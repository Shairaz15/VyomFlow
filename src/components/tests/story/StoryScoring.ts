import type { Story, StoryRecallBiomarkers, StoryMatchResult, ComprehensionResponse } from "../../../types/storyTypes";
import { extractLanguageFeatures } from "../../../ai/languageFeatures";

export interface ComputeScoreInput {
    story: Story;
    recalledText: string;
    englishTranslation?: string;
    durationMs: number;
    pauseCount?: number;
    pauseDurationMs?: number;
    cognitivePauseCount?: number;
    syntacticPauseCount?: number;
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
        cognitivePauseCount = 0,
        syntacticPauseCount = 0,
        matchResult,
        comprehensionResponses
    } = input;

    // 1. Two-Tier Recall Accuracy & Detail Tracking (Weight 35%)
    const totalUnits = story.informationUnits.length;
    const recalledCount = matchResult.infoUnitsMatched.length;
    let gistRecallCount = 0;
    let verbatimRecallCount = 0;
    let totalWeight = 0;
    let earnedWeight = 0;

    story.informationUnits.forEach(u => {
        totalWeight += u.weight;
        const detail = matchResult.unitDetails?.[u.id];
        if (detail) {
            earnedWeight += u.weight * detail.score;
            if (detail.matchType === 'verbatim') verbatimRecallCount++;
            else if (detail.matchType === 'gist') gistRecallCount++;
        } else if (matchResult.infoUnitsMatched.includes(u.id)) {
            earnedWeight += u.weight;
            verbatimRecallCount++;
        }
    });

    // Proportional recall accuracy with clinical intrusion/confabulation penalty
    const baseRecallAccuracy = totalUnits > 0 ? recalledCount / totalUnits : 0;
    const intrusionCount = matchResult.falseRecalls?.length || 0;
    const intrusionPenalty = Math.min(0.15, Math.max(0, (intrusionCount - 1) * 0.05));
    const recallAccuracy = Math.max(0, baseRecallAccuracy - intrusionPenalty);
    const infoUnitsScore = totalWeight > 0 ? earnedWeight / totalWeight : 0;

    // 2. Comprehension MCQ Accuracy (Weight 40%)
    const correctCount = comprehensionResponses.filter(r => r.isCorrect).length;
    const totalQuestions = comprehensionResponses.length;
    const mcqAccuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    const totalResponseTimeMs = comprehensionResponses.reduce((sum, r) => sum + r.responseTimeMs, 0);
    const avgResponseTimeMs = totalQuestions > 0 ? totalResponseTimeMs / totalQuestions : 0;

    // 3. Narrative Sequence (LIS) & Similarity Score (Weight 10%)
    const storySequenceScore = matchResult.sequenceMatchScore;
    const similarityScore = (matchResult.jaccardSimilarity + matchResult.levenshteinSimilarity) / 2;
    const narrativeCompleteness = (recallAccuracy + infoUnitsScore) / 2;

    // 4. Speech Biomarkers & Discriminative Pause Profiling (Weight 15%)
    const cleanTokens = (recalledText || "").trim().split(/\s+/).filter(w => w.length > 0);
    const hasSpokenContent = cleanTokens.length > 0;

    let speechRateWPM = 0;
    let lexicalDiversity = 0;
    let hesitationRate = 0;
    let pauseFrequency = 0;
    let speechBiomarkerScore = 0;

    if (hasSpokenContent) {
        // Use cognitive pauses (>2.2s) as the primary disfluency penalty, exempting natural breathing pauses
        const effectivePauseCount = cognitivePauseCount > 0 ? cognitivePauseCount : Math.round(pauseCount * 0.5);

        const langFeatures = extractLanguageFeatures({
            transcript: recalledText,
            englishTranslation,
            durationMs,
            pauseCount: effectivePauseCount,
            pauseDurationMs
        });

        speechRateWPM = langFeatures.derived.wpm;
        lexicalDiversity = langFeatures.derived.lexicalDiversity;
        hesitationRate = langFeatures.derived.hesitationIndex;
        pauseFrequency = durationMs > 0 ? (pauseCount / (durationMs / 60000)) : 0;

        // Normalized Speech Biomarkers Sub-score (0 to 1)
        // Optimal WPM: ~100-150 WPM, low disfluency, high diversity
        const wpmScore = Math.min(1.0, speechRateWPM / 120);
        const diversityScore = Math.min(1.0, lexicalDiversity);
        const fluencyScore = Math.max(0, 1 - hesitationRate);
        speechBiomarkerScore = (wpmScore * 0.4) + (diversityScore * 0.3) + (fluencyScore * 0.3);
    }

    // Final Composite Weight Calculation (0 - 100)
    // 40% MCQs + 35% Information Unit Recall (20% count + 15% weighted) + 15% Speech Biomarkers + 10% Sequence & Similarity
    const rawScore = 
        (mcqAccuracy * 0.40) +
        (recallAccuracy * 0.20) +
        (infoUnitsScore * 0.15) +
        (speechBiomarkerScore * 0.15) +
        (storySequenceScore * 0.05) +
        (similarityScore * 0.05);

    // True weighted score (0 - 100 scale, empty recall caps at MCQ performance)
    const storyRecallScore = Math.round(Math.min(100, Math.max(0, rawScore * 100)));

    const biomarkers: StoryRecallBiomarkers = {
        memory: {
            recallAccuracy,
            infoUnitsRecalled: recalledCount,
            totalInfoUnits: totalUnits,
            omissionCount: matchResult.infoUnitsOmitted.length,
            falseRecallCount: intrusionCount,
            gistRecallCount,
            verbatimRecallCount,
            perseverationCount: matchResult.perseverationCount || 0
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
            pauseFrequency,
            cognitivePauseCount,
            syntacticPauseCount
        }
    };

    return {
        biomarkers,
        storyRecallScore
    };
}
