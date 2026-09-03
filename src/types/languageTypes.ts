export interface LanguageRawMetrics {
    wordCount: number;
    speechDuration: number; // Total recording duration in ms
    activeSpeechDurationMs?: number; // Duration of active phonation (excluding pauses)
    pauseCount: number; // Total number of silence pauses (> 250ms)
    pauseDurationTotalMs?: number; // Cumulative pause time in ms
    pauseDurationAvg: number; // Average duration per pause in ms
    fillerWordCount: number;
    repetitions: number;
    uniqueWordCount: number;
    detectedLanguage?: string;
    detectedLanguageConfidence?: number;
    promptTopic?: string;
}

export interface LanguageDerivedFeatures {
    wpm: number; // Overall Words Per Minute
    articulationRate?: number; // Words Per Minute during active phonation
    phonationRatio?: number; // Proportion of time spent speaking (0.0 to 1.0)
    lexicalDiversity: number; // Standard Type-Token Ratio (TTR)
    rootTTR?: number; // Guiraud's Index: Unique / sqrt(Total)
    hesitationIndex: number; // Disfluency ratio (fillers + reps + pauses) / words
    fluencyIndex: number; // 0-100 Fluency Score
    speechStability: number; // 0-100 Motor Speech Stability
    semanticCoherence?: number; // 0-100 Prompt Relevance & Thematic Continuity
    syntacticComplexity?: number; // 0-100 Mean Length of Utterance & Structure
    ideaDensity?: number; // Proportion of Content Words vs Function Words
    cognitiveSpeechIndex?: number; // Composite Cognitive Speech Index (0-100)
    coherenceProxy: number; // Legacy proxy score
}

export interface LanguageAssessmentResult {
    id: string; // Unique ID
    sessionId: string;
    timestamp: Date;
    transcript: string;
    verbatimTranscript?: string;
    englishTranslation?: string;
    detectedLanguage?: string;
    promptTopic?: string;
    rawMetrics: LanguageRawMetrics;
    derivedFeatures: LanguageDerivedFeatures;
    explainability: {
        keyFactors: string[];
    };
}

