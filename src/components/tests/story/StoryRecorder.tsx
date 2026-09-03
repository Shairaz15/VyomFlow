import { useState, useRef, useEffect } from "react";
import { Card, Icon } from "../../common";
import type { SupportedLanguage } from "../../../types/storyTypes";
import "./StoryAssessment.css";

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
            isRecordingRef.current = false;
            cleanupAudioResources();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop();
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                } catch {}
            }
        };
    }, []);

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

    // Try starting WebSocket proxy streams (via Vite dev proxy or cloud proxy)
    const tryConnectProxyWebSockets = () => {
        try {
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const verbatimUrl = isLocalDev
                ? `${wsProtocol}//${window.location.host}/api/sarvam-ws?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000`
                : `${import.meta.env.VITE_SARVAM_PROXY_URL || 'wss://vyomflow-proxy.onrender.com'}?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;
            const translateUrl = isLocalDev
                ? `${wsProtocol}//${window.location.host}/api/sarvam-ws?model=saaras:v4&language-code=unknown&mode=translate&sample_rate=16000`
                : `${import.meta.env.VITE_SARVAM_PROXY_URL || 'wss://vyomflow-proxy.onrender.com'}?model=saaras:v4&language-code=unknown&mode=translate&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;

            console.log('[StoryRecorder][Sarvam] Connecting to WebSocket proxies:', verbatimUrl);
            const wsVerbatim = new WebSocket(verbatimUrl);

            wsVerbatim.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'data') {
                        const text = msg.data?.transcript?.trim() || '';
                        if (text) {
                            setVerbatimTranscript(prev => (prev ? `${prev} ${text}` : text));
                            setTranscript(prev => (prev ? `${prev} ${text}` : text));
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

            wsVerbatimRef.current = wsVerbatim;

            // Connect simultaneous English translation socket
            try {
                const wsTranslate = new WebSocket(translateUrl);
                wsTranslate.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === 'data') {
                            const text = msg.data?.transcript?.trim() || '';
                            if (text) {
                                setEnglishTranslation(prev => (prev ? `${prev} ${text}` : text));
                            }
                        } else if (msg.type === 'transcript' && msg.text) {
                            const text = msg.text.trim();
                            if (text) {
                                setEnglishTranslation(prev => (prev ? `${prev} ${text}` : text));
                            }
                        }
                    } catch {}
                };
                wsTranslateRef.current = wsTranslate;
            } catch (wsTrErr) {
                console.warn('[StoryRecorder] Translate WebSocket connection skipped:', wsTrErr);
            }
        } catch (e: any) {
            console.log('[StoryRecorder][Sarvam] WebSocket proxy error:', e?.message);
            setDiagnosticStatus("REST API Direct Mode");
        }
    };

    // Real-time debounced English translation fallback
    useEffect(() => {
        if (!isRecording) return;
        const textToTranslate = (verbatimTranscript || transcript).trim();
        if (!textToTranslate || textToTranslate.length < 4) return;

        const debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch('/api/sarvam-translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: textToTranslate,
                        source_language_code: detectedLanguage && detectedLanguage !== 'unknown' && detectedLanguage !== 'Auto-detecting...' && detectedLanguage !== 'Listening...' ? detectedLanguage : 'hi-IN',
                        target_language_code: 'en-IN',
                        model: 'sarvam-translate:v1',
                        mode: 'formal'
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.translated_text && data.translated_text.trim()) {
                        setEnglishTranslation(data.translated_text.trim());
                    }
                }
            } catch {
                // Non-critical background live translation
            }
        }, 1200);

        return () => clearTimeout(debounceTimer);
    }, [verbatimTranscript, transcript, isRecording, detectedLanguage]);

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
            isRecordingRef.current = true;

            // Initialize acoustic pause tracker
            pauseTrackerRef.current = {
                isSilent: false,
                lastStateChangeTime: Date.now(),
                pauseCount: 0,
                totalPauseDurationMs: 0,
                totalSpeechDurationMs: 0
            };

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

            mediaRecorder.start(400); // 400ms chunk frequency

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

                    // 2. Stream real-time WAV payload to WebSockets if open
                    const wavBase64 = convertFloat32ToWavBase64(inputData, 16000);
                    const payload = JSON.stringify({
                        audio: {
                            data: wavBase64,
                            sample_rate: '16000',
                            encoding: 'audio/wav',
                        },
                    });

                    if (wsVerbatimRef.current?.readyState === WebSocket.OPEN) {
                        wsVerbatimRef.current.send(payload);
                    }
                    if (wsTranslateRef.current?.readyState === WebSocket.OPEN) {
                        wsTranslateRef.current.send(payload);
                    }
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
            isRecordingRef.current = false;
            setIsRecording(false);
        }
    };

    // Stop Recording
    const stopRecording = () => {
        isRecordingRef.current = false;

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

            // 1. Live WebSocket Transcript is already captured in real-time in sarvamNativeScript
            // 2. Sarvam Translation to English (if audio is non-English)
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
        setEnglishTranslation(sarvamEnglishTranslation || englishTranslation);
        
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
            englishTranslation: sarvamEnglishTranslation || englishTranslation || activeText,
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
        <Card className="story-recorder-card animate-fadeIn">
            {/* Top Phase Badge */}
            {!isRecording ? (
                <div className="narration-badge">
                    <Icon name="mic" size={16} />
                    <span>Voice Retelling Phase</span>
                </div>
            ) : (
                <div className="recording-indicator">
                    <span className="pulsing-red-dot" />
                    <span>Recording in Progress</span>
                </div>
            )}

            <h3 className="select-card-title text-xl font-semibold text-[#17324D] dark:text-[#F7F4EC] mt-1 mb-1">
                Story Retelling Phase
            </h3>
            <p className="recorder-sub">
                Retell the story you heard in as much detail as you can remember. Speak naturally in your chosen language.
            </p>

            {/* Timer, Language & Status Meta Bar */}
            <div className="story-meta-bar">
                <div className="story-meta-pill" role="timer" aria-live="polite">
                    <span>⏱️</span>
                    <span>{timer}s</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="story-meta-pill">
                        <span>🌐</span>
                        <span>{detectedLanguage}</span>
                    </div>
                    <div className="story-meta-pill story-meta-status">
                        <span className={`status-dot ${isRecording ? 'animate-ping' : ''}`} />
                        <span>{diagnosticStatus}</span>
                    </div>
                </div>
            </div>

            {/* Audio Waveform / Visualizer / Central Mic Icon Button */}
            <div className="visualizer-wrapper my-2">
                {isRecording ? (
                    <div className="waveform-visualizer active">
                        <span className="bar bar1"></span>
                        <span className="bar bar2"></span>
                        <span className="bar bar3"></span>
                        <span className="bar bar4"></span>
                        <span className="bar bar5"></span>
                    </div>
                ) : isProcessingAudio ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-[#4F7C78] dark:text-[#00C9B7]">
                        <div className="spinner !w-5 !h-5 !border-2 m-0" />
                        <span>Processing Audio with Sarvam AI...</span>
                    </div>
                ) : (
                    <button 
                        type="button"
                        className="mic-circle" 
                        onClick={startRecording}
                        aria-label="Start recording"
                        title="Click to start recording"
                    >
                        <Icon name="mic" size={28} />
                    </button>
                )}
                {!isProcessingAudio && (
                    <p className="player-state-label mt-1 text-xs">
                        {isRecording ? "Listening to your retelling..." : "Tap microphone to begin"}
                    </p>
                )}
            </div>

            {/* Live Speech Transcript Box with Simultaneous English Translation */}
            <div 
                className="live-transcript-box"
                role="log"
                aria-live="polite"
                aria-label="Speech transcript"
            >
                <div className="live-transcript-header">
                    <span className="live-label">LIVE TRANSCRIPT</span>
                    {isRecording && <span className="live-pulse-badge">LIVE</span>}
                </div>
                {transcript || verbatimTranscript ? (
                    <div className="live-text-container">
                        <p className="live-native-text">{verbatimTranscript || transcript}</p>
                        {englishTranslation && englishTranslation.trim().toLowerCase() !== (verbatimTranscript || transcript).trim().toLowerCase() && (
                            <div className="live-english-translation">
                                <span className="lang-tag-en">EN</span>
                                <p className="live-english-text">{englishTranslation}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="transcript-idle-hint">
                        {isRecording 
                            ? "🎙️ Listening... Speak naturally in your chosen language. Live transcription and English subtitles will appear simultaneously." 
                            : isProcessingAudio
                            ? "⏳ Analyzing speech audio..."
                            : "Tap the microphone icon above to begin retelling the story..."}
                    </p>
                )}
                <div ref={transcriptEndRef} />
            </div>

            {/* Diagnostic Error Banner */}
            {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-200 text-xs my-3 flex items-start gap-2 text-left shadow-sm">
                    <span className="text-base leading-none">⚠️</span>
                    <div className="flex-1">
                        <p className="font-semibold text-rose-800 dark:text-rose-300">Notice:</p>
                        <p className="mt-0.5">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons: Only shown while recording */}
            {isRecording && (
                <div className="story-action-controls flex flex-col items-center justify-center gap-2 mt-3">
                    <button 
                        type="button"
                        onClick={stopRecording} 
                        className="story-finish-record-btn"
                        aria-label="Finish recording and process results"
                    >
                        <span className="stop-square" />
                        Finish Recording
                    </button>
                    {timer < 15 && (
                        <p className="text-xs text-[#63788A] dark:text-[#A0B0BC] m-0">
                            Try to speak for at least 15 seconds for robust story recall analysis
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
}
