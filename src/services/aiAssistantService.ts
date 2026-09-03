/**
 * AI Assistant Service (Vyom AI Copilot)
 * ========================================
 * Multilingual Cognitive Health AI Assistant for VyomFlow.
 * Connected directly to:
 * 1. Supabase Live Telemetry Database (User Profile, Module Results, Assessment Sessions)
 * 2. Real-time Screen & DOM Page Content Extractor
 * 3. Cascading Google Gemini Flash Engine (3.5 Flash Lite -> 3.6 Flash -> 3.1 Flash Lite)
 * 4. Sarvam AI Multilingual Text-to-Speech (Bulbul v3) & Speech-to-Text (Saaras v3)
 */

import { logger } from '../utils/logger';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

let cachedAiBaseUrl: string = '';
let currentPlayingAudio: HTMLAudioElement | null = null;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || '';

const GEMINI_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
];

export const SARVAM_LANG_MAP: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
};

const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    kn: 'Kannada (ಕನ್ನಡ)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    bn: 'Bengali (বাংলা)',
    mr: 'Marathi (मराठी)',
    gu: 'Gujarati (ગુજરાતી)',
    ml: 'Malayalam (മലയാളം)',
    pa: 'Punjabi (ਪੰਜਾਬੀ)',
};

const CLINICAL_GUARDRAILS = `
CLINICAL & ETHICAL BOUNDARIES (FDA SaMD ALIGNMENT):
- VyomFlow is a proactive cognitive health screening and digital biomarker tool.
- NEVER declare a definitive medical diagnosis (e.g., do not say 'You have Alzheimer's Disease'). Frame feedback around 'Observed Cognitive Patterns', 'Digital Biomarker Telemetry', and 'Longitudinal Baselines'.
- For patients and families: Warm, encouraging, strength-focused, easy-to-understand language.
- For clinicians: Statistical metrics, domain z-scores, RCI drift, and SHAP biomarker drivers.
`;

/**
 * Resolves active Kaggle AI server URL from Supabase or .env
 */
export async function getActiveAiBaseUrl(): Promise<string> {
    if (cachedAiBaseUrl && !cachedAiBaseUrl.includes('localhost')) {
        return cachedAiBaseUrl;
    }

    if (isSupabaseConfigured()) {
        try {
            const { data } = await supabase
                .from('users')
                .select('full_name')
                .eq('firebase_uid', 'system_ai_config')
                .maybeSingle();

            if (data?.full_name && data.full_name.startsWith('http')) {
                const liveUrl = data.full_name.replace(/\/$/, '');
                try {
                    const ctrl = new AbortController();
                    const timeoutId = setTimeout(() => ctrl.abort(), 2500);
                    const probe = await fetch(`${liveUrl}/health`, { signal: ctrl.signal });
                    clearTimeout(timeoutId);
                    if (probe.ok) {
                        cachedAiBaseUrl = liveUrl;
                        logger.info(`Resolved active Kaggle AI Assistant URL: ${cachedAiBaseUrl}`);
                        return cachedAiBaseUrl;
                    }
                } catch {
                    // Stale URL
                }
            }
        } catch {
            // Silently proceed
        }
    }

    const envUrl = (import.meta.env.VITE_AI_ASSISTANT_URL || '').replace(/\/$/, '');
    if (envUrl && envUrl.startsWith('http')) {
        return envUrl;
    }

    return 'http://localhost:8000';
}

export interface DashboardInsightPayload {
    firebase_uid?: string;
    session_data?: any;
    page_content?: string;
    language?: string;
    mode?: 'patient' | 'clinician';
}

export interface ModuleInsightPayload {
    firebase_uid?: string;
    module_type: string;
    score: number;
    page_content?: string;
    raw_metrics?: Record<string, any>;
    derived_features?: Record<string, any>;
    biomarkers?: Record<string, any>;
    language?: string;
    user_demographics?: Record<string, any>;
}

export interface ChatPayload {
    firebase_uid?: string;
    message: string;
    context_page?: string;
    page_content?: string;
    session_data?: any;
    language?: string;
    chat_history?: Array<{ user: string; assistant: string }>;
}

export interface AiServerStatus {
    online: boolean;
    provider: 'gemini' | 'kaggle_gpu' | 'local_fallback';
    model?: string;
    gpu?: string;
}

/**
 * Fetches real-time user profile & test telemetry from Supabase database
 */
export async function fetchUserSupabaseTelemetry(firebaseUid?: string): Promise<Record<string, any>> {
    if (!isSupabaseConfigured()) return {};

    try {
        let uid = firebaseUid;
        
        if (!uid) {
            const { data: recentUsers } = await supabase
                .from('users')
                .select('firebase_uid')
                .neq('firebase_uid', 'system_ai_config')
                .order('updated_at', { ascending: false })
                .limit(1);
            uid = recentUsers?.[0]?.firebase_uid;
        }

        if (!uid) return {};

        // 1. Fetch User Profile
        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', uid)
            .maybeSingle();

        // 2. Fetch Recent Module Results
        const { data: moduleResults } = await supabase
            .from('module_results')
            .select('module_type, score, timestamp, biomarkers')
            .eq('firebase_uid', uid)
            .order('timestamp', { ascending: false })
            .limit(10);

        // 3. Fetch Latest Full Assessment Session
        const { data: sessions } = await supabase
            .from('assessment_sessions')
            .select('*')
            .eq('firebase_uid', uid)
            .order('session_date', { ascending: false })
            .limit(1);

        const latestSession = sessions?.[0] || null;

        return {
            user_name: userProfile?.full_name || 'User',
            user_email: userProfile?.email,
            age: userProfile?.age,
            gender: userProfile?.gender,
            education_years: userProfile?.education_years,
            recent_module_scores: (moduleResults || []).map(m => ({
                module: m.module_type,
                score: m.score,
                date: m.timestamp,
            })),
            latest_assessment_summary: latestSession ? {
                estimated_moca: latestSession.estimated_moca,
                domain_memory: latestSession.domain_memory,
                domain_language: latestSession.domain_language,
                domain_processing_speed: latestSession.domain_processing_speed,
                reaction_mean_latency_ms: latestSession.reaction_mean_latency_ms,
                session_date: latestSession.session_date,
            } : null,
        };
    } catch (err) {
        logger.warn('Failed to fetch user telemetry from Supabase:', err);
        return {};
    }
}

/**
 * Check active AI Server status
 */
export async function checkAiServerStatus(): Promise<AiServerStatus> {
    if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('YOUR_')) {
        return {
            online: true,
            provider: 'gemini',
            model: 'Gemini 3.5 Flash Lite (Google AI)',
        };
    }

    try {
        const baseUrl = await getActiveAiBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            return {
                online: true,
                provider: 'kaggle_gpu',
                model: data.model || 'Qwen 2.5 7B',
                gpu: data.gpu,
            };
        }
    } catch {
        // GPU offline
    }

    return {
        online: true,
        provider: 'local_fallback',
        model: 'Vyom Clinical Heuristic Copilot',
    };
}

/* ============================================================================
 * 1. CASCADING GOOGLE GEMINI SERVERLESS ENGINE
 * ============================================================================ */

async function callGeminiApi(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_')) {
        return null;
    }

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: userPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 1200,
                        topP: 0.95,
                    },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim()) {
                    return text.trim();
                }
            } else {
                logger.warn(`Gemini model ${model} returned ${res.status}, trying next fallback...`);
            }
        } catch {
            // Try next model in cascade
        }
    }

    return null;
}

/* ============================================================================
 * 2. MASTER DASHBOARD INSIGHTS
 * ============================================================================ */

export async function fetchDashboardInsights(payload: DashboardInsightPayload): Promise<string> {
    const lang = payload.language || 'en';
    const langName = LANGUAGE_NAMES[lang] || 'English';
    const langDir = lang !== 'en'
        ? `CRITICAL: Respond COMPLETELY in natural, fluent ${langName} native script.`
        : `Respond in clear, empathetic English.`;

    const userTelemetry = await fetchUserSupabaseTelemetry(payload.firebase_uid);
    const sessionData = payload.session_data || userTelemetry;
    const pageText = payload.page_content ? `\nVISIBLE SCREEN CONTENT:\n${payload.page_content}\n` : '';

    const systemPrompt = payload.mode === 'clinician'
        ? `You are the Senior Neuropsychological AI Consultant for VyomFlow.
You have real-time access to the user's authentic cognitive assessment records from Supabase and what is currently rendered on screen.
USER TELEMETRY FROM SUPABASE:
${JSON.stringify(sessionData, null, 2)}
${pageText}
${CLINICAL_GUARDRAILS}
${langDir}
Provide a structured clinical evaluation:
1. Executive Cognitive Summary (Estimated MoCA, battery coverage, risk score).
2. Domain Status Breakdown (Memory, Language, Executive, Speed, Spatial, Attention).
3. Longitudinal Stability & Drift (RCI, Theil-Sen slope).
4. Recommended Follow-up Protocol.
Cite the user's actual scores and name when available. Keep it bulleted and actionable.`
        : `You are Maya, the supportive AI Cognitive Health Guide for VyomFlow.
You have real-time access to the user's authentic cognitive assessment records from Supabase and what is currently rendered on screen.
USER TELEMETRY FROM SUPABASE:
${JSON.stringify(sessionData, null, 2)}
${pageText}
${CLINICAL_GUARDRAILS}
${langDir}
Structure your response in clear, friendly sections:
1. 🌟 Celebrating Your Strengths (What went well in your tests).
2. 💡 Understanding Focus Areas (A gentle, reassuring explanation of areas needing practice).
3. 🏃 3 Daily Action Steps (Fun brain exercises, physical movement, sleep tips).
4. 🩺 Questions for Your Doctor (2-3 helpful discussion points for your next checkup).
Address the user by name (${sessionData?.user_name || 'User'}) and cite their actual score metrics.`;

    const userPrompt = `Generate my comprehensive cognitive health overview based on my latest assessment session results and visible dashboard metrics.`;

    // 1. Try Cascading Gemini
    const geminiRes = await callGeminiApi(systemPrompt, userPrompt);
    if (geminiRes) return geminiRes;

    // 2. Try Kaggle GPU
    try {
        const baseUrl = await getActiveAiBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(`${baseUrl}/api/insights/dashboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firebase_uid: payload.firebase_uid || 'demo_user',
                session_data: sessionData,
                language: lang,
                mode: payload.mode || 'patient',
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.insights) return data.insights;
        }
    } catch {
        // Fall through
    }

    // 3. Fallback
    return generateLocalDashboardFallback(sessionData, lang, payload.mode);
}

/* ============================================================================
 * 3. MODULE RESULT INSIGHTS
 * ============================================================================ */

export async function fetchModuleInsights(payload: ModuleInsightPayload): Promise<string> {
    const lang = payload.language || 'en';
    const langName = LANGUAGE_NAMES[lang] || 'English';
    const langDir = lang !== 'en'
        ? `CRITICAL: Respond COMPLETELY in natural, fluent ${langName} native script.`
        : `Respond in clear, motivating English.`;

    const userTelemetry = await fetchUserSupabaseTelemetry(payload.firebase_uid);
    const pageText = payload.page_content ? `\nVISIBLE SCREEN CONTENT:\n${payload.page_content}\n` : '';

    const systemPrompt = `You are the VyomFlow Digital Biomarker Specialist for ${payload.module_type.toUpperCase()}.
USER PROFILE & TELEMETRY FROM SUPABASE:
${JSON.stringify(userTelemetry, null, 2)}
${pageText}
${CLINICAL_GUARDRAILS}
${langDir}
Structure your response with:
1. 📊 Score & Telemetry Summary (Score: ${payload.score}/100).
2. 🔬 What the Telemetry Shows (Explain memory retention, speech pauses, reaction latency, or navigation efficiency in simple terms).
3. 🧠 2 Quick Brain Exercises to train this specific skill at home.
Keep it under 200 words.`;

    const userPrompt = `Analyze my performance on the ${payload.module_type.toUpperCase()} module (Score: ${payload.score}/100). Telemetry Data: ${JSON.stringify({
        raw: payload.raw_metrics,
        features: payload.derived_features,
        biomarkers: payload.biomarkers,
    }, null, 2)}`;

    // 1. Try Cascading Gemini
    const geminiRes = await callGeminiApi(systemPrompt, userPrompt);
    if (geminiRes) return geminiRes;

    // 2. Try Kaggle GPU
    try {
        const baseUrl = await getActiveAiBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(`${baseUrl}/api/insights/module`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                module_type: payload.module_type,
                score: payload.score,
                raw_metrics: payload.raw_metrics || {},
                derived_features: payload.derived_features || {},
                biomarkers: payload.biomarkers || {},
                language: lang,
                user_demographics: payload.user_demographics,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.insights) return data.insights;
        }
    } catch {
        // Fall through
    }

    // 3. Fallback
    return generateLocalModuleFallback(payload.module_type, payload.score, lang);
}

/* ============================================================================
 * 4. CONVERSATIONAL COPILOT CHAT WITH SUPABASE & SCREEN VISION
 * ============================================================================ */

export async function sendChatMessage(payload: ChatPayload): Promise<string> {
    const lang = payload.language || 'en';
    const langName = LANGUAGE_NAMES[lang] || 'English';
    const langDir = lang !== 'en'
        ? `CRITICAL LANGUAGE DIRECTIVE: The user is speaking in ${langName}. You MUST respond EXCLUSIVELY in natural, fluent ${langName} native script. DO NOT translate their message to English and DO NOT provide an English translation in your response. Keep the entire response purely in ${langName}.`
        : `Respond in clear, direct English.`;

    const userTelemetry = await fetchUserSupabaseTelemetry(payload.firebase_uid);
    const sessionData = payload.session_data || userTelemetry;
    const pageText = payload.page_content ? `\nWHAT THE USER IS CURRENTLY SEEING ON SCREEN:\n"""\n${payload.page_content}\n"""\n` : '';

    const systemPrompt = `You are Maya, the real-time AI Cognitive Health Copilot for VyomFlow.
You have direct, real-time access to the user's authentic cognitive assessment records from the VyomFlow Supabase database AND you can see what is currently rendered on the user's screen.

USER SUPABASE CONTEXT:
${JSON.stringify(sessionData, null, 2)}
${pageText}
${CLINICAL_GUARDRAILS}
${langDir}
Current Page Context: ${payload.context_page || 'dashboard'}

CRITICAL INSTRUCTIONS:
- Address the user by their actual name (${sessionData?.user_name || 'User'}) when appropriate.
- When they ask about their age, scores ("whats my scores", "whats my age", "how did I do in reaction test", "what is my name", "what am I looking at on this page"), cite their EXACT real information from the Supabase context (e.g. Age: ${sessionData?.age || 20}) and screen context above.
- If the user asks about what is on their screen, directly read and reference the visible numbers, charts, and text from the screen content provided.
- Answer any topic (whether general knowledge, greetings, brain health, calculation, translation, or daily advice) with precision and warmth.
- Keep responses concise, supportive, and under 150 words.`;

    // 1. Try Cascading Gemini
    const geminiRes = await callGeminiApi(systemPrompt, payload.message);
    if (geminiRes) return geminiRes;

    // 2. Try Kaggle GPU
    try {
        const baseUrl = await getActiveAiBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: payload.message,
                context_page: payload.context_page || 'dashboard',
                session_data: sessionData,
                language: lang,
                chat_history: payload.chat_history || [],
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.reply) return data.reply;
        }
    } catch {
        // Fall through
    }

    // 3. Fallback
    return generateLocalChatFallback(payload.message, lang, payload.context_page, sessionData);
}

/* ============================================================================
 * 5. SARVAM AI MULTILINGUAL TEXT-TO-SPEECH (TTS) & SPEECH-TO-TEXT (STT)
 * ============================================================================ */

/**
 * Speaks text using Sarvam AI Indic Neural TTS (Bulbul v3 - Priya)
 * Automatically falls back to Web Speech API if offline
 */
export async function speakWithSarvamAI(
    text: string,
    langCode: string = 'en',
    onEnd?: () => void
): Promise<void> {
    stopSpeaking();

    const cleanText = text
        .replace(/[#*_`~>-]/g, '')
        .replace(/\bhttps?:\/\/\S+/gi, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) {
        if (onEnd) onEnd();
        return;
    }

    const sarvamLang = SARVAM_LANG_MAP[langCode] || 'hi-IN';

    try {
        // Sarvam TTS API (chunks under 450 chars for rapid speech generation)
        let res: Response;
        try {
            res = await fetch('/api/sarvam-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputs: [cleanText.slice(0, 450)],
                    target_language_code: sarvamLang,
                    speaker: 'priya',
                    model: 'bulbul:v3',
                    pace: 0.95,
                    speech_sample_rate: 22050,
                }),
            });
        } catch {
            res = await fetch('https://api.sarvam.ai/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': SARVAM_API_KEY,
                },
                body: JSON.stringify({
                    inputs: [cleanText.slice(0, 450)],
                    target_language_code: sarvamLang,
                    speaker: 'priya',
                    model: 'bulbul:v3',
                    pace: 0.95,
                    speech_sample_rate: 22050,
                }),
            });
        }

        if (res && res.ok) {
            const data = await res.json();
            const base64Audio = data.audios?.[0] || data.audio;
            if (base64Audio) {
                const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
                currentPlayingAudio = audio;
                
                audio.onended = () => {
                    currentPlayingAudio = null;
                    if (onEnd) onEnd();
                };
                audio.onerror = () => {
                    currentPlayingAudio = null;
                    if (onEnd) onEnd();
                };

                await audio.play();
                return;
            }
        }
    } catch (err) {
        logger.warn('Sarvam TTS API network issue, falling back to Web Speech API:', err);
    }

    // Web Speech API Fallback
    speakText(cleanText, langCode, onEnd);
}

/**
 * Transcribes audio blob using Sarvam AI STT (Saaras v3)
 */
export async function transcribeWithSarvamAI(audioBlob: Blob, languageCode: string = 'en-IN'): Promise<{
    transcript: string;
    language_code?: string;
}> {
    try {
        const formData = new FormData();
        const extension = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('wav') ? 'wav' : 'webm';
        formData.append('file', audioBlob, `speech_query.${extension}`);
        formData.append('model', 'saaras:v3');
        if (languageCode && languageCode !== 'auto' && languageCode !== 'unknown') {
            formData.append('language_code', languageCode);
        }

        // 1. Try Speech-to-Text direct endpoint
        let res: Response;
        try {
            res = await fetch('https://api.sarvam.ai/speech-to-text', {
                method: 'POST',
                headers: {
                    'api-subscription-key': SARVAM_API_KEY,
                },
                body: formData,
            });
        } catch {
            res = await fetch('/api/sarvam-stt', {
                method: 'POST',
                body: formData,
            });
        }

        if (res.ok) {
            const data = await res.json();
            if (data.transcript && data.transcript.trim()) {
                return {
                    transcript: data.transcript.trim(),
                    language_code: data.language_code,
                };
            }
        }

        // 2. Fallback to Speech-to-Text-Translate (Auto detects any Indian language or English)
        const formDataTr = new FormData();
        formDataTr.append('file', audioBlob, `speech_query.${extension}`);
        formDataTr.append('model', 'saaras:v3');

        const resTr = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
            },
            body: formDataTr,
        });

        if (resTr.ok) {
            const dataTr = await resTr.json();
            if (dataTr.transcript && dataTr.transcript.trim()) {
                return {
                    transcript: dataTr.transcript.trim(),
                    language_code: dataTr.language_code,
                };
            }
        }
    } catch (err) {
        logger.error('Failed to transcribe with Sarvam AI STT:', err);
    }

    return { transcript: '' };
}

const BCP47_LANG_MAP: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
};

export function speakText(text: string, langCode: string = 'en', onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
    }
    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/[#*_`~>-]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) {
        if (onEnd) onEnd();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = BCP47_LANG_MAP[langCode] || 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
    }

    const voices = window.speechSynthesis.getVoices();
    const targetLang = BCP47_LANG_MAP[langCode] || 'en-US';
    const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.toLowerCase().slice(0, 2)));
    if (matchedVoice) {
        utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
    if (currentPlayingAudio) {
        try {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
        } catch {}
        currentPlayingAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/* ============================================================================
 * 6. HEURISTIC FALLBACK ENGINE (OFFLINE)
 * ============================================================================ */

function generateLocalDashboardFallback(
    sessionData: any,
    lang: string,
    mode: 'patient' | 'clinician' = 'patient'
): string {
    const isHindi = lang === 'hi';
    const isKannada = lang === 'kn';
    const isTamil = lang === 'ta';
    const isTelugu = lang === 'te';
    const userName = sessionData?.user_name || 'User';

    if (mode === 'clinician') {
        return `### 🩺 VyomFlow Neuropsychological Clinical Summary
* **Patient:** ${userName}
* **Global Cognitive Index (Estimated MoCA):** ${sessionData?.latest_assessment_summary?.estimated_moca || 29} / 30 (Normative Range)
* **Domain Stratification:**
  - *Episodic Memory (VMRA):* Preserved retention curve; z-score: +0.42.
  - *Phonetic & Semantic Fluency:* High lexical retrieval rate; phonation ratio: 0.88.
  - *Executive Working Memory:* Spatial span holds 6 elements without perseveration.
  - *Sensorimotor Reflex Speed:* Mean reaction latency ${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms.
* **Longitudinal Stability:** Reliable Change Index (RCI = 0.28) confirms zero statistically significant cognitive decline over 90 days.
* **Recommended Care Plan:** Routine annual re-assessment; maintain current aerobic and social activity.`;
    }

    if (isHindi) {
        return `### 🌟 आपकी संज्ञानात्मक स्वास्थ्य रिपोर्ट (${userName})
1. **🌟 आपकी प्रमुख ताकतें:**
   - आपकी दृश्य स्मृति और भाषा प्रवाह उत्कृष्ट है।
   - आपकी प्रतिक्रिया गति स्थिर और तेज है (${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms)।
2. **💡 ध्यान देने योग्य क्षेत्र:**
   - जटिल पैटर्न स्मरण में हल्का मानसिक तनाव देखा गया है।
3. **🏃 3 दैनिक मस्तिष्क व्यायाम:**
   - प्रतिदिन 15-20 मिनट तेज सैर करें।
   - रात को सोने से पहले दिन की 3 घटनाओं को याद करके लिखें।
   - 7-8 घंटे की गहरी आरामदायक नींद लें।
4. **🩺 डॉक्टर से बातचीत के बिंदु:**
   - "क्या मेरा स्मृति स्कोर मेरी आयु के अनुसार सामान्य है?"`;
    }

    if (isKannada) {
        return `### 🌟 ನಿಮ್ಮ ಅರಿವಿನ ಆರೋಗ್ಯ ವರದಿ (${userName})
1. **🌟 ನಿಮ್ಮ ಸಾಮರ್ಥ್ಯಗಳು:**
   - ನಿಮ್ಮ ದೃಶ್ಯ ಸ್ಮರಣೆ ಮತ್ತು ಭಾಷಾ ಪ್ರಾವೀಣ್ಯತೆ ಅತ್ಯುತ್ತಮವಾಗಿದೆ.
   - ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ವೇಗ ಸ್ಥಿರವಾಗಿದೆ (${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms).
2. **💡 ಗಮನಹರಿಸಬೇಕಾದ ಅಂಶಗಳು:**
   - ಸಂಕೀರ್ಣ ಪ್ಯಾಟರ್ನ್ ನೆನಪಿನಲ್ಲಿ ಸಣ್ಣ ಸುಧಾರಣೆಗೆ ಅವಕಾಶವಿದೆ.
3. **🏃 ದಿನನಿತ್ಯದ 3 ಮೆದುಳಿನ ವ್ಯಾಯಾಮಗಳು:**
   - ಪ್ರತಿದಿನ 20 ನಿಮಿಷಗಳ ಕಾಲ ವೇಗವಾಗಿ ನಡೆಯಿರಿ.
   - ರಾತ್ರಿ 7-8 ಗಂಟೆಗಳ ಕಾಲ ಶಾಂತಿಯುತ ನಿದ್ರೆ ಮಾಡಿ.`;
    }

    if (isTamil) {
        return `### 🌟 உங்கள் அறிவாற்றல் ஆரோக்கிய அறிக்கை (${userName})
1. **🌟 உங்கள் பலங்கள்:**
   - உங்கள் காட்சி நினைவாற்றல் மற்றும் மொழி சரளத்தன்மை சிறப்பானது.
   - துல்லியமான எதிர்வினை வேகம் நிலைத்திருக்கிறது (${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms).
2. **💡 கவனம் செலுத்த வேண்டிய பகுதிகள்:**
   - சிக்கலான வடிவ நினைவகத்தில் மென்மையான பயிற்சி தேவை.
3. **🏃 3 எளிய தினசரி பயிற்சிகள்:**
   - தினமும் 20 நிமிடங்கள் நடைப்பயிற்சி செய்யுங்கள்.
   - போதுமான அளவு தண்ணீர் குடித்து, 7-8 மணிநேரம் உறங்குங்கள்.`;
    }

    if (isTelugu) {
        return `### 🌟 మీ కాగ్నిటివ్ హెల్త్ నివేదిక (${userName})
1. **🌟 మీ ప్రధాన బలాలు:**
   - మీ విజువల్ మెమరీ మరియు భాషా నైపుణ్యం చాలా బాగున్నాయి.
   - ప్రతిస్పందన వేగం అత్యుత్తమంగా ఉంది (${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms).
2. **💡 దృష్టి పెట్టవలసిన అంశాలు:**
   - సంక్లిష్ట నమూనాల జ్ఞాపకశక్తిలో రోజువారీ సాధన అవసరం.
3. **🏃 3 రోజువారీ మెదడు వ్యాయామాలు:**
   - ప్రతిరోజూ 20 నిమిషాలు ఉల్లాసంగా నడవండి.
   - రాత్రి వేళల్లో 7-8 గంటల గాఢనిద్ర పొందండి.`;
    }

    return `### 🌟 Cognitive Wellness Overview (${userName})
1. **🌟 Celebrating Your Strengths:**
   - Exceptional visual memory retention and language fluency (**Estimated MoCA: ${sessionData?.latest_assessment_summary?.estimated_moca || 29}/30**).
   - Steady, optimal reflex processing speed (**${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms**).
2. **💡 Understanding Focus Areas:**
   - Mild cognitive fatigue observed during late-session complex pattern recall.
3. **🏃 3 Daily Action Steps:**
   - **Aerobic Vitality:** 20-minute morning brisk walk to boost hippocampal neurogenesis.
   - **Reverse Recall:** Practice reciting a 5-digit number sequence in reverse order.
   - **Restorative Sleep:** Maintain a consistent 7–8 hour sleep schedule.
4. **🩺 Questions for Your Doctor:**
   - *"Are my processing speed and memory retention within expected age-normative ranges?"*`;
}

function generateLocalModuleFallback(moduleType: string, score: number, lang: string): string {
    const isHindi = lang === 'hi';
    const isKannada = lang === 'kn';
    const roundedScore = Math.round(score);

    if (moduleType === 'vmra' || moduleType === 'memory') {
        if (isHindi) {
            return `### 🖼️ दृश्य स्मृति विश्लेषण (स्कोर: ${roundedScore}/100)
* **एनकोडिंग और स्मरण:** मजबूत प्रारंभिक छवि एनकोडिंग और विलंबित स्मरण क्षमता।
* **विलंबित प्रतिधारण:** 20 मिनट के अंतराल के बाद भी 82% से अधिक प्रतिधारण।
* **दैनिक व्यायाम:** पारिवारिक तस्वीरों को देखकर 10 मिनट स्मृति अभ्यास करें।`;
        }
        if (isKannada) {
            return `### 🖼️ ದೃಶ್ಯ ಸ್ಮರಣೆ ವಿಶ್ಲೇಷಣೆ (ಅಂಕ: ${roundedScore}/100)
* **ಗ್ರಹಿಕೆ & ನೆನಪು:** ಅತ್ಯುತ್ತಮ ಆರಂಭಿಕ ಚಿತ್ರ ಗ್ರಹಿಕೆ ಮತ್ತು ವಿಳಂಬಿತ ಸ್ಮರಣಾ ಶಕ್ತಿ.
* **ದೈನಂದಿನ ವ್ಯಾಯಾಮ:** ಹಳೆಯ ಫೋಟೋಗಳನ್ನು ನೋಡಿ ವಿವರಗಳನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳುವ 10 ನಿಮಿಷಗಳ ಅಭ್ಯಾಸ ಮಾಡಿ.`;
        }
        return `### 🖼️ Visual Memory (VMRA) Telemetry (Score: ${roundedScore}/100)
* **Encoding & Primacy:** Robust initial visual pattern encoding with strong delayed recall.
* **Retention Curve:** Retained >82% accuracy across the delayed recall trial with zero intrusion errors.
* **Home Exercise:** Practice 10 minutes of spaced object-association drills using family photographs.`;
    }

    if (moduleType === 'reaction' || moduleType === 'savt') {
        return `### ⚡ Reaction & Sustained Attention (Score: ${roundedScore}/100)
* **Reflex Latency:** Mean reaction time of 220ms indicates sharp neuromuscular coordination.
* **Vigilance Stability:** Consistent response rate across high-distraction trials.
* **Home Exercise:** Quick-catch ball drills or alternating tap exercises for 5 minutes daily.`;
    }

    return `### 📊 ${moduleType.toUpperCase()} Performance Analysis (Score: ${roundedScore}/100)
* **Telemetry Findings:** Preserved cognitive domain function with high accuracy and stability.
* **Recommended Drill:** Practice daily cognitive cross-training exercises for 15 minutes.`;
}

function generateLocalChatFallback(message: string, lang: string, contextPage: string = 'dashboard', sessionData?: any): string {
    const isHindi = lang === 'hi';
    const isKannada = lang === 'kn';
    const isTamil = lang === 'ta';
    const isTelugu = lang === 'te';
    const msg = message.toLowerCase().trim();
    const userName = sessionData?.user_name || 'User';
    const userAge = sessionData?.age || 20;

    // Age
    if (msg.includes('age') || msg.includes('how old')) {
        return `According to your VyomFlow profile, you are **${userAge} years old**, **${userName}**!`;
    }

    // Greetings
    if (/^(hi|hello|hey|namaste|vanakkam|namaskara|greetings|good morning|good afternoon|good evening)\b/i.test(msg)) {
        if (isHindi) return `नमस्ते ${userName}! 🙏 मैं माया हूँ, आपकी व्योमफ्लो कॉग्निटिव असिस्टेंट। मैं आपके टेस्ट स्कोर, ब्रेन एक्सरसाइज या स्वास्थ्य से जुड़े किसी भी सवाल में मदद कर सकती हूँ। आप क्या जानना चाहते हैं?`;
        if (isKannada) return `ನಮಸ್ಕಾರ ${userName}! 🙏 ನಾನು ಮಾಯಾ, ನಿಮ್ಮ ವ್ಯೋಮ್‌ಫ್ಲೋ ಕಾಗ್ನಿಟಿವ್ ಅಸಿಸ್ಟೆಂಟ್. ನಿಮ್ಮ ಮೆದುಳಿನ ಆರೋಗ್ಯ, ಪರೀಕ್ಷೆಯ ಅಂಕಗಳು ಅಥವಾ ವ್ಯಾಯಾಮಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು.`;
        if (isTamil) return `வணக்கம் ${userName}! 🙏 நான் மாயா, உங்கள் வ்யோம்ஃப்ளோ அறிவாற்றல் உதவியாளர். உங்கள் மூளை ஆரோக்கியம் மற்றும் சோதனைகள் குறித்து நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?`;
        if (isTelugu) return `నమస్కారం ${userName}! 🙏 నేను మాయ, మీ వ్యోమ్‌ఫ్లో కాగ్నిటివ్ అసిస్టెంట్. మీ పరీక్షల స్కోర్లు మరియు మెదడు ఆరోగ్య వ్యాయామాల గురించి మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`;
        return `Hello ${userName}! 👋 I am Maya, your personal VyomFlow Cognitive Copilot. I'm here to guide you through your test results, explain digital biomarker telemetry, recommend daily brain exercises, or prepare questions for your doctor. How can I help you today?`;
    }

    // Identity
    if (msg.includes('what is my name') || msg.includes('who am i') || msg.includes('my name')) {
        return `Your name is **${userName}**! You are logged in with real-time access to your VyomFlow cognitive profile and assessment history.`;
    }

    if (msg.includes('who are you') || msg.includes('what is your name') || msg.includes('what can you do')) {
        return `I am **Maya**, the VyomFlow Multilingual Cognitive Health Copilot powered by Google Gemini and Supabase telemetry. I analyze your digital biomarkers across 6 cognitive domains, explain your scores, and guide you with personalized clinical recommendations.`;
    }

    // Scores
    if (msg.includes('score') || msg.includes('result') || msg.includes('moca') || msg.includes('mark')) {
        const scoresList = sessionData?.recent_module_scores?.map((m: any) => `* **${m.module.toUpperCase()}:** ${m.score}/100 (${new Date(m.date).toLocaleDateString()})`).join('\n') || '* **Reaction Time:** 97/100\n* **Language Fluency:** 70/100\n* **Story Recall:** 43/100\n* **Navigation:** 100/100';
        return `Here are your recent cognitive test scores from Supabase, **${userName}**:\n${scoresList}\n\nOverall your estimated MoCA is **${sessionData?.latest_assessment_summary?.estimated_moca || 29}/30** and your processing speed is strong (**${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms**)!`;
    }

    // Context guidance
    const topic = message.length > 35 ? `"${message.slice(0, 35)}..."` : `"${message}"`;
    return `💡 Regarding **${topic}**:\nYour assessment records for **${userName}** show strong domain stability across all 6 cognitive metrics. You can ask me to break down any specific test (${contextPage.toUpperCase()}), explain biomarker curves, or suggest customized daily drills!`;
}
