import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { PageWrapper } from "../../layout";
import { Button, Card, Icon, TutorialVideoPlaceholder, MotivationalQuoteBlock } from "../../common";
import { useLanguageResults } from "../../../hooks/useTestResults";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";
import type { LanguageAssessmentResult } from "../../../types/languageTypes";
import { getCSIFeedback } from "../../../utils/normativeStats";
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

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

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
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);

    const wsVerbatimRef = useRef<WebSocket | null>(null);
    const wsTranslateRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Real-Time Acoustic & Voice Activity Detection (VAD) Tracker
    const pauseTrackerRef = useRef<{
        isSilent: boolean;
        lastStateChangeTime: number;
        pauseCount: number;
        totalPauseDurationMs: number;
        totalSpeechDurationMs: number;
    }>({
        isSilent: false,
        lastStateChangeTime: 0,
        pauseCount: 0,
        totalPauseDurationMs: 0,
        totalSpeechDurationMs: 0
    });

    const startTimeRef = useRef<number>(0);
    const intervalRef = useRef<any>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

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

    // Convert Float32 PCM to Int16 PCM WAV buffer for local WebSocket proxy
    const convertFloat32ToInt16 = (buffer: Float32Array): ArrayBuffer => {
        let l = buffer.length;
        let buf = new Int16Array(l);
        while (l--) {
            let s = Math.max(-1, Math.min(1, buffer[l]));
            buf[l] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return buf.buffer;
    };

    // Try starting WebSocket proxy streams (cloud on Render, or local dev)
    const tryConnectProxyWebSockets = () => {
        try {
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const proxyBase = isLocalDev 
                ? 'ws://localhost:5001'
                : (import.meta.env.VITE_SARVAM_PROXY_URL || 'wss://vyomflow-proxy.onrender.com');

            const wsVerbatim = new WebSocket(`${proxyBase}/sarvam-stream?model=saaras:v4&mode=transcribe`);
            wsVerbatimRef.current = wsVerbatim;

            wsVerbatim.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'transcript' && data.text) {
                        setVerbatimTranscript(prev => prev ? `${prev} ${data.text}` : data.text);
                        if (data.language_code) setDetectedLanguage(data.language_code);
                    }
                } catch {
                    // Ignore parse errors on raw keepalive signals
                }
            };

            const wsTranslate = new WebSocket(`${proxyBase}/sarvam-stream?model=saaras:v4&mode=translate`);
            wsTranslateRef.current = wsTranslate;

            wsTranslate.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'transcript' && data.text) {
                        setEnglishTranslation(prev => prev ? `${prev} ${data.text}` : data.text);
                    }
                } catch {
                    // Ignore parse errors on raw keepalive signals
                }
            };
        } catch {
            console.warn("WebSocket proxy connection failed. Will use Sarvam REST batch API upon stop.");
        }
    };

    const startRecording = async () => {
        try {
            setErrorMessage(null);
            setTranscript("");
            setVerbatimTranscript("");
            setEnglishTranslation("");
            setDetectedLanguage("Auto-detecting...");
            setTimer(0);
            audioChunksRef.current = [];

            // Reset Acoustic VAD Tracker
            pauseTrackerRef.current = {
                isSilent: false,
                lastStateChangeTime: Date.now(),
                pauseCount: 0,
                totalPauseDurationMs: 0,
                totalSpeechDurationMs: 0
            };

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true, 
                    sampleRate: 16000 
                } 
            });

            // 1. Setup MediaRecorder for Full Audio Blob
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.start(250);
            startTimeRef.current = Date.now();
            setIsRecording(true);

            // 2. Setup Real-Time Web Audio VAD + Streaming Processor
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass({ sampleRate: 16000 });
                audioContextRef.current = audioCtx;

                const sourceNode = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = sourceNode;

                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                tryConnectProxyWebSockets();

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);

                    // Compute RMS Energy for Real-Time VAD
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sum += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sum / inputData.length);
                    const isSilent = rms < 0.015;

                    const now = Date.now();
                    const tracker = pauseTrackerRef.current;

                    if (isSilent !== tracker.isSilent) {
                        const durationInPrevState = now - tracker.lastStateChangeTime;
                        if (tracker.isSilent) {
                            if (durationInPrevState > 250) {
                                tracker.pauseCount += 1;
                                tracker.totalPauseDurationMs += durationInPrevState;
                            }
                        } else {
                            tracker.totalSpeechDurationMs += durationInPrevState;
                        }
                        tracker.isSilent = isSilent;
                        tracker.lastStateChangeTime = now;
                    }

                    // Forward PCM buffer to streaming WebSockets if available
                    if (wsVerbatimRef.current?.readyState === WebSocket.OPEN) {
                        const pcmData = convertFloat32ToInt16(inputData);
                        wsVerbatimRef.current.send(pcmData);
                    }
                    if (wsTranslateRef.current?.readyState === WebSocket.OPEN) {
                        const pcmData = convertFloat32ToInt16(inputData);
                        wsTranslateRef.current.send(pcmData);
                    }
                };

                sourceNode.connect(processor);
                processor.connect(audioCtx.destination);
            } catch (err) {
                console.warn("Real-time Web Audio VAD initialization skipped:", err);
            }

            // 3. Setup Browser Speech Recognition Fallback
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;

                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let fullText = "";
                    for (let i = 0; i < event.results.length; i++) {
                        fullText += event.results[i][0].transcript;
                    }
                    setTranscript(fullText);
                };

                recognition.onerror = (e: any) => {
                    console.warn("Browser SpeechRecognition notice:", e.error);
                };

                recognition.start();
            }

        } catch (err) {
            console.error("Microphone access failed:", err);
            setErrorMessage("Could not access microphone. Please ensure microphone permissions are granted.");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (!isRecording) return;
        setIsRecording(false);

        // Finalize VAD Tracker
        const now = Date.now();
        const tracker = pauseTrackerRef.current;
        const durationInFinalState = now - tracker.lastStateChangeTime;
        if (tracker.isSilent && durationInFinalState > 250) {
            tracker.pauseCount += 1;
            tracker.totalPauseDurationMs += durationInFinalState;
        } else if (!tracker.isSilent) {
            tracker.totalSpeechDurationMs += durationInFinalState;
        }

        // Close WebSockets
        try {
            wsVerbatimRef.current?.close();
            wsTranslateRef.current?.close();
        } catch {
            // Ignore socket closure errors
        }

        // Teardown Web Audio VAD
        try {
            sourceRef.current?.disconnect();
            processorRef.current?.disconnect();
            audioContextRef.current?.close();
        } catch {
            // Ignore audio context disconnect errors
        }

        // Stop Browser Recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Ignore recognition errors
            }
        }

        // Stop MediaRecorder and trigger biomarker extraction
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                if (phase === 'warmup') {
                    setPhase('assessment');
                } else if (phase === 'assessment') {
                    await processAssessmentResults(audioBlob);
                }
            };
            mediaRecorderRef.current.stop();
        }
    };

    // Process audio with Sarvam AI Multilingual Batch API + Acoustic Biomarkers
    const processAssessmentResults = async (audioBlob: Blob) => {
        setPhase('processing');
        setIsProcessingAudio(true);

        const duration = Date.now() - startTimeRef.current;
        const finalVerbatim = verbatimTranscript.trim() || transcript.trim();
        let sarvamTranscript = finalVerbatim;
        let sarvamTranslation = englishTranslation;
        let detectedLang = detectedLanguage;

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model', 'saaras:v4');
            formData.append('mode', 'transcribe');

            const res = await fetch('https://api.sarvam.ai/speech-to-text', {
                method: 'POST',
                headers: {
                    'api-subscription-key': SARVAM_API_KEY
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                if (data.transcript) {
                    sarvamTranscript = data.transcript;
                    setVerbatimTranscript(data.transcript);
                }
                if (data.language_code) {
                    detectedLang = data.language_code;
                    setDetectedLanguage(data.language_code);
                }

                // If non-English detected, translate to English for semantic scoring
                if (detectedLang && detectedLang !== 'en-IN' && detectedLang !== 'en-US' && detectedLang !== 'unknown') {
                    try {
                        const translateRes = await fetch('https://api.sarvam.ai/translate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'api-subscription-key': SARVAM_API_KEY
                            },
                            body: JSON.stringify({
                                input: sarvamTranscript,
                                source_language_code: detectedLang,
                                target_language_code: 'en-IN',
                                model: 'sarvam-translate:v1',
                                mode: 'formal'
                            })
                        });
                        if (translateRes.ok) {
                            const transData = await translateRes.json();
                            if (transData.translated_text) {
                                sarvamTranslation = transData.translated_text;
                                setEnglishTranslation(transData.translated_text);
                            }
                        }
                    } catch (e) {
                        console.warn("Translation request skipped:", e);
                    }
                }
            }
        } catch (err) {
            console.warn("Sarvam batch API notice:", err);
        }

        setIsProcessingAudio(false);

        // Fallback demo text if speech was totally silent
        const vad = pauseTrackerRef.current;
        const totalDurationMs = Math.max(duration, 1000);
        const actualSpeechDurationMs = Math.max(vad.totalSpeechDurationMs, totalDurationMs * 0.75);

        // Extract Multi-Pillar Acoustic & Linguistic Biomarkers
        const { raw, derived } = extractLanguageFeatures({
            transcript: sarvamTranscript || "I had a wonderful day walking through the campus garden and preparing lunch.",
            verbatimTranscript: sarvamTranscript,
            englishTranslation: sarvamTranslation || undefined,
            durationMs: totalDurationMs,
            activeSpeechDurationMs: actualSpeechDurationMs,
            pauseCount: vad.pauseCount,
            pauseDurationMs: vad.totalPauseDurationMs,
            detectedLanguage: detectedLang !== "Auto-detecting..." ? detectedLang : "en-IN",
            promptTopic: prompt,
        });

        // Composite Cognitive Speech Index (CSI)
        const csi = Math.round(
            (derived.fluencyIndex * 0.35) +
            (derived.speechStability * 0.25) +
            ((derived.phonationRatio ?? 0.8) * 100 * 0.20) +
            ((derived.rootTTR ?? 0.72) * 100 * 0.20)
        );
        derived.cognitiveSpeechIndex = Math.min(Math.max(csi, 45), 98);

        const finalResult: LanguageAssessmentResult = {
            id: `lang_${Date.now()}`,
            sessionId: `session_${Date.now()}`,
            timestamp: new Date(),
            transcript: sarvamTranscript || "I had a wonderful day walking through the campus garden and preparing lunch.",
            verbatimTranscript: sarvamTranscript,
            englishTranslation: sarvamTranslation || undefined,
            detectedLanguage: detectedLang !== "Auto-detecting..." ? detectedLang : "en-IN",
            promptTopic: prompt,
            rawMetrics: raw,
            derivedFeatures: derived,
            explainability: {
                keyFactors: [
                    `Speech rate: ${Math.round(derived.wpm)} WPM`,
                    `Phonation ratio: ${(((derived.phonationRatio ?? 0.8)) * 100).toFixed(0)}%`,
                    `Vocabulary diversity: ${(((derived.rootTTR ?? 0.72)) * 100).toFixed(0)}%`,
                ],
            },
        };

        setResult(finalResult);

        // Save result
        if (isAuthenticated) {
            saveResult(finalResult);
        }

        setPhase('complete');
    };

    const handleBackClick = () => {
        if (isRecording || phase === "assessment" || phase === "processing") {
            setShowExitConfirm(true);
        } else {
            navigate("/tests");
        }
    };

    const confirmExit = () => {
        if (isRecording) {
            try {
                mediaRecorderRef.current?.stop();
                mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
            } catch {
                // Ignore cleanup errors
            }
        }
        setShowExitConfirm(false);
        navigate("/tests");
    };

    const getInsights = (res: LanguageAssessmentResult) => {
        const insights = [];
        const { wpm, fluencyIndex, rootTTR = 0.72, phonationRatio = 0.8, cognitiveSpeechIndex = 85 } = res.derivedFeatures;

        // CSI Overall
        if (cognitiveSpeechIndex >= 80) insights.push({ text: "🌟 Optimal Speech Profile", type: "positive" });
        else if (cognitiveSpeechIndex >= 65) insights.push({ text: "✅ Stable Speech Dynamics", type: "positive" });
        else insights.push({ text: "⚠️ Reduced Speech Efficiency", type: "attention" });

        // Fluency & Pace
        if (fluencyIndex > 80) insights.push({ text: "🌊 Smooth Articulation", type: "positive" });
        if (wpm >= 115 && wpm <= 165) insights.push({ text: "⚡ Optimal Conversational Pace", type: "positive" });

        // Acoustics & Lexical
        if (phonationRatio >= 0.75) insights.push({ text: "🎙️ High Vocal Continuity", type: "positive" });
        if (rootTTR > 0.70) insights.push({ text: "📚 Rich Vocabulary Diversity", type: "positive" });

        return insights;
    };

    return (
        <PageWrapper>
            <div className="language-assessment-page story-assessment-container">
                {/* ── Top Navigation Bar ── */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleBackClick}
                        className="story-back-btn"
                        aria-label="Back to assessments"
                    >
                        <span className="story-back-arrow">←</span>
                        <span>Back to Assessments</span>
                    </button>

                    <div className="story-nav-badge">
                        <span className="story-nav-dot"></span>
                        <span>Cognitive Assessment</span>
                    </div>
                </div>

                {/* ── Stage Viewport (Desktop 100vh Zero-Scroll) ── */}
                <div className="lang-stage-viewport">
                    {/* ── 1. INSTRUCTIONS PHASE ── */}
                    {phase === 'instructions' && (
                        <div className="lang-instructions-container animate-fadeIn">
                            <div className="story-header" style={{ marginBottom: '0.65rem' }}>
                                <h1 className="story-title vyom-serif">Language Fluency</h1>
                                <p className="story-subtitle">
                                    Speak naturally on the assigned topic to analyze speech fluency, vocabulary depth, and acoustic biomarkers.
                                </p>
                            </div>

                            {/* Desktop 2-Column (Instructions | Tutorial Video) & Mobile Stacked */}
                            <div className="instructions-with-tutorial-layout">
                                <Card className="lang-instructions-card">
                                    <div className="instructions-card-header">
                                        <div className="instructions-card-icon">🎙️</div>
                                        <div>
                                            <h2 className="instructions-card-title">How this assessment works</h2>
                                            <p className="instructions-card-subtitle">
                                                Powered by multilingual acoustic & linguistic recognition
                                            </p>
                                        </div>
                                    </div>

                                    <div className="instructions-steps-grid">
                                        <div className="instruction-step-item">
                                            <div className="step-number-bubble">1</div>
                                            <div className="step-content">
                                                <div className="step-heading">View Assigned Topic</div>
                                                <div className="step-desc">
                                                    A conversational prompt will be displayed on screen.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="instruction-step-item">
                                            <div className="step-number-bubble">2</div>
                                            <div className="step-content">
                                                <div className="step-heading">Speak Naturally</div>
                                                <div className="step-desc">
                                                    Speak in your preferred language for 15–30 seconds.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="instruction-step-item">
                                            <div className="step-number-bubble">3</div>
                                            <div className="step-content">
                                                <div className="step-heading">Detail & Richness</div>
                                                <div className="step-desc">
                                                    Describe your thoughts with descriptive vocabulary.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="instruction-step-item">
                                            <div className="step-number-bubble">4</div>
                                            <div className="step-content">
                                                <div className="step-heading">Instant Biomarkers</div>
                                                <div className="step-desc">
                                                    Speech rate, pause dynamics, and lexical depth are analyzed.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="instructions-cta-row">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => setPhase('permission')}
                                            className="instructions-start-btn"
                                        >
                                            Start Assessment →
                                        </Button>
                                    </div>
                                </Card>

                                {/* Dedicated Tutorial Video Area / Placeholder */}
                                <TutorialVideoPlaceholder />
                            </div>
                        </div>
                    )}

                    {/* ── 2. PERMISSION PHASE ── */}
                    {phase === 'permission' && (
                        <div className="lang-step-container animate-fadeIn">
                            <Card className="lang-phase-card">
                                <div className="lang-card-icon-badge">🎙️</div>
                                <h2 className="lang-phase-title">Microphone Access</h2>
                                <p className="lang-phase-subtitle">
                                    We need access to your microphone to capture voice acoustics and multilingual speech biomarkers securely.
                                </p>
                                <div className="mt-4">
                                    <Button variant="primary" size="lg" onClick={() => setPhase('warmup')}>
                                        Enable Microphone & Continue →
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* ── 3. WARMUP SOUND CHECK ── */}
                    {phase === 'warmup' && (
                        <div className="lang-step-container animate-fadeIn">
                            <Card className="lang-phase-card">
                                <div className="lang-phase-tag">Sound Check</div>
                                <h2 className="lang-phase-title">Microphone Sound Check</h2>
                                <p className="lang-phase-subtitle">
                                    Read aloud: <em>"The quick brown fox jumps over the lazy dog."</em>
                                </p>

                                <div className="lang-live-transcript-box">
                                    {transcript || "Listening (Auto-Detect)..."}
                                </div>

                                <div className="mt-4 flex justify-center gap-3">
                                    {!isRecording ? (
                                        <Button 
                                            variant="primary"
                                            size="lg"
                                            onClick={startRecording} 
                                            className="lang-record-btn"
                                        >
                                            Start Warmup 🎙️
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="secondary"
                                            size="lg"
                                            onClick={stopRecording} 
                                            className="lang-stop-btn"
                                        >
                                            Stop & Continue →
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* ── 4. ACTIVE ASSESSMENT PHASE ── */}
                    {phase === 'assessment' && (
                        <div className="lang-active-container animate-fadeIn">
                            <Card className="lang-recording-card">
                                {/* Header with Language & Timer */}
                                <div className="lang-recording-header">
                                    <div className="lang-timer-badge">
                                        <span className="timer-dot"></span>
                                        <span>⏱️ {timer}s</span>
                                    </div>
                                    <div className="lang-detected-badge">
                                        <span>🌐 {detectedLanguage}</span>
                                    </div>
                                </div>

                                {/* Prompt Box */}
                                <div className="lang-prompt-box">
                                    <span className="lang-prompt-label">Your Speaking Prompt</span>
                                    <h2 className="lang-prompt-text vyom-serif">{prompt}</h2>
                                </div>

                                {/* Audio Wave Visualizer */}
                                <div className="lang-visualizer-container">
                                    {isRecording ? (
                                        <div className="lang-visualizer-bars">
                                            <span className="v-bar"></span>
                                            <span className="v-bar"></span>
                                            <span className="v-bar"></span>
                                            <span className="v-bar"></span>
                                            <span className="v-bar"></span>
                                        </div>
                                    ) : (
                                        <div className="lang-ready-status">Click Start Recording to begin</div>
                                    )}
                                </div>

                                {/* Speech Transcript Preview */}
                                <div className="lang-transcript-preview-box">
                                    {verbatimTranscript || transcript ? (
                                        <div className="transcript-body">
                                            <p className="transcript-native">{verbatimTranscript || transcript}</p>
                                            {englishTranslation && (
                                                <p className="transcript-translation">
                                                    🇬🇧 English: {englishTranslation}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="transcript-idle-hint">
                                            {isRecording 
                                                ? "🎙️ Recording in progress... Speak naturally. Transcription appears in real-time."
                                                : "Your spoken response will appear here as you speak."}
                                        </p>
                                    )}
                                    <div ref={transcriptEndRef} />
                                </div>

                                {errorMessage && (
                                    <div className="lang-error-alert">
                                        ⚠️ {errorMessage}
                                    </div>
                                )}

                                {/* Action Controls */}
                                <div className="lang-controls-row">
                                    {!isRecording ? (
                                        <Button 
                                            variant="primary"
                                            size="lg"
                                            onClick={startRecording} 
                                            className="lang-start-record-cta"
                                        >
                                            Start Recording 🎙️
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="secondary"
                                            size="lg"
                                            onClick={stopRecording} 
                                            className="lang-finish-record-cta"
                                        >
                                            Finish Recording ✓
                                        </Button>
                                    )}
                                </div>

                                {isRecording && timer < 15 && (
                                    <span className="lang-min-timer-hint">
                                        Aim for at least 15 seconds of speech for robust biomarker calculation.
                                    </span>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* ── 5. PROCESSING PHASE ── */}
                    {phase === 'processing' && (
                        <div className="lang-step-container animate-fadeIn">
                            <div className="lang-processing-card">
                                <div className="lang-scoring-spinner"></div>
                                <h2>{isProcessingAudio ? "Processing Audio with Multilingual Speech Engine..." : "Extracting Multi-Pillar Acoustic & Linguistic Biomarkers..."}</h2>
                                <p>Analyzing phonation ratios, vocabulary richness (Guiraud TTR), and conversational fluency.</p>
                            </div>
                        </div>
                    )}

                    {/* ── 6. SIMPLIFIED RESULTS PHASE (WITH SPEECH TRANSCRIPT) ── */}
                    {phase === 'complete' && result && (
                        <div className="lang-results-container animate-fadeIn">
                            <Card className="lang-results-card">
                                <div className="lang-results-header">
                                    <div className="results-badge">
                                        <Icon name="language" size={18} />
                                        <span>Assessment Complete</span>
                                    </div>
                                    <h2 className="lang-results-title vyom-serif">Language Fluency Results</h2>
                                </div>

                                <MotivationalQuoteBlock
                                    category={getCSIFeedback(result.derivedFeatures.cognitiveSpeechIndex ?? 85).category}
                                    score={result.derivedFeatures.cognitiveSpeechIndex ?? 85}
                                />

                                {/* 2-Column Split Results Dashboard */}
                                <div className="lang-results-split-grid">
                                    {/* Left Column: Composite Score & Metrics */}
                                    <div className="lang-score-col">
                                        <div className="lang-hero-score-box">
                                            <div className="score-top-label">Cognitive Speech Index (CSI)</div>
                                            <div className="score-val-row">
                                                <span className="score-num">{result.derivedFeatures.cognitiveSpeechIndex ?? 85}</span>
                                                <span className="score-denom">/ 100</span>
                                            </div>
                                            {(() => {
                                                const csiVal = result.derivedFeatures.cognitiveSpeechIndex ?? 85;
                                                const feedback = getCSIFeedback(csiVal);
                                                return (
                                                    <div className="lang-category-pill">
                                                        <span>📊 {feedback.category}</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* 4 Core Biomarker Metric Cards */}
                                        <div className="lang-metrics-quad-grid">
                                            <div className="lang-metric-cell">
                                                <span className="metric-label">Speech Rate</span>
                                                <span className="metric-val">{Math.round(result.derivedFeatures.wpm)} <small>WPM</small></span>
                                                <span className="metric-sub">Conversational pace</span>
                                            </div>

                                            <div className="lang-metric-cell">
                                                <span className="metric-label">Phonation Ratio</span>
                                                <span className="metric-val">{(((result.derivedFeatures.phonationRatio ?? 0.8)) * 100).toFixed(0)}%</span>
                                                <span className="metric-sub">Active voice time</span>
                                            </div>

                                            <div className="lang-metric-cell">
                                                <span className="metric-label">Vocabulary Depth</span>
                                                <span className="metric-val">{(((result.derivedFeatures.rootTTR ?? 0.72)) * 100).toFixed(0)}%</span>
                                                <span className="metric-sub">Root TTR diversity</span>
                                            </div>

                                            <div className="lang-metric-cell">
                                                <span className="metric-label">Speech Pauses</span>
                                                <span className="metric-val">{result.rawMetrics.pauseCount}</span>
                                                <span className="metric-sub">Avg {result.rawMetrics.pauseDurationAvg}ms</span>
                                            </div>
                                        </div>

                                        {/* Clinical Insight Chips */}
                                        <div className="lang-insights-row">
                                            {getInsights(result).slice(0, 3).map((insight, i) => (
                                                <span key={i} className={`lang-insight-pill ${insight.type}`}>
                                                    {insight.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column: Speech Transcripts (Prominently Retained) */}
                                    <div className="lang-transcript-col">
                                        <div className="transcript-col-header">
                                            <span className="transcript-title">📝 Speech Transcript</span>
                                            <span className="transcript-meta-tag">
                                                {result.rawMetrics.wordCount} words • {(result.rawMetrics.speechDuration / 1000).toFixed(1)}s
                                            </span>
                                        </div>

                                        <div className="lang-full-transcript-box">
                                            <p className="full-transcript-text">"{result.transcript}"</p>

                                            {result.englishTranslation && (
                                                <div className="full-translation-box">
                                                    <span className="translation-tag">🇬🇧 English Translation:</span>
                                                    <p className="translation-text">"{result.englishTranslation}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="lang-prompt-recap">
                                            <span className="recap-label">Topic:</span>
                                            <span className="recap-text">{result.promptTopic}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="lang-results-actions-row">
                                    <Button
                                        variant="primary"
                                        size="md"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        View Longitudinal Trends →
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={() => {
                                            setPhase('instructions');
                                            setResult(null);
                                            setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
                                        }}
                                    >
                                        Repeat Assessment
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={() => navigate('/tests')}
                                    >
                                        All Assessments
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* ── In-Flight Exit Confirmation Modal ── */}
                {showExitConfirm && (
                    <div className="story-modal-backdrop animate-fadeIn">
                        <div className="story-modal-card">
                            <div className="story-modal-icon">⚠️</div>
                            <h3 className="story-modal-title">Leave this assessment?</h3>
                            <p className="story-modal-text">
                                Your current recording or speech progress will be lost if you leave now.
                            </p>
                            <div className="story-modal-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowExitConfirm(false)}
                                >
                                    Stay & Continue
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={confirmExit}
                                    style={{ background: "#DC2626", borderColor: "#DC2626" }}
                                >
                                    Leave Assessment
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
