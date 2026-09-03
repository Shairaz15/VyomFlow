import type {
    DestinationAnswer,
    IntersectionResponse,
    LandmarkOrderingResult,
    NavigationBiomarkers,
} from "../../../../types/navigationTypes";

/**
 * Pure function to compute 17+ visuospatial navigation and memory biomarkers.
 * Uses sub-millisecond latency records, directional decision accuracy,
 * destination recall, and chronological landmark sequence fidelity.
 */
export function computeNavigationBiomarkers(
    destinationAnswer: DestinationAnswer,
    intersectionResponses: IntersectionResponse[],
    landmarkOrdering: LandmarkOrderingResult
): NavigationBiomarkers {
    // 1. Route Memory Metrics
    const destinationRecallAccuracy = destinationAnswer.isCorrect ? 1 : 0;
    const totalIntersections = intersectionResponses.length || 1;
    const correctTurns = intersectionResponses.filter((r) => r.isCorrect).length;
    const navigationAccuracy = correctTurns / totalIntersections;
    const wrongTurnCount = totalIntersections - correctTurns;
    const correctDecisionRate = navigationAccuracy;

    // 2. Executive Function & Latency Analytics
    const latencies = intersectionResponses.map((r) => r.decisionLatencyMs);
    const averageDecisionLatencyMs = latencies.length > 0
        ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
        : 0;

    const maxDecisionLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;

    const latencyVariance = latencies.length > 0
        ? latencies.reduce((sum, l) => sum + Math.pow(l - averageDecisionLatencyMs, 2), 0) / latencies.length
        : 0;

    // Hesitation count: decision latency > 2x average decision latency
    const hesitationThreshold = averageDecisionLatencyMs > 0 ? averageDecisionLatencyMs * 2 : 2500;
    const hesitationCount = latencies.filter((l) => l > hesitationThreshold).length;

    // 3. Spatial Memory Metrics
    const landmarkRecognitionAccuracy = landmarkOrdering.recognitionAccuracy;
    const falseLandmarkRate = landmarkOrdering.selectedLandmarkIds.length > 0
        ? landmarkOrdering.falseLandmarkCount / landmarkOrdering.selectedLandmarkIds.length
        : 0;
    const landmarkSequenceAccuracy = landmarkOrdering.sequenceAccuracy;

    // Chronological Recall Score: weighted blend of sequence accuracy and recognition
    const chronologicalRecallScore = (landmarkSequenceAccuracy * 0.7) + (landmarkRecognitionAccuracy * 0.3);

    // 4. Composite Scores
    const routeMemoryScore = (navigationAccuracy * 0.7) + (destinationRecallAccuracy * 0.3);
    const visualAttentionScore = Math.max(0, landmarkRecognitionAccuracy * (1 - (falseLandmarkRate * 0.5)));
    const episodicMemoryScore = (chronologicalRecallScore * 0.6) + (destinationRecallAccuracy * 0.4);

    // Latency normalization: <2000ms -> 1.0, >8000ms -> 0.0
    const normalizedLatencyScore = Math.max(0, Math.min(1, 1 - (averageDecisionLatencyMs - 2000) / 6000));
    const falseLandmarkRetention = Math.max(0, 1 - falseLandmarkRate);

    // 5. Final Weighted Navigation Score (0–100)
    // - Direction Accuracy: 30%
    // - Landmark Recognition: 20%
    // - Landmark Chronology: 20%
    // - Decision Latency: 15%
    // - Destination Recall: 10%
    // - False Landmark Penalty / Precision: 5%
    const rawScore = (
        (navigationAccuracy * 0.30) +
        (landmarkRecognitionAccuracy * 0.20) +
        (chronologicalRecallScore * 0.20) +
        (normalizedLatencyScore * 0.15) +
        (destinationRecallAccuracy * 0.10) +
        (falseLandmarkRetention * 0.05)
    ) * 100;

    const navigationScore = Math.round(Math.max(0, Math.min(100, rawScore)));

    return {
        destinationRecallAccuracy,
        navigationAccuracy: Number(navigationAccuracy.toFixed(3)),
        wrongTurnCount,
        correctDecisionRate: Number(correctDecisionRate.toFixed(3)),
        averageDecisionLatencyMs: Math.round(averageDecisionLatencyMs),
        maxDecisionLatencyMs: Math.round(maxDecisionLatencyMs),
        decisionLatencyVariance: Math.round(latencyVariance),
        hesitationCount,
        landmarkRecognitionAccuracy: Number(landmarkRecognitionAccuracy.toFixed(3)),
        falseLandmarkRate: Number(falseLandmarkRate.toFixed(3)),
        landmarkSequenceAccuracy: Number(landmarkSequenceAccuracy.toFixed(3)),
        chronologicalRecallScore: Number(chronologicalRecallScore.toFixed(3)),
        routeMemoryScore: Number(routeMemoryScore.toFixed(3)),
        visualAttentionScore: Number(visualAttentionScore.toFixed(3)),
        episodicMemoryScore: Number(episodicMemoryScore.toFixed(3)),
        navigationScore,
    };
}
