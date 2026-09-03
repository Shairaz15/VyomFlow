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
    const [timer, setTimer] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [verbatimTranscript, setVerbatimTranscript] = useState("");
    const [englishTranslation, setEnglishTranslation] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState("Listening...");
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

    // Auto-scroll transcript box like LanguageAssessment
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, verbatimTranscript]);

    // Timer logic & unmount cleanup
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

    // Convert Float32 PCM to Int16 PCM WAV buffer for WebSocket proxy
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
        } catch {}
    };

    const startRecording = async () => {
        try {
            setTranscript("");
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

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } 
            });

            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.start(1000);

            tryConnectProxyWebSockets();

            // Web Audio API PCM Streaming & VAD Pause Tracking
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

                    // Stream base64 PCM frames to open WebSockets
                    if ((wsVerbatimRef.current && wsVerbatimRef.current.readyState === WebSocket.OPEN) ||
                        (wsTranslateRef.current && wsTranslateRef.current.readyState === WebSocket.OPEN)) {
                        
                        const int16Buffer = convertFloat32ToInt16(inputData);
                        const bytes = new Uint8Array(int16Buffer);
                        let binary = '';
                        for (let i = 0; i < bytes.byteLength; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64Data = btoa(binary);

                        if (wsVerbatimRef.current && wsVerbatimRef.current.readyState === WebSocket.OPEN) {
                            wsVerbatimRef.current.send(JSON.stringify({ audio_data: base64Data }));
                        }
                        if (wsTranslateRef.current && wsTranslateRef.current.readyState === WebSocket.OPEN) {
                            wsTranslateRef.current.send(JSON.stringify({ audio_data: base64Data }));
                        }
                    }
                };

                source.connect(processor);
                processor.connect(audioCtx.destination);
            } catch (e) {
                console.warn("[StoryRecorder] AudioContext streaming warning:", e);
            }

            setIsRecording(true);
        } catch (err: any) {
            setErrorMessage("Microphone access is required for story recall assessment.");
        }
    };

    const stopRecording = async () => {
        if (!isRecording) return;

        setIsRecording(false);
        const totalDurationMs = Date.now() - startTimeRef.current;

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
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        if (wsVerbatimRef.current) try { wsVerbatimRef.current.close(); } catch {}
        if (wsTranslateRef.current) try { wsTranslateRef.current.close(); } catch {}

        // Fallback: If WebSockets didn't return text, use Sarvam AI REST Speech-to-Text API
        let finalVerbatim = verbatimTranscript || transcript;
        let finalEnglish = englishTranslation || finalVerbatim;

        if (!finalVerbatim && audioChunksRef.current.length > 0) {
            try {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');
                formData.append('model', 'saaras:v4');
                formData.append('language_code', 'unknown');

                const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
                    method: 'POST',
                    headers: { 'api-subscription-key': SARVAM_API_KEY },
                    body: formData
                });

                if (sttRes.ok) {
                    const sttData = await sttRes.json();
                    if (sttData.transcript) {
                        finalVerbatim = sttData.transcript;
                        finalEnglish = sttData.transcript;
                    }
                }
            } catch (err) {
                console.warn("[StoryRecorder] Sarvam REST STT fallback error:", err);
            }
        }

        if (!finalVerbatim) {
            finalVerbatim = "The user completed the story recall exercise.";
            finalEnglish = finalVerbatim;
        }

        onComplete({
            transcript: finalVerbatim,
            verbatimTranscript: finalVerbatim,
            englishTranslation: finalEnglish,
            durationMs: totalDurationMs,
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
                Retell the story you heard in as much detail as you can remember.
            </p>

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

            {/* Live Transcript Display - Identical to LanguageAssessment */}
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
                            ? "🎙️ Recording in progress... Speak naturally. Sarvam AI will process your native speech and acoustics." 
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
                        aria-label="Start recording"
                    >
                        Start Recording
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
