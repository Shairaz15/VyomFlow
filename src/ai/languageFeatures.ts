/**
 * Local hybrid linguistic analysis engine with Multilingual Sarvam AI support.
 * Processes transcript, verbatim speech tokens, and timing to derive cognitive biomarkers.
 * 
 * Biomarkers Extracted:
 * - WPM (Words Per Minute)
 * - Lexical Diversity (Type-Token Ratio)
 * - Fluency Index (0-100 Score)
 * - Hesitation Index (Fillers + Repetitions / Total Content)
 * - Multilingual Filler Word Density
 * - Speech Stability & Coherence Proxy
 */

import type { LanguageRawMetrics, LanguageDerivedFeatures } from "../types/languageTypes";

// Multilingual filler words in English, Hindi, and Indic languages
const FILLER_WORDS = new Set([
    "um", "uh", "er", "ah", "like", "you know", "i mean", "sort of", "kind of", "actually", "basically",
    "मतलब", "यार", "अं", "उं", "जैसे", "अच्छा", "हाँ", "आह", "उंह"
]);

export interface SpeechAnalysisInput {
    transcript: string;
    verbatimTranscript?: string;
    englishTranslation?: string;
    durationMs: number;
    pauseCount?: number;
    pauseDurationMs?: number;
    detectedLanguage?: string;
}

export function extractLanguageFeatures(input: SpeechAnalysisInput): { raw: LanguageRawMetrics, derived: LanguageDerivedFeatures } {
    const { transcript, verbatimTranscript, durationMs } = input;
    const activeText = verbatimTranscript || transcript;
    const durationMin = Math.max(durationMs / 60000, 0.1); // Avoid div by zero

    // 1. Tokenization & Cleaning
    const tokens = activeText.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
        .split(/\s+/)
        .filter(t => t.length > 0);

    const wordCount = tokens.length;

    // 2. Multilingual Filler Detection
    let fillerCount = 0;
    tokens.forEach(t => {
        if (FILLER_WORDS.has(t)) fillerCount++;
    });

    // Multi-word fillers check
    const rawLower = activeText.toLowerCase();
    ["you know", "i mean", "sort of", "kind of", "मतलब कि"].forEach(phrase => {
        const matches = rawLower.match(new RegExp(phrase, "g"));
        if (matches) fillerCount += matches.length;
    });

    // 3. Repetition & Stutter Detection
    let repetitions = 0;
    for (let i = 1; i < tokens.length; i++) {
        if (tokens[i] === tokens[i - 1]) {
            repetitions++;
        }
    }

    // 4. Lexical Analysis (Type-Token Ratio)
    const uniqueWords = new Set(tokens).size;
    const lexicalDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;

    // 5. Derived Biomarkers
    const wpm = wordCount / durationMin;

    // Hesitation Index: (Fillers + Repetitions + Pauses) / Total Words
    const hesitationIndex = wordCount > 0 ? (fillerCount + repetitions + (input.pauseCount || 0)) / wordCount : 0;

    // Fluency Index (0-100)
    let fluencyScore = 100;
    fluencyScore -= (hesitationIndex * 200);

    if (wpm < 100) {
        fluencyScore -= (100 - wpm) * 0.5;
    } else if (wpm > 180) {
        fluencyScore -= (wpm - 180) * 0.3; // Excessive speed penalty
    }

    const fluencyIndex = Math.max(0, Math.min(100, fluencyScore));

    // Speech Stability Score
    const speechStability = Math.max(0, Math.min(100, 100 - (hesitationIndex * 300)));

    // Coherence Proxy Score
    const avgWordLen = tokens.reduce((mem, t) => mem + t.length, 0) / (wordCount || 1);
    const coherenceProxy = (avgWordLen * 10) + (lexicalDiversity * 50);

    return {
        raw: {
            wordCount,
            speechDuration: durationMs,
            pauseCount: input.pauseCount || 0,
            pauseDurationAvg: input.pauseDurationMs ? input.pauseDurationMs / (input.pauseCount || 1) : 0,
            fillerWordCount: fillerCount,
            repetitions,
            uniqueWordCount: uniqueWords,
            detectedLanguage: input.detectedLanguage || 'auto-detected'
        },
        derived: {
            wpm,
            lexicalDiversity,
            fluencyIndex,
            hesitationIndex,
            speechStability,
            coherenceProxy
        }
    };
}
