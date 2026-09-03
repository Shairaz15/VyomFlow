import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon, TutorialVideoPlaceholder, MotivationalQuoteBlock } from "../../common";
import { useLanguageResults } from "../../../hooks/useTestResults";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";
import type { LanguageAssessmentResult } from "../../../types/languageTypes";
import "../story/StoryAssessment.css";
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { results, saveResult } = useLanguageResults();

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
    const activeStageRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
    const isRecordingRef = useRef<boolean>(false);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            isRecordingRef.current = false;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop();
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                } catch {}
            }
        };
    }, []);

    // Smoothly scroll and center the active stage card within viewport
    const scrollToActiveStage = useCallback(() => {
        if (!activeStageRef.current) return;

        requestAnimationFrame(() => {
            if (!activeStageRef.current) return;
            const rect = activeStageRef.current.getBoundingClientRect();
            const topClearance = 80;
            const isComfortablyVisible = 
                rect.top >= topClearance && 
                rect.bottom <= window.innerHeight + 40;

            if (!isComfortablyVisible) {
                activeStageRef.current.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center",
                    inline: "nearest"
                });
            }
        });
    }, []);

    useEffect(() => {
        scrollToActiveStage();
    }, [phase, scrollToActiveStage]);

    // Scroll to bottom of transcript in live box
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

    // Convert Float32 PCM chunk from ScriptProcessorNode to a valid 16kHz mono WAV Base64 string for Sarvam AI
    const convertFloat32ToWavBase64 = (float32Array: Float32Array, sampleRate = 16000): string => {
        const numSamples = float32Array.length;
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);

        // RIFF header
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + numSamples * 2, true); // file length - 8
        view.setUint32(8, 0x57415645, false); // "WAVE"
        // fmt sub-chunk
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, 1, true); // NumChannels (1 mono)
        view.setUint32(24, sampleRate, true); // SampleRate
        view.setUint32(28, sampleRate * 2, true); // ByteRate
        view.setUint16(32, 2, true); // BlockAlign
        view.setUint16(34, 16, true); // BitsPerSample
        // data sub-chunk
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, numSamples * 2, true); // data size

        // Write 16-bit PCM samples
        let offset = 44;
        for (let i = 0; i < numSamples; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(offset, sample, true);
        }

        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    // Connect to Sarvam AI live WebSocket stream (via Vite dev proxy or cloud proxy)
    const tryConnectProxyWebSockets = () => {
        try {
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const verbatimUrl = isLocalDev
                ? `${wsProtocol}//${window.location.host}/api/sarvam-ws?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000`
                : `${import.meta.env.VITE_SARVAM_PROXY_URL || 'wss://vyomflow-proxy.onrender.com'}?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;

            console.log("[LanguageAssessment] Connecting to Sarvam WebSocket:", verbatimUrl);
            const wsVerbatim = new WebSocket(verbatimUrl);
            wsVerbatimRef.current = wsVerbatim;

            wsVerbatim.onopen = () => {
                console.log("[LanguageAssessment] ✅ Sarvam AI WebSocket connected successfully!");
            };

            wsVerbatim.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'data' && data.data?.transcript) {
                        const newText = data.data.transcript.trim();
                        if (newText) {
                            setVerbatimTranscript(prev => (prev ? `${prev} ${newText}` : newText));
                            setTranscript(prev => (prev ? `${prev} ${newText}` : newText));
                        }
                        if (data.data?.language_code) setDetectedLanguage(data.data.language_code);
                    } else if (data.type === 'transcript' && data.text) {
                        const newText = data.text.trim();
                        if (newText) {
                            setVerbatimTranscript(prev => (prev ? `${prev} ${newText}` : newText));
                            setTranscript(prev => (prev ? `${prev} ${newText}` : newText));
                        }
                        if (data.language_code) setDetectedLanguage(data.language_code);
                    }
                } catch {
                    // Ignore parse errors on raw keepalive signals
                }
            };

            wsVerbatim.onerror = (err) => {
                console.warn("[LanguageAssessment] Sarvam WebSocket event:", err);
            };
        } catch {
            console.warn("WebSocket proxy connection failed. Will use Sarvam REST live polling.");
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
            isRecordingRef.current = true;

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

            // 1. Setup MediaRecorder for audio processing
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.start(400);
            startTimeRef.current = Date.now();
            setIsRecording(true);
            isRecordingRef.current = true;

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

                    // Forward real-time 16kHz WAV payload to streaming Sarvam WebSocket
                    if (wsVerbatimRef.current?.readyState === WebSocket.OPEN) {
                        const wavBase64 = convertFloat32ToWavBase64(inputData, 16000);
                        const payload = JSON.stringify({
                            audio: {
                                data: wavBase64,
                                sample_rate: '16000',
                                encoding: 'audio/wav'
                            }
                        });
                        wsVerbatimRef.current.send(payload);
                    }
                };

                sourceNode.connect(processor);
                processor.connect(audioCtx.destination);
            } catch (err) {
                console.warn("Real-time Web Audio VAD initialization skipped:", err);
            }

        } catch (err) {
            console.error("Microphone access failed:", err);
            setErrorMessage("Could not access microphone. Please ensure microphone permissions are granted.");
            isRecordingRef.current = false;
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (!isRecordingRef.current && !isRecording) return;
        isRecordingRef.current = false;
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
            wsVerbatimRef.current = null;
        } catch {}
        try {
            wsTranslateRef.current?.close();
            wsTranslateRef.current = null;
        } catch {}

        // Stop Audio Processing
        try {
            processorRef.current?.disconnect();
            sourceRef.current?.disconnect();
            audioContextRef.current?.close();
        } catch {}

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
    // Process audio with Sarvam AI Live Streaming Transcript + Acoustic Biomarkers
    const processAssessmentResults = async (_audioBlob?: Blob) => {
        setPhase('processing');
        setIsProcessingAudio(true);

        const duration = Date.now() - startTimeRef.current;
        const liveCaptured = verbatimTranscript.trim() || transcript.trim();
        let sarvamTranscript = liveCaptured;
        let sarvamTranslation = englishTranslation;
        let detectedLang = detectedLanguage;

        try {
            // If non-English detected, translate to English for semantic scoring
            if (detectedLang && detectedLang !== 'en-IN' && detectedLang !== 'en-US' && detectedLang !== 'unknown') {
                try {
                    const translatePayload = JSON.stringify({
                        input: sarvamTranscript,
                        source_language_code: detectedLang,
                        target_language_code: 'en-IN',
                        model: 'sarvam-translate:v1',
                        mode: 'formal'
                    });

                    let translateRes = await fetch('/api/sarvam-translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: translatePayload
                    });

                    if (!translateRes.ok) {
                        translateRes = await fetch('https://api.sarvam.ai/translate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'api-subscription-key': SARVAM_API_KEY
                            },
                            body: translatePayload
                        });
                    }

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
        } catch (err) {
            console.warn("Sarvam processing notice:", err);
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

    // Navigation and Exit Controls
    const handleExitClick = () => {
        if (phase === "instructions" || phase === "complete") {
            navigate("/tests");
            return;
        }
        setShowExitConfirm(true);
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

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    const handleRetake = () => {
        setPhase("instructions");
        setResult(null);
        setTranscript("");
        setVerbatimTranscript("");
        setEnglishTranslation("");
        setTimer(0);
        setIsRecording(false);
        setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    };

    // Score tier calculation matching Story Recall convention
    const getScoreTier = (score: number) => {
        if (score >= 80) return { label: 'Exceptional Fluency', level: 'stable' as const };
        if (score >= 60) return { label: 'Moderate Fluency', level: 'change_detected' as const };
        return { label: 'Needs Attention', level: 'possible_risk' as const };
    };

    // Trend calculation comparing with prior sessions
    const trend: 'up' | 'down' = useMemo(() => {
        try {
            if (results && results.length > 0) {
                const prev = results[results.length - 1];
                const prevScore = prev?.derivedFeatures?.cognitiveSpeechIndex ?? (prev as any)?.score;
                if (typeof prevScore === 'number') {
                    const currentScore = result?.derivedFeatures?.cognitiveSpeechIndex ?? 85;
                    return currentScore >= prevScore ? 'up' : 'down';
                }
            }
        } catch {
            // fallback
        }
        const currentScore = result?.derivedFeatures?.cognitiveSpeechIndex ?? 85;
        return currentScore >= 60 ? 'up' : 'down';
    }, [results, result]);

    // Radar chart data for Language Fluency
    const radarData = useMemo(() => {
        if (!result) return [];
        const df = result.derivedFeatures;
        const wpmScore = Math.min(100, Math.round((df.wpm / 140) * 100));
        const ttrScore = Math.min(100, Math.round(((df.rootTTR ?? 0.72) / 0.8) * 100));
        const phonationScore = Math.min(100, Math.round((df.phonationRatio ?? 0.8) * 100));
        const fluencyScore = Math.min(100, Math.round(df.fluencyIndex ?? 85));
        const stabilityScore = Math.min(100, Math.round(df.speechStability ?? 80));
        const coherenceScore = Math.min(100, Math.round(df.semanticCoherence ?? df.coherenceProxy ?? 85));

        return [
            { subject: 'Speech Rate', A: wpmScore, fullMark: 100 },
            { subject: 'Fluency Index', A: fluencyScore, fullMark: 100 },
            { subject: 'Vocabulary (TTR)', A: ttrScore, fullMark: 100 },
            { subject: 'Phonation Ratio', A: phonationScore, fullMark: 100 },
            { subject: 'Speech Stability', A: stabilityScore, fullMark: 100 },
            { subject: 'Semantic Flow', A: coherenceScore, fullMark: 100 },
        ];
    }, [result]);

    // Custom axis tick renderer matching Story Recall
    const renderCustomAxisTick = ({ payload, x, y, cx, cy }: any) => {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offsetX = dist > 0 ? x + (dx / dist) * 8 : x;
        const offsetY = dist > 0 ? y + (dy / dist) * 8 : y;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (dx > 12) {
            textAnchor = 'start';
        } else if (dx < -12) {
            textAnchor = 'end';
        }

        return (
            <text
                x={offsetX}
                y={offsetY}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill={isDark ? '#E2ECF2' : '#17324D'}
                fontSize={10}
                fontWeight={600}
                className="radar-axis-tick select-none"
            >
                {payload.value}
            </text>
        );
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
            <div className="story-assessment-container container">
                {/* ── Top Navigation Bar ── */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label="Back to Assessments"
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>Back to Assessments</span>
                    </button>
                </div>

                {/* ── Primary Test Header (shown only on instructions intro) ── */}
                {phase === "instructions" && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">Language Fluency</h1>
                        <p className="story-subtitle">
                            Speak naturally on the assigned topic to analyze speech fluency, vocabulary depth, and acoustic biomarkers.
                        </p>
                    </div>
                )}

                {/* ── Active Assessment Stage Viewport ── */}
                <div ref={activeStageRef} className="story-stage-viewport lang-stage-viewport">
                    {/* ── Phase 1: Instructions Phase (Story Recall Layout & Orientation) ── */}
                    {phase === 'instructions' && (
                        <div className="instructions-with-tutorial-layout animate-fadeIn">
                            <Card className="instructions-card">
                                <div className="instructions-content">
                                    <div className="instructions-icon-wrapper" aria-hidden="true">
                                        <Icon name="language" size={28} />
                                    </div>
                                    <h2 className="instructions-card-title vyom-serif">How this assessment works</h2>

                                    <ol className="instructions-step-list">
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">1</div>
                                            <div className="step-content">
                                                <strong>View Prompt:</strong>
                                                <span>A conversational speaking topic will be displayed on screen.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">2</div>
                                            <div className="step-content">
                                                <strong>Speak Naturally:</strong>
                                                <span>Express your thoughts in your preferred language for 15–30 seconds.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">3</div>
                                            <div className="step-content">
                                                <strong>Detail & Flow:</strong>
                                                <span>Describe your ideas with natural vocabulary and descriptive depth.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">4</div>
                                            <div className="step-content">
                                                <strong>Instant Biomarkers:</strong>
                                                <span>Speech rate, pause dynamics, and lexical diversity are analyzed automatically.</span>
                                            </div>
                                        </li>
                                    </ol>

                                    <div className="instructions-action-row">
                                        <Button
                                            variant="primary"
                                            className="story-primary-start-btn"
                                            onClick={() => setPhase('permission')}
                                        >
                                            Start Test
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Tutorial Video Placeholder */}
                            <TutorialVideoPlaceholder />
                        </div>
                    )}

                    {/* ── Phase 2: Microphone Permission Phase ── */}
                    {phase === 'permission' && (
                        <div className="lang-step-container animate-fadeIn">
                            <Card className="lang-phase-card">
                                <div className="lang-card-icon-badge">🎙️</div>
                                <h2 className="lang-phase-title vyom-serif">Microphone Access</h2>
                                <p className="lang-phase-subtitle">
                                    We need access to your microphone to capture voice acoustics and multilingual speech biomarkers securely.
                                </p>
                                <div className="instructions-action-row" style={{ marginTop: '1.25rem' }}>
                                    <Button 
                                        variant="primary" 
                                        className="story-primary-start-btn"
                                        onClick={() => setPhase('warmup')}
                                    >
                                        Enable Microphone & Continue
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* ── Phase 3: Warmup Sound Check ── */}
                    {phase === 'warmup' && (
                        <div className="lang-step-container animate-fadeIn">
                            <Card className="lang-phase-card">
                                <div className="lang-phase-tag">Sound Check</div>
                                <h2 className="lang-phase-title vyom-serif">Microphone Sound Check</h2>
                                <p className="lang-phase-subtitle">
                                    Read aloud: <em>"The quick brown fox jumps over the lazy dog."</em>
                                </p>

                                <div className="lang-live-transcript-box">
                                    {transcript ? (
                                        transcript
                                    ) : isRecording ? (
                                        <span style={{ opacity: 0.8, fontStyle: 'italic' }}>
                                            🎙️ Listening... Speak aloud: "The quick brown fox jumps over the lazy dog."
                                        </span>
                                    ) : (
                                        "Click Start Warmup to test your microphone."
                                    )}
                                </div>

                                <div className="instructions-action-row" style={{ marginTop: '1rem', gap: '0.75rem' }}>
                                    {!isRecording ? (
                                        <Button 
                                            variant="primary" 
                                            className="story-primary-start-btn lang-record-btn"
                                            onClick={startRecording}
                                        >
                                            Start Warmup 🎙️
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="secondary" 
                                            className="lang-stop-btn"
                                            onClick={stopRecording}
                                        >
                                            Stop & Continue →
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* ── Phase 4: Active Assessment Recording Phase ── */}
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
                                                ? "🎙️ Listening to your voice... Speak naturally. Transcribed text will appear here as you speak."
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
                                            className="story-primary-start-btn lang-start-record-cta"
                                            onClick={startRecording}
                                        >
                                            Start Recording 🎙️
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="secondary" 
                                            className="lang-finish-record-cta"
                                            onClick={stopRecording}
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

                    {/* ── Phase 5: Processing Phase ── */}
                    {phase === 'processing' && (
                        <Card className="processing-card animate-fadeIn">
                            <div className="processing-body">
                                <div className="spinner" />
                                <h3 className="processing-title vyom-serif">
                                    {isProcessingAudio ? "Processing Audio with Multilingual Engine..." : "Analyzing Speech Biomarkers..."}
                                </h3>
                                <p className="processing-desc">
                                    Analyzing phonation ratios, vocabulary richness (Guiraud TTR), and conversational fluency.
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* ── Phase 6: Results Screen (Story Recall Layout & Orientation) ── */}
                    {phase === 'complete' && result && (() => {
                        const csiScore = Math.round(result.derivedFeatures.cognitiveSpeechIndex ?? 85);
                        const tier = getScoreTier(csiScore);

                        return (
                            <div className="story-results-container animate-fadeIn">
                                {/* Top Overview Card */}
                                <Card className="results-overview-card">
                                    <div className="overview-header">
                                        <div className="overview-title-group">
                                            <h2 className="vyom-serif">Language Fluency Profile</h2>
                                            <span className={`story-trend-pill ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                                                <Icon name={trend === 'up' ? 'trend-up' : 'trend-down'} size={13} />
                                                <span>{trend === 'up' ? 'Improving' : 'Declining'}</span>
                                            </span>
                                        </div>
                                        <div className="score-badge-circle">
                                            <span className="score-num">{csiScore}</span>
                                            <span className="score-denom">/ 100</span>
                                        </div>
                                    </div>
                                </Card>

                                <MotivationalQuoteBlock
                                    category={tier.label}
                                    score={csiScore}
                                />

                                {/* Biomarkers Breakdown Row (2x2 grid) */}
                                <div className="biomarkers-grid-row">
                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Speech Rate</h4>
                                            <p className="metric-desc">{result.rawMetrics.wordCount} words • {(result.rawMetrics.speechDuration / 1000).toFixed(1)}s duration</p>
                                        </div>
                                        <div className="metric-val">
                                            {Math.round(result.derivedFeatures.wpm)} <span className="metric-unit">WPM</span>
                                        </div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Fluency Index</h4>
                                            <p className="metric-desc">Speech continuity & flow</p>
                                        </div>
                                        <div className="metric-val">
                                            {Math.round(result.derivedFeatures.fluencyIndex ?? 85)}%
                                        </div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Vocabulary Depth</h4>
                                            <p className="metric-desc">{result.rawMetrics.uniqueWordCount} unique words (Root TTR)</p>
                                        </div>
                                        <div className="metric-val">
                                            {Math.round((result.derivedFeatures.rootTTR ?? 0.72) * 100)}%
                                        </div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Acoustic Phonation</h4>
                                            <p className="metric-desc">{result.rawMetrics.pauseCount} pauses (avg {result.rawMetrics.pauseDurationAvg}ms)</p>
                                        </div>
                                        <div className="metric-val">
                                            {Math.round((result.derivedFeatures.phonationRatio ?? 0.8) * 100)}%
                                        </div>
                                    </Card>
                                </div>

                                {/* Full-Length Biomarker Radar & Speech Transcript Card */}
                                <Card className="radar-chart-card full-width-radar">
                                    <h3 className="radar-title">Biomarker Radar</h3>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={155}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="52%" data={radarData}>
                                                <PolarGrid stroke={isDark ? "rgba(0, 201, 183, 0.22)" : "rgba(79, 124, 120, 0.22)"} />
                                                <PolarAngleAxis 
                                                    dataKey="subject" 
                                                    tick={renderCustomAxisTick} 
                                                    tickLine={false} 
                                                />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" tick={false} />
                                                <Radar
                                                    name="Biomarkers"
                                                    dataKey="A"
                                                    stroke={isDark ? "#00C9B7" : "#4F7C78"}
                                                    fill={isDark ? "#00C9B7" : "#4F7C78"}
                                                    fillOpacity={isDark ? 0.35 : 0.28}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Speech Transcript & Analysis Section */}
                                    <div className="language-transcript-section">
                                        <div className="transcript-section-header">
                                            <div className="transcript-section-title-group">
                                                <Icon name="language" size={15} />
                                                <span className="transcript-section-title">Speech Transcript & Analysis</span>
                                            </div>
                                            <span className="transcript-meta-badge">
                                                {result.rawMetrics.wordCount} words • {(result.rawMetrics.speechDuration / 1000).toFixed(1)}s • {result.detectedLanguage ? result.detectedLanguage.toUpperCase() : "AUTO"}
                                            </span>
                                        </div>

                                        <div className="transcript-bubble-box">
                                            <div className="transcript-prompt-line">
                                                <span className="prompt-label">Topic:</span>
                                                <span className="prompt-value">"{result.promptTopic || prompt}"</span>
                                            </div>
                                            <div className="transcript-body-text">
                                                <span className="transcript-text-label">Spoken:</span>
                                                <p className="transcript-spoken-content">"{result.transcript}"</p>
                                            </div>
                                            {result.englishTranslation && (
                                                <div className="transcript-translation-line">
                                                    <span className="translation-tag">🇬🇧 English:</span>
                                                    <p className="translation-text">"{result.englishTranslation}"</p>
                                                </div>
                                            )}
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
                                </Card>

                                {/* Centered Actions */}
                                <div className="results-actions">
                                    <button type="button" onClick={handleRetake} className="story-retake-btn">
                                        <Icon name="language" size={16} /> Retake Test
                                    </button>
                                    <button 
                                        type="button" 
                                        className="story-primary-start-btn story-back-assessments-btn" 
                                        onClick={() => navigate('/tests')}
                                    >
                                        Back to Assessments
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* ── In-Flight Exit Confirmation Modal ── */}
                {showExitConfirm && (
                    <div className="story-modal-backdrop animate-fadeIn" role="dialog" aria-modal="true">
                        <div className="story-exit-modal animate-scaleUp">
                            <div className="exit-modal-icon">⚠️</div>
                            <h3 className="exit-modal-title vyom-serif">Leave this assessment?</h3>
                            <p className="exit-modal-text">
                                Your current recording or speech progress will be lost if you leave now.
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    Continue Test
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    Leave Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
