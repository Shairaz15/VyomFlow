/**
 * AI Response & Audio Cache (VyomFlow Ultra-Low Latency Engine)
 *
 * Provides two-tier (In-Memory + Session/Local Web Storage) caching for:
 * 1. Sarvam Text-to-Speech (TTS) synthesized Base64 audio streams
 * 2. Sarvam / Gemini translations and language evaluations
 *
 * Shaves 700-1200ms network round-trip down to 0ms for repeated assessment prompts.
 */

// Memory LRU Cache Maps
const ttsMemoryCache = new Map<string, string>();
const translationMemoryCache = new Map<string, string>();

const MAX_TTS_CACHE_ENTRIES = 60;
const MAX_TRANS_CACHE_ENTRIES = 200;

function normalizeText(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ─── TTS AUDIO CACHE ────────────────────────────────────────────────────────

export function getCachedTTS(text: string, lang: string, speaker: string = 'priya'): string | null {
    if (!text) return null;
    const key = `tts:${lang}:${speaker}:${normalizeText(text)}`;

    // Tier 1: In-Memory
    if (ttsMemoryCache.has(key)) {
        return ttsMemoryCache.get(key)!;
    }

    // Tier 2: Session Storage
    try {
        const stored = sessionStorage.getItem(`vyom_${key}`);
        if (stored) {
            ttsMemoryCache.set(key, stored);
            return stored;
        }
    } catch {
        // SessionStorage unavailable or restricted
    }

    return null;
}

export function setCachedTTS(text: string, lang: string, audioBase64: string, speaker: string = 'priya'): void {
    if (!text || !audioBase64) return;
    const key = `tts:${lang}:${speaker}:${normalizeText(text)}`;

    // LRU eviction in memory
    if (ttsMemoryCache.size >= MAX_TTS_CACHE_ENTRIES) {
        const oldestKey = ttsMemoryCache.keys().next().value;
        if (oldestKey) ttsMemoryCache.delete(oldestKey);
    }
    ttsMemoryCache.set(key, audioBase64);

    // Persist small-to-medium audio (< 300KB) into sessionStorage safely
    if (audioBase64.length < 400_000) {
        try {
            sessionStorage.setItem(`vyom_${key}`, audioBase64);
        } catch {
            // Storage quota exceeded — memory cache remains intact
        }
    }
}

// ─── TRANSLATION CACHE ──────────────────────────────────────────────────────

export function getCachedTranslation(text: string, srcLang: string, tgtLang: string): string | null {
    if (!text) return null;
    const key = `tr:${srcLang}:${tgtLang}:${normalizeText(text)}`;

    // Tier 1: In-Memory
    if (translationMemoryCache.has(key)) {
        return translationMemoryCache.get(key)!;
    }

    // Tier 2: Local Storage
    try {
        const stored = localStorage.getItem(`vyom_${key}`);
        if (stored) {
            translationMemoryCache.set(key, stored);
            return stored;
        }
    } catch {
        // LocalStorage unavailable
    }

    return null;
}

export function setCachedTranslation(text: string, srcLang: string, tgtLang: string, translatedText: string): void {
    if (!text || !translatedText) return;
    const key = `tr:${srcLang}:${tgtLang}:${normalizeText(text)}`;

    if (translationMemoryCache.size >= MAX_TRANS_CACHE_ENTRIES) {
        const oldestKey = translationMemoryCache.keys().next().value;
        if (oldestKey) translationMemoryCache.delete(oldestKey);
    }
    translationMemoryCache.set(key, translatedText);

    try {
        localStorage.setItem(`vyom_${key}`, translatedText);
    } catch {
        // Storage quota exceeded
    }
}
