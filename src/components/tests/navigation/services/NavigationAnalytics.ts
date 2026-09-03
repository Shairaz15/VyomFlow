import type {
    MapGraph,
    MovementRecord,
    LandmarkRecallResponse,
    NavigationBiomarkers,
} from "../../../../types/navigationTypes";

/**
 * Analytics Engine for 3D Navigation Assessment.
 * Reads EXCLUSIVELY from MovementLogger to calculate spatial & executive biomarkers.
 */
export function extractNavigationBiomarkers(
    graph: MapGraph,
    moveLogs: MovementRecord[],
    quizResponses: LandmarkRecallResponse[],
    totalDurationMs: number
): NavigationBiomarkers {
    if (moveLogs.length === 0) {
        return createEmptyBiomarkers(totalDurationMs);
    }

    const totalMoves = moveLogs.length;
    const optimalMoves = Math.max(1, graph.optimalPath.length - 1);

    // 1. Navigation Accuracy & Wrong Turns
    const correctMovesCount = moveLogs.filter(
        (m) => m.chosenDirection === m.correctDirection
    ).length;
    const navigationAccuracy = Math.min(1, Math.max(0, correctMovesCount / totalMoves));
    const wrongTurnCount = totalMoves - correctMovesCount;

    // 2. Path Efficiency & Route Deviation
    const pathEfficiency = Math.min(1, Math.max(0, optimalMoves / totalMoves));
    const routeDeviation = Math.max(0, totalMoves - optimalMoves);

    // 3. Decision Latency Analytics (Mean, Median, Max, Variance)
    const latencies = moveLogs.map((m) => m.decisionLatency);
    const sumLatency = latencies.reduce((acc, val) => acc + val, 0);
    const decisionLatencyMean = sumLatency / totalMoves;

    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const mid = Math.floor(sortedLatencies.length / 2);
    const decisionLatencyMedian =
        sortedLatencies.length % 2 !== 0
            ? sortedLatencies[mid]
            : (sortedLatencies[mid - 1] + sortedLatencies[mid]) / 2;

    const decisionLatencyMax = Math.max(...latencies);

    // Variance calculation: Σ(x - μ)² / N
    const sumSquaredDiff = latencies.reduce(
        (acc, val) => acc + Math.pow(val - decisionLatencyMean, 2),
        0
    );
    const decisionLatencyVariance = Math.round(sumSquaredDiff / totalMoves);

    // 4. Hesitations & Backtracks
    const hesitationCount = moveLogs.filter((m) => m.hesitationFlag).length;
    const backtrackCount = moveLogs.filter((m) => m.backtrackStatus).length;

    // 5. Exploration Ratio (Requirement 7)
    // Formula: Visited Unique Nodes ÷ Optimal Path Nodes
    const uniqueVisitedNodes = new Set(moveLogs.map((m) => m.currentNode)).size;
    const explorationRatio = Math.round((uniqueVisitedNodes / graph.optimalPath.length) * 100) / 100;

    // 6. Landmark Recall Accuracy
    let landmarkRecallAccuracy = 1;
    if (quizResponses.length > 0) {
        const correctQuizCount = quizResponses.filter((r) => r.isCorrect).length;
        landmarkRecallAccuracy = correctQuizCount / quizResponses.length;
    }

    // 7. Planning Efficiency & Route Confidence Index
    const planningEfficiency = Math.min(1, optimalMoves / (totalMoves + backtrackCount));
    const confidenceScore = Math.max(
        0,
        100 - wrongTurnCount * 12 - hesitationCount * 10 - backtrackCount * 8
    );
    const routeConfidenceIndex = Math.round(confidenceScore);

    // 8. Navigation Strategy Classification
    let navigationStrategy: NavigationBiomarkers["navigationStrategy"] = "Direct Path";
    if (pathEfficiency >= 0.85 && hesitationCount <= 1) {
        navigationStrategy = "Direct Path";
    } else if (wrongTurnCount >= 3 || backtrackCount >= 2) {
        navigationStrategy = "Trial & Error";
    } else if (explorationRatio > 1.4 && hesitationCount <= 3) {
        navigationStrategy = "Systematic Exploration";
    } else if (decisionLatencyMean > 3000 || hesitationCount > 3) {
        navigationStrategy = "Hesitant Search";
    }

    // Demographic-normalized metrics (Baseline unadjusted placeholders, populated in NavigationScoring)
    return {
        navigationAccuracy,
        pathEfficiency,
        wrongTurnCount,
        completionTimeMs: totalDurationMs,
        routeDeviation,
        decisionLatencyMean: Math.round(decisionLatencyMean),
        decisionLatencyMedian: Math.round(decisionLatencyMedian),
        decisionLatencyMax: Math.round(decisionLatencyMax),
        decisionLatencyVariance,
        hesitationCount,
        backtrackCount,
        explorationRatio,
        landmarkRecallAccuracy,
        planningEfficiency,
        routeConfidenceIndex,
        navigationStrategy,
        normalizedAccuracy: navigationAccuracy,
        normalizedEfficiency: pathEfficiency,
        normalizedLatency: Math.max(0, 1 - decisionLatencyMean / 5000),
        normalizedWrongTurns: Math.max(0, 1 - wrongTurnCount / 10),
    };
}

function createEmptyBiomarkers(durationMs: number): NavigationBiomarkers {
    return {
        navigationAccuracy: 0,
        pathEfficiency: 0,
        wrongTurnCount: 0,
        completionTimeMs: durationMs,
        routeDeviation: 0,
        decisionLatencyMean: 0,
        decisionLatencyMedian: 0,
        decisionLatencyMax: 0,
        decisionLatencyVariance: 0,
        hesitationCount: 0,
        backtrackCount: 0,
        explorationRatio: 0,
        landmarkRecallAccuracy: 0,
        planningEfficiency: 0,
        routeConfidenceIndex: 0,
        navigationStrategy: "Trial & Error",
        normalizedAccuracy: 0,
        normalizedEfficiency: 0,
        normalizedLatency: 0,
        normalizedWrongTurns: 0,
    };
}
