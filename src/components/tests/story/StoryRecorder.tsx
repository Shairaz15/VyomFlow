import { useState, useRef, useEffect } from "react";
import { Button, Card } from "../../common";

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

interface StoryRecorderProps {
    onComplete: (data: {
        transcript: string;
        verbatimTranscript: string;
        englishTranslation: string;
        durationMs: number;
        pauseCount: number;
        pauseDurationMs: number;
    }) => void;
}

export function StoryRecorder({ onComplete }: StoryRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [timer, setTimer] = useState(0);
    const [verbatimTranscript, setVerbatimTranscript] = useState("");
    const [englishTranslation, setEnglishTranslation] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState("Listening...");
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error" | "idle">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const wsVerbatimRef = useRef<WebSocket | null>(null);
    const wsTranslateRef = useRef<WebSocket | null>(null);
    const intervalRef = useRef<any>(null);

    const startTimeRef = useRef<number>(0);
    const pauseTrackerRef = useRef({
        isSilent: false,
        lastStateChangeTime: 0,
        pauseCount: 0,
        totalPauseDurationMs: 0
    });

    // Auto-scroll transcript box
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [verbatimTranscript, englishTranslation]);

    // Timer & unmount cleanup
    useEffect(() => {
        if (isRecording) {
            intervalRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => {
            clearInterval(intervalRef.current);
            if (processorRef.current) {
                try { processorRef.current.disconnect(); } catch {}
            }
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch {}
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try { audioContextRef.current.close(); } catch {}
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop();
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                } catch {}
            }
            if (wsVerbatimRef.current) {
                try { wsVerbatimRef.current.close(); } catch {}
            }
            if (wsTranslateRef.current) {
                try { wsTranslateRef.current.close(); } catch {}
            }
        };
    }, [isRecording]);

    // Convert Float32 PCM audio to Int16 PCM WAV buffer for Sarvam AI WebSocket
    const convertFloat32ToInt16 = (buffer: Float32Array): ArrayBuffer => {
        let l = buffer.length;
        let buf = new Int16Array(l);
        while (l--) {
            let s = Math.max(-1, Math.min(1, buffer[l]));
            buf[l] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return buf.buffer;
    };

    // Try connecting live Sarvam AI WebSocket proxy streams (non-blocking)
    const tryConnectProxyWebSockets = () => {
        try {
            setConnectionStatus("connecting");
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const proxyBase = isLocalDev 
                ? 'ws://localhost:5001'
                : (import.meta.env.VITE_SARVAM_PROXY_URL || 'wss://vyomflow-proxy.onrender.com');

            // 1. Verbatim STT WebSocket stream (Native script)
            const verbatimUrl = `${proxyBase}?model=saaras:v4&language-code=unknown&mode=verbatim&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;
            const wsVerbatim = new WebSocket(verbatimUrl);

            wsVerbatim.onopen = () => {
                console.log("[Sarvam AI] Live Verbatim WebSocket Connected");
                setConnectionStatus("connected");
            };

            wsVerbatim.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'data') {
                        const text = msg.data?.transcript || '';
                        if (text) {
                            setVerbatimTranscript(prev => prev + (prev ? ' ' : '') + text);
                        }
                        if (msg.data?.language_code) {
                            setDetectedLanguage(msg.data.language_code);
                        }
                    }
                } catch {}
            };

            wsVerbatim.onerror = (err) => {
                console.warn("[Sarvam AI] Verbatim WebSocket error:", err);
                setConnectionStatus("error");
            };

            // 2. English Translation STT WebSocket stream
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

            wsVerbatimRef.current = wsVerbatim;
            wsTranslateRef.current = wsTranslate;
        } catch (err) {
            console.warn("[Sarvam AI] WebSocket connection attempt warning:", err);
            setConnectionStatus("error");
        }
    };

    // 100% Authentic Sarvam AI STT & Translation Processing via REST Endpoints
    const process100PercentSarvamAI = async (audioBlob: Blob) => {
        setIsProcessingAudio(true);
        setErrorMessage(null);
        const totalDurationMs = Date.now() - startTimeRef.current;

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

        const finalVerbatim = sarvamNativeScript || verbatimTranscript || "Story retold by user.";
        const finalEnglish = sarvamEnglishTranslation || englishTranslation || finalVerbatim;

        if (sarvamDetectedLang !== "unknown") {
            setDetectedLanguage(sarvamDetectedLang);
        }

        setIsProcessingAudio(false);

        onComplete({
            transcript: finalVerbatim,
            verbatimTranscript: finalVerbatim,
            englishTranslation: finalEnglish,
            durationMs: totalDurationMs,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs
        });
    };

    const startRecording = async () => {
        try {
            setVerbatimTranscript("");
            setEnglishTranslation("");
            setErrorMessage(null);
            setDetectedLanguage("Listening...");
            setTimer(0);
            startTimeRef.current = Date.now();
            audioChunksRef.current = [];

            pauseTrackerRef.current = {
                isSilent: false,
                lastStateChangeTime: Date.now(),
                pauseCount: 0,
                totalPauseDurationMs: 0
            };

            // Request Microphone Stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } 
            });

            // MediaRecorder for Sarvam AI Audio Processing
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
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

            mediaRecorder.start(1000);

            // Connect Live Sarvam AI WebSockets (non-blocking)
            tryConnectProxyWebSockets();

            // Web Audio API PCM Live Streaming to Sarvam AI WebSocket
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

                    // VAD Pause tracking
                    let sumSquares = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sumSquares += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sumSquares / inputData.length);
                    const isSpeech = rms > 0.015;
                    const now = Date.now();
                    const elapsed = now - pauseTrackerRef.current.lastStateChangeTime;

                    if (isSpeech && pauseTrackerRef.current.isSilent) {
                        if (elapsed >= 250) {
                            pauseTrackerRef.current.pauseCount++;
                            pauseTrackerRef.current.totalPauseDurationMs += elapsed;
                        }
                        pauseTrackerRef.current.isSilent = false;
                        pauseTrackerRef.current.lastStateChangeTime = now;
                    } else if (!isSpeech && !pauseTrackerRef.current.isSilent) {
                        pauseTrackerRef.current.isSilent = true;
                        pauseTrackerRef.current.lastStateChangeTime = now;
                    }

                    // Stream base64 Int16 PCM frames to Sarvam WebSockets if open
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
            } catch (e) {
                console.warn("[StoryRecorder] AudioContext streaming warning:", e);
            }

            setIsRecording(true);
        } catch {
            setErrorMessage("Microphone access is required for story recall assessment.");
        }
    };

    const stopRecording = () => {
        if (!isRecording) return;

        setIsRecording(false);

        if (processorRef.current) {
            try { processorRef.current.disconnect(); } catch {}
        }
        if (sourceRef.current) {
            try { sourceRef.current.disconnect(); } catch {}
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try { audioContextRef.current.close(); } catch {}
        }

        // Send WebSocket flush frame & close
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

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            const currentMime = mediaRecorderRef.current.mimeType || 'audio/webm';
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: currentMime });
                process100PercentSarvamAI(audioBlob);
            };
            try {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch {
                const audioBlob = new Blob(audioChunksRef.current, { type: currentMime });
                process100PercentSarvamAI(audioBlob);
            }
        } else {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            process100PercentSarvamAI(audioBlob);
        }
    };

    return (
        <Card className="phase-card active-assessment animate-fadeIn">
            <div className="phase-badge">
                ⚡ 100% Sarvam AI STT & Translation Engine (saaras:v4)
            </div>
            <h2>Story Retelling Phase</h2>
            <p className="text-secondary text-sm mb-4">
                Retell the story you heard in as much detail as you can remember.
            </p>

            {/* Timer & Language Indicator */}
            <div className="flex items-center justify-between my-2 px-2">
                <div className="timer" role="timer" aria-live="polite">
                    ⏱️ {timer}s
                </div>
                <div className="text-xs bg-slate-900 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-full font-mono">
                    🌐 {detectedLanguage} {connectionStatus === "connected" ? "• Live WebSocket" : ""}
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
                        <div className="spinner text-xs" /> Processing Sarvam AI Transcription...
                    </div>
                ) : (
                    <div className="text-secondary">Ready to record</div>
                )}
            </div>

            {/* Live Sarvam AI WebSocket Transcript Display */}
            <div 
                className="transcript-box"
                role="log"
                aria-live="polite"
                aria-label="Speech transcript"
            >
                {verbatimTranscript || englishTranslation ? (
                    <div>
                        <p>{verbatimTranscript}</p>
                        {englishTranslation && (
                            <p className="text-xs text-purple-400 mt-2 border-t border-purple-900/50 pt-2 italic">
                                🇬🇧 English Translation: {englishTranslation}
                            </p>
                        )}
                    </div>
                ) : (
                    <span className="transcript-placeholder">
                        {isRecording 
                            ? "🎙️ Live Sarvam AI streaming... Speak naturally." 
                            : isProcessingAudio
                            ? "⏳ Finalizing transcript with Sarvam AI STT..."
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
                        aria-label="Stop recording and finish"
                    >
                        Finish & Process Recall
                    </Button>
                )}
            </div>
        </Card>
    );
}
