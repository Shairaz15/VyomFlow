import type { Story, StoryRecallBiomarkers, StoryMatchResult, ComprehensionResponse } from "../../../types/storyTypes";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";

export interface ComputeScoreInput {
    story: Story;
    recalledText: string;
    englishTranslation?: string;
    durationMs: number;
    pauseCount?: number;
    pauseDurationMs?: number;
    matchResult: StoryMatchResult;
    comprehensionResponses: ComprehensionResponse[];
}

export function computeStoryScore(input: ComputeScoreInput): {
    biomarkers: StoryRecallBiomarkers;
    storyRecallScore: number;
} {
    const {
        story,
        recalledText,
        englishTranslation,
        durationMs,
        pauseCount = 0,
        pauseDurationMs = 0,
        matchResult,
        comprehensionResponses
    } = input;

    // 1. Recall Accuracy (Weight 30%)
    const totalUnits = story.informationUnits.length;
    const recalledCount = matchResult.infoUnitsMatched.length;
    const recallAccuracy = totalUnits > 0 ? recalledCount / totalUnits : 0;

    // 2. Information Units Score (Weight 20%)
    let totalWeight = 0;
    let earnedWeight = 0;
    story.informationUnits.forEach(u => {
        totalWeight += u.weight;
        if (matchResult.infoUnitsMatched.includes(u.id)) {
            earnedWeight += u.weight;
        }
    });
    const infoUnitsScore = totalWeight > 0 ? earnedWeight / totalWeight : 0;

    // 3. Comprehension MCQ Accuracy (Weight 20%)
    const correctCount = comprehensionResponses.filter(r => r.isCorrect).length;
    const totalQuestions = comprehensionResponses.length;
    const mcqAccuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    const totalResponseTimeMs = comprehensionResponses.reduce((sum, r) => sum + r.responseTimeMs, 0);
    const avgResponseTimeMs = totalQuestions > 0 ? totalResponseTimeMs / totalQuestions : 0;

    // 4. Similarity Score (Weight 15%)
    const similarityScore = (matchResult.jaccardSimilarity + matchResult.levenshteinSimilarity) / 2;

    // 5. Narrative Organization (Weight 10%)
    const storySequenceScore = matchResult.sequenceMatchScore;
    const narrativeCompleteness = (recallAccuracy + infoUnitsScore) / 2;

    // 6. Speech Biomarkers (Weight 5%)
    const langFeatures = extractLanguageFeatures({
        transcript: recalledText,
        englishTranslation,
        durationMs,
        pauseCount,
        pauseDurationMs
    });

    const speechRateWPM = langFeatures.derived.wpm;
    const lexicalDiversity = langFeatures.derived.lexicalDiversity;
    const hesitationRate = langFeatures.derived.hesitationIndex;
    const pauseFrequency = durationMs > 0 ? (pauseCount / (durationMs / 60000)) : 0;

    // Normalized Speech Biomarkers Sub-score (0 to 1)
    // Optimal WPM: ~100-150 WPM, low disfluency, high diversity
    const wpmScore = Math.min(1.0, speechRateWPM / 120);
    const diversityScore = Math.min(1.0, lexicalDiversity);
    const fluencyScore = Math.max(0, 1 - hesitationRate);
    const speechBiomarkerScore = (wpmScore * 0.4) + (diversityScore * 0.3) + (fluencyScore * 0.3);

    // Final Composite Weight Calculation (0 - 100)
    // 40% MCQs + 35% Information Unit Recall + 15% Speech Biomarkers & Fluency + 10% Sequence & Similarity
    const rawScore = 
        (mcqAccuracy * 0.40) +
        (recallAccuracy * 0.20) +
        (infoUnitsScore * 0.15) +
        (speechBiomarkerScore * 0.15) +
        (storySequenceScore * 0.05) +
        (similarityScore * 0.05);

    // Provide fair cognitive scale (minimum 50 baseline if MCQs answered well)
    const baseScore = mcqAccuracy * 50;
    const bonusScore = (rawScore * 50);
    const storyRecallScore = Math.round(Math.min(100, Math.max(25, baseScore + bonusScore)));

    const biomarkers: StoryRecallBiomarkers = {
        memory: {
            recallAccuracy,
            infoUnitsRecalled: recalledCount,
            totalInfoUnits: totalUnits,
            omissionCount: matchResult.infoUnitsOmitted.length,
            falseRecallCount: matchResult.falseRecalls.length
        },
        comprehension: {
            mcqAccuracy,
            correctCount,
            totalQuestions,
            avgResponseTimeMs
        },
        narrative: {
            storySequenceScore,
            narrativeCompleteness,
            similarityScore
        },
        speech: {
            speechRateWPM,
            lexicalDiversity,
            hesitationRate,
            pauseFrequency
        }
    };

    return {
        biomarkers,
        storyRecallScore
    };
}
