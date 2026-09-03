import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card } from "../../common";
import { useLanguageResults } from "../../../hooks/useTestResults";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";
import type { LanguageAssessmentResult } from "../../../types/languageTypes";
import { getLanguageFeedback } from "../../../utils/normativeStats";
import "./LanguageAssessment.css";

type Phase = "instructions" | "permission" | "warmup" | "assessment" | "processing" | "complete";

const PROMPTS = [
    "Describe what you did yesterday in as much detail as possible.",
    "Describe a place you visit often and why you like it.",
    "Talk about a normal day for you, from morning to night.",
    "Explain how to make your favorite meal.",
    "Describe your childhood home.",
    "Talk about a recent book or movie you enjoyed.",
    "Describe your favorite season and why you like it.",
    "Explain the rules of a game or sport you know.",
    "Talk about a memorable trip you have taken.",
    "Describe a person who has influenced your life."
];

export function LanguageAssessment() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { saveResult } = useLanguageResults();

    // State
    const [phase, setPhase] = useState<Phase>("instructions");
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [verbatimTranscript, setVerbatimTranscript] = useState("");
    const [englishTranslation, setEnglishTranslation] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState<string>("Auto-detecting...");

    const [prompt, setPrompt] = useState("");
    const [timer, setTimer] = useState(0);
    const [result, setResult] = useState<LanguageAssessmentResult | null>(null);

    // Sarvam Proxy config
    const [proxyPort] = useState(5001);
    const [isProxyConnected, setIsProxyConnected] = useState<boolean>(true);

    // Audio & WS Refs
    const wsVerbatimRef = useRef<WebSocket | null>(null);
    const wsTranslateRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const startTimeRef = useRef<number>(0);
    const intervalRef = useRef<any>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Check Proxy Status on Mount
    useEffect(() => {
        fetch(`http://localhost:${proxyPort}/health`)
            .then(res => setIsProxyConnected(res.ok))
            .catch(() => setIsProxyConnected(false));
    }, [proxyPort]);

    // Scroll to bottom of transcript
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, verbatimTranscript]);

    // Select random prompt on mount
    useEffect(() => {
        setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (isRecording) {
            intervalRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRecording]);

    // Convert Float32 PCM to Int16 PCM WAV buffer
    const convertFloat32ToInt16 = (buffer: Float32Array): ArrayBuffer => {
        let l = buffer.length;
        let buf = new Int16Array(l);
        while (l--) {
            let s = Math.max(-1, Math.min(1, buffer[l]));
            buf[l] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return buf.buffer;
    };

    // Connect Sarvam AI Multilingual Dual-Stream WebSocket (Auto-Detect Default)
    const connectSarvamStreams = () => {
        const apiKey = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';
        
        // 1. Verbatim Stream (Captures filler words, stutters, exact spoken language)
        const verbatimUrl = `ws://localhost:${proxyPort}?model=saaras:v4&language-code=unknown&mode=verbatim&sample_rate=16000&api_key=${encodeURIComponent(apiKey)}`;
        const wsVerbatim = new WebSocket(verbatimUrl);

        wsVerbatim.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'data') {
                    const text = msg.data?.transcript || '';
                    if (text) {
                        setVerbatimTranscript(prev => prev + (prev ? ' ' : '') + text);
                        setTranscript(prev => prev + (prev ? ' ' : '') + text);
                    }
                    if (msg.data?.language_code) {
                        setDetectedLanguage(msg.data.language_code);
                    }
                }
            } catch (err) {
                // Ignore non-json logs
            }
        };

        // 2. Translation Stream (Translates Indic speech to English for NLP scoring)
        const translateUrl = `ws://localhost:${proxyPort}?model=saaras:v4&language-code=unknown&mode=translate&sample_rate=16000&api_key=${encodeURIComponent(apiKey)}`;
        const wsTranslate = new WebSocket(translateUrl);

        wsTranslate.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'data') {
                    const text = msg.data?.transcript || '';
                    if (text) {
                        setEnglishTranslation(prev => prev + (prev ? ' ' : '') + text);
                    }
                }
            } catch (err) {
                // Ignore non-json logs
            }
        };

        wsVerbatimRef.current = wsVerbatim;
        wsTranslateRef.current = wsTranslate;
    };

    // Initialize Sarvam PCM Microphone Recording
    const startRecording = async () => {
        if (!isAuthenticated) return;

        try {
            setTranscript("");
            setVerbatimTranscript("");
            setEnglishTranslation("");
            setDetectedLanguage("Auto-detecting language...");

            connectSarvamStreams();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
            
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Buffer = convertFloat32ToInt16(inputData);
                
                const bytes = new Uint8Array(int16Buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64Data = btoa(binary);

                const payload = JSON.stringify({
                    audio: {
                        data: base64Data,
                        sample_rate: '16000',
                        encoding: 'audio/wav',
                    },
                });

                [wsVerbatimRef.current, wsTranslateRef.current].forEach(ws => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(payload);
                    }
                });
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

            setIsRecording(true);
            startTimeRef.current = Date.now();

        } catch (err: any) {
            alert(`Microphone access error: ${err.message}`);
        }
    };

    const stopRecording = () => {
        if (timer < 15 && phase === 'assessment') {
            const confirmStop = window.confirm("Ideally we need 15 seconds of speech for accurate analysis. Are you sure you want to stop?");
            if (!confirmStop) return;
        }

        if (processorRef.current && audioContextRef.current) {
            processorRef.current.disconnect();
            sourceRef.current?.disconnect();
            audioContextRef.current.close();
        }

        const flushMsg = JSON.stringify({ type: 'flush' });
        [wsVerbatimRef.current, wsTranslateRef.current].forEach(ws => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(flushMsg);
                ws.close();
            }
        });

        wsVerbatimRef.current = null;
        wsTranslateRef.current = null;

        setIsRecording(false);

        if (phase === 'warmup') {
            setPhase('assessment');
            setTimer(0);
            setTranscript("");
            setVerbatimTranscript("");
            setEnglishTranslation("");
        } else {
            setPhase('processing');
            processResults();
        }
    };

    const processResults = () => {
        const duration = Date.now() - startTimeRef.current;
        const activeTranscript = verbatimTranscript || transcript;

        // Multilingual Biomarker Feature Extraction Engine
        const analysis = extractLanguageFeatures({
            transcript: activeTranscript,
            verbatimTranscript: verbatimTranscript,
            englishTranslation: englishTranslation,
            durationMs: duration,
            detectedLanguage: detectedLanguage
        });

        const newResult: LanguageAssessmentResult = {
            id: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            timestamp: new Date(),
            transcript: activeTranscript,
            verbatimTranscript: verbatimTranscript,
            englishTranslation: englishTranslation,
            detectedLanguage: detectedLanguage,
            rawMetrics: analysis.raw,
            derivedFeatures: analysis.derived,
            explainability: {
                keyFactors: []
            }
        };

        saveResult(newResult);
        setResult(newResult);
        setTimeout(() => setPhase('complete'), 1200);
    };

    const getInsights = (res: LanguageAssessmentResult) => {
        const insights = [];
        const { wpm, fluencyIndex, hesitationIndex, lexicalDiversity } = res.derivedFeatures;

        if (fluencyIndex > 80) insights.push({ text: "Excellent Fluency", type: "positive" });
        else if (fluencyIndex > 60) insights.push({ text: "Good Fluency", type: "positive" });
        else insights.push({ text: "Reduced Fluency", type: "attention" });

        if (wpm > 130) insights.push({ text: "Fast Pace", type: "neutral" });
        else if (wpm < 100) insights.push({ text: "Slower Pace", type: "neutral" });
        else insights.push({ text: "Steady Pace", type: "positive" });

        if (hesitationIndex < 0.05) insights.push({ text: "Consistent Flow", type: "positive" });
        else if (hesitationIndex > 0.15) insights.push({ text: "Frequent Hesitations/Fillers", type: "attention" });

        if (lexicalDiversity > 0.6) insights.push({ text: "Rich Vocabulary", type: "positive" });

        return insights;
    };

    return (
        <PageWrapper>
            <div className="language-container center-content" style={{ color: 'white', position: 'relative', zIndex: 5 }}>
                {phase === 'instructions' && (
                    <div className="assessment-phase instructions-phase">
                        <div className="phase-icon">🎙️</div>
                        <h2>Multilingual Language Fluency Assessment</h2>
                        <p className="phase-description">
                            Spontaneous speech analysis for cognitive trends powered by Sarvam AI.
                        </p>

                        <div className="privacy-notice" style={{ background: 'rgba(124, 58, 237, 0.15)', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
                            <strong>🌐 Multilingual Auto-Detection Active</strong>
                            <p>You can speak naturally in <strong>English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, or Punjabi</strong>. Sarvam AI automatically detects your spoken language.</p>
                        </div>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span>You will be given a simple topic to discuss</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span>Speak naturally in any preferred language for at least 15–30 seconds</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span>Try to provide as much detail as possible</span>
                            </div>
                        </div>

                        <div className="button-group">
                            <Button variant="secondary" onClick={() => navigate('/tests')}>Back</Button>
                            <Button variant="primary" onClick={() => setPhase('permission')}>Start</Button>
                        </div>
                    </div>
                )}

                {phase === 'permission' && (
                    <Card className="permission-card">
                        <h2>🎙️ Microphone Access</h2>
                        <p>We need access to your microphone for Sarvam AI audio pattern analysis.</p>
                        <Button variant="primary" onClick={() => setPhase('warmup')}>Enable Microphone</Button>
                    </Card>
                )}

                {phase === 'warmup' && (
                    <Card className="phase-card">
                        <div className="phase-badge">Warmup</div>
                        <h2>Let's test the microphone</h2>
                        <p>Read aloud or speak in your preferred language: "The quick brown fox jumps over the lazy dog."</p>

                        <div className="transcript-preview">
                            {transcript || "Listening (Sarvam AI Auto-Detect)..."}
                        </div>

                        {!isRecording ? (
                            <Button 
                                onClick={startRecording} 
                                className="record-btn"
                                aria-label="Start microphone warmup recording"
                            >
                                Start Warmup
                            </Button>
                        ) : (
                            <Button 
                                onClick={stopRecording} 
                                variant="secondary" 
                                className="stop-btn"
                                aria-label="Stop recording and continue"
                            >
                                Stop & Continue
                            </Button>
                        )}
                    </Card>
                )}

                {phase === 'assessment' && (
                    <Card className="phase-card active-assessment">
                        <div className="phase-badge" style={{ background: 'rgba(124, 58, 237, 0.8)' }}>
                            Sarvam AI Multilingual
                        </div>
                        <h2>{prompt}</h2>

                        {/* Timer & Language Indicator */}
                        <div className="flex items-center justify-between my-2 px-2">
                            <div className="timer" role="timer" aria-live="polite">
                                ⏱️ {timer}s
                            </div>
                            <div className="text-xs bg-slate-900 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-full font-mono">
                                🌐 {detectedLanguage}
                            </div>
                        </div>

                        {/* Visualizer Animation */}
                        <div className="visualizer-container">
                            {isRecording ? (
                                <>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                    <div className="visual-bar"></div>
                                </>
                            ) : (
                                <div className="text-secondary">Ready to record</div>
                            )}
                        </div>

                        {/* Live Transcript Display */}
                        <div 
                            className="transcript-box"
                            role="log"
                            aria-live="polite"
                            aria-label="Speech transcript"
                        >
                            {transcript ? (
                                <div>
                                    <p>{transcript}</p>
                                    {englishTranslation && (
                                        <p className="text-xs text-purple-400 mt-2 border-t border-purple-900/50 pt-2 italic">
                                            🇬🇧 English Translation: {englishTranslation}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <span className="transcript-placeholder">Your speech will appear here in real-time in any spoken language...</span>
                            )}
                            <div ref={transcriptEndRef} />
                        </div>

                        <div className="controls">
                            {!isRecording ? (
                                <Button 
                                    onClick={startRecording} 
                                    className="record-btn pulse"
                                    aria-label="Start recording your speech response"
                                >
                                    Start Recording
                                </Button>
                            ) : (
                                <Button 
                                    onClick={stopRecording} 
                                    variant="secondary" 
                                    className="stop-btn"
                                    aria-label="Finish recording and process results"
                                >
                                    Finish Recording
                                </Button>
                            )}
                        </div>
                        {isRecording && timer < 15 && <p className="text-xs text-secondary mt-2">Try to speak for at least 15 seconds</p>}
                    </Card>
                )}

                {phase === 'processing' && (
                    <div className="processing-state" role="status" aria-live="polite">
                        <div className="spinner" aria-hidden="true"></div>
                        <h3>Analyzing Multilingual Biomarkers & Disfluencies...</h3>
                    </div>
                )}

                {phase === 'complete' && result && (
                    <Card className="results-card">
                        <h1>Language Session Complete</h1>
                        
                        {/* Auto-detected Language Header */}
                        {result.detectedLanguage && (
                            <div className="text-center mb-4">
                                <span className="inline-block bg-purple-950 border border-purple-700/60 text-purple-200 text-xs px-3 py-1 rounded-full font-mono">
                                    🌐 Spoken Language: {result.detectedLanguage}
                                </span>
                            </div>
                        )}

                        <div className="metrics-grid">
                            <div className="metric">
                                <label>Speech Rate</label>
                                <p className="value">{Math.round(result.derivedFeatures.wpm)} WPM</p>
                            </div>
                            <div className="metric">
                                <label>Fluency Index</label>
                                <p className="value">{Math.round(result.derivedFeatures.fluencyIndex)}/100</p>
                            </div>
                            <div className="metric">
                                <label>Hesitation / Fillers</label>
                                <p className="value">{(result.derivedFeatures.hesitationIndex * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Raw Biomarker Details */}
                        <div className="my-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs font-mono text-left">
                            <div className="text-purple-400 font-bold uppercase tracking-wider mb-1">
                                🧬 Biomarker Extraction Summary
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-slate-300">
                                <div>• Total Word Count: <strong>{result.rawMetrics.wordCount}</strong></div>
                                <div>• Filler Word Count: <strong>{result.rawMetrics.fillerWordCount}</strong></div>
                                <div>• Word Repetitions: <strong>{result.rawMetrics.repetitions}</strong></div>
                                <div>• Unique Word TTR: <strong>{(result.derivedFeatures.lexicalDiversity * 100).toFixed(1)}%</strong></div>
                                <div>• Speech Stability: <strong>{Math.round(result.derivedFeatures.speechStability)}/100</strong></div>
                                <div>• Coherence Score: <strong>{Math.round(result.derivedFeatures.coherenceProxy)}/100</strong></div>
                            </div>
                            {result.englishTranslation && (
                                <div className="mt-3 pt-2 border-t border-slate-800 text-slate-400">
                                    <strong className="text-purple-300">English Translation:</strong> "{result.englishTranslation}"
                                </div>
                            )}
                        </div>

                        {/* Insight Chips */}
                        <div className="insights-grid">
                            {(() => {
                                const feedback = getLanguageFeedback(result.derivedFeatures.wpm, result.derivedFeatures.hesitationIndex);
                                const otherInsights = getInsights(result);

                                return (
                                    <>
                                        <div className="feedback-badge-wrapper">
                                            <span className={`feedback-badge ${feedback.category === 'Exceptional' || feedback.category === 'Above Average' ? 'positive' : feedback.category === 'Needs Attention' ? 'attention' : 'neutral'}`}>
                                                {feedback.category}: {feedback.message}
                                            </span>
                                        </div>

                                        {otherInsights.map((insight, i) => (
                                            <span key={i} className={`insight-chip ${insight.type}`}>
                                                {insight.text}
                                            </span>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="button-group">
                            <Button onClick={() => navigate('/dashboard')}>View Dashboard Trends</Button>
                            <Button onClick={() => navigate('/tests')} variant="secondary">Back to Assessments</Button>
                        </div>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
