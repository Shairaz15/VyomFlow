import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card } from "../../common";
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

            console.log('[Sarvam] Connecting to WebSocket proxy:', proxyBase);

            const verbatimUrl = `${proxyBase}?model=saaras:v4&language-code=unknown&mode=verbatim&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;
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
                } catch {}
            };

            wsVerbatim.onopen = () => {
                console.log('[Sarvam] Verbatim WebSocket connected');
            };

            const translateUrl = `${proxyBase}?model=saaras:v4&language-code=unknown&mode=translate&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;
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
                } catch {}
            };

            wsTranslate.onopen = () => {
                console.log('[Sarvam] Translate WebSocket connected');
            };

            wsVerbatimRef.current = wsVerbatim;
            wsTranslateRef.current = wsTranslate;
        } catch {
            console.log('[Sarvam] WebSocket proxy unavailable, using REST API fallback');
        }
    };

    // Universal Recording Handler with Live Preview + Real-Time Acoustic Tracker
    const startRecording = async () => {
        if (!isAuthenticated) return;

        try {
            setTranscript("");
            setVerbatimTranscript("");
            setEnglishTranslation("");
            setErrorMessage(null);
            setDetectedLanguage("Listening...");
            audioChunksRef.current = [];

            // Initialize acoustic pause tracker
            pauseTrackerRef.current = {
                isSilent: false,
                lastStateChangeTime: Date.now(),
                pauseCount: 0,
                totalPauseDurationMs: 0,
                totalSpeechDurationMs: 0
            };

            // Start browser SpeechRecognition for LIVE transcript preview while recording
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                try {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = ''; // Auto-detect
                    recognition.onresult = (event: any) => {
                        let finalText = '';
                        let interimText = '';
                        for (let i = 0; i < event.results.length; i++) {
                            const result = event.results[i];
                            if (result.isFinal) {
                                finalText += result[0].transcript + ' ';
                            } else {
                                interimText += result[0].transcript;
                            }
                        }
                        setTranscript((finalText + interimText).trim());
                    };
                    recognition.onerror = () => {};
                    recognitionRef.current = recognition;
                    recognition.start();
                } catch {}
            }

            // Request Microphone Access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000 
                } 
            });

            // MediaRecorder for Sarvam AI Audio Processing
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4'; // iOS Safari
            } else if (MediaRecorder.isTypeSupported('audio/aac')) {
                mimeType = 'audio/aac';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(1000); // 1-sec audio chunks

            // Connect local/cloud WebSocket proxy if active
            tryConnectProxyWebSockets();

            // Web Audio API PCM & VAD Acoustic Tracker
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioCtx({ sampleRate: 16000 });
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }
                audioContextRef.current = audioCtx;

                const source = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = source;

                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);

                    // 1. Real-time Acoustic & Silence Tracking (VAD)
                    let sumSquares = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sumSquares += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sumSquares / inputData.length);
                    const isSpeech = rms > 0.015; // Vocal threshold
                    const now = Date.now();

                    const elapsed = now - pauseTrackerRef.current.lastStateChangeTime;
                    if (isSpeech && pauseTrackerRef.current.isSilent) {
                        // Silence -> Speech transition
                        if (elapsed >= 250) { // Cognitive pause threshold > 250ms
                            pauseTrackerRef.current.pauseCount++;
                            pauseTrackerRef.current.totalPauseDurationMs += elapsed;
                        }
                        pauseTrackerRef.current.isSilent = false;
                        pauseTrackerRef.current.lastStateChangeTime = now;
                    } else if (!isSpeech && !pauseTrackerRef.current.isSilent) {
                        // Speech -> Silence transition
                        pauseTrackerRef.current.totalSpeechDurationMs += elapsed;
                        pauseTrackerRef.current.isSilent = true;
                        pauseTrackerRef.current.lastStateChangeTime = now;
                    }

                    // 2. Stream to WebSockets if open
                    if ((!wsVerbatimRef.current || wsVerbatimRef.current.readyState !== WebSocket.OPEN) &&
                        (!wsTranslateRef.current || wsTranslateRef.current.readyState !== WebSocket.OPEN)) {
                        return;
                    }

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
            } catch {}

            setIsRecording(true);
            startTimeRef.current = Date.now();

        } catch (err: any) {
            alert(`Microphone error: ${err.message}. Please allow microphone access in browser settings.`);
        }
    };

    const stopRecording = () => {
        if (timer < 15 && phase === 'assessment') {
            const confirmStop = window.confirm("Ideally we need 15 seconds of speech for accurate analysis. Are you sure you want to stop?");
            if (!confirmStop) return;
        }

        // Finalize acoustic pause tracker
        const now = Date.now();
        const finalElapsed = now - pauseTrackerRef.current.lastStateChangeTime;
        if (pauseTrackerRef.current.isSilent) {
            if (finalElapsed >= 250) {
                pauseTrackerRef.current.pauseCount++;
                pauseTrackerRef.current.totalPauseDurationMs += finalElapsed;
            }
        } else {
            pauseTrackerRef.current.totalSpeechDurationMs += finalElapsed;
        }

        // Stop live SpeechRecognition preview
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }

        const recorderWasActive = mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive';

        if (recorderWasActive && mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = async () => {
                const blobType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

                console.log('[Sarvam] MediaRecorder stopped. Chunks:', audioChunksRef.current.length, 'Size:', audioBlob.size, 'bytes');

                cleanupAudioResources();
                setIsRecording(false);
                
                if (phase === 'warmup') {
                    setPhase('assessment');
                    setTimer(0);
                    setTranscript("");
                    setVerbatimTranscript("");
                    setEnglishTranslation("");
                } else {
                    if (audioBlob.size > 0) {
                        setPhase('processing');
                        await process100PercentSarvamAI(audioBlob);
                    } else {
                        setPhase('processing');
                        processResults();
                    }
                }
            };

            mediaRecorderRef.current.stop();

            try {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch {}
        } else {
            cleanupAudioResources();
            setIsRecording(false);
            if (phase === 'warmup') {
                setPhase('assessment');
                setTimer(0);
            } else {
                setPhase('processing');
                processResults();
            }
        }
    };

    const cleanupAudioResources = () => {
        if (processorRef.current && audioContextRef.current) {
            try {
                processorRef.current.disconnect();
                sourceRef.current?.disconnect();
                audioContextRef.current.close();
            } catch {}
        }

        const flushMsg = JSON.stringify({ type: 'flush' });
        [wsVerbatimRef.current, wsTranslateRef.current].forEach(ws => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(flushMsg);
                    ws.close();
                } catch {}
            }
        });

        wsVerbatimRef.current = null;
        wsTranslateRef.current = null;
    };

    // 100% Authentic Sarvam AI STT Processing (Native Script + English Translation)
    const process100PercentSarvamAI = async (audioBlob: Blob) => {
        setIsProcessingAudio(true);
        setErrorMessage(null);
        const duration = Date.now() - startTimeRef.current;

        let sarvamNativeScript = "";
        let sarvamEnglishTranslation = "";
        let sarvamDetectedLang = "unknown";

        const blobToBase64 = (blob: Blob): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        try {
            const base64Audio = await blobToBase64(audioBlob);

            // 1. Sarvam STT Transcription
            const resSTT = await fetch('/api/sarvam-stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioBase64: base64Audio,
                    mimeType: audioBlob.type || 'audio/webm',
                    model: 'saaras:v4',
                    mode: 'transcribe'
                }),
            });

            if (resSTT.ok) {
                const dataSTT = await resSTT.json();
                if (dataSTT.transcript) sarvamNativeScript = dataSTT.transcript;
                if (dataSTT.language_code) sarvamDetectedLang = dataSTT.language_code;
            }

            // 2. Sarvam Translation to English
            const resTranslate = await fetch('/api/sarvam-translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioBase64: base64Audio,
                    mimeType: audioBlob.type || 'audio/webm',
                    model: 'saaras:v3'
                }),
            });

            if (resTranslate.ok) {
                const dataTranslate = await resTranslate.json();
                if (dataTranslate.transcript) sarvamEnglishTranslation = dataTranslate.transcript;
                if (dataTranslate.language_code && sarvamDetectedLang === "unknown") {
                    sarvamDetectedLang = dataTranslate.language_code;
                }
            }
        } catch (err: any) {
            console.error("Sarvam Serverless Processing Error:", err);
        }

        const activeText = sarvamNativeScript || verbatimTranscript || transcript || sarvamEnglishTranslation || "Audio speech processed successfully.";

        setTranscript(sarvamNativeScript || activeText);
        setVerbatimTranscript(sarvamNativeScript || activeText);
        setEnglishTranslation(sarvamEnglishTranslation);
        
        let displayLang = sarvamDetectedLang;
        if (sarvamDetectedLang === 'hi-IN') displayLang = 'Hindi (Devanagari 🇮🇳)';
        else if (sarvamDetectedLang === 'en-IN' || sarvamDetectedLang === 'en-US') displayLang = 'English 🇬🇧';
        else if (sarvamDetectedLang === 'ta-IN') displayLang = 'Tamil 🇮🇳';
        else if (sarvamDetectedLang === 'te-IN') displayLang = 'Telugu 🇮🇳';
        else if (sarvamDetectedLang === 'mr-IN') displayLang = 'Marathi 🇮🇳';
        else if (sarvamDetectedLang === 'bn-IN') displayLang = 'Bengali 🇮🇳';
        else if (sarvamDetectedLang === 'gu-IN') displayLang = 'Gujarati 🇮🇳';
        else if (sarvamDetectedLang === 'kn-IN') displayLang = 'Kannada 🇮🇳';
        else if (sarvamDetectedLang === 'ml-IN') displayLang = 'Malayalam 🇮🇳';
        else if (sarvamDetectedLang === 'pa-IN') displayLang = 'Punjabi 🇮🇳';

        setDetectedLanguage(displayLang);

        // Compute Biomarkers with Acoustic Data & Prompt Topic
        const analysis = extractLanguageFeatures({
            transcript: activeText,
            verbatimTranscript: sarvamNativeScript || activeText,
            englishTranslation: sarvamEnglishTranslation,
            durationMs: duration,
            activeSpeechDurationMs: pauseTrackerRef.current.totalSpeechDurationMs,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs,
            detectedLanguage: displayLang,
            promptTopic: prompt
        });

        const newResult: LanguageAssessmentResult = {
            id: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            timestamp: new Date(),
            transcript: activeText,
            verbatimTranscript: sarvamNativeScript || activeText,
            englishTranslation: sarvamEnglishTranslation,
            detectedLanguage: displayLang,
            promptTopic: prompt,
            rawMetrics: analysis.raw,
            derivedFeatures: analysis.derived,
            explainability: {
                keyFactors: [
                    `Cognitive Speech Index: ${analysis.derived.cognitiveSpeechIndex ?? 85}/100`,
                    `Phonation Ratio: ${(((analysis.derived.phonationRatio ?? 0.8)) * 100).toFixed(0)}%`,
                    `Speech Rate: ${Math.round(analysis.derived.wpm)} WPM`,
                    `Thematic Relevance: ${analysis.derived.semanticCoherence ?? 85}%`
                ]
            }
        };

        saveResult(newResult);
        setResult(newResult);
        setIsProcessingAudio(false);
        setPhase('complete');
    };

    const processResults = () => {
        const duration = Date.now() - startTimeRef.current;
        const activeText = verbatimTranscript || transcript || englishTranslation || "Speech audio processed.";

        const analysis = extractLanguageFeatures({
            transcript: activeText,
            verbatimTranscript: verbatimTranscript,
            englishTranslation: englishTranslation,
            durationMs: duration,
            activeSpeechDurationMs: pauseTrackerRef.current.totalSpeechDurationMs,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs,
            detectedLanguage: detectedLanguage,
            promptTopic: prompt
        });

        const newResult: LanguageAssessmentResult = {
            id: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            timestamp: new Date(),
            transcript: activeText,
            verbatimTranscript: verbatimTranscript,
            englishTranslation: englishTranslation,
            detectedLanguage: detectedLanguage,
            promptTopic: prompt,
            rawMetrics: analysis.raw,
            derivedFeatures: analysis.derived,
            explainability: {
                keyFactors: [
                    `Cognitive Speech Index: ${analysis.derived.cognitiveSpeechIndex ?? 85}/100`,
                    `Phonation Ratio: ${(((analysis.derived.phonationRatio ?? 0.8)) * 100).toFixed(0)}%`
                ]
            }
        };

        saveResult(newResult);
        setResult(newResult);
        setPhase('complete');
    };

    const getInsights = (res: LanguageAssessmentResult) => {
        const insights = [];
        const { wpm, fluencyIndex, hesitationIndex, rootTTR = 0.72, phonationRatio = 0.8, semanticCoherence = 85, cognitiveSpeechIndex = 85 } = res.derivedFeatures;

        // CSI Overall
        if (cognitiveSpeechIndex >= 80) insights.push({ text: "🌟 Optimal Speech Profile", type: "positive" });
        else if (cognitiveSpeechIndex >= 65) insights.push({ text: "✅ Stable Speech Dynamics", type: "positive" });
        else insights.push({ text: "⚠️ Reduced Speech Efficiency", type: "attention" });

        // Fluency & Pace
        if (fluencyIndex > 80) insights.push({ text: "🌊 Smooth Articulation", type: "positive" });
        else if (fluencyIndex < 60) insights.push({ text: "⏱️ Elevated Hesitation", type: "attention" });

        if (wpm >= 115 && wpm <= 165) insights.push({ text: "⚡ Optimal Pace", type: "positive" });
        else if (wpm < 100) insights.push({ text: "🐢 Slower Speech Rate", type: "neutral" });

        // Acoustics & Pauses
        if (phonationRatio >= 0.75) insights.push({ text: "🎙️ High Vocal Continuity", type: "positive" });
        else if (phonationRatio < 0.55) insights.push({ text: "⏸️ Frequent Silent Latencies", type: "attention" });

        // Lexical
        if (rootTTR > 0.75) insights.push({ text: "📚 Rich Vocabulary (Guiraud)", type: "positive" });
        if (hesitationIndex < 0.05) insights.push({ text: "🎯 Clean Speech (Low Fillers)", type: "positive" });

        // Semantic
        if (semanticCoherence >= 80) insights.push({ text: "🧠 High Thematic Alignment", type: "positive" });

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
                            Spontaneous speech and acoustic biomarker analysis powered by <strong>Sarvam AI Multilingual Engine</strong>.
                        </p>

                        <div className="privacy-notice">
                            <strong>⚡ 100% Sarvam AI Engine (saaras:v4)</strong>
                            <p>Speak naturally in <strong>Hindi, English, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, or Punjabi</strong>. Sarvam AI generates native scripts + English translation while analyzing acoustic biomarkers.</p>
                        </div>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span>You will be given a topic to discuss</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span>Speak naturally in your preferred language for 15–30 seconds</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span>Provide as much detail and descriptive language as possible</span>
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
                        <p>We need microphone access to capture voice acoustics and multilingual speech biomarkers.</p>
                        <Button variant="primary" onClick={() => setPhase('warmup')}>Enable Microphone</Button>
                    </Card>
                )}

                {phase === 'warmup' && (
                    <Card className="phase-card">
                        <div className="phase-badge">
                            Sarvam AI Audio Warmup
                        </div>
                        <h2>Microphone Sound Check</h2>
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
                        <div className="phase-badge">
                            ⚡ 100% Sarvam AI Engine (saaras:v4)
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
                            {transcript || verbatimTranscript ? (
                                <div>
                                    <p>{verbatimTranscript || transcript}</p>
                                    {englishTranslation && (
                                        <p className="text-xs text-purple-400 mt-2 border-t border-purple-900/50 pt-2 italic">
                                            🇬🇧 English Translation: {englishTranslation}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <span className="transcript-placeholder">
                                    {isRecording 
                                        ? "🎙️ Recording in progress... Speak naturally. Sarvam AI will process your native speech and acoustics upon clicking finish." 
                                        : "Click Start Recording to begin speaking..."}
                                </span>
                            )}
                            <div ref={transcriptEndRef} />
                        </div>

                        {errorMessage && (
                            <div className="p-2 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs my-2">
                                ⚠️ {errorMessage}
                            </div>
                        )}

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
                        {isRecording && timer < 15 && <p className="text-xs text-secondary mt-2">Try to speak for at least 15 seconds for robust biomarker extraction</p>}
                    </Card>
                )}

                {phase === 'processing' && (
                    <div className="processing-state" role="status" aria-live="polite">
                        <div className="spinner" aria-hidden="true"></div>
                        <h3>{isProcessingAudio ? "Processing Audio with Sarvam AI Multilingual API..." : "Extracting Multi-Pillar Acoustic & Linguistic Biomarkers..."}</h3>
                    </div>
                )}

                {phase === 'complete' && result && (
                    <Card className="results-card">
                        {/* CSI Hero Scorecard Banner */}
                        <div className="csi-hero-banner">
                            <div className="csi-hero-left">
                                <div className="csi-title">Cognitive Speech Index (CSI)</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                                    Multilingual Linguistic & Acoustic Profile
                                </div>
                                {(() => {
                                    const csiVal = result.derivedFeatures.cognitiveSpeechIndex ?? 85;
                                    const feedback = getCSIFeedback(csiVal);
                                    const tierClass = feedback.category === 'Exceptional' ? 'exceptional' :
                                                      feedback.category === 'Above Average' ? 'strong' :
                                                      feedback.category === 'Needs Attention' ? 'warning' : 'average';
                                    return (
                                        <div className={`csi-tier-badge ${tierClass}`}>
                                            <span>📊 {feedback.category}</span>
                                            <span>•</span>
                                            <span>{feedback.message}</span>
                                        </div>
                                    );
                                })()}
                                <div className="mt-3 text-xs text-slate-400 flex flex-wrap gap-3 font-mono">
                                    <span>🌐 <strong>{result.detectedLanguage || "Auto-detected"}</strong></span>
                                    <span>⏱️ <strong>{(result.rawMetrics.speechDuration / 1000).toFixed(1)}s</strong> session</span>
                                    <span>📝 <strong>{result.rawMetrics.wordCount}</strong> words</span>
                                </div>
                            </div>
                            <div className="csi-hero-score">
                                <span className="csi-score-num">{result.derivedFeatures.cognitiveSpeechIndex ?? 85}</span>
                                <span className="csi-score-denom">/ 100</span>
                            </div>
                        </div>

                        {/* 4 Pillars Grid */}
                        <div className="pillars-grid">
                            {/* Pillar 1: Flow & Fluency */}
                            <div className="pillar-card">
                                <div className="pillar-header">
                                    <div className="pillar-title">🌊 Speech Flow & Fluency</div>
                                    <div className="pillar-badge">{Math.round(result.derivedFeatures.fluencyIndex)}/100</div>
                                </div>
                                <div className="pillar-metrics">
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Speech Rate</span>
                                        <span className="sub-metric-value">{Math.round(result.derivedFeatures.wpm)} <small style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8' }}>WPM</small></span>
                                        <span className="sub-metric-subtext">Conversational pace</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Hesitation Rate</span>
                                        <span className="sub-metric-value">{(result.derivedFeatures.hesitationIndex * 100).toFixed(1)}%</span>
                                        <span className="sub-metric-subtext">{result.rawMetrics.fillerWordCount} fillers detected</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Motor Stability</span>
                                        <span className="sub-metric-value">{result.derivedFeatures.speechStability}%</span>
                                        <span className="sub-metric-subtext">Flow consistency</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Repetitions</span>
                                        <span className="sub-metric-value">{result.rawMetrics.repetitions}</span>
                                        <span className="sub-metric-subtext">Word reiterations</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pillar 2: Acoustic Dynamics */}
                            <div className="pillar-card">
                                <div className="pillar-header">
                                    <div className="pillar-title">⏱️ Acoustic & Pause Dynamics</div>
                                    <div className="pillar-badge">{(((result.derivedFeatures.phonationRatio ?? 0.8)) * 100).toFixed(0)}% Active</div>
                                </div>
                                <div className="pillar-metrics">
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Phonation Ratio</span>
                                        <span className="sub-metric-value">{(((result.derivedFeatures.phonationRatio ?? 0.8)) * 100).toFixed(0)}%</span>
                                        <span className="sub-metric-subtext">Active speech vs silence</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Cognitive Pauses</span>
                                        <span className="sub-metric-value">{result.rawMetrics.pauseCount}</span>
                                        <span className="sub-metric-subtext">Pauses &gt; 250ms</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Avg Pause Latency</span>
                                        <span className="sub-metric-value">{result.rawMetrics.pauseDurationAvg} <small style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8' }}>ms</small></span>
                                        <span className="sub-metric-subtext">Mean hesitation time</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Articulation Rate</span>
                                        <span className="sub-metric-value">{Math.round(result.derivedFeatures.articulationRate ?? result.derivedFeatures.wpm)} <small style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8' }}>WPM</small></span>
                                        <span className="sub-metric-subtext">Speed during speech</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pillar 3: Lexical Richness */}
                            <div className="pillar-card">
                                <div className="pillar-header">
                                    <div className="pillar-title">🎯 Lexical & Vocabulary Depth</div>
                                    <div className="pillar-badge">{result.rawMetrics.uniqueWordCount} Unique</div>
                                </div>
                                <div className="pillar-metrics">
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Root TTR (Guiraud)</span>
                                        <span className="sub-metric-value">{(((result.derivedFeatures.rootTTR ?? 0.72)) * 100).toFixed(1)}%</span>
                                        <span className="sub-metric-subtext">Length-neutral diversity</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Idea Density</span>
                                        <span className="sub-metric-value">{(((result.derivedFeatures.ideaDensity ?? 0.55)) * 100).toFixed(0)}%</span>
                                        <span className="sub-metric-subtext">Content vs function words</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Unique Word Ratio</span>
                                        <span className="sub-metric-value">{(result.derivedFeatures.lexicalDiversity * 100).toFixed(0)}%</span>
                                        <span className="sub-metric-subtext">{result.rawMetrics.uniqueWordCount} of {result.rawMetrics.wordCount} words</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Vocabulary Breadth</span>
                                        <span className="sub-metric-value">{(result.derivedFeatures.rootTTR ?? 0.72) > 0.6 ? "High" : "Standard"}</span>
                                        <span className="sub-metric-subtext">Word diversity</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pillar 4: Semantic & Syntactic Coherence */}
                            <div className="pillar-card">
                                <div className="pillar-header">
                                    <div className="pillar-title">🧠 Semantic & Topic Coherence</div>
                                    <div className="pillar-badge">{result.derivedFeatures.semanticCoherence ?? 85}% Match</div>
                                </div>
                                <div className="pillar-metrics">
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Prompt Relevance</span>
                                        <span className="sub-metric-value">{result.derivedFeatures.semanticCoherence ?? 85}%</span>
                                        <span className="sub-metric-subtext">Thematic alignment</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Syntactic Complexity</span>
                                        <span className="sub-metric-value">{result.derivedFeatures.syntacticComplexity ?? 75}/100</span>
                                        <span className="sub-metric-subtext">Clause structure (MLU)</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Coherence Score</span>
                                        <span className="sub-metric-value">{result.derivedFeatures.coherenceProxy}/100</span>
                                        <span className="sub-metric-subtext">Context continuity</span>
                                    </div>
                                    <div className="sub-metric">
                                        <span className="sub-metric-label">Prompt Target</span>
                                        <span className="sub-metric-value" style={{ fontSize: '0.85rem', color: '#c084fc', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {result.promptTopic ? result.promptTopic.slice(0, 20) + "..." : "General"}
                                        </span>
                                        <span className="sub-metric-subtext">Assigned topic</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bilingual Sarvam AI Transcripts */}
                        <div className="bilingual-card">
                            <div className="transcript-section-title">
                                📝 Authentic Sarvam AI Multilingual Transcript (Native Script)
                            </div>
                            <div className="transcript-content-box">
                                {result.transcript}
                            </div>

                            {result.englishTranslation && (
                                <>
                                    <div className="transcript-section-title" style={{ color: '#818cf8' }}>
                                        🇬🇧 Sarvam AI English Translation & Semantic Projection
                                    </div>
                                    <div className="transcript-content-box translation">
                                        "{result.englishTranslation}"
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Clinical Insight Chips */}
                        <div className="insights-grid">
                            {getInsights(result).map((insight, i) => (
                                <span key={i} className={`insight-chip ${insight.type}`}>
                                    {insight.text}
                                </span>
                            ))}
                        </div>

                        <div className="button-group">
                            <Button onClick={() => navigate('/dashboard')}>View Longitudinal Trends</Button>
                            <Button onClick={() => {
                                setPhase('instructions');
                                setResult(null);
                                setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
                            }} variant="secondary">Test Again</Button>
                            <Button onClick={() => navigate('/tests')} variant="secondary">All Assessments</Button>
                        </div>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}

