/**
 * Story Narration Recall Assessment (StoryAssessment) Types
 */

export type StoryDifficulty = 'easy' | 'medium' | 'hard';

export type SupportedLanguage = 
    | 'en-IN' 
    | 'hi-IN' 
    | 'ta-IN' 
    | 'te-IN' 
    | 'kn-IN' 
    | 'bn-IN' 
    | 'mr-IN' 
    | 'gu-IN';

export interface InformationUnit {
    id: string;
    description: string; // Brief English description of key fact/detail
    keywords: string[];   // Lowercase keywords indicating presence in recall
    weight: number;      // Importance weight (1-3)
}

export interface ComprehensionOption {
    id: string;
    text: string;
}

export interface ComprehensionQuestion {
    id: string;
    questionText: string;
    options: ComprehensionOption[];
    correctOptionId: string;
    languageContent?: Record<SupportedLanguage, {
        questionText: string;
        options: ComprehensionOption[];
    }>;
}

export interface Story {
    id: string;
    title: string;
    difficulty: StoryDifficulty;
    englishReference: string;
    content: Record<SupportedLanguage, string>;
    informationUnits: InformationUnit[];
    comprehensionQuestions: ComprehensionQuestion[];
}

export interface StoryRecallBiomarkers {
    memory: {
        recallAccuracy: number;        // 0 to 1
        infoUnitsRecalled: number;
        totalInfoUnits: number;
        omissionCount: number;
        falseRecallCount: number;
    };
    comprehension: {
        mcqAccuracy: number;           // 0 to 1
        correctCount: number;
        totalQuestions: number;
        avgResponseTimeMs: number;
    };
    narrative: {
        storySequenceScore: number;    // 0 to 1
        narrativeCompleteness: number; // 0 to 1
        similarityScore: number;       // 0 to 1 (avg of Jaccard & Levenshtein)
    };
    speech: {
        speechRateWPM: number;
        lexicalDiversity: number;     // Type-Token Ratio
        hesitationRate: number;       // Fillers + pauses per total words
        pauseFrequency: number;       // Pauses per minute
    };
}

export interface StoryMatchResult {
    jaccardSimilarity: number;
    levenshteinSimilarity: number;
    sequenceMatchScore: number;
    infoUnitsMatched: string[];        // Unit IDs matched
    infoUnitsOmitted: string[];        // Unit IDs missed
    falseRecalls: string[];           // Unmatched key statements
}

export interface ComprehensionResponse {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
}

export interface StoryAssessmentResult {
    id: string;
    sessionId: string;
    timestamp: Date;
    storyId: string;
    difficulty: StoryDifficulty;
    selectedLanguage: SupportedLanguage;
    nativeTranscript: string;
    englishTranslation: string;
    verbatimTranscript?: string;
    comprehensionResponses: ComprehensionResponse[];
    matchResult: StoryMatchResult;
    biomarkers: StoryRecallBiomarkers;
    storyRecallScore: number; // 0 to 100
}
