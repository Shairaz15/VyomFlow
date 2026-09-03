/**
 * Navigation Assessment Types
 * Defines data structures for nodes, edges, map graphs, move tracking,
 * landmark recall quiz, biomarkers, and final results.
 */

export interface MapNode {
    id: string;
    label: string;
    emoji: string;
    x: number; // Grid coordinate X (0..100 or SVG space)
    y: number; // Grid coordinate Y (0..100 or SVG space)
    isStart?: boolean;
    isDestination?: boolean;
    landmark?: string;
}

export interface MapEdge {
    from: string;
    to: string;
    weight: number;
    direction: "north" | "south" | "east" | "west";
}

export interface MapGraph {
    id: string;
    name: string;
    difficulty: NavigationDifficulty;
    nodes: MapNode[];
    edges: MapEdge[];
    optimalPath: string[]; // Node IDs in sequence from start to destination
    encodingTimeSeconds: number; // 15, 12, 10, or 8 seconds
}

export type NavigationDifficulty = 1 | 2 | 3 | 4;

export interface MoveRecord {
    timestamp: number;
    fromNode: string;
    toNode: string;
    direction: "north" | "south" | "east" | "west";
    decisionTimeMs: number;
    isCorrectMove: boolean;
    isBacktrack: boolean;
}

export interface LandmarkRecallQuestion {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
}

export interface LandmarkRecallResponse {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    responseTimeMs: number;
}

export interface NavigationBiomarkers {
    navigationAccuracy: number; // 0..1 (correct choices / total choices)
    pathEfficiency: number; // 0..1 (optimal distance / actual distance)
    wrongTurnCount: number; // number of wrong turns
    completionTimeMs: number; // total navigation time
    routeDeviation: number; // extra nodes visited beyond optimal
    decisionLatencyMs: number; // average decision time per node (ms)
    hesitationCount: number; // pauses > 2000ms
    backtrackCount: number; // count of returning to immediate previous node
    landmarkRecallAccuracy: number; // 0..1 from 3 recall questions
    planningEfficiency: number; // 0..1 (for Level 4 multiple routes, optimal vs chosen)
}

export interface NavigationAssessmentResult {
    id: string;
    sessionId: string;
    timestamp: Date;
    difficulty: NavigationDifficulty;
    mapId: string;
    moves: MoveRecord[];
    landmarkRecallResponses: LandmarkRecallResponse[];
    biomarkers: NavigationBiomarkers;
    navigationScore: number; // 0..100
    totalMoves: number;
    optimalMoves: number;
    completionTimeMs: number;
}
