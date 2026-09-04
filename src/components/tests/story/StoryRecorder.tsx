import { useState, useRef, useEffect } from "react";
import { Card, Icon } from "../../common";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { SupportedLanguage } from "../../../types/storyTypes";
import { SARVAM_API_KEY } from "../../../utils/sarvamConfig";
import "./StoryAssessment.css";

interface StoryRecorderProps {
    selectedLanguage?: SupportedLanguage;
    onComplete: (data: {
        transcript: string;
        verbatimTranscript: string;
        englishTranslation: string;
        durationMs: number;
        pauseCount: number;
        pauseDurationMs: number;
        cognitivePauseCount?: number;
        syntacticPauseCount?: number;
    }) => void;
}

export function StoryRecorder({ selectedLanguage, onComplete }: StoryRecorderProps) {
    const { t } = useLanguage();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [verbatimTranscript, setVerbatimTranscript] = useState("");
    const [englishTranslation, setEnglishTranslation] = useState("");
    const [liveTranscript, setLiveTranscript] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState<string>(selectedLanguage || "Auto-detecting...");
    const [timer, setTimer] = useState(0);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [diagnosticStatus, setDiagnosticStatus] = useState<string>("Ready");

    // Audio & Streaming Refs (Following AiAssistantBubble Pattern)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const wsVerbatimRef = useRef<WebSocket | null>(null);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const isRecordingRef = useRef<boolean>(false);
    const liveTranscriptRef = useRef<string>("");

    // Real-Time Acoustic & Voice Activity Detection (VAD) Tracker
    const pauseTrackerRef = useRef<{
        isSilent: boolean;
        lastStateChangeTime: number;
        pauseCount: number;
        totalPauseDurationMs: number;
        totalSpeechDurationMs: number;
        cognitivePauseCount: number; // Hesitation blocks > 2200ms
        syntacticPauseCount: number; // Natural breathing/clause pauses 1000-2200ms
    }>({
        isSilent: false,
        lastStateChangeTime: 0,
        pauseCount: 0,
        totalPauseDurationMs: 0,
        totalSpeechDurationMs: 0,
        cognitivePauseCount: 0,
        syntacticPauseCount: 0
    });

    const startTimeRef = useRef<number>(0);
    const intervalRef = useRef<any>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of transcript
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript, verbatimTranscript, englishTranslation, liveTranscript]);

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

    // Convert Float32 PCM chunk to 16kHz mono WAV Base64 string for WebSocket streaming (AiAssistantBubble pattern)
    const convertFloat32ToWavBase64 = (float32Array: Float32Array, sampleRate = 16000): string => {
        const numSamples = float32Array.length;
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);

        // RIFF header
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + numSamples * 2, true);
        view.setUint32(8, 0x57415645, false); // "WAVE"
        // fmt sub-chunk
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, numSamples * 2, true);

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

    // Try starting WebSocket proxy stream (Exact AiAssistantBubble pattern)
    const tryConnectProxyWebSockets = () => {
        try {
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const verbatimUrl = isLocalDev
                ? `${wsProtocol}//${window.location.host}/api/sarvam-ws?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000`
                : `wss://vyomflow-proxy.onrender.com?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000&api_key=${encodeURIComponent(SARVAM_API_KEY)}`;

            const wsVerbatim = new WebSocket(verbatimUrl);

            wsVerbatim.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'data') {
                        const text = msg.data?.transcript?.trim() || '';
                        if (text) {
                            setLiveTranscript(prev => {
                                const next = prev ? `${prev} ${text}` : text;
                                liveTranscriptRef.current = next;
                                setTranscript(next);
                                setVerbatimTranscript(next);
                                return next;
                            });
                        }
                    }
                } catch {}
            };

            wsVerbatimRef.current = wsVerbatim;
        } catch {
            // Non-fatal
        }
    };

    // Cleanup Audio Resources
    const cleanupAudioResources = () => {
        if (wsVerbatimRef.current) {
            try {
                wsVerbatimRef.current.close();
            } catch {}
            wsVerbatimRef.current = null;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {}
            recognitionRef.current = null;
        }

        if (processorRef.current) {
            try {
                processorRef.current.disconnect();
            } catch {}
            processorRef.current = null;
        }

        if (sourceRef.current) {
            try {
                sourceRef.current.disconnect();
            } catch {}
            sourceRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch {}
            audioContextRef.current = null;
        }
    };

    // Start Recording (Exact AiAssistantBubble implementation)
    const startRecording = async () => {
        try {
            setTranscript("");
            setVerbatimTranscript("");
            setEnglishTranslation("");
            setLiveTranscript("");
            liveTranscriptRef.current = "";
            setErrorMessage(null);
            setDetectedLanguage(selectedLanguage || "Listening...");
            setDiagnosticStatus("Recording active...");
            audioChunksRef.current = [];
            isRecordingRef.current = true;

            // Initialize acoustic pause tracker
            pauseTrackerRef.current = {
                isSilent: false,
                lastStateChangeTime: Date.now(),
                pauseCount: 0,
                totalPauseDurationMs: 0,
                totalSpeechDurationMs: 0,
                cognitivePauseCount: 0,
                syntacticPauseCount: 0
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
                isRecordingRef.current = false;
                setIsRecording(false);
                return;
            }

            // MediaRecorder for Audio Processing
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(400);

            // Connect streaming WebSocket (AiAssistantBubble pattern)
            tryConnectProxyWebSockets();

            // Web Speech Recognition for instant 0ms visual text feedback
            try {
                const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognitionClass) {
                    const recognition = new SpeechRecognitionClass();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = selectedLanguage || 'en-IN';

                    recognition.onresult = (event: any) => {
                        let fullText = '';
                        for (let i = 0; i < event.results.length; i++) {
                            fullText += event.results[i][0].transcript + ' ';
                        }
                        fullText = fullText.trim();
                        if (fullText) {
                            liveTranscriptRef.current = fullText;
                            setLiveTranscript(fullText);
                            setVerbatimTranscript(fullText);
                            setTranscript(fullText);
                        }
                    };

                    recognition.onerror = () => {};
                    recognition.start();
                    recognitionRef.current = recognition;
                }
            } catch (speechErr) {
                console.warn('[StoryRecorder] Live browser speech recognition skipped:', speechErr);
            }

            // Web Audio API PCM streaming
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

                    // 1. Acoustic VAD Pause Tracking
                    let sumSquares = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sumSquares += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sumSquares / inputData.length);
                    const isSpeech = rms > 0.015;
                    const now = Date.now();

                    const elapsed = now - pauseTrackerRef.current.lastStateChangeTime;
                    if (isSpeech && pauseTrackerRef.current.isSilent) {
                        if (elapsed >= 1000) {
                            pauseTrackerRef.current.pauseCount++;
                            pauseTrackerRef.current.totalPauseDurationMs += elapsed;
                            if (elapsed >= 2200) {
                                pauseTrackerRef.current.cognitivePauseCount++;
                            } else {
                                pauseTrackerRef.current.syntacticPauseCount++;
                            }
                        }
                        pauseTrackerRef.current.isSilent = false;
                        pauseTrackerRef.current.lastStateChangeTime = now;
                    } else if (!isSpeech && !pauseTrackerRef.current.isSilent) {
                        pauseTrackerRef.current.totalSpeechDurationMs += elapsed;
                        pauseTrackerRef.current.isSilent = true;
                        pauseTrackerRef.current.lastStateChangeTime = now;
                    }

                    // 2. Stream chunk to WebSocket if connected
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
                };

                source.connect(processor);
                processor.connect(audioCtx.destination);
            } catch (ctxErr) {
                console.warn('[StoryRecorder] Web Audio Context error (non-fatal):', ctxErr);
            }

            setIsRecording(true);
            startTimeRef.current = Date.now();

        } catch (err: any) {
            console.error("Recording error:", err);
            setErrorMessage(`[Error: RECORD_START_FAILED] ${err.message || 'Unknown recording initialization error'}`);
            setDiagnosticStatus("Start Failed");
            isRecordingRef.current = false;
            setIsRecording(false);
        }
    };

    // Stop Recording (Exact AiAssistantBubble implementation)
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
                    await processSarvamSTT(audioBlob);
                } else if (liveTranscriptRef.current.trim()) {
                    processResults(liveTranscriptRef.current.trim());
                } else {
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
            processResults(liveTranscriptRef.current.trim());
        }
    };

    // 100% Sarvam AI STT Processing (Exact AiAssistantBubble REST Pattern)
    const processSarvamSTT = async (audioBlob: Blob) => {
        setIsProcessingAudio(true);
        setErrorMessage(null);
        setDiagnosticStatus("Transcribing with Sarvam AI...");
        const duration = Date.now() - startTimeRef.current;

        let finalSpokenText = liveTranscriptRef.current.trim() || liveTranscript.trim() || verbatimTranscript.trim() || transcript.trim();
        let englishTrans = "";

        const isEnglish = selectedLanguage === 'en-IN';
        const filename = `story_audio.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`;

        const formData = new FormData();
        formData.append('file', audioBlob, filename);
        formData.append('model', 'saaras:v3');
        formData.append('language_code', 'unknown');

        // PRIMARY: Transcribe verbatim in native language (speech-to-text) to keep Hindi in Hindi!
        try {
            let sttRes: Response;
            try {
                sttRes = await fetch('/api/sarvam-stt', {
                    method: 'POST',
                    headers: { 'api-subscription-key': SARVAM_API_KEY },
                    body: formData,
                });
            } catch {
                sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
                    method: 'POST',
                    headers: { 'api-subscription-key': SARVAM_API_KEY },
                    body: formData,
                });
            }

            if (sttRes.ok) {
                const sttData = await sttRes.json();
                if (sttData.transcript && sttData.transcript.trim()) {
                    finalSpokenText = sttData.transcript.trim();
                }
            } else if (!finalSpokenText) {
                // Secondary fallback only if verbatim transcription was empty
                const fallbackRes = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
                    method: 'POST',
                    headers: { 'api-subscription-key': SARVAM_API_KEY },
                    body: formData,
                });
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.transcript && fallbackData.transcript.trim()) {
                        finalSpokenText = fallbackData.transcript.trim();
                    }
                }
            }
        } catch (err) {
            console.warn('[StoryRecorder] Sarvam STT REST error, using live transcript:', err);
        }

        // Translation to English for scoring (if audio is non-English)
        if (!isEnglish) {
            try {
                const transForm = new FormData();
                transForm.append('file', audioBlob, filename);
                transForm.append('model', 'saaras:v3');
                if (selectedLanguage) {
                    transForm.append('language_code', selectedLanguage);
                }

                let transRes: Response;
                try {
                    transRes = await fetch('/api/sarvam-stt-translate', {
                        method: 'POST',
                        headers: { 'api-subscription-key': SARVAM_API_KEY },
                        body: transForm,
                    });
                } catch {
                    transRes = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
                        method: 'POST',
                        headers: { 'api-subscription-key': SARVAM_API_KEY },
                        body: transForm,
                    });
                }

                if (transRes.ok) {
                    const transData = await transRes.json();
                    if (transData.transcript && transData.transcript.trim()) {
                        englishTrans = transData.transcript.trim();
                    }
                }
            } catch (trErr) {
                console.warn('[StoryRecorder] English translation fetch error:', trErr);
            }
        } else {
            englishTrans = finalSpokenText;
        }

        const activeText = finalSpokenText.trim() || englishTrans.trim() || "";
        const activeEnglish = englishTrans.trim() || activeText;

        setTranscript(activeText);
        setVerbatimTranscript(activeText);
        setEnglishTranslation(activeEnglish);
        setIsProcessingAudio(false);
        setDiagnosticStatus("Processed Successfully");

        onComplete({
            transcript: activeText,
            verbatimTranscript: activeText,
            englishTranslation: activeEnglish,
            durationMs: duration,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs,
            cognitivePauseCount: pauseTrackerRef.current.cognitivePauseCount,
            syntacticPauseCount: pauseTrackerRef.current.syntacticPauseCount,
        });
    };

    const processResults = (fallbackText?: string) => {
        const duration = Date.now() - startTimeRef.current;
        const activeText = (fallbackText || liveTranscriptRef.current || verbatimTranscript || transcript || englishTranslation || "").trim();
        setIsProcessingAudio(false);
        setDiagnosticStatus(activeText ? "Completed with fallback text" : "Completed with no speech detected");

        onComplete({
            transcript: activeText,
            verbatimTranscript: activeText,
            englishTranslation: englishTranslation || activeText,
            durationMs: duration,
            pauseCount: pauseTrackerRef.current.pauseCount,
            pauseDurationMs: pauseTrackerRef.current.totalPauseDurationMs,
            cognitivePauseCount: pauseTrackerRef.current.cognitivePauseCount,
            syntacticPauseCount: pauseTrackerRef.current.syntacticPauseCount,
        });
    };

    return (
        <Card className="story-recorder-card animate-fadeIn">
            {/* Top Phase Badge */}
            {!isRecording ? (
                <div className="narration-badge">
                    <Icon name="mic" size={16} />
                    <span>{t("story.voiceRetellingPhase")}</span>
                </div>
            ) : (
                <div className="recording-indicator">
                    <span className="pulsing-red-dot" />
                    <span>{t("story.recordingInProgress")}</span>
                </div>
            )}

            <h3 className="select-card-title text-xl font-semibold text-[#17324D] dark:text-[#F7F4EC] mt-1 mb-1">
                {t("story.storyRetellingTitle")}
            </h3>
            <p className="recorder-sub">
                {t("story.storyRetellingSub")}
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
                        <span>{t("story.processingWithSarvam")}</span>
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
                        {isRecording ? t("story.listeningToRetelling") : t("story.tapMicToBegin")}
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
                    <span className="live-label">{t("story.liveTranscript")}</span>
                    {isRecording && <span className="live-pulse-badge">{t("story.live")}</span>}
                </div>
                {transcript || verbatimTranscript || liveTranscript ? (
                    <div className="live-text-container">
                        <p className="live-native-text">{liveTranscript || verbatimTranscript || transcript}</p>
                        {englishTranslation && englishTranslation.trim().toLowerCase() !== (liveTranscript || verbatimTranscript || transcript).trim().toLowerCase() && (
                            <div className="live-english-translation">
                                <span className="lang-tag-en">EN</span>
                                <p className="live-english-text">{englishTranslation}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="transcript-idle-hint">
                        {isRecording 
                            ? t("story.listeningHint")
                            : isProcessingAudio
                            ? t("story.analyzingSpeech")
                            : t("story.tapMicIconAbove")}
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
                        {t("story.finishRecording")}
                    </button>
                    {timer < 15 && (
                        <p className="text-xs text-[#63788A] dark:text-[#A0B0BC] m-0">
                            {t("story.speak15Sec")}
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
}
