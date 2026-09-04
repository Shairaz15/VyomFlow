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
import { useTheme } from '../../contexts/ThemeContext';
import {
    Sparkles,
    MessageSquare,
    Activity,
    History,
    Plus,
    Minus,
    Maximize2,
    Minimize2,
    X,
    MapPin,
    Volume2,
    Square,
    Copy,
    Check,
    Trash2,
    Mic,
    Send,
    Brain,
    Zap,
    Target,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    ArrowRight,
    Radio,
} from 'lucide-react';
import { VyomFlowLogo } from './VyomFlowLogo';
import {
    fetchDashboardInsights,
    fetchModuleInsights,
    sendChatMessage,
    speakWithSarvamAI,
    stopSpeaking,
    checkAiServerStatus,
    detectMessageLanguage,
} from '../../services/aiAssistantService';
import { SARVAM_API_KEY } from '../../utils/sarvamConfig';
import './AiAssistantBubble.css';

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

// High-performance cached page content extraction (bypasses full DOM cloning)
let cachedPageText = '';
let lastExtractTime = 0;
let lastExtractPath = '';

function extractCurrentPageContent(): string {
    if (typeof document === 'undefined') return '';
    try {
        const now = Date.now();
        const currentPath = window.location.pathname;
        if (cachedPageText && currentPath === lastExtractPath && now - lastExtractTime < 8000) {
            return cachedPageText;
        }

        const mainEl = document.querySelector('main') || document.querySelector('#root') || document.body;
        if (!mainEl) return '';

        // Selectively extract text from informative content elements without cloning the entire tree
        const contentNodes = mainEl.querySelectorAll('h1, h2, h3, h4, p, [role="article"], .dashboard-card, .metric-value, .stat-value, .test-title');
        const extractedSegments: string[] = [];

        contentNodes.forEach(node => {
            if (node.closest('.ai-bubble-container')) return;
            const t = node.textContent?.trim();
            if (t && t.length > 2 && !t.includes('{') && !t.includes('function(')) {
                extractedSegments.push(t);
            }
        });

        const result = (extractedSegments.length > 0 ? extractedSegments.join(' | ') : (mainEl.textContent || ''))
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 2000);

        cachedPageText = result;
        lastExtractTime = now;
        lastExtractPath = currentPath;
        return result;
    } catch {
        return '';
    }
}

export const AiAssistantBubble: React.FC = () => {
    const location = useLocation();
    const { locale, setLocale } = useLanguage();
    const { user } = useAuth();
    const { theme } = useTheme();
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
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = sessionStorage.getItem('vyom_chat_history');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [];
    });
    const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'history'>('chat');
    const [drawerMode, setDrawerMode] = useState<'normal' | 'expanded' | 'mini'>('normal');
    const [activeQueryLang, setActiveQueryLang] = useState<string>('en');
    const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const bodyEndRef = useRef<HTMLDivElement>(null);
    const chatBodyRef = useRef<HTMLDivElement>(null);
    
    // Audio Capture & Visualizer Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const wsVerbatimRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const isRecordingRef = useRef<boolean>(false);
    const timerIntervalRef = useRef<any>(null);

    // Feature 4: Session Persistence
    useEffect(() => {
        try {
            sessionStorage.setItem('vyom_chat_history', JSON.stringify(chatMessages));
        } catch {}
    }, [chatMessages]);

    const handleNewChat = () => {
        setChatMessages([]);
        try {
            sessionStorage.removeItem('vyom_chat_history');
        } catch {}
    };

    const toggleSection = (key: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Feature 3: Dynamic Contextual Suggestions (Clean text without emojis)
    const getDynamicChips = () => {
        const isHi = locale === 'hi';
        switch (currentContext.type) {
            case 'vmra':
                return isHi
                    ? ['यह मेमोरी ग्रिड समझाइए', 'मेरा विजुअल स्कोर कैसा है?', 'याददाश्त सुधारने के टिप्स']
                    : ['Explain this memory grid', 'How is my visual recall score?', 'Tips to boost visual retention'];
            case 'story':
                return isHi
                    ? ['कहानी का मुख्य संदेश क्या है?', 'मेरी रिकॉल सटीकता कैसी है?', 'डॉक्टर से क्या पूछें?']
                    : ['Key themes of this story', 'How is my recall accuracy?', 'Questions for my physician'];
            case 'reaction':
                return isHi
                    ? ['सामान्य रिएक्शन टाइम क्या है?', 'मेरी प्रतिक्रिया गति सुधारे', 'ध्यान केंद्रित करने के उपाय']
                    : ['What is normal reaction latency?', 'How to improve response speed', 'Sustained focus tips'];
            case 'savt':
                return isHi
                    ? ['सस्टेन्ड अटेंशन क्या मापता है?', 'गलत क्लिक कैसे कम करें?', 'एकाग्रता बढ़ाने के व्यायाम']
                    : ['What does sustained attention measure?', 'How to reduce false taps', 'Concentration exercises'];
            case 'navigation':
                return isHi
                    ? ['3D स्पैटियल नेविगेशन का महत्व', 'ओरिएंटेशन कैसे बेहतर करें?', 'हिप्पोकैम्पस स्वास्थ्य']
                    : ['Importance of 3D spatial navigation', 'Improving spatial orientation', 'Hippocampus health'];
            case 'dashboard':
            default:
                return isHi
                    ? ['मेरा समग्र स्कोर समझाइए', 'बेसलाइन की तुलना में प्रगति', 'डॉक्टर के लिए जरूरी सवाल', 'आज का ब्रेन वर्कआउट']
                    : ['Summarize my overall score', 'Progress vs personal baseline', 'Doctor discussion points', 'Daily brain workout'];
        }
    };

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

    // Automatically reload insights when page route or language changes while open
    useEffect(() => {
        if (isOpen) {
            loadInsights(locale);
        }
    }, [location.pathname, locale, isOpen]);

    const loadInsights = async (targetLang: string = locale) => {
        setIsLoading(true);
        const pageContent = extractCurrentPageContent();

        try {
            if (currentContext.type === 'dashboard') {
                const res = await fetchDashboardInsights({
                    firebase_uid: user?.uid,
                    page_content: pageContent,
                    language: targetLang,
                    mode: 'patient',
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
            loadInsights(locale);
        } else {
            stopSpeaking();
            setPlayingMessageId(null);
            if (isRecordingRef.current) {
                stopRecording(false);
            }
        }
    };

    const handlePlayMessageAudio = (messageId: string, textToSpeak: string) => {
        if (playingMessageId === messageId) {
            stopSpeaking();
            setPlayingMessageId(null);
        } else {
            stopSpeaking();
            setPlayingMessageId(messageId);
            const detectedAudioLang = detectMessageLanguage(textToSpeak);
            speakWithSarvamAI(textToSpeak, detectedAudioLang, () => {
                setPlayingMessageId(null);
            });
        }
    };

    const handleCopyMessage = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const handleSendUserMessage = async (msgText: string) => {
        if (!msgText.trim()) return;
        setActiveTab('chat');

        // Detect language dynamically for this specific message
        const detected = detectMessageLanguage(msgText);
        setActiveQueryLang(detected);

        // Automatically switch the website's language (i18n locale) to match the user's query
        if (detected && detected !== locale) {
            startTransition(() => {
                setLocale(detected as any);
            });
        }

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
                language: detected,
            });

            // Feature 1: Progressive Streaming / Typewriter Delivery
            const aiMsgId = `ai-${Date.now()}`;
            const aiMsg: ChatMessage = {
                id: aiMsgId,
                sender: 'assistant',
                text: '',
            };
            setChatMessages(prev => [...prev, aiMsg]);
            setIsLoading(false);

            // Fluid progressive streaming (adaptive chunking for smooth & rapid delivery)
            const words = reply.split(' ');
            let currentIdx = 0;
            const chunkSize = words.length > 80 ? 5 : words.length > 30 ? 3 : 2;
            const tickInterval = 16; // 60 FPS smooth frame rate

            await new Promise<void>((resolve) => {
                const streamTimer = setInterval(() => {
                    currentIdx += chunkSize;
                    const nextText = words.slice(0, currentIdx).join(' ');
                    setChatMessages(prev =>
                        prev.map(m => (m.id === aiMsgId ? { ...m, text: nextText } : m))
                    );
                    // 60 FPS smooth direct scroll without browser layout thrashing
                    if (chatBodyRef.current) {
                        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
                    }

                    if (currentIdx >= words.length) {
                        clearInterval(streamTimer);
                        setChatMessages(prev =>
                            prev.map(m => (m.id === aiMsgId ? { ...m, text: reply } : m))
                        );
                        if (chatBodyRef.current) {
                            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
                        }
                        resolve();
                    }
                }, tickInterval);
            });
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

    const cleanupAudioResources = () => {
        if (wsVerbatimRef.current) {
            try {
                wsVerbatimRef.current.close();
            } catch {}
            wsVerbatimRef.current = null;
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
        if (analyserRef.current) {
            try {
                analyserRef.current.disconnect();
            } catch {}
            analyserRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch {}
            audioContextRef.current = null;
        }
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

                // Feature 2: Audio Analyser for Real-Time Waveform Visualization
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 32;
                analyser.smoothingTimeConstant = 0.8;
                source.connect(analyser);
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
            formData.append('language_code', 'unknown');

            // PRIMARY: Transcribe verbatim in native language (speech-to-text) to keep Hindi in Hindi!
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

    // Feature 5: Collapsible Clinical Accordion Cards
    const renderFormattedText = (raw: string, messageId: string = 'msg') => {
        if (!raw) return null;

        if (raw.includes('\n### ') || raw.startsWith('### ')) {
            const sections = raw.split(/(?=\n### |^### )/);
            return sections.map((sec, secIdx) => {
                const lines = sec.trim().split('\n');
                const titleLine = lines[0];
                const contentLines = lines.slice(1);
                const isHeading = titleLine.startsWith('### ');
                const titleText = isHeading ? titleLine.replace('### ', '') : '';
                const secKey = `${messageId}-sec-${secIdx}`;
                const isCollapsed = collapsedSections[secKey] ?? (secIdx > 1);

                if (isHeading && contentLines.length > 0) {
                    return (
                        <div key={secIdx} className="ai-accordion-card">
                            <div
                                className="ai-accordion-header"
                                onClick={() => toggleSection(secKey)}
                                title="Click to expand/collapse"
                            >
                                <span className="ai-accordion-chevron">
                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </span>
                                <h3 className="ai-accordion-title">{titleText}</h3>
                            </div>
                            {!isCollapsed && (
                                <div className="ai-accordion-body">
                                    {contentLines.map((line, lIdx) => renderSingleLine(line, lIdx))}
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <div key={secIdx}>
                        {lines.map((l, lIdx) => renderSingleLine(l, lIdx))}
                    </div>
                );
            });
        }

        const lines = raw.split('\n');
        return lines.map((line, idx) => renderSingleLine(line, idx));
    };

    const renderSingleLine = (line: string, idx: number) => {
        if (line.startsWith('### ')) {
            return (
                <div key={idx} className="ai-section-title-wrap">
                    <h3>{line.replace('### ', '')}</h3>
                </div>
            );
        }
        if (line.startsWith('## ')) {
            return (
                <div key={idx} className="ai-section-title-wrap major">
                    <h2>{line.replace('## ', '')}</h2>
                </div>
            );
        }
        if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
                <li key={idx} className="ai-formatted-bullet">
                    {formatInlineStyles(line.replace(/^[*\-]\s+/, ''))}
                </li>
            );
        }
        if (line.trim() === '') {
            return <div key={idx} style={{ height: '6px' }} />;
        }
        return <p key={idx} className="ai-formatted-para">{formatInlineStyles(line)}</p>;
    };

    const formatInlineStyles = (str: string) => {
        const parts = str.split(/(\b\*\*[^*]+\*\*\b|\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const inner = part.slice(2, -2);
                // Feature 4: Clinical Badges for MoCA, Latency, Scores, and Warnings with Icons
                if (/moca\s*[:\s]*\d+\/\d+/i.test(inner)) {
                    return (
                        <span key={i} className="ai-clinical-pill moca">
                            <Brain size={12} className="ai-pill-icon" />
                            <span>{inner}</span>
                        </span>
                    );
                }
                if (/\d+ms/i.test(inner)) {
                    return (
                        <span key={i} className="ai-clinical-pill latency">
                            <Zap size={12} className="ai-pill-icon" />
                            <span>{inner}</span>
                        </span>
                    );
                }
                if (/\d+\/100/i.test(inner)) {
                    return (
                        <span key={i} className="ai-clinical-pill score">
                            <Target size={12} className="ai-pill-icon" />
                            <span>{inner}</span>
                        </span>
                    );
                }
                if (/🚨|red flag|warning|चेतावनी|खतरा/i.test(inner)) {
                    const clean = inner.replace(/[🚨]/g, '').trim();
                    return (
                        <span key={i} className="ai-clinical-pill alert">
                            <AlertTriangle size={12} className="ai-pill-icon" />
                            <span>{clean || inner}</span>
                        </span>
                    );
                }
                return <strong key={i}>{inner}</strong>;
            }
            return part;
        });
    };

    return (
        <div className={`ai-bubble-container ${theme === 'light' ? 'light-mode' : ''}`} data-theme={theme}>
            {/* 1. Collapsed Floating Trigger Bubble with VyomFlow Brand Logo */}
            {!isOpen && (
                <button
                    className="ai-bubble-trigger"
                    onClick={handleToggleOpen}
                    aria-label="Open Neena"
                    title="Open Neena"
                >
                    <VyomFlowLogo variant="icon" height={38} theme={theme} className="ai-bubble-brand-logo" />
                    {hasUnreadNotification && <span className="ai-bubble-badge" />}
                    <div className="ai-bubble-tooltip">
                        <Sparkles size={13} className="ai-tooltip-sparkle" />
                        <span>Ask Neena</span>
                    </div>
                </button>
            )}

            {/* Feature 2: Compact Voice Bar Mode (Picture-in-Picture) with VyomFlow Brand Logo */}
            {isOpen && drawerMode === 'mini' && (
                <div className={`ai-mini-dock-pill ${theme === 'light' ? 'light-mode' : ''}`}>
                    <div className="ai-mini-pill-info" onClick={() => setDrawerMode('normal')}>
                        <VyomFlowLogo variant="icon" height={24} theme={theme} className="ai-mini-brand-logo" />
                        <div className="ai-mini-pill-text">
                            <span className="ai-mini-pill-title">Neena</span>
                            <span className="ai-mini-pill-sub">
                                {isRecording ? `Recording (${recordingSeconds}s)...` : playingMessageId ? 'Speaking...' : currentContext.title}
                            </span>
                        </div>
                        {isRecording && (
                            <div className="ai-audio-waveform-bars mini">
                                <span className="ai-wave-bar bar-1" />
                                <span className="ai-wave-bar bar-2" />
                                <span className="ai-wave-bar bar-3" />
                                <span className="ai-wave-bar bar-4" />
                                <span className="ai-wave-bar bar-5" />
                            </div>
                        )}
                    </div>

                    <div className="ai-mini-pill-controls">
                        <button
                            type="button"
                            className={`ai-mic-btn mini ${isRecording ? 'recording' : ''}`}
                            onClick={handleToggleVoiceRecording}
                            title={isRecording ? 'Stop & Send' : 'Speak'}
                        >
                            {isRecording ? <Square size={12} fill="currentColor" /> : <Mic size={14} />}
                        </button>
                        <button
                            type="button"
                            className="ai-control-btn mini"
                            onClick={() => setDrawerMode('normal')}
                            title="Expand to Full View"
                        >
                            <Maximize2 size={13} />
                        </button>
                        <button
                            type="button"
                            className="ai-control-btn mini"
                            onClick={handleToggleOpen}
                            title="Close"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Expanded AI Drawer Card */}
            {isOpen && drawerMode !== 'mini' && (
                <div className={`ai-drawer-card ${drawerMode === 'expanded' ? 'expanded' : ''} ${theme === 'light' ? 'light-mode' : ''}`} data-theme={theme}>
                    {/* Mobile Bottom-Sheet Pull Indicator */}
                    <div className="ai-mobile-handle-bar" />

                    {/* Header */}
                    <div className="ai-drawer-header">
                        <div className="ai-drawer-title-group">
                            <div className="ai-avatar">
                                <VyomFlowLogo variant="icon" height={28} theme={theme} className="ai-header-brand-logo" />
                            </div>
                            <div>
                                <div className="ai-drawer-title">
                                    Neena
                                    <span
                                        className={`ai-status-dot ${isServerOnline === false ? 'offline' : ''}`}
                                        title={isServerOnline ? 'AI Model Online' : 'Local Heuristic Active'}
                                    />
                                </div>
                                <div className="ai-drawer-subtitle">Multilingual Cognitive Assistant</div>
                            </div>
                        </div>

                        <div className="ai-drawer-controls">
                            {/* Feature 2: Minimize to Picture-in-Picture Pill */}
                            <button
                                className="ai-control-btn"
                                onClick={() => setDrawerMode('mini')}
                                title="Minimize to Voice Pill"
                            >
                                <Minus size={15} />
                            </button>

                            {/* Feature 5: Expand / Dock to Side-Panel Toggle */}
                            <button
                                className={`ai-control-btn ${drawerMode === 'expanded' ? 'active' : ''}`}
                                onClick={() => setDrawerMode(prev => prev === 'expanded' ? 'normal' : 'expanded')}
                                title={drawerMode === 'expanded' ? 'Dock to Window (440px)' : 'Expand to Side-Panel (740px)'}
                            >
                                {drawerMode === 'expanded' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                            </button>

                            {/* Close / Collapse Button */}
                            <button
                                className="ai-control-btn"
                                onClick={handleToggleOpen}
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Feature 1: Segmented Header Tabs with Lucide Icons */}
                    <div className="ai-tab-nav">
                        <button
                            className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <MessageSquare size={13} />
                            <span>Chat</span> {chatMessages.length > 0 && <span className="ai-tab-badge">{chatMessages.length}</span>}
                        </button>
                        <button
                            className={`ai-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                            onClick={() => setActiveTab('insights')}
                        >
                            <Activity size={13} />
                            <span>Live Insights</span>
                        </button>
                        <button
                            className={`ai-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <History size={13} />
                            <span>History</span>
                        </button>
                        {activeTab === 'chat' && chatMessages.length > 0 && (
                            <button
                                className="ai-tab-action-btn"
                                onClick={handleNewChat}
                                title="Start a fresh conversation"
                            >
                                <Plus size={12} />
                                <span>New</span>
                            </button>
                        )}
                    </div>

                    {/* Context Ribbon with MapPin Icon */}
                    <div className="ai-context-bar">
                        <span className="ai-context-text">
                            <MapPin size={13} className="ai-context-icon" />
                            Context: <strong>{currentContext.title}</strong>
                        </span>
                    </div>

                    {/* Body based on Active Tab */}
                    {activeTab === 'chat' && (
                        <div className="ai-drawer-body chat-mode" ref={chatBodyRef}>
                            {chatMessages.length === 0 ? (
                                <div className="ai-empty-chat-welcome">
                                    <div className="ai-welcome-icon-wrap">
                                        <VyomFlowLogo variant="icon" height={48} theme={theme} className="ai-welcome-brand-logo" />
                                    </div>
                                    <h4>Hello! I am Neena.</h4>
                                    <p>
                                        {locale === 'hi'
                                            ? `मैं आपकी ${currentContext.title} स्क्रीन के परीक्षण परिणामों का विश्लेषण करने में सहायता कर सकती हूँ। नीचे दिए गए किसी भी सुझाव पर टैप करें या अपना प्रश्न पूछें।`
                                            : `I can help analyze your ${currentContext.title} results, explain neurological metrics, or give tailored brain exercises. Tap a suggestion below or ask anything!`}
                                    </p>
                                </div>
                            ) : (
                                chatMessages.map(msg => (
                                    <div key={msg.id} className={`ai-chat-bubble ${msg.sender}`}>
                                        <div className="ai-bubble-content">
                                            {renderFormattedText(msg.text, msg.id)}
                                        </div>
                                        {msg.sender === 'assistant' && (
                                            <div className="ai-bubble-footer-actions">
                                                <button
                                                    className={`ai-message-speak-btn ${playingMessageId === msg.id ? 'playing' : ''}`}
                                                    onClick={() => handlePlayMessageAudio(msg.id, msg.text)}
                                                    title={playingMessageId === msg.id ? 'Stop audio' : 'Listen with Sarvam AI Voice'}
                                                >
                                                    {playingMessageId === msg.id ? (
                                                        <>
                                                            <span className="ai-playing-wave">
                                                                <span /><span /><span />
                                                            </span>
                                                            <Square size={11} fill="currentColor" />
                                                            <span>Stop</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Volume2 size={13} />
                                                            <span>Listen</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    className={`ai-message-copy-btn ${copiedMessageId === msg.id ? 'copied' : ''}`}
                                                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                                                    title="Copy response to clipboard"
                                                >
                                                    {copiedMessageId === msg.id ? (
                                                        <>
                                                            <Check size={12} />
                                                            <span>Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={12} />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                            {isLoading && chatMessages.length > 0 && (
                                <div className="ai-chat-bubble assistant">
                                    <em>Thinking in {INDIAN_LANGUAGES.find(l => l.code === activeQueryLang)?.label || 'English'}...</em>
                                </div>
                            )}

                            <div ref={bodyEndRef} />
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="ai-drawer-body insights-mode">
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
                                            <span className="ai-message-role">
                                                <Sparkles size={13} />
                                                <span>Neena Live Assessment Telemetry</span>
                                            </span>
                                        </div>
                                        <div className="ai-bubble-content">{renderFormattedText(insights, 'insight')}</div>
                                        {insights && (
                                            <div className="ai-bubble-footer-actions">
                                                <button
                                                    className={`ai-message-speak-btn ${playingMessageId === 'insight' ? 'playing' : ''}`}
                                                    onClick={() => handlePlayMessageAudio('insight', insights)}
                                                    title={playingMessageId === 'insight' ? 'Stop voice' : 'Listen with Sarvam AI Voice'}
                                                >
                                                    {playingMessageId === 'insight' ? (
                                                        <>
                                                            <Square size={11} fill="currentColor" />
                                                            <span>Stop Voice</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Volume2 size={13} />
                                                            <span>Listen Voice</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    className={`ai-message-copy-btn ${copiedMessageId === 'insight' ? 'copied' : ''}`}
                                                    onClick={() => handleCopyMessage('insight', insights)}
                                                    title="Copy insights"
                                                >
                                                    {copiedMessageId === 'insight' ? (
                                                        <>
                                                            <Check size={12} />
                                                            <span>Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={12} />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="ai-drawer-body history-mode">
                            <div className="ai-history-header-row">
                                <span className="ai-history-count">
                                    {chatMessages.filter(m => m.sender === 'user').length} Questions Asked This Session
                                </span>
                                {chatMessages.length > 0 && (
                                    <button
                                        className="ai-history-clear-btn"
                                        onClick={handleNewChat}
                                        title="Clear conversation history"
                                    >
                                        <Trash2 size={12} />
                                        <span>Clear History</span>
                                    </button>
                                )}
                            </div>
                            {chatMessages.filter(m => m.sender === 'user').length === 0 ? (
                                <div className="ai-empty-history">
                                    <p>No questions asked yet in this session.</p>
                                </div>
                            ) : (
                                <div className="ai-history-list">
                                    {chatMessages
                                        .filter(m => m.sender === 'user')
                                        .map((m, idx) => (
                                            <div
                                                key={m.id}
                                                className="ai-history-item"
                                                onClick={() => {
                                                    setActiveTab('chat');
                                                }}
                                            >
                                                <span className="ai-history-item-num">#{idx + 1}</span>
                                                <span className="ai-history-item-text">{m.text}</span>
                                                <ArrowRight size={13} className="ai-history-item-arrow" />
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feature 2: Real-time Audio Waveform Live Transcription Banner */}
                    {isRecording && (
                        <div className="ai-live-transcribe-banner">
                            <div className="ai-live-header">
                                <div className="ai-live-dot" />
                                <span className="ai-live-tag">
                                    <Radio size={11} className="ai-recording-pulse-icon" />
                                    LIVE RECORDING ({recordingSeconds}s) • {INDIAN_LANGUAGES.find(l => l.code === locale)?.label}
                                </span>
                                {/* Organic Hardware-Accelerated 5-Bar Waveform */}
                                <div className="ai-audio-waveform-bars" title="Listening to your voice...">
                                    <span className="ai-wave-bar bar-1" />
                                    <span className="ai-wave-bar bar-2" />
                                    <span className="ai-wave-bar bar-3" />
                                    <span className="ai-wave-bar bar-4" />
                                    <span className="ai-wave-bar bar-5" />
                                </div>
                            </div>
                            <div className="ai-live-text">
                                {liveTranscript || 'Listening... Speak your question now.'}
                            </div>
                        </div>
                    )}

                    {/* Footer Input Bar */}
                    <div className="ai-drawer-footer">
                        {/* Feature 3: Dynamic Contextual Suggestions Carousel */}
                        <div className="ai-dynamic-chips-carousel">
                            {getDynamicChips().map((chip, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="ai-dynamic-chip"
                                    onClick={() => {
                                        setActiveTab('chat');
                                        handleSendUserMessage(chip);
                                    }}
                                >
                                    <Sparkles size={11} className="ai-chip-sparkle" />
                                    <span>{chip}</span>
                                </button>
                            ))}
                        </div>

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
                                        ? 'Sarvam AI processing speech...'
                                        : isRecording
                                        ? `Recording (${recordingSeconds}s)... Click stop to send`
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
                                title={isRecording ? 'Stop & Send Question' : 'Speak with Sarvam AI'}
                            >
                                {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
                            </button>

                            {/* Submit Arrow */}
                            <button
                                type="submit"
                                className="ai-send-btn"
                                disabled={!chatInput.trim() || isProcessingAudio}
                                aria-label="Send Message"
                            >
                                <Send size={15} />
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
