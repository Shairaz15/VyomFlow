/**
 * Floating Multilingual AI Assistant Bubble (Vyom AI Copilot)
 * ============================================================
 * Connected directly to:
 * 1. Supabase Live Telemetry & User Records
 * 2. Real-time Live Screen & DOM Reader
 * 3. Cascading Google Gemini Flash Serverless Engine
 * 4. Sarvam AI Multilingual Text-to-Speech (Bulbul v3) at the bottom of messages
 * 5. 100% Exact StoryRecall & LanguageFluency Audio Capture & Real-Time Sarvam WS Transcription
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    fetchDashboardInsights,
    fetchModuleInsights,
    sendChatMessage,
    speakWithSarvamAI,
    stopSpeaking,
    checkAiServerStatus,
} from '../../services/aiAssistantService';
import './AiAssistantBubble.css';

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
}

const INDIAN_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
];

function extractCurrentPageContent(): string {
    if (typeof document === 'undefined') return '';
    try {
        const mainEl = document.querySelector('main') || document.querySelector('#root') || document.body;
        if (!mainEl) return '';
        
        const clone = mainEl.cloneNode(true) as HTMLElement;
        const drawerInClone = clone.querySelector('.ai-bubble-container');
        if (drawerInClone) drawerInClone.remove();
        
        clone.querySelectorAll('script, style, svg, noscript, nav, iframe').forEach(el => el.remove());
        
        const rawText = clone.innerText || clone.textContent || '';
        return rawText.replace(/\s+/g, ' ').trim().slice(0, 2000);
    } catch {
        return '';
    }
}

export const AiAssistantBubble: React.FC = () => {
    const location = useLocation();
    const { locale, setLocale } = useLanguage();
    const { user } = useAuth();
    const [, startTransition] = useTransition();

    const [isOpen, setIsOpen] = useState(false);
    const [insights, setInsights] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
    const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
    const [activeMode, setActiveMode] = useState<'patient' | 'clinician'>('patient');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

    const bodyEndRef = useRef<HTMLDivElement>(null);
    
    // Exact StoryRecorder Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const wsVerbatimRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const isRecordingRef = useRef<boolean>(false);
    const timerIntervalRef = useRef<any>(null);

    // Identify current page context
    const getPageContext = (): { type: string; title: string } => {
        const path = location.pathname.toLowerCase();
        if (path.includes('dashboard')) return { type: 'dashboard', title: 'Master Dashboard' };
        if (path.includes('vmra') || path.includes('memory')) return { type: 'vmra', title: 'Visual Memory (VMRA)' };
        if (path.includes('story')) return { type: 'story', title: 'Story Recall' };
        if (path.includes('language')) return { type: 'language', title: 'Speech & Language' };
        if (path.includes('pattern')) return { type: 'pattern', title: 'Pattern Working Memory' };
        if (path.includes('reaction')) return { type: 'reaction', title: 'Reaction Time' };
        if (path.includes('attention') || path.includes('savt')) return { type: 'savt', title: 'Sustained Attention' };
        if (path.includes('navigation')) return { type: 'navigation', title: '3D Spatial Navigation' };
        return { type: 'general', title: 'VyomFlow Overview' };
    };

    const currentContext = getPageContext();

    useEffect(() => {
        const probe = () => {
            checkAiServerStatus().then(status => {
                setIsServerOnline(status.online);
            });
        };
        probe();
        const interval = setInterval(probe, 30000);
        return () => clearInterval(interval);
    }, []);

    // Timer logic
    useEffect(() => {
        if (isRecording) {
            setRecordingSeconds(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setRecordingSeconds(0);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isRecording]);

    // Cleanup resources on unmount
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
            stopSpeaking();
        };
    }, []);

    // Automatically reload insights when page route, language, or mode changes while open
    useEffect(() => {
        if (isOpen) {
            loadInsights(locale, activeMode);
        }
    }, [location.pathname, locale, activeMode, isOpen]);

    const loadInsights = async (targetLang: string = locale, mode: 'patient' | 'clinician' = activeMode) => {
        setIsLoading(true);
        const pageContent = extractCurrentPageContent();

        try {
            if (currentContext.type === 'dashboard') {
                const res = await fetchDashboardInsights({
                    firebase_uid: user?.uid,
                    page_content: pageContent,
                    language: targetLang,
                    mode,
                });
                setInsights(res);
            } else {
                const res = await fetchModuleInsights({
                    firebase_uid: user?.uid,
                    module_type: currentContext.type,
                    score: 85,
                    page_content: pageContent,
                    language: targetLang,
                });
                setInsights(res);
            }
        } catch {
            setInsights('Unable to generate insights right now. Please check connectivity.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleOpen = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (nextState) {
            setHasUnreadNotification(false);
            loadInsights(locale, activeMode);
        } else {
            stopSpeaking();
            setPlayingMessageId(null);
            if (isRecordingRef.current) {
                stopRecording(false);
            }
        }
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        startTransition(() => {
            setLocale(newLang as any);
        });
        loadInsights(newLang, activeMode);
        stopSpeaking();
        setPlayingMessageId(null);
    };

    const handlePlayMessageAudio = (messageId: string, textToSpeak: string) => {
        if (playingMessageId === messageId) {
            stopSpeaking();
            setPlayingMessageId(null);
        } else {
            stopSpeaking();
            setPlayingMessageId(messageId);
            speakWithSarvamAI(textToSpeak, locale, () => {
                setPlayingMessageId(null);
            });
        }
    };

    const handleQuickAction = async (promptType: 'explain' | 'baseline' | 'doctor' | 'exercises') => {
        const promptMap: Record<string, string> = {
            explain: `Can you explain what is currently displayed on my ${currentContext.title} in simple terms?`,
            baseline: `How does my performance on this page compare to my personal baseline?`,
            doctor: `What are 2 specific questions I should discuss with my doctor regarding the data on this screen?`,
            exercises: `Give me 2 practical brain exercises I can practice at home today based on this test.`,
        };

        const question = promptMap[promptType];
        await handleSendUserMessage(question);
    };

    const handleSendUserMessage = async (msgText: string) => {
        if (!msgText.trim()) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: msgText,
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setLiveTranscript('');
        setIsLoading(true);

        setTimeout(() => {
            bodyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);

        try {
            const pageContent = extractCurrentPageContent();
            const reply = await sendChatMessage({
                firebase_uid: user?.uid,
                message: msgText,
                context_page: currentContext.type,
                page_content: pageContent,
                language: locale,
            });

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                sender: 'assistant',
                text: reply,
            };
            setChatMessages(prev => [...prev, aiMsg]);
        } catch {
            const errorMsg: ChatMessage = {
                id: `err-${Date.now()}`,
                sender: 'assistant',
                text: 'Sorry, I had trouble processing your question. Please try again.',
            };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                bodyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    };

    // =========================================================================
    // EXACT STORYRECORDER AUDIO CAPTURE & WEBSOCKET STREAMING ENGINE
    // =========================================================================

    // Convert Float32 PCM chunk from ScriptProcessorNode to a valid 16kHz mono WAV Base64 string
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

    // Try starting WebSocket proxy stream (StoryRecorder pattern)
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
                                setChatInput(next);
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

    // Cleanup Audio Resources (StoryRecorder pattern)
    const cleanupAudioResources = () => {
        if (processorRef.current && audioContextRef.current) {
            try {
                processorRef.current.disconnect();
                sourceRef.current?.disconnect();
                audioContextRef.current.close();
            } catch {}
        }

        const flushMsg = JSON.stringify({ type: 'flush' });
        if (wsVerbatimRef.current && wsVerbatimRef.current.readyState === WebSocket.OPEN) {
            try {
                wsVerbatimRef.current.send(flushMsg);
                wsVerbatimRef.current.close();
            } catch {}
        }

        wsVerbatimRef.current = null;
        processorRef.current = null;
        sourceRef.current = null;
        audioContextRef.current = null;
    };

    // Start Recording (Exact StoryRecorder implementation)
    const startRecording = async () => {
        try {
            setLiveTranscript('');
            setChatInput('');
            audioChunksRef.current = [];
            isRecordingRef.current = true;

            // Request Microphone Access
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 16000,
                    },
                });
            } catch (micErr: any) {
                console.error("Microphone access failed:", micErr);
                setChatInput("Microphone permission was denied. Please allow microphone in your browser URL bar.");
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

            // Connect streaming WebSocket
            tryConnectProxyWebSockets();

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
                console.warn('[AI Assistant] Web Audio context error (non-fatal):', ctxErr);
            }

            setIsRecording(true);
        } catch (err: any) {
            console.error("Recording error:", err);
            isRecordingRef.current = false;
            setIsRecording(false);
        }
    };

    // Stop Recording (Exact StoryRecorder implementation)
    const stopRecording = (shouldSubmit: boolean = true) => {
        isRecordingRef.current = false;

        const recorderWasActive = mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive';

        if (recorderWasActive && mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.requestData();
            } catch {}

            mediaRecorderRef.current.onstop = async () => {
                const blobType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

                cleanupAudioResources();
                setIsRecording(false);

                if (shouldSubmit) {
                    if (audioBlob.size > 100) {
                        await processSarvamSTT(audioBlob);
                    } else if (liveTranscript.trim()) {
                        handleSendUserMessage(liveTranscript.trim());
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
            if (shouldSubmit && liveTranscript.trim()) {
                handleSendUserMessage(liveTranscript.trim());
            }
        }
    };

    // 100% Sarvam AI STT Processing (StoryRecorder REST pattern)
    const processSarvamSTT = async (audioBlob: Blob) => {
        setIsProcessingAudio(true);
        let finalSpokenText = liveTranscript.trim();

        try {
            const filename = `voice_query.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`;
            const formData = new FormData();
            formData.append('file', audioBlob, filename);
            formData.append('model', 'saaras:v3');

            // Try direct translation / transcribe
            const directRes = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
                method: 'POST',
                headers: { 'api-subscription-key': SARVAM_API_KEY },
                body: formData,
            });

            if (directRes.ok) {
                const directData = await directRes.json();
                if (directData.transcript && directData.transcript.trim()) {
                    finalSpokenText = directData.transcript.trim();
                }
            } else {
                // Fallback to transcribe
                const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
                    method: 'POST',
                    headers: { 'api-subscription-key': SARVAM_API_KEY },
                    body: formData,
                });
                if (sttRes.ok) {
                    const sttData = await sttRes.json();
                    if (sttData.transcript && sttData.transcript.trim()) {
                        finalSpokenText = sttData.transcript.trim();
                    }
                }
            }
        } catch (err) {
            console.warn('[AI Assistant] Sarvam STT REST error, using live transcript:', err);
        } finally {
            setIsProcessingAudio(false);
        }

        if (finalSpokenText.trim()) {
            setChatInput(finalSpokenText.trim());
            handleSendUserMessage(finalSpokenText.trim());
        }
    };

    const handleToggleVoiceRecording = () => {
        if (isRecording) {
            stopRecording(true);
        } else {
            startRecording();
        }
    };

    const renderFormattedText = (raw: string) => {
        if (!raw) return null;
        const lines = raw.split('\n');
        return lines.map((line, idx) => {
            if (line.startsWith('### ')) {
                return <h3 key={idx}>{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={idx}>{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('* ') || line.startsWith('- ')) {
                return (
                    <li key={idx}>
                        {formatInlineStyles(line.replace(/^[*\-]\s+/, ''))}
                    </li>
                );
            }
            if (line.trim() === '') {
                return <div key={idx} style={{ height: '6px' }} />;
            }
            return <p key={idx}>{formatInlineStyles(line)}</p>;
        });
    };

    const formatInlineStyles = (str: string) => {
        const parts = str.split(/(\b\*\*[^*]+\*\*\b|\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="ai-bubble-container">
            {/* 1. Collapsed Floating Trigger Bubble */}
            {!isOpen && (
                <button
                    className="ai-bubble-trigger"
                    onClick={handleToggleOpen}
                    aria-label="Open AI Cognitive Copilot"
                    title="Open Vyom AI Copilot"
                >
                    <span className="ai-bubble-icon">🧠</span>
                    {hasUnreadNotification && <span className="ai-bubble-badge" />}
                    <div className="ai-bubble-tooltip">
                        Ask Vyom AI ✨
                    </div>
                </button>
            )}

            {/* 2. Expanded Floating AI Drawer */}
            {isOpen && (
                <div className="ai-drawer-card">
                    {/* Header */}
                    <div className="ai-drawer-header">
                        <div className="ai-drawer-title-group">
                            <div className="ai-avatar">🧠</div>
                            <div>
                                <div className="ai-drawer-title">
                                    Vyom AI Copilot
                                    <span
                                        className={`ai-status-dot ${isServerOnline === false ? 'offline' : ''}`}
                                        title={isServerOnline ? 'AI Model Online' : 'Local Heuristic Active'}
                                    />
                                </div>
                                <div className="ai-drawer-subtitle">Multilingual Cognitive Assistant</div>
                            </div>
                        </div>

                        <div className="ai-drawer-controls">
                            {/* Indian Language Selector */}
                            <select
                                className="ai-lang-select"
                                value={locale}
                                onChange={handleLanguageChange}
                                title="Change Language"
                            >
                                {INDIAN_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>

                            {/* Close / Collapse Button */}
                            <button
                                className="ai-control-btn"
                                onClick={handleToggleOpen}
                                title="Minimize"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Context Ribbon */}
                    <div className="ai-context-bar">
                        <span>📍 Context: <strong>{currentContext.title}</strong></span>
                        <button
                            className="ai-mode-toggle"
                            onClick={() => {
                                const nextMode = activeMode === 'patient' ? 'clinician' : 'patient';
                                setActiveMode(nextMode);
                                loadInsights(locale, nextMode);
                            }}
                            title="Switch between Patient and Clinician view"
                        >
                            {activeMode === 'patient' ? '👤 Patient Mode' : '🩺 Clinician Mode'}
                        </button>
                    </div>

                    {/* Body */}
                    <div className="ai-drawer-body">
                        {/* Primary Insight Box with Speaker at the Bottom */}
                        <div className="ai-insight-box">
                            {isLoading && !insights ? (
                                <div className="ai-loading-skeleton">
                                    <div className="ai-skeleton-line" style={{ width: '80%' }} />
                                    <div className="ai-skeleton-line" style={{ width: '100%' }} />
                                    <div className="ai-skeleton-line" style={{ width: '60%' }} />
                                    <div className="ai-skeleton-line" style={{ width: '90%' }} />
                                </div>
                            ) : (
                                <div>
                                    <div className="ai-message-header">
                                        <span className="ai-message-role">✨ Maya Insights</span>
                                    </div>
                                    <div className="ai-bubble-content">{renderFormattedText(insights)}</div>
                                    {insights && (
                                        <div className="ai-bubble-footer-actions">
                                            <button
                                                className={`ai-message-speak-btn ${playingMessageId === 'insight' ? 'playing' : ''}`}
                                                onClick={() => handlePlayMessageAudio('insight', insights)}
                                                title={playingMessageId === 'insight' ? 'Stop voice' : 'Listen with Sarvam AI Voice'}
                                            >
                                                {playingMessageId === 'insight' ? '⏹️ Stop Voice' : '🔊 Listen Voice'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Action Chips */}
                        <div className="ai-quick-actions">
                            <button className="ai-chip-btn" onClick={() => handleQuickAction('explain')}>
                                🔍 Explain Page
                            </button>
                            <button className="ai-chip-btn" onClick={() => handleQuickAction('baseline')}>
                                📊 Baseline Progress
                            </button>
                            <button className="ai-chip-btn" onClick={() => handleQuickAction('exercises')}>
                                💡 Daily Exercises
                            </button>
                            <button className="ai-chip-btn" onClick={() => handleQuickAction('doctor')}>
                                🩺 Doctor Talking Points
                            </button>
                        </div>

                        {/* Chat Messages with Speaker at the Bottom */}
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`ai-chat-bubble ${msg.sender}`}>
                                <div className="ai-bubble-content">
                                    {renderFormattedText(msg.text)}
                                </div>
                                {msg.sender === 'assistant' && (
                                    <div className="ai-bubble-footer-actions">
                                        <button
                                            className={`ai-message-speak-btn ${playingMessageId === msg.id ? 'playing' : ''}`}
                                            onClick={() => handlePlayMessageAudio(msg.id, msg.text)}
                                            title={playingMessageId === msg.id ? 'Stop audio' : 'Listen with Sarvam AI Voice'}
                                        >
                                            {playingMessageId === msg.id ? '⏹️ Stop' : '🔊 Listen'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && chatMessages.length > 0 && (
                            <div className="ai-chat-bubble assistant">
                                <em>Thinking in {INDIAN_LANGUAGES.find(l => l.code === locale)?.label}...</em>
                            </div>
                        )}

                        <div ref={bodyEndRef} />
                    </div>

                    {/* LIVE STREAMING TRANSCRIPTION BANNER (StoryRecorder Live Style) */}
                    {isRecording && (
                        <div className="ai-live-transcribe-banner">
                            <div className="ai-live-header">
                                <div className="ai-live-dot" />
                                <span className="ai-live-tag">
                                    🔴 LIVE RECORDING ({recordingSeconds}s) • {INDIAN_LANGUAGES.find(l => l.code === locale)?.label}
                                </span>
                            </div>
                            <div className="ai-live-text">
                                {liveTranscript || 'Listening... Speak your question now.'}
                            </div>
                        </div>
                    )}

                    {/* Footer Input Bar */}
                    <div className="ai-drawer-footer">
                        <form
                            className="ai-input-form"
                            onSubmit={e => {
                                e.preventDefault();
                                handleSendUserMessage(chatInput);
                            }}
                        >
                            <input
                                type="text"
                                className="ai-chat-input"
                                placeholder={
                                    isProcessingAudio
                                        ? '⏳ Sarvam AI processing your speech...'
                                        : isRecording
                                        ? `🔴 Recording (${recordingSeconds}s)... Click ⏹️ to send`
                                        : `Ask anything in ${INDIAN_LANGUAGES.find(l => l.code === locale)?.label || 'English'}...`
                                }
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                disabled={isProcessingAudio}
                            />

                            {/* Voice Recording Button */}
                            <button
                                type="button"
                                className={`ai-mic-btn ${isRecording ? 'recording' : ''}`}
                                onClick={handleToggleVoiceRecording}
                                disabled={isProcessingAudio}
                                title={isRecording ? 'Click to Stop & Send Question' : 'Click to Speak (Sarvam AI Audio Engine)'}
                            >
                                {isRecording ? '⏹️' : '🎙️'}
                            </button>

                            {/* Text Send Button */}
                            <button
                                type="submit"
                                className="ai-send-btn"
                                disabled={!chatInput.trim() || isProcessingAudio}
                                title="Send Message"
                            >
                                ➤
                            </button>
                        </form>

                        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
                            Vyom AI provides wellness insights, not a medical diagnosis.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
