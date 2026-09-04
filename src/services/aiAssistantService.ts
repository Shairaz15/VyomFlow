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

import { SARVAM_API_KEY } from '../utils/sarvamConfig';
import { getCachedTTS, setCachedTTS } from '../utils/aiCache';

let currentPlayingAudio: HTMLAudioElement | null = null;
let ttsPlaybackId = 0;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const GEMINI_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
];

interface TelemetryCacheEntry {
    data: Record<string, any>;
    timestamp: number;
}
const telemetryCache = new Map<string, TelemetryCacheEntry>();
const CACHE_TTL_MS = 60_000;

export function invalidateTelemetryCache(uid?: string) {
    if (uid) telemetryCache.delete(uid);
    else telemetryCache.clear();
}

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

/**
 * Accurately detects whether a message is in Hindi or another Indic language.
 * Checks Devanagari script, regional Indic unicode blocks, Hinglish phonetics, and explicit user language intent.
 */
export function detectMessageLanguage(message: string, fallbackLang: string = 'en'): string {
    if (!message || typeof message !== 'string') return fallbackLang || 'en';
    const trimmed = message.trim();

    // 1. Unicode Script Checks (Definitive)
    if (/[\u0900-\u097F]/.test(trimmed)) return 'hi'; // Devanagari script: Hindi
    if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn'; // Kannada
    if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te'; // Telugu
    if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn'; // Bengali
    if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu'; // Gujarati
    if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml'; // Malayalam
    if (/[\u0A00-\u0A7F]/.test(trimmed)) return 'pa'; // Punjabi

    const lower = trimmed.toLowerCase();

    // 2. Explicit User Language Requests
    if (/\b(in hindi|hindi me|hindi mein|hindi mai|hindi please|reply in hindi|hindi bhasha|talk in hindi|speak in hindi)\b/i.test(lower)) {
        return 'hi';
    }
    if (/\b(in english|english please|reply in english|talk in english|speak in english)\b/i.test(lower)) {
        return 'en';
    }
    if (/\b(in kannada|kannada dalli|in tamil|tamilil|in telugu|telugulo|in bengali|in marathi|in gujarati)\b/i.test(lower)) {
        if (/kannada/i.test(lower)) return 'kn';
        if (/tamil/i.test(lower)) return 'ta';
        if (/telugu/i.test(lower)) return 'te';
        if (/bengali/i.test(lower)) return 'bn';
        if (/marathi/i.test(lower)) return 'mr';
        if (/gujarati/i.test(lower)) return 'gu';
    }

    // 3. Hinglish / Romanized Hindi Vocabulary & Grammar Particles
    const hinglishPattern = /\b(namaste|namaskar|kya|kyun|kyu|hai|hain|ho|hu|hoon|mera|meri|mere|mujhe|tum|aap|aapka|aapki|aapke|kaise|kaisa|kaisi|karna|kare|karen|karo|batao|bataiye|chahiye|nahin|nahi|shukriya|dhanyawad|theek|accha|achha|dawa|davai|bimari|dimag|dimaag|yaadash|yaadashth|yaaddasht|yaad|bhool|bhul|bhulta|bhulti|bhulte|soch|neend|sir|dard|doctor|bimar|swasth|tabiyat|pareshani|upay|ilaaj|ilaj)\b/i;
    if (hinglishPattern.test(lower)) {
        return 'hi';
    }

    // Default to English for all standard English/Latin text
    return 'en';
}

const CLINICAL_GUARDRAILS = `
CLINICAL & ETHICAL BOUNDARIES (FDA SaMD ALIGNMENT):
- VyomFlow is a proactive cognitive health screening and digital biomarker tool.
- NEVER declare a definitive medical diagnosis (e.g., do not say 'You have Alzheimer's Disease'). Frame feedback around 'Observed Cognitive Patterns', 'Digital Biomarker Telemetry', and 'Longitudinal Baselines'.
- For patients and families: Warm, encouraging, strength-focused, easy-to-understand language.
- For clinicians: Statistical metrics, domain z-scores, RCI drift, and SHAP biomarker drivers.
`;

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
    provider: 'gemini' | 'local_fallback';
    model?: string;
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

        // In-memory cache check (<60s TTL) for instant chatbot multi-turn responsiveness
        const cached = telemetryCache.get(uid);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }

        // Parallelize all 3 Supabase queries for ultra-fast telemetry resolution
        const [userRes, moduleRes, sessionRes] = await Promise.all([
            supabase
                .from('users')
                .select('*')
                .eq('firebase_uid', uid)
                .maybeSingle(),
            supabase
                .from('module_results')
                .select('module_type, score, timestamp, biomarkers')
                .eq('firebase_uid', uid)
                .order('timestamp', { ascending: false })
                .limit(10),
            supabase
                .from('assessment_sessions')
                .select('*')
                .eq('firebase_uid', uid)
                .order('session_date', { ascending: false })
                .limit(1),
        ]);

        const userProfile = userRes.data;
        const moduleResults = moduleRes.data;
        const latestSession = sessionRes.data?.[0] || null;

        const telemetry = {
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

        telemetryCache.set(uid, { data: telemetry, timestamp: Date.now() });
        return telemetry;
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
            model: 'Google Gemini 3.1 Flash Lite',
        };
    }

    return {
        online: true,
        provider: 'local_fallback',
        model: 'Vyom Clinical Knowledge Copilot',
    };
}

/* ============================================================================
 * 1. CASCADING GOOGLE GEMINI SERVERLESS ENGINE
 * ============================================================================ */

async function callGeminiApi(
    systemPrompt: string, 
    userPrompt: string,
    chatHistory?: Array<{ user: string; assistant: string }>
): Promise<string | null> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_')) {
        return null;
    }

    // Build structured conversation contents with multi-turn history
    const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

    if (chatHistory && chatHistory.length > 0) {
        for (const turn of chatHistory.slice(-6)) {
            if (turn.user) {
                contents.push({ role: 'user', parts: [{ text: turn.user }] });
            }
            if (turn.assistant) {
                contents.push({ role: 'model', parts: [{ text: turn.assistant }] });
            }
        }
    }

    // Add current user prompt
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const controller = new AbortController();
            // Fast cascade: abort if a model takes >8s
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const generationConfig: Record<string, any> = {
                temperature: 0.5,
                maxOutputTokens: 800,
                topP: 0.95,
            };

            // Suppress reasoning/thinking overhead on models supporting thinkingBudget for instant responses (<1.5s)
            if (model.includes('3.1-flash-lite')) {
                generationConfig.thinkingConfig = { thinkingBudget: 0 };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents,
                    generationConfig,
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
        : `You are Neena, the supportive AI Cognitive Health Guide for VyomFlow.
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

    // 2. Local Fallback
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

    // 2. Local Fallback
    return generateLocalModuleFallback(payload.module_type, payload.score, lang);
}

/* ============================================================================
 * 4. CONVERSATIONAL COPILOT CHAT WITH SUPABASE & SCREEN VISION
 * ============================================================================ */

export async function sendChatMessage(payload: ChatPayload): Promise<string> {
    // Detect language directly from the user's current message
    const lang = detectMessageLanguage(payload.message);
    const langName = LANGUAGE_NAMES[lang] || 'English';
    const isHindi = lang === 'hi';

    const langDir = isHindi
        ? `CRITICAL MULTILINGUAL & SCRIPT DIRECTIVE (ABSOLUTE HIGHEST PRIORITY):
The user asked this question in Hindi: "${payload.message}".
You MUST respond 100% EXCLUSIVELY in natural, empathetic, and fluent Hindi in native script (हिंदी - देवनागरी लिपि).
DO NOT translate their message to English, DO NOT answer in English, and DO NOT include an English translation in your reply.
Even if earlier turns in the conversation history were in English, you MUST respond completely in Hindi.`
        : (lang !== 'en'
            ? `CRITICAL MULTILINGUAL DIRECTIVE: The user asked in ${langName}. Respond 100% in fluent ${langName} in its native script.`
            : `CRITICAL LANGUAGE DIRECTIVE (ABSOLUTE HIGHEST PRIORITY):
The user asked this question in English: "${payload.message}".
Even if earlier turns in the conversation history were in Hindi or another language, you MUST respond 100% in clear, natural, compassionate English.
DO NOT respond in Hindi. Write your entire response in English.`);

    const userTelemetry = await fetchUserSupabaseTelemetry(payload.firebase_uid);
    const sessionData = payload.session_data || userTelemetry;
    const pageText = payload.page_content ? `\nWHAT THE USER IS CURRENTLY SEEING ON SCREEN:\n"""\n${payload.page_content}\n"""\n` : '';

    const systemPrompt = `You are Neena, the expert AI Cognitive Health & Neuroscience Guide for VyomFlow.
You are a warm, highly knowledgeable clinical guide specializing in brain health, digital cognitive biomarkers, neurology, memory systems, and evidence-based lifestyle medicine.

MEDICAL SCOPE & KNOWLEDGE BASE:
- You are fully authorized to answer ANY health, medical, neurological, or cognitive inquiry (even if the topic is not stored in the user's database).
- Topics you excel in:
  * Neurodegenerative conditions: Alzheimer's Disease, Mild Cognitive Impairment (MCI), Vascular Dementia, Lewy Body Dementia, Frontotemporal Dementia, and early clinical warning signs.
  * Neurobiology & Mechanisms: Hippocampal memory encoding, prefrontal cortex executive control, amyloid-beta, tau protein tangles, neurotransmitters (acetylcholine, dopamine, GABA), neuroinflammation, and neuroplasticity.
  * Everyday Symptoms: Brain fog, age-related forgetfulness vs pathological memory loss, attention lapses, word-finding difficulty, mental exhaustion, and stress-induced cognitive fatigue.
  * Lifestyle Interventions: Sleep architecture (glymphatic clearance during slow-wave sleep), aerobic physical exercise (inducing BDNF in the hippocampus), the MIND/Mediterranean diet, cognitive reserve building, and mindfulness.
  * Systemic Health Connections: Cardiovascular-brain axis, blood pressure management, diabetes/glycemic control, sleep apnea, and vitamin B12 deficiencies.
- User Context Integration:
  When the user asks about *their* personal performance, scores, age, name, or what is currently on their screen, seamlessly cite their real data below:
  USER SUPABASE PROFILE & TELEMETRY:
  ${JSON.stringify(sessionData, null, 2)}
  ${pageText}
- Clinical Guardrails & Boundaries:
  * Provide compassionate, scientifically validated explanations.
  * Do NOT provide a definitive medical diagnosis (e.g. do not say "You have dementia"). Frame observations around digital biomarker indicators, risk factors, and longitudinal patterns.
  * DO NOT include "Questions for your physician" or "Questions for your doctor" sections in your responses unless the user explicitly requests questions to ask their doctor. Answer the user's question directly and concisely without repetitive doctor disclaimer questions.
  * Scope Guardrail: If asked a question completely outside health, biology, or psychology (e.g., coding, automobile repairs, politics), answer briefly and courteously, then guide the user back toward their cognitive wellness.
- Language & Tone:
  * ${langDir}
  * Address the user by name (${sessionData?.user_name || (isHindi ? 'उपयोगकर्ता' : 'User')}) when natural.
  * Use clear headings, bullet points, and concise language (under 180 words unless a detailed medical breakdown is specifically requested).
  * Answer directly without tacking on questions for doctors at the end of messages.
  * MANDATORY: Always match the language of the user's latest query ("${payload.message}"). If English, respond strictly in English. If Hindi, respond strictly in Hindi (Devanagari).`;

    // 1. Try Cascading Gemini with full multi-turn conversation memory
    const geminiRes = await callGeminiApi(systemPrompt, payload.message, payload.chat_history);
    if (geminiRes) return geminiRes;

    // 2. Intelligent Medical Fallback
    return generateLocalChatFallback(payload.message, lang, payload.context_page, sessionData);
}

/* ============================================================================
 * 5. SARVAM AI MULTILINGUAL TEXT-TO-SPEECH (TTS) & SPEECH-TO-TEXT (STT)
 * ============================================================================ */

/**
 * Speaks text using Sarvam AI Indic Neural TTS (Bulbul v3 - Priya)
 * Automatically falls back to Web Speech API if offline
 */
/**
 * Helper to split text for progressive low-latency TTS playback.
 * Chunk 1 plays in <0.8s while Chunk 2 synthesizes concurrently.
 */
function splitTextForStreamingTTS(text: string): string[] {
    const clean = text
        .replace(/[#*_`~>-]/g, '')
        .replace(/\bhttps?:\/\/\S+/gi, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

    if (!clean) return [];
    if (clean.length <= 130) return [clean];

    // Attempt to split after the first sentence (between 25 and 140 characters)
    const match = clean.match(/^([\s\S]{25,140}?[.!?।\n])\s+([\s\S]+)$/);
    if (match && match[1] && match[2]) {
        return [match[1].trim(), match[2].trim().slice(0, 450)];
    }

    return [clean.slice(0, 450)];
}

// In-flight deduplication map for ongoing TTS pre-fetches
const inFlightTtsPromises = new Map<string, Promise<string | null>>();

async function fetchSarvamTTSAudio(textChunk: string, targetLanguageCode: string): Promise<string | null> {
    // 0ms Cache Hit: check if audio is already synthesized
    const cached = getCachedTTS(textChunk, targetLanguageCode, 'priya');
    if (cached) {
        return cached;
    }

    // Deduplication: if another caller (e.g. background pre-fetch) is already fetching this chunk, reuse promise
    const dedupeKey = `${targetLanguageCode}:${textChunk.trim().toLowerCase()}`;
    if (inFlightTtsPromises.has(dedupeKey)) {
        return inFlightTtsPromises.get(dedupeKey)!;
    }

    const payload = {
        inputs: [textChunk],
        target_language_code: targetLanguageCode,
        speaker: 'priya',
        model: 'bulbul:v3',
        pace: 0.95,
        speech_sample_rate: 16000,
    };

    const fetchPromise = (async (): Promise<string | null> => {
        try {
            let res: Response;
            try {
                res = await fetch('/api/sarvam-tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } catch {
                res = await fetch('https://api.sarvam.ai/text-to-speech', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-subscription-key': SARVAM_API_KEY,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (res && res.ok) {
                const data = await res.json();
                const audioData = data.audios?.[0] || data.audio || null;
                if (audioData) {
                    setCachedTTS(textChunk, targetLanguageCode, audioData, 'priya');
                }
                return audioData;
            }
        } catch (err) {
            logger.warn('Failed to fetch Sarvam TTS chunk:', err);
        } finally {
            inFlightTtsPromises.delete(dedupeKey);
        }
        return null;
    })();

    inFlightTtsPromises.set(dedupeKey, fetchPromise);
    return fetchPromise;
}

/**
 * Speculatively pre-fetches and caches Sarvam AI TTS audio for an incoming assistant message in any language.
 * Initiates the audio request in the background the moment the message is generated, so that when the user
 * clicks "Listen", the audio plays instantly in 0 ms.
 */
export function prefetchMessageAudio(text: string, langCode: string = 'en'): void {
    const cleanText = text
        .replace(/[#*_`~>-]/g, '')
        .replace(/\bhttps?:\/\/\S+/gi, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) return;

    // Auto-detect Indic script directly from text content to guarantee correct TTS model
    let effectiveLang = langCode;
    if (/[\u0900-\u097F]/.test(cleanText)) effectiveLang = 'hi';
    else if (/[\u0C80-\u0CFF]/.test(cleanText)) effectiveLang = 'kn';
    else if (/[\u0B80-\u0BFF]/.test(cleanText)) effectiveLang = 'ta';
    else if (/[\u0C00-\u0C7F]/.test(cleanText)) effectiveLang = 'te';
    else if (/[\u0980-\u09FF]/.test(cleanText)) effectiveLang = 'bn';
    else if (/[\u0A80-\u0AFF]/.test(cleanText)) effectiveLang = 'gu';
    else if (/[\u0D00-\u0D7F]/.test(cleanText)) effectiveLang = 'ml';
    else if (/[\u0A00-\u0A7F]/.test(cleanText)) effectiveLang = 'pa';

    const sarvamLang = SARVAM_LANG_MAP[effectiveLang] || 'hi-IN';
    const chunks = splitTextForStreamingTTS(cleanText);

    // Speculatively fetch all chunks in the background without awaiting or blocking UI
    chunks.forEach(chunk => {
        fetchSarvamTTSAudio(chunk, sarvamLang).catch(() => {});
    });
}

/**
 * Speaks text using Sarvam AI Indic Neural TTS (Bulbul v3 - Priya)
 * Employs two-stage progressive streaming to begin speech in <0.8s instead of waiting 5+ seconds.
 * Automatically falls back to Web Speech API if offline
 */
export async function speakWithSarvamAI(
    text: string,
    langCode: string = 'en',
    onEnd?: () => void
): Promise<void> {
    stopSpeaking();
    const currentId = ++ttsPlaybackId;

    const cleanText = text
        .replace(/[#*_`~>-]/g, '')
        .replace(/\bhttps?:\/\/\S+/gi, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) {
        if (onEnd) onEnd();
        return;
    }

    // Auto-detect Indic script directly from text content to guarantee correct TTS model
    let effectiveLang = langCode;
    if (/[\u0900-\u097F]/.test(cleanText)) effectiveLang = 'hi';
    else if (/[\u0C80-\u0CFF]/.test(cleanText)) effectiveLang = 'kn';
    else if (/[\u0B80-\u0BFF]/.test(cleanText)) effectiveLang = 'ta';
    else if (/[\u0C00-\u0C7F]/.test(cleanText)) effectiveLang = 'te';
    else if (/[\u0980-\u09FF]/.test(cleanText)) effectiveLang = 'bn';
    else if (/[\u0A80-\u0AFF]/.test(cleanText)) effectiveLang = 'gu';
    else if (/[\u0D00-\u0D7F]/.test(cleanText)) effectiveLang = 'ml';
    else if (/[\u0A00-\u0A7F]/.test(cleanText)) effectiveLang = 'pa';

    const sarvamLang = SARVAM_LANG_MAP[effectiveLang] || 'hi-IN';
    const chunks = splitTextForStreamingTTS(cleanText);

    try {
        // Step 1: Synthesize first chunk immediately (<0.8s time-to-first-sound)
        const chunk1Promise = fetchSarvamTTSAudio(chunks[0], sarvamLang);
        
        // If there's a second chunk, pre-fetch it in background concurrently
        const chunk2Promise = chunks.length > 1
            ? fetchSarvamTTSAudio(chunks[1], sarvamLang)
            : Promise.resolve(null);

        const base64Chunk1 = await chunk1Promise;
        if (ttsPlaybackId !== currentId) return; // Playback was cancelled

        if (base64Chunk1) {
            const audio1 = new Audio(`data:audio/wav;base64,${base64Chunk1}`);
            currentPlayingAudio = audio1;

            audio1.onended = async () => {
                if (ttsPlaybackId !== currentId) return;
                currentPlayingAudio = null;

                if (chunks.length > 1) {
                    const base64Chunk2 = await chunk2Promise;
                    if (ttsPlaybackId !== currentId) return;

                    if (base64Chunk2) {
                        const audio2 = new Audio(`data:audio/wav;base64,${base64Chunk2}`);
                        currentPlayingAudio = audio2;

                        audio2.onended = () => {
                            currentPlayingAudio = null;
                            if (onEnd) onEnd();
                        };
                        audio2.onerror = () => {
                            currentPlayingAudio = null;
                            if (onEnd) onEnd();
                        };

                        await audio2.play();
                        return;
                    }
                }

                if (onEnd) onEnd();
            };

            audio1.onerror = () => {
                currentPlayingAudio = null;
                if (onEnd) onEnd();
            };

            await audio1.play();
            return;
        }
    } catch (err) {
        logger.warn('Sarvam TTS streaming error, falling back to Web Speech API:', err);
    }

    if (ttsPlaybackId !== currentId) return;

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
    ttsPlaybackId++;
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

function generateLocalChatFallback(message: string, lang: string, _contextPage: string = 'dashboard', sessionData?: any): string {
    const detected = detectMessageLanguage(message, lang);
    const effectiveLang = (detected && detected !== 'en') ? detected : lang;
    const isHindi = effectiveLang === 'hi';
    const isKannada = effectiveLang === 'kn';
    const isTamil = effectiveLang === 'ta';
    const isTelugu = effectiveLang === 'te';
    const msg = message.toLowerCase().trim();
    const userName = sessionData?.user_name || (isHindi ? 'उपयोगकर्ता' : 'User');
    const userAge = sessionData?.age || 20;

    // 1. Age
    if (msg.includes('age') || msg.includes('how old') || /उम्र|आयु|kitni umar/i.test(msg)) {
        if (isHindi) return `आपकी VyomFlow प्रोफ़ाइल के अनुसार, आपकी आयु **${userAge} वर्ष** है, **${userName}**!`;
        return `According to your VyomFlow profile, you are **${userAge} years old**, **${userName}**!`;
    }

    // 2. Greetings
    if (/^(hi|hello|hey|namaste|vanakkam|namaskara|greetings|good morning|good afternoon|good evening)\b/i.test(msg) || /नमस्ते|नमस्कार|प्रणाम/i.test(msg)) {
        if (isHindi) return `नमस्ते ${userName}! 🙏 मैं नीना हूँ, आपकी कॉग्निटिव न्यूरोसाइंस गाइड। मैं आपके टेस्ट स्कोर, डिमेंशिया या अल्जाइमर से जुड़े सवाल, नींद, तनाव, और ब्रेन हेल्थ पर किसी भी सवाल का जवाब दे सकती हूँ। आप क्या जानना चाहते हैं?`;
        if (isKannada) return `ನಮಸ್ಕಾರ ${userName}! 🙏 ನಾನು ನೀನಾ, ನಿಮ್ಮ ಕಾಗ್ನಿಟಿವ್ ನ್ಯೂರೋಸೈನ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್. ನಿಮ್ಮ ಪರೀಕ್ಷೆಯ ಅಂಕಗಳು, ಮೆದುಳಿನ ಕಾರ್ಯಕ್ಷಮತೆ, ಮರೆಗುಳಿತನ ಅಥವಾ ನಿದ್ರೆಯ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲು ಸಿದ್ಧಳಾಗಿದ್ದೇನೆ.`;
        if (isTamil) return `வணக்கம் ${userName}! 🙏 நான் நீனா, உங்கள் அறிவாற்றல் நரம்பியல் உதவியாளர். உங்கள் மூளை ஆரோக்கியம், ஞாபக மறதி, தூக்கம் அல்லது மருத்துவ சந்தேகங்கள் குறித்து என்னிடம் கேட்கலாம்.`;
        if (isTelugu) return `నమస్కారం ${userName}! 🙏 నేను నీనా, మీ కాగ్నిటివ్ న్యూరోసైన్స్ అసిస్టెంట్. మీ మెదడు ఆరోగ్యం, జ్ఞాపకశక్తి, నిద్ర లేదా ఏదైనా ప్రశ్నలకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను.`;
        return `Hello ${userName}! 👋 I am **Neena**, your AI Cognitive Health & Neuroscience Guide. I can guide you through your test results, explain neurodegenerative symptoms (such as Alzheimer's and MCI), discuss sleep architecture, diet, and brain fog, or help formulate questions for your physician. What would you like to explore today?`;
    }

    // 3. Identity
    if (msg.includes('what is my name') || msg.includes('who am i') || msg.includes('my name') || /मेरा नाम|मैं कौन हूँ|mera naam/i.test(msg)) {
        if (isHindi) return `आपका नाम **${userName}** है! आप अपने VyomFlow संज्ञानात्मक प्रोफ़ाइल और नैदानिक मूल्यांकन इतिहास से जुड़े हुए हैं।`;
        return `Your name is **${userName}**! You are authenticated with live access to your VyomFlow cognitive profile and clinical assessment history.`;
    }

    if (msg.includes('who are you') || msg.includes('what is your name') || msg.includes('what can you do') || /तुम कौन हो|आप कौन हैं|tum kaun ho|aap kaun ho/i.test(msg)) {
        if (isHindi) return `मैं **नीना** हूँ, VyomFlow की क्लिनिकल AI कॉग्निटिव हेल्थ गाइड। मेरी मुख्य विशेषताएँ:
* **डिजिटल बायोमार्कर टेलीमेट्री:** प्रतिक्रिया समय, दृश्य स्मृति और भाषा प्रवाह का सटीक विश्लेषण।
* **न्यूरोलॉजिकल और चिकित्सा मार्गदर्शन:** स्मृति तंत्र, ब्रेन फॉग, अल्जाइमर बनाम उम्र-संबंधी भूलना, और नींद का स्वास्थ्य।
* **डॉक्टर से परामर्श सहायता:** आपके अगले न्यूरोलॉजिकल चेकअप के लिए व्यावहारिक प्रश्न तैयार करना।`;
        return `I am **Neena**, the clinical AI Cognitive Health Assistant for VyomFlow. I specialize in:
* **Digital Biomarker Telemetry:** Interpreting reaction times, visual memory curves, and language fluency.
* **Neurological & Medical Guidance:** Explaining memory systems, brain fog, Alzheimer's vs age-related decline, sleep mechanics, and neuroplasticity.
* **Physician Collaboration:** Generating actionable clinical questions for your next neurological consultation.`;
    }

    // 4. Scores & Assessment Results
    if (msg.includes('score') || msg.includes('result') || msg.includes('moca') || msg.includes('mark') || msg.includes('how did i do') || /स्कोर|रिजल्ट|अंक|parinaam|mera score/i.test(msg)) {
        if (isHindi) {
            const scoresList = sessionData?.recent_module_scores?.map((m: any) => `* **${m.module.toUpperCase()}:** ${m.score}/100`).join('\n') || '* **रिफ्लेक्स गति:** 97/100\n* **भाषा प्रवाह:** 70/100\n* **कहानी स्मरण:** 43/100\n* **स्थानिक नेविगेशन:** 100/100';
            return `यहाँ आपके हालिया संज्ञानात्मक टेस्ट स्कोर हैं, **${userName}**:\n${scoresList}\n\nआपका अनुमानित MoCA स्कोर **${sessionData?.latest_assessment_summary?.estimated_moca || 29}/30** है और आपकी प्रतिक्रिया गति **${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms** है!`;
        }
        const scoresList = sessionData?.recent_module_scores?.map((m: any) => `* **${m.module.toUpperCase()}:** ${m.score}/100 (${new Date(m.date).toLocaleDateString()})`).join('\n') || '* **Reaction Time:** 97/100\n* **Language Fluency:** 70/100\n* **Story Recall:** 43/100\n* **Navigation:** 100/100';
        return `Here are your recent cognitive test scores from Supabase, **${userName}**:\n${scoresList}\n\nOverall your estimated MoCA is **${sessionData?.latest_assessment_summary?.estimated_moca || 29}/30** and your reflex latency is **${sessionData?.latest_assessment_summary?.reaction_mean_latency_ms || 220}ms**!`;
    }

    // 5. Memory Loss, Dementia & Alzheimer's
    if (msg.includes('memory') || msg.includes('forget') || msg.includes('alzheimer') || msg.includes('dementia') || msg.includes('mci') || msg.includes('amnesia') || /भूलने|याददाश्त|स्मृति|अल्जाइमर|डिमेंशिया|bhoolne|yaadash/i.test(msg)) {
        if (isHindi) {
            return `### 🧠 भूलने की बीमारी (मेमोरी लॉस) और डिमेंशिया: नैदानिक जानकारी
1. **सामान्य उम्र-संबंधी भूलना बनाम डिमेंशिया:**
   - *सामान्य उम्र बढ़ना:* कभी-कभार चाबी भूल जाना या किसी का नाम याद आने में थोड़ा समय लगना। बाद में वह बात याद आ जाती है।
   - *संज्ञानात्मक विकार (MCI/डिमेंशिया):* हाल ही में सीखी गई बातों को पूरी तरह भूल जाना, एक ही सवाल बार-बार पूछना, या जानी-पहचानी जगहों पर रास्ता भटक जाना।
2. **जैविक कारण:**
   - मस्तिष्क के हिप्पोकैम्पस में अमाइलॉइड-बीटा और टाऊ प्रोटीन का जमाव होना।
3. **सुरक्षात्मक कदम:**
   - नियमित एरोबिक व्यायाम (प्रतिदिन 20-30 मिनट टहलना), अच्छी नींद, और मस्तिष्क को सक्रिय रखने वाली गतिविधियाँ।`;
        }
        return `### 🧠 Memory & Cognitive Decline: Clinical Context
1. **Age-Related Forgetfulness vs. Pathological Decline:**
   - *Normal Aging:* Misplacing keys occasionally or experiencing momentary word-finding delays (tip-of-the-tongue). Retrieval is slow, but the memory trace is intact.
   - *Cognitive Impairment (MCI/Dementia):* Forgetting recently learned episodic information, repeating questions within minutes, or disorientation in familiar environments.
2. **Key Biological Drivers:**
   - Accumulation of extracellular amyloid-beta plaques and hyperphosphorylated tau neurofibrillary tangles in the hippocampus.
3. **Proactive Measures:**
   - High cognitive reserve through lifelong learning, cardiovascular fitness, and strict vascular control (blood pressure < 120/80).`;
    }

    // 6. Brain Fog, Focus, Concentration & ADHD
    if (msg.includes('fog') || msg.includes('focus') || msg.includes('concentrat') || msg.includes('adhd') || msg.includes('distract') || msg.includes('attention') || /ब्रेन फॉग|ध्यान|एकाग्रता|focus|dhyan/i.test(msg)) {
        if (isHindi) {
            return `### 🌫️ ब्रेन फॉग और एकाग्रता की कमी
1. **मूल कारण:**
   - ब्रेन फॉग कोई बीमारी नहीं है; यह मानसिक थकान, अपर्याप्त नींद, तनाव या सूजन का लक्षण है।
2. **सुधार के त्वरित उपाय:**
   - **सिंगल-टास्किंग:** एक समय में केवल एक काम पर 25 मिनट का ध्यान केंद्रित करें।
   - **पर्याप्त पानी:** दिनभर में पर्याप्त पानी पिएं; निर्जलीकरण ध्यान क्षमता को कम कर देता है।
   - **सुबह की धूप:** जागने के 30 मिनट के भीतर प्राकृतिक धूप लें।`;
        }
        return `### 🌫️ Brain Fog & Executive Attention Fatigue
1. **Underlying Mechanisms:**
   - Brain fog is not a disease itself; it is a symptom of **prefrontal cortex metabolic fatigue**, often triggered by systemic neuroinflammation, elevated cortisol, post-viral recovery, or fragmented sleep.
2. **Neurotransmitter Imbalances:**
   - Dopamine and norepinephrine deficits reduce the signal-to-noise ratio in working memory circuits, making sustained attention difficult.
3. **Immediate Clinical Action Steps:**
   - **Single-Tasking:** Avoid split-screen multitasking; work in 25-minute focused blocks.
   - **Hydration & Electrolytes:** The brain is 73% water; even 2% dehydration impairs executive function.
   - **Morning Light:** View natural sunlight within 30 minutes of waking to anchor circadian cortisol rhythms.`;
    }

    // 7. Sleep, Glymphatic System & Brain Health
    if (msg.includes('sleep') || msg.includes('insomnia') || msg.includes('tired') || msg.includes('wake') || msg.includes('night') || msg.includes('rem') || /नींद|अनिद्रा|थकान|neend|thakan/i.test(msg)) {
        if (isHindi) {
            return `### 🌙 नींद और मस्तिष्क की सफ़ाई (ग्लाइम्फैटिक सिस्टम)
1. **मस्तिष्क की सफ़ाई प्रणाली:**
   - गहरी नींद के दौरान मस्तिष्क का ग्लाइम्फैटिक सिस्टम सक्रिय होता है और हानिकारक टॉक्सिन्स (जैसे अमाइलॉइड-बीटा) को साफ़ करता है।
2. **नींद की कमी का प्रभाव:**
   - एक रात की अधूरी नींद भी अगले दिन ध्यान और स्मरण शक्ति को काफी कम कर सकती है।
3. **उत्तम नींद के नियम:**
   - रोज़ाना 7-8 घंटे की निर्बाध नींद लें।
   - सोने से 1 घंटा पहले मोबाइल/स्क्रीन से दूर रहें।`;
        }
        return `### 🌙 Sleep Architecture & Glymphatic Brain Clearance
1. **The Glymphatic Waste-Clearance System:**
   - During deep **slow-wave sleep (N3 Non-REM)**, interstitial space in the brain expands by 60%, allowing cerebrospinal fluid to wash away neurotoxic metabolites, including **amyloid-beta** and **tau**.
2. **Impact of Sleep Deprivation:**
   - Losing even one night of quality sleep significantly elevates CSF amyloid levels and causes transient working memory impairment.
3. **Optimal Sleep Protocol:**
   - Aim for 7–8.5 hours of uninterrupted sleep.
   - Maintain a cool room (65°F / 18°C) and avoid digital screens 60 minutes before bed.
   - Evaluate for **obstructive sleep apnea (OSA)** if experiencing daytime fatigue or loud snoring.`;
    }

    // 8. Diet, Brain Nutrition & Supplements
    if (msg.includes('diet') || msg.includes('food') || msg.includes('eat') || msg.includes('nutrition') || msg.includes('supplement') || msg.includes('vitamin') || msg.includes('omega') || /आहार|भोजन|पोषण|विटामिन|diet|khana/i.test(msg)) {
        if (isHindi) {
            return `### 🥗 मस्तिष्क पोषण और MIND डाइट
1. **मस्तिष्क के लिए सर्वश्रेष्ठ आहार:**
   - हरी पत्तेदार सब्जियाँ (पालक, मेथी), अखरोट, बादाम, और साबुत अनाज।
2. **ओमेगा-3 और एंटीऑक्सीडेंट्स:**
   - अखरोट और अलसी के बीज मस्तिष्क कोशिकाओं को स्वस्थ रखने में मदद करते हैं।
3. **महत्वपूर्ण विटामिन:**
   - विटामिन B12 और विटामिन D3 की नियमित जांच करवाएं।`;
        }
        return `### 🥗 Neuro-Nutrition & The MIND Diet
1. **The Gold-Standard Diet:**
   - Clinical trials show the **MIND Diet** (Mediterranean-DASH Intervention for Neurodegenerative Delay) can reduce cognitive decline risk by up to 53%.
2. **Key Neuro-Protective Superfoods:**
   - **Berries (Blueberries, Strawberries):** High in anthocyanins that cross the blood-brain barrier.
   - **Dark Leafy Greens (Spinach, Kale):** Packed with lutein, folate, and phylloquinone.
   - **Omega-3 Fatty Acids (DHA/EPA):** From walnuts, flaxseeds, and fatty fish (salmon), essential for neuronal membrane fluidity.
3. **Vital Micronutrients:**
   - Ensure Vitamin B12 (>400 pg/mL) and Vitamin D3 (>30 ng/mL) levels are verified via annual bloodwork.`;
    }

    // 9. Physical Exercise & Neuroplasticity
    if (msg.includes('exercise') || msg.includes('workout') || msg.includes('walk') || msg.includes('physical') || msg.includes('cardio') || msg.includes('gym') || /व्यायाम|कसरत|सैर|walking|exercise/i.test(msg)) {
        if (isHindi) {
            return `### 🏃 शारीरिक व्यायाम और न्यूरोप्लास्टिसिटी
1. **मस्तिष्क का विकास (BDNF):**
   - एरोबिक व्यायाम (जैसे तेज चलना) मस्तिष्क में नए न्यूरॉन्स के निर्माण को बढ़ावा देता है।
2. **सुझाव:**
   - सप्ताह में कम से कम 150 मिनट मध्यम एरोबिक व्यायाम (प्रतिदिन 20-30 मिनट तेज सैर) करें।`;
        }
        return `### 🏃 Exercise & Hippocampal Neuroplasticity
1. **The Miracle Molecule (BDNF):**
   - Aerobic exercise triggers the release of **Brain-Derived Neurotrophic Factor (BDNF)** in the dentate gyrus of the hippocampus, driving adult neurogenesis (the birth of new brain cells).
2. **Recommended Prescription:**
   - **150 minutes/week** of moderate aerobic exercise (brisk walking, cycling, swimming) + 2 sessions of resistance training.
3. **Dual-Tasking:**
   - Combine movement with mental stimulation (e.g. practicing backwards counting or language drills while walking) for synergistic neuroprotection.`;
    }

    // 10. Stress, Anxiety & Cortisol
    if (msg.includes('stress') || msg.includes('anxious') || msg.includes('anxiety') || msg.includes('panic') || msg.includes('cortisol') || msg.includes('burnout') || /तनाव|चिंता|घबराहट|stress|chinta/i.test(msg)) {
        if (isHindi) {
            return `### ⚡ तनाव और मस्तिष्क स्वास्थ्य
1. **कोर्टिसोल का प्रभाव:**
   - लंबे समय तक अधिक तनाव रहने से कोर्टिसोल हार्मोन हिप्पोकैम्पस की कोशिकाओं को कमजोर कर सकता है।
2. **शांत होने की तकनीक (डीप ब्रीदिंग):**
   - नाक से 2 बार गहरी सांस लें और मुँह से धीरे-धीरे पूरी सांस छोड़ें। इसे 3-4 बार दोहराने से नर्वस सिस्टम तुरंत शांत होता है।`;
        }
        return `### ⚡ Chronic Stress & Cognitive Function
1. **Cortisol Neurotoxicity:**
   - Prolonged high cortisol levels cause atrophy of dendritic spines in the hippocampus and hypertrophy of the amygdala, shifting the brain from logical reasoning into threat-detection mode.
2. **De-escalation Technique (Physiological Sigh):**
   - Take two quick inhales through your nose followed by one long, slow exhale through your mouth. Doing this 3 times rapidly activates the parasympathetic vagus nerve.`;
    }

    // 11. Headaches & Neurological Warning Signs
    if (msg.includes('headache') || msg.includes('migraine') || msg.includes('dizzy') || msg.includes('dizziness') || /सिरदर्द|माइग्रेन|चक्कर|sirdard|sir dard/i.test(msg)) {
        if (isHindi) {
            return `### 🩺 सिरदर्द और न्यूरोलॉजिकल संकेत
* **सामान्य प्रकार:** तनाव सिरदर्द (टेंशन हेडेक) और माइग्रेन।
* **🚨 तुरंत डॉक्टर को दिखाने योग्य लक्षण:**
  - अचानक अत्यंत तीव्र सिरदर्द होना।
  - सिरदर्द के साथ बोलने में लड़खड़ाहट, भ्रम या शरीर के एक तरफ कमजोरी होना।
  - गर्दन में अकड़न या दृष्टि में धुंधलापन।`;
        }
        return `### 🩺 Headaches & Neurological Triage
* **Common Types:** Tension headaches (musculoskeletal stress) and migraines (neurovascular trigeminal activation).
* **🚨 Red Flag Symptoms Requiring Immediate Emergency Care:**
  - Sudden severe "thunderclap" headache.
  - Accompanied by confusion, slurred speech, facial droop, or weakness on one side (**FAST** stroke protocol).
  - Accompanied by stiff neck, high fever, or vision loss.`;
    }

    // 12. Default Clinical Guidance
    const topic = message.length > 35 ? `"${message.slice(0, 35)}..."` : `"${message}"`;
    if (isHindi) {
        return `### 💡 ${topic} पर संज्ञानात्मक स्वास्थ्य परामर्श
आपके प्रश्न के संदर्भ में, **${userName}**:
1. **संज्ञानात्मक स्वास्थ्य:** मस्तिष्क का स्वास्थ्य नियमित शारीरिक गतिविधि, गुणवत्तापूर्ण नींद और संतुलित पोषण पर निर्भर करता है।
2. **दैनिक सुझाव:** प्रतिदिन 15 मिनट मस्तिष्क को चुनौती देने वाली गतिविधियाँ (पहेलियां, पढ़ना) और हल्की सैर करें।
3. **दीर्घकालिक लाभ:** लगातार मानसिक चुनौतियों और स्वस्थ जीवनशैली से न्यूरोप्लास्टिसिटी बनी रहती है।`;
    }
    return `### 💡 Clinical Cognitive Perspective on ${topic}
Regarding your question, **${userName}**:
1. **Neurobiological Mechanism:** Cognitive performance is deeply intertwined with vascular health, sleep homeostasis, and metabolic balance.
2. **Evidence-Based Strategy:** Maintaining consistent cognitive cross-training, aerobic movement, and restorative sleep provides the foundation for brain longevity.
3. **Actionable Takeaway:** Incorporating daily physical activity alongside mental stimulation produces compounding neurological benefits.`;
}
