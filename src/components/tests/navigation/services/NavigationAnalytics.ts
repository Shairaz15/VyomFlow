import type {
    MapGraph,
    MoveRecord,
    LandmarkRecallResponse,
    NavigationBiomarkers,
} from "../../../../types/navigationTypes";
import { comparePaths } from "../utils/graphAlgorithms";

export function extractNavigationBiomarkers(
    map: MapGraph,
    moves: MoveRecord[],
    landmarkRecallResponses: LandmarkRecallResponse[],
    completionTimeMs: number
): NavigationBiomarkers {
    const totalMoves = moves.length;
    const correctMovesCount = moves.filter((m) => m.isCorrectMove).length;
    const navigationAccuracy = totalMoves > 0 ? correctMovesCount / totalMoves : 1;

    // Actual path taken (sequence of node IDs starting with start node)
    const actualNodeSequence: string[] = [];
    if (moves.length > 0) {
        actualNodeSequence.push(moves[0].fromNode);
        for (const m of moves) {
            actualNodeSequence.push(m.toNode);
        }
    } else {
        actualNodeSequence.push(...map.optimalPath);
    }

    const pathComparison = comparePaths(map.optimalPath, actualNodeSequence);
    const pathEfficiency = pathComparison.pathEfficiency;
    const routeDeviation = pathComparison.extraSteps;

    const wrongTurnCount = moves.filter((m) => !m.isCorrectMove).length;

    const totalDecisionLatency = moves.reduce((sum, m) => sum + m.decisionTimeMs, 0);
    const decisionLatencyMs = totalMoves > 0 ? Math.round(totalDecisionLatency / totalMoves) : 0;

    const hesitationCount = moves.filter((m) => m.decisionTimeMs > 2000).length;
    const backtrackCount = moves.filter((m) => m.isBacktrack).length;

    const correctLandmarkResponses = landmarkRecallResponses.filter((r) => r.isCorrect).length;
    const landmarkRecallAccuracy =
        landmarkRecallResponses.length > 0
            ? correctLandmarkResponses / landmarkRecallResponses.length
            : 1;

    // Planning Efficiency (Level 4: ratio of optimal path length to chosen path length)
    const optimalEdgeCount = Math.max(1, map.optimalPath.length - 1);
    const actualEdgeCount = Math.max(1, moves.length);
    const planningEfficiency = Math.min(1, optimalEdgeCount / actualEdgeCount);

    return {
        navigationAccuracy,
        pathEfficiency,
        wrongTurnCount,
        completionTimeMs,
        routeDeviation,
        decisionLatencyMs,
        hesitationCount,
        backtrackCount,
        landmarkRecallAccuracy,
        planningEfficiency,
    };
}
