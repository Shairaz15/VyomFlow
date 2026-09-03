import type { NavigationBiomarkers, NavigationDifficulty } from "../../../../types/navigationTypes";

export interface DemographicContext {
    age?: number; // Default: 45
    yearsOfEducation?: number; // Default: 14
}

export interface NavigationScoreResult {
    navigationScore: number; // 0..100 composite score
    nextRecommendedLevel: NavigationDifficulty;
    isLevelUnlocked: boolean;
    normalizedMetrics: {
        accuracy: number;
        efficiency: number;
        latency: number;
        wrongTurns: number;
        landmarkRecall: number;
    };
}

/**
 * Normalizes spatial biomarkers considering participant demographic cohort and difficulty level,
 * then computes the composite 0-100 Navigation Score and adaptive level progression.
 */
export function computeNavigationScore(
    rawBiomarkers: NavigationBiomarkers,
    difficulty: NavigationDifficulty,
    demographics: DemographicContext = {}
): NavigationScoreResult {
    const age = demographics.age ?? 45;
    const edu = demographics.yearsOfEducation ?? 14;

    // Age adjustment factor: Older age gets slight adjustment threshold relaxation (+0.05)
    const ageFactor = age > 60 ? 1.08 : age > 45 ? 1.03 : 1.0;
    // Education factor
    const eduFactor = edu >= 16 ? 1.0 : 0.96;
    // Difficulty factor: Higher levels expect higher spatial memory cognitive load
    const difficultyFactor = 1 + (difficulty - 1) * 0.05;

    // 1. Normalize Path Efficiency (Target: > 0.8)
    const normalizedEfficiency = Math.min(
        1,
        Math.max(0, (rawBiomarkers.pathEfficiency * ageFactor * eduFactor) / 0.85)
    );

    // 2. Normalize Accuracy (Target: > 0.9)
    const normalizedAccuracy = Math.min(
        1,
        Math.max(0, rawBiomarkers.navigationAccuracy * ageFactor)
    );

    // 3. Normalize Decision Latency (Expected mean latency per node: 800ms - 2500ms)
    // Penalize latencies > 3500ms or < 300ms (mindless clicking)
    const targetLatency = 1500 * difficultyFactor;
    const latencyDev = Math.abs(rawBiomarkers.decisionLatencyMean - targetLatency);
    const normalizedLatency = Math.min(
        1,
        Math.max(0, 1 - latencyDev / (3000 * ageFactor))
    );

    // 4. Normalize Wrong Turn Rate
    const normalizedWrongTurns = Math.min(
        1,
        Math.max(0, 1 - (rawBiomarkers.wrongTurnCount * 0.15) / difficultyFactor)
    );

    // 5. Landmark Recall Score (0..1)
    const landmarkRecallScore = rawBiomarkers.landmarkRecallAccuracy;

    // Composite Navigation Score Weights:
    // Path Efficiency: 30%
    // Navigation Accuracy: 25%
    // Wrong Turn Control: 20%
    // Landmark Recall: 15%
    // Decision Latency Stability: 10%
    const weightedSum =
        normalizedEfficiency * 0.30 +
        normalizedAccuracy * 0.25 +
        normalizedWrongTurns * 0.20 +
        landmarkRecallScore * 0.15 +
        normalizedLatency * 0.10;

    const navigationScore = Math.round(Math.min(100, Math.max(0, weightedSum * 100)));

    // Adaptive Progression Logic (Requirement 2):
    // Score >= 85 -> Skip to Level 3 (or +2 levels, max 4)
    // Score 70-84 -> Unlock Level 2 (or +1 level, max 4)
    // Score < 70 -> Repeat current level
    let nextRecommendedLevel: NavigationDifficulty = difficulty;
    let isLevelUnlocked = false;

    if (navigationScore >= 85) {
        nextRecommendedLevel = Math.min(4, difficulty + 2) as NavigationDifficulty;
        isLevelUnlocked = difficulty < 4;
    } else if (navigationScore >= 70) {
        nextRecommendedLevel = Math.min(4, difficulty + 1) as NavigationDifficulty;
        isLevelUnlocked = difficulty < 4;
    } else {
        nextRecommendedLevel = difficulty;
        isLevelUnlocked = false;
    }

    return {
        navigationScore,
        nextRecommendedLevel,
        isLevelUnlocked,
        normalizedMetrics: {
            accuracy: Math.round(normalizedAccuracy * 100) / 100,
            efficiency: Math.round(normalizedEfficiency * 100) / 100,
            latency: Math.round(normalizedLatency * 100) / 100,
            wrongTurns: Math.round(normalizedWrongTurns * 100) / 100,
            landmarkRecall: Math.round(landmarkRecallScore * 100) / 100,
        },
    };
}
