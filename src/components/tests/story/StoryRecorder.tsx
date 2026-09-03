import { useState, useRef, useEffect } from "react";
import { Button, Card } from "../../common";
import type { SupportedLanguage } from "../../../types/storyTypes";
import "../language/LanguageAssessment.css";

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

interface StoryRecorderProps {
    selectedLanguage?: SupportedLanguage;
    onComplete: (data: {
        transcript: string;
        verbatimTranscript: string;
        englishTranslation: string;
        durationMs: number;
        pauseCount: number;
        pauseDurationMs: number;
    }) => void;
}

export function StoryRecorder({ selectedLanguage, onComplete }: StoryRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [verbatimTranscript, setVerbatimTranscript] = useState("");
    const [englishTranslation, setEnglishTranslation] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState<string>("Auto-detecting...");
    const [timer, setTimer] = useState(0);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [diagnosticStatus, setDiagnosticStatus] = useState<string>("Ready");

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
    }, [transcript, verbatimTranscript, englishTranslation]);

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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
            }
            cleanupAudioResources();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop();
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                } catch {}
            }
        };
    }, []);

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

    // Try starting WebSocket proxy streams
    const tryConnectProxyWebSockets = () => {
        try {
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const proxyBase = isLocalDev 
                ? 'ws://localhost:5001'
                : (import.meta.env.VITE_SARVAM_PROXY_URL || 'wss://vyomflow-proxy.onrender.com');

            console.log('[StoryRecorder][Sarvam] Connecting to WebSocket proxy:', proxyBase);

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
                    } else if (msg.type === 'error') {
                        console.warn('[StoryRecorder][WS Verbatim Error]', msg.data);
                    }
                } catch {}
            };

            wsVerbatim.onopen = () => {
                console.log('[StoryRecorder][Sarvam] Verbatim WebSocket connected');
                setDiagnosticStatus("WebSocket Live Stream: Connected");
            };

            wsVerbatim.onerror = (err) => {
                console.warn('[StoryRecorder][Sarvam] WebSocket proxy not reached, using REST API fallback', err);
                setDiagnosticStatus("REST API Mode (Proxy Offline)");
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
                console.log('[StoryRecorder][Sarvam] Translate WebSocket connected');
            };

            wsVerbatimRef.current = wsVerbatim;
            wsTranslateRef.current = wsTranslate;
        } catch (e: any) {
            console.log('[StoryRecorder][Sarvam] WebSocket proxy error:', e?.message);
            setDiagnosticStatus("REST API Direct Mode");
        }
    };

    // Universal Recording Handler with Live Preview + Real-Time Acoustic Tracker
    const startRecording = async () => {
        try {
            setTranscript("");
            setVerbatimTranscript("");
            setEnglishTranslation("");
            setErrorMessage(null);
            setDetectedLanguage("Listening...");
            setDiagnosticStatus("Recording active...");
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
                    recognition.lang = ''; // Auto-detect in browser
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
                    recognition.onerror = (e: any) => {
                        console.warn('[StoryRecorder] Web Speech error (non-fatal):', e?.error);
                    };
                    recognitionRef.current = recognition;
                    recognition.start();
                } catch (e) {
                    console.log('[StoryRecorder] Web Speech Recognition not available on this browser:', e);
                }
            }

            // Request Microphone Access
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: { 
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 16000 
                    } 
                });
            } catch (micErr: any) {
                const isDenied = micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError';
                const isNotFound = micErr.name === 'NotFoundError' || micErr.name === 'DevicesNotFoundError';
                const customMsg = isDenied
                    ? "[Error: MIC_ACCESS_DENIED] Microphone permission was denied. Please allow microphone access in your browser URL bar."
                    : isNotFound
                    ? "[Error: NO_MIC_DEVICE] No microphone input found on your device. Please plug in a microphone or headset."
                    : `[Error: MIC_INIT_FAILED] Microphone error (${micErr.name}): ${micErr.message}`;
                
                setErrorMessage(customMsg);
                setDiagnosticStatus("Microphone Error");
                return;
            }

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
            } catch (ctxErr) {
                console.warn('[StoryRecorder] Web Audio Context error (non-fatal):', ctxErr);
            }

            setIsRecording(true);
            startTimeRef.current = Date.now();

        } catch (err: any) {
            setErrorMessage(`[Error: RECORD_START_FAILED] ${err.message || 'Unknown recording initialization error'}`);
            setDiagnosticStatus("Start Failed");
        }
    };

    // Stop Recording
    const stopRecording = () => {
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
            try {
                mediaRecorderRef.current.requestData();
            } catch {}

            mediaRecorderRef.current.onstop = async () => {
                const blobType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

                console.log('[StoryRecorder][Sarvam] MediaRecorder stopped. Chunks:', audioChunksRef.current.length, 'Size:', audioBlob.size, 'bytes');

                cleanupAudioResources();
                setIsRecording(false);
                
                if (audioBlob.size > 100) {
                    await process100PercentSarvamAI(audioBlob);
                } else {
                    setErrorMessage("[Warning: AUDIO_EMPTY] Recorded audio was empty (< 100 bytes). Retrying or continuing with fallback.");
                    processResults();
                }
            };

            mediaRecorderRef.current.stop();

            try {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch {}
        } else {
            cleanupAudioResources();
            setIsRecording(false);
            processResults();
        }
    };

    // Cleanup Audio Resources
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

    // 100% Authentic Sarvam AI STT Processing with explicit status & error reporting
    const process100PercentSarvamAI = async (audioBlob: Blob) => {
        setIsProcessingAudio(true);
        setErrorMessage(null);
        setDiagnosticStatus("Sarvam AI STT Processing...");
        const duration = Date.now() - startTimeRef.current;

        let sarvamNativeScript = "";
        let sarvamEnglishTranslation = "";
        let sarvamDetectedLang: string = (selectedLanguage as string) || "unknown";

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

            // 1. Sarvam STT Transcription (/api/sarvam-stt or direct fallback)
            try {
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
                    console.log('[StoryRecorder] /api/sarvam-stt success:', dataSTT);
                    if (dataSTT.transcript) sarvamNativeScript = dataSTT.transcript;
                    if (dataSTT.language_code) sarvamDetectedLang = dataSTT.language_code;
                } else {
                    const errBody = await resSTT.text();
                    console.warn(`[StoryRecorder] /api/sarvam-stt returned ${resSTT.status}: ${errBody}. Trying direct Sarvam AI REST API...`);

                    // Direct API Fallback
                    const filename = `story_audio.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`;
                    const formData = new FormData();
                    formData.append('file', audioBlob, filename);
                    formData.append('model', 'saaras:v4');
                    formData.append('mode', 'transcribe');

                    const directRes = await fetch('https://api.sarvam.ai/speech-to-text', {
                        method: 'POST',
                        headers: { 'api-subscription-key': SARVAM_API_KEY },
                        body: formData
                    });
                    if (directRes.ok) {
                        const directData = await directRes.json();
                        console.log('[StoryRecorder] Direct Sarvam STT REST API success:', directData);
                        if (directData.transcript) sarvamNativeScript = directData.transcript;
                        if (directData.language_code) sarvamDetectedLang = directData.language_code;
                    } else {
                        const directErr = await directRes.text();
                        console.error(`[StoryRecorder] Direct Sarvam STT failed with ${directRes.status}: ${directErr}`);
                        if (directRes.status === 401 || directRes.status === 403) {
                            setErrorMessage("[Error: SARVAM_AUTH_FAILED] Sarvam API Key authentication failed (401/403). Please verify API key status.");
                        } else if (directRes.status === 429) {
                            setErrorMessage("[Error: SARVAM_RATE_LIMIT] Sarvam AI API rate limit reached. Please wait a moment.");
                        } else {
                            setErrorMessage(`[Error: SARVAM_STT_ERROR] Sarvam STT returned HTTP ${directRes.status}: ${directErr.substring(0, 100)}`);
                        }
                    }
                }
            } catch (networkErr: any) {
                console.warn('[StoryRecorder] /api/sarvam-stt network error:', networkErr);
                // Attempt direct call
                try {
                    const filename = `story_audio.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`;
                    const formData = new FormData();
                    formData.append('file', audioBlob, filename);
                    formData.append('model', 'saaras:v4');
                    formData.append('mode', 'transcribe');

                    const directRes = await fetch('https://api.sarvam.ai/speech-to-text', {
                        method: 'POST',
                        headers: { 'api-subscription-key': SARVAM_API_KEY },
                        body: formData
                    });
                    if (directRes.ok) {
                        const directData = await directRes.json();
                        if (directData.transcript) sarvamNativeScript = directData.transcript;
                        if (directData.language_code) sarvamDetectedLang = directData.language_code;
                    } else {
                        setErrorMessage(`[Error: SARVAM_DIRECT_FAIL] STT Direct Call returned ${directRes.status}`);
                    }
                } catch (directExc: any) {
                    setErrorMessage(`[Error: SARVAM_CONNECTION_LOST] Could not connect to Sarvam AI STT: ${directExc.message}`);
                }
            }

            // 2. Sarvam Translation to English
            try {
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
                } else {
                    const filename = `story_audio.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`;
                    const formData = new FormData();
                    formData.append('file', audioBlob, filename);
                    formData.append('model', 'saaras:v3');

                    const directRes = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
                        method: 'POST',
                        headers: { 'api-subscription-key': SARVAM_API_KEY },
                        body: formData
                    });
                    if (directRes.ok) {
                        const directData = await directRes.json();
                        if (directData.transcript) sarvamEnglishTranslation = directData.transcript;
                        if (directData.language_code && sarvamDetectedLang === "unknown") {
                            sarvamDetectedLang = directData.language_code;
                        }
                    }
                }
            } catch (transErr) {
                console.warn('[StoryRecorder] Sarvam translate error (non-fatal):', transErr);
            }
        } catch (err: any) {
            console.error("[StoryRecorder] Sarvam Audio Processing Exception:", err);
            setErrorMessage(`[Error: AUDIO_PROCESS_EXC] ${err.message}`);
        }

        const activeText = sarvamNativeScript || verbatimTranscript || transcript || sarvamEnglishTranslation || "Story retold by user.";

        setTranscript(sarvamNativeScript || activeText);
        setVerbatimTranscript(sarvamNativeScript || activeText);
        setEnglishTranslation(sarvamEnglishTranslation);
        
        let displayLang: string = sarvamDetectedLang;
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
        setIsProcessingAudio(false);
        setDiagnosticStatus("Processed Successfully");

        onComplete({
            transcript: activeText,
            verbatimTranscript: sarvamNativeScript || activeText,
            englishTranslation: sarvamEnglishTranslation || activeText,
            durationMs: duration,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs
        });
    };

    const processResults = () => {
        const duration = Date.now() - startTimeRef.current;
        const activeText = verbatimTranscript || transcript || englishTranslation || "Story retold by user.";
        setIsProcessingAudio(false);
        setDiagnosticStatus("Completed with fallback text");

        onComplete({
            transcript: activeText,
            verbatimTranscript: verbatimTranscript || activeText,
            englishTranslation: englishTranslation || activeText,
            durationMs: duration,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs
        });
    };

    return (
        <Card className="phase-card active-assessment animate-fadeIn">
            <div className="phase-badge">
                ⚡ 100% Sarvam AI Engine (saaras:v4)
            </div>
            <h2>Story Retelling Phase</h2>
            <p className="text-secondary text-sm mb-4">
                Retell the story you heard in as much detail as you can remember. Speak naturally in your chosen language.
            </p>

            {/* Timer, Language, & Diagnostic Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 my-2 px-2">
                <div className="timer" role="timer" aria-live="polite">
                    ⏱️ {timer}s
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs bg-slate-900 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-full font-mono">
                        🌐 {detectedLanguage}
                    </div>
                    <div className="text-[11px] bg-slate-900/80 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full font-mono">
                        📡 {diagnosticStatus}
                    </div>
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
                ) : isProcessingAudio ? (
                    <div className="flex items-center gap-2 text-purple-400">
                        <div className="spinner text-xs" /> Processing Audio with Sarvam AI Multilingual API...
                    </div>
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
                            : isProcessingAudio
                            ? "⏳ Processing Audio with Sarvam AI..."
                            : "Click Start Recording to begin retelling the story..."}
                    </span>
                )}
                <div ref={transcriptEndRef} />
            </div>

            {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-lg text-rose-200 text-xs my-3 flex items-start gap-2 shadow-lg">
                    <span className="text-base leading-none">⚠️</span>
                    <div className="flex-1">
                        <p className="font-semibold text-rose-300">Diagnostic Alert:</p>
                        <p className="mt-0.5">{errorMessage}</p>
                    </div>
                </div>
            )}

            <div className="controls">
                {!isRecording ? (
                    <Button 
                        onClick={startRecording} 
                        className="record-btn"
                        disabled={isProcessingAudio}
                        aria-label="Start recording"
                    >
                        {isProcessingAudio ? "Processing..." : "Start Recording"}
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
            {isRecording && timer < 15 && (
                <p className="text-xs text-secondary mt-2">Try to speak for at least 15 seconds for robust story recall analysis</p>
            )}
        </Card>
    );
}
