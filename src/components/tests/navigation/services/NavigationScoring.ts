import type { NavigationBiomarkers, NavigationDifficulty } from "../../../../types/navigationTypes";

export interface NavigationScoreResult {
    navigationScore: number; // 0..100
    subScores: {
        accuracyScore: number;
        efficiencyScore: number;
        wrongTurnScore: number;
        completionTimeScore: number;
        routeDeviationScore: number;
        latencyScore: number;
        backtrackScore: number;
    };
}

const EXPECTED_COMPLETION_TIME_MS: Record<NavigationDifficulty, number> = {
    1: 30000, // 30s
    2: 45000, // 45s
    3: 60000, // 60s
    4: 75000, // 75s
};

export function computeNavigationScore(
    biomarkers: NavigationBiomarkers,
    difficulty: NavigationDifficulty,
    totalMoves: number,
    optimalMoves: number
): NavigationScoreResult {
    // 1. Accuracy (30%)
    const accuracyScore = Math.max(0, Math.min(1, biomarkers.navigationAccuracy));

    // 2. Path Efficiency (20%)
    const efficiencyScore = Math.max(0, Math.min(1, biomarkers.pathEfficiency));

    // 3. Wrong Turn Penalty (15%)
    const safeTotalMoves = Math.max(1, totalMoves);
    const wrongTurnScore = Math.max(0, 1 - biomarkers.wrongTurnCount / safeTotalMoves);

    // 4. Completion Time Score (15%)
    const expectedMs = EXPECTED_COMPLETION_TIME_MS[difficulty] || 45000;
    const timeDiffMs = Math.max(0, biomarkers.completionTimeMs - expectedMs);
    const completionTimeScore = Math.max(0, 1 - timeDiffMs / expectedMs);

    // 5. Route Deviation Score (10%)
    const safeOptimalMoves = Math.max(1, optimalMoves);
    const routeDeviationScore = Math.max(0, 1 - biomarkers.routeDeviation / safeOptimalMoves);

    // 6. Decision Latency Score (5%)
    // Optimal latency: 800ms - 2500ms
    let latencyScore = 1;
    if (biomarkers.decisionLatencyMs < 400) {
        // Too fast (random guessing)
        latencyScore = 0.5;
    } else if (biomarkers.decisionLatencyMs > 2500) {
        // Too slow
        const excess = biomarkers.decisionLatencyMs - 2500;
        latencyScore = Math.max(0, 1 - excess / 3000);
    }

    // 7. Backtracking Score (5%)
    const backtrackScore = Math.max(0, 1 - biomarkers.backtrackCount * 0.25);

    // Weighted combination (0..1)
    const compositeScore =
        accuracyScore * 0.30 +
        efficiencyScore * 0.20 +
        wrongTurnScore * 0.15 +
        completionTimeScore * 0.15 +
        routeDeviationScore * 0.10 +
        latencyScore * 0.05 +
        backtrackScore * 0.05;

    // Scale to 0..100
    const navigationScore = Math.round(compositeScore * 100);

    return {
        navigationScore,
        subScores: {
            accuracyScore: Math.round(accuracyScore * 100),
            efficiencyScore: Math.round(efficiencyScore * 100),
            wrongTurnScore: Math.round(wrongTurnScore * 100),
            completionTimeScore: Math.round(completionTimeScore * 100),
            routeDeviationScore: Math.round(routeDeviationScore * 100),
            latencyScore: Math.round(latencyScore * 100),
            backtrackScore: Math.round(backtrackScore * 100),
        },
    };
}
