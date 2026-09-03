/**
 * Advanced Multilingual Linguistic & Acoustic Biomarker Engine
 * Analyzes audio acoustics, speech-to-pause dynamics, lexical diversity,
 * semantic prompt relevance, and syntax to calculate a composite Cognitive Speech Index (CSI).
 */

import type { LanguageRawMetrics, LanguageDerivedFeatures } from "../types/languageTypes";

// Comprehensive Multilingual Filler Lexicon (Indic & English)
const FILLER_WORDS = new Set([
    // English
    "um", "uh", "er", "ah", "like", "you know", "i mean", "sort of", "kind of", "actually", "basically", "literally", "right", "okay", "well",
    // Hindi
    "मतलब", "यार", "अं", "उं", "जैसे", "अच्छा", "हाँ", "आह", "उंह", "तो", "वैसे", "अरे", "हूँ",
    // Tamil
    "வந்து", "அதாவது", "அதுவந்து", "தெரியுமா", "ஆமா", "சரி", "அப்புறம்",
    // Telugu
    "అంటే", "అది", "కదా", "ఏమో", "సరే", "అన్నమాట", "మరి",
    // Kannada
    "ಅಂದ್ರೆ", "ಅದು", "ಗೊತ್ತಾ", "ಸರಿ", "ಹಾಗೆ", "ಮತ್ತೆ",
    // Bengali
    "মানে", "আর কি", "যে", "হচ্ছে", "আচ্ছা", "তো", "হুম",
    // Marathi
    "म्हणजे", "बरं", "असं", "बघ", "तर", "हो ना", "का",
    // Gujarati
    "મતલબ", "એટલે", "જો", "હા", "બરાબર", "તો"
]);

const MULTI_WORD_FILLERS = [
    "you know", "i mean", "sort of", "kind of", "you see", "as in",
    "मतलब कि", "बोले तो", "ऐसे ही", "சொல்லப் போனால்", "అంటే కదా"
];

// Common English function words for Idea Density / Content vs Function ratio
const FUNCTION_WORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "with", "by", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "from",
    "up", "down", "in", "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how", "all",
    "any", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "s", "t", "can", "will", "just", "don", "should", "now", "and", "but",
    "or", "as", "if", "it", "its", "they", "them", "their", "we", "us",
    "our", "he", "him", "his", "she", "her", "i", "me", "my", "you", "your"
]);

export interface SpeechAnalysisInput {
    transcript: string;
    verbatimTranscript?: string;
    englishTranslation?: string;
    durationMs: number;
    activeSpeechDurationMs?: number;
    pauseCount?: number;
    pauseDurationMs?: number;
    detectedLanguage?: string;
    promptTopic?: string;
}

export function extractLanguageFeatures(input: SpeechAnalysisInput): { raw: LanguageRawMetrics, derived: LanguageDerivedFeatures } {
    const { 
        transcript, 
        verbatimTranscript, 
        englishTranslation, 
        durationMs,
        promptTopic 
    } = input;

    const activeText = verbatimTranscript || transcript || "";
    const englishText = englishTranslation || activeText;
    const durationMin = Math.max(durationMs / 60000, 0.05); // Min 3 seconds

    // 1. Acoustic & Pause Metrics
    const totalPauses = input.pauseCount || 0;
    const totalPauseDurationMs = input.pauseDurationMs || 0;
    const activeSpeechMs = input.activeSpeechDurationMs 
        ? Math.max(input.activeSpeechDurationMs, 1000) 
        : Math.max(durationMs - totalPauseDurationMs, durationMs * 0.7);
    const activeSpeechMin = activeSpeechMs / 60000;

    // Phonation Ratio: Proportion of time spent actively speaking vs pausing
    const phonationRatio = Math.max(0.1, Math.min(1.0, activeSpeechMs / Math.max(durationMs, 1000)));
    const avgPauseDuration = totalPauses > 0 ? totalPauseDurationMs / totalPauses : 0;

    // 2. Tokenization & Cleaning
    const tokens = activeText.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'।]/g, " ") // Remove punctuation including Indic danda
        .split(/\s+/)
        .filter(t => t.length > 0);

    const wordCount = tokens.length;

    // 3. Multilingual Filler Detection
    let fillerCount = 0;
    tokens.forEach(t => {
        if (FILLER_WORDS.has(t)) fillerCount++;
    });

    // Multi-word fillers
    const rawLower = activeText.toLowerCase();
    MULTI_WORD_FILLERS.forEach(phrase => {
        const matches = rawLower.match(new RegExp(phrase, "gi"));
        if (matches) fillerCount += matches.length;
    });

    // 4. Repetition & Stutter Detection (adjacent duplicate words)
    let repetitions = 0;
    for (let i = 1; i < tokens.length; i++) {
        if (tokens[i] === tokens[i - 1] && tokens[i].length > 1) {
            repetitions++;
        }
    }

    // 5. Lexical Analysis (Standard TTR & Root TTR / Guiraud's Index)
    const uniqueTokens = new Set(tokens);
    const uniqueWords = uniqueTokens.size;
    const lexicalDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;
    
    // Root TTR: Unique / sqrt(Total) - eliminates sample-length bias
    // Normalized to 0.0 - 1.0 (typical human conversational Root TTR ranges from 3.0 to 7.0)
    const rawRootTTR = wordCount > 0 ? uniqueWords / Math.sqrt(wordCount) : 0;
    const rootTTR = Math.min(1.0, rawRootTTR / 6.5);

    // 6. Speech Rates
    const wpm = wordCount > 0 ? wordCount / durationMin : 0;
    const articulationRate = wordCount > 0 ? wordCount / Math.max(activeSpeechMin, 0.05) : 0;

    // 7. Hesitation Index
    // (Fillers + Repetitions + Acoustic Pauses) normalized by total words
    const hesitationEvents = fillerCount + (repetitions * 1.5) + (totalPauses * 0.5);
    const hesitationIndex = wordCount > 0 ? hesitationEvents / wordCount : 0;

    // 8. Fluency Score (0 - 100)
    let fluencyScore = 100;
    // Penalty for excessive hesitations/fillers
    fluencyScore -= Math.min(60, hesitationIndex * 150);

    // Penalty for speech rate deviation from optimal conversational window (110 - 160 WPM)
    if (wpm < 110 && wpm > 0) {
        fluencyScore -= (110 - wpm) * 0.45;
    } else if (wpm > 175) {
        fluencyScore -= (wpm - 175) * 0.35; // Rapid speech / cluttering penalty
    } else if (wpm === 0) {
        fluencyScore = 10;
    }

    const fluencyIndex = Math.max(10, Math.min(100, Math.round(fluencyScore)));

    // 9. Semantic Prompt Relevance & Coherence
    const semanticCoherence = calculateSemanticCoherence(promptTopic || "", englishText, activeText);

    // 10. Syntactic Complexity & Idea Density
    const { syntacticComplexity, ideaDensity } = calculateSyntaxAndIdeaDensity(englishText, tokens);

    // 11. Motor Speech Stability (0 - 100)
    const speechStability = Math.max(10, Math.min(100, Math.round(
        (phonationRatio * 60) + (Math.max(0, 1 - hesitationIndex) * 40)
    )));

    // 12. Composite Cognitive Speech Index (CSI 0-100)
    // Clinically-weighted multi-dimensional score:
    // - 30% Fluency (Pace & Hesitation)
    // - 25% Acoustic Dynamics (Phonation ratio & Pause stability)
    // - 20% Lexical Richness (Root TTR & Vocabulary depth)
    // - 15% Semantic Coherence (Prompt relevance & context flow)
    // - 10% Syntactic Complexity (Sentence structure & MLU)
    const acousticScore = Math.min(100, (phonationRatio * 85) + (totalPauses <= 4 ? 15 : Math.max(0, 15 - (totalPauses - 4) * 3)));
    const lexicalScore = Math.min(100, (rootTTR * 70) + (lexicalDiversity * 30));

    const compositeCSI = Math.round(
        (fluencyIndex * 0.30) +
        (acousticScore * 0.25) +
        (lexicalScore * 0.20) +
        (semanticCoherence * 0.15) +
        (syntacticComplexity * 0.10)
    );

    const cognitiveSpeechIndex = Math.max(10, Math.min(100, compositeCSI));
    const coherenceProxy = Math.round((semanticCoherence * 0.6) + (lexicalDiversity * 40));

    return {
        raw: {
            wordCount,
            speechDuration: durationMs,
            activeSpeechDurationMs: activeSpeechMs,
            pauseCount: totalPauses,
            pauseDurationTotalMs: totalPauseDurationMs,
            pauseDurationAvg: Math.round(avgPauseDuration),
            fillerWordCount: fillerCount,
            repetitions,
            uniqueWordCount: uniqueWords,
            detectedLanguage: input.detectedLanguage || 'auto-detected',
            promptTopic
        },
        derived: {
            wpm: Math.round(wpm * 10) / 10,
            articulationRate: Math.round(articulationRate * 10) / 10,
            phonationRatio: Math.round(phonationRatio * 100) / 100,
            lexicalDiversity: Math.round(lexicalDiversity * 1000) / 1000,
            rootTTR: Math.round(rootTTR * 1000) / 1000,
            hesitationIndex: Math.round(hesitationIndex * 1000) / 1000,
            fluencyIndex,
            speechStability,
            semanticCoherence,
            syntacticComplexity,
            ideaDensity: Math.round(ideaDensity * 100) / 100,
            cognitiveSpeechIndex,
            coherenceProxy
        }
    };
}

/**
 * Calculates semantic overlap and prompt alignment.
 */
function calculateSemanticCoherence(promptTopic: string, englishText: string, nativeText: string): number {
    if (!promptTopic || (!englishText && !nativeText)) {
        return 75; // Default neutral baseline
    }

    const extractKeywords = (text: string) => {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(w => w.length > 3 && !FUNCTION_WORDS.has(w));
    };

    const promptKeywords = extractKeywords(promptTopic);
    const responseKeywords = extractKeywords(englishText + " " + nativeText);

    if (promptKeywords.length === 0 || responseKeywords.length === 0) {
        return 70;
    }

    // Keyword match count
    let matches = 0;
    promptKeywords.forEach(pk => {
        if (responseKeywords.some(rk => rk.includes(pk) || pk.includes(rk))) {
            matches++;
        }
    });

    const keywordRelevance = promptKeywords.length > 0 ? (matches / promptKeywords.length) : 0.5;
    
    // Length & elaboration factor (responses with > 20 words have higher depth)
    const elaborationFactor = Math.min(1.0, responseKeywords.length / 15);

    const score = (keywordRelevance * 55) + (elaborationFactor * 45);
    return Math.max(30, Math.min(100, Math.round(score)));
}

/**
 * Calculates Syntactic Complexity (Mean Length of Utterance) and Idea Density (Content vs Function words).
 */
function calculateSyntaxAndIdeaDensity(text: string, rawTokens: string[]): { syntacticComplexity: number, ideaDensity: number } {
    if (!text || rawTokens.length === 0) {
        return { syntacticComplexity: 65, ideaDensity: 0.5 };
    }

    // 1. Clause / Sentence splitting
    const clauses = text.split(/[.,!?;]|\b(?:and|but|because|although|which|that|when|if|so|while)\b/i)
        .map(c => c.trim())
        .filter(c => c.length > 0);

    const clauseCount = Math.max(1, clauses.length);
    const mlu = rawTokens.length / clauseCount; // Words per clause

    // Optimal MLU for conversational speech is 7 - 14 words per clause
    let syntaxScore = 80;
    if (mlu >= 7 && mlu <= 14) {
        syntaxScore = 90 + Math.min(10, (mlu - 7) * 1.5);
    } else if (mlu < 7) {
        syntaxScore = 55 + (mlu * 4); // Short, telegraphic speech
    } else {
        syntaxScore = Math.max(60, 100 - ((mlu - 14) * 3)); // Run-on sentences
    }

    // 2. Content vs Function Word Ratio (Idea Density)
    let contentWords = 0;
    const lowerTokens = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
    lowerTokens.forEach(token => {
        if (!FUNCTION_WORDS.has(token) && token.length > 2) {
            contentWords++;
        }
    });

    const ideaDensity = lowerTokens.length > 0 ? contentWords / lowerTokens.length : 0.5;

    return {
        syntacticComplexity: Math.max(20, Math.min(100, Math.round(syntaxScore))),
        ideaDensity
    };
}

