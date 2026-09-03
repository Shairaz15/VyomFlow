/**
 * 3D Navigation Assessment Types
 * Defines data structures for MapLibre 3D nodes, street edges, movement logs,
 * spatial landmark recall, session metadata, biomarkers, and assessment results.
 */

export type NavigationDifficulty = 1 | 2 | 3 | 4;

export interface MapNode {
    id: string;
    label: string;
    emoji: string;
    lat: number;
    lng: number;
    x: number; // Grid layout X
    y: number; // Grid layout Y
    isStart?: boolean;
    isDestination?: boolean;
    landmark?: string; // Fictional Landmark Name (e.g. "St. Jude Hospital", "Central Park")
    gridCol?: number;
    gridRow?: number;
}

export interface MapEdge {
    from: string;
    to: string;
    weight: number;
    direction: "north" | "south" | "east" | "west";
    streetName?: string; // Fictional street name (e.g. "Astra Way")
}

export interface MapGraph {
    id: string;
    name: string;
    difficulty: NavigationDifficulty;
    gridDimensions: { cols: number; rows: number };
    center: [number, number]; // [lng, lat] for MapLibre initial view
    nodes: MapNode[];
    edges: MapEdge[];
    optimalPath: string[]; // Node IDs in sequence from start to destination
    patternSequence: ("north" | "south" | "east" | "west")[];
    encodingTimeSeconds: number; // 15s, 12s, 10s, 8s
}

/**
 * Single source of truth record logged for every user movement decision.
 */
export interface MovementRecord {
    currentNode: string;
    previousNode: string | null;
    availableDirections: ("north" | "south" | "east" | "west")[];
    chosenDirection: "north" | "south" | "east" | "west";
    correctDirection: "north" | "south" | "east" | "west";
    decisionTimestamp: number;
    decisionLatency: number; // Time elapsed since last move in ms
    distanceTravelled: number; // Cumulative step count or distance
    backtrackStatus: boolean; // True if step reverses immediately to previous node
    hesitationFlag: boolean; // True if decision latency > 2500ms
    sessionTimestamp: number;
}

export interface SessionMetadata {
    browser: string;
    deviceType: "mobile" | "tablet" | "desktop";
    screenResolution: string;
    viewportSize: string;
    inputMethod: "touch" | "keyboard";
    fps: number;
    timestamp: number;
    durationMs: number;
}

export type LandmarkRecallQuestionType =
    | "sequential"
    | "spatial"
    | "exclusion"
    | "temporal"
    | "destination";

export interface LandmarkRecallQuestion {
    id: string;
    type: LandmarkRecallQuestionType;
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
    // Basic navigation accuracy & efficiency
    navigationAccuracy: number; // 0..1 (correct choices / total choices)
    pathEfficiency: number; // 0..1 (optimal path length / actual moves)
    wrongTurnCount: number;
    completionTimeMs: number;
    routeDeviation: number; // Extra steps beyond optimal path

    // Expanded decision latency analytics
    decisionLatencyMean: number; // Average latency per decision (ms)
    decisionLatencyMedian: number; // Median latency (ms)
    decisionLatencyMax: number; // Maximum single-move latency (ms)
    decisionLatencyVariance: number; // Latency variance (ms^2)

    // Strategy & behavior metrics
    hesitationCount: number; // Count of pauses > 2500ms
    backtrackCount: number; // Count of returning to previous node
    explorationRatio: number; // Visited unique nodes / Optimal path nodes count
    landmarkRecallAccuracy: number; // 0..1 accuracy on landmark quiz
    planningEfficiency: number; // 0..1 optimal vs chosen route cost
    routeConfidenceIndex: number; // Smoothness & velocity score 0..100
    navigationStrategy: "Direct Path" | "Trial & Error" | "Systematic Exploration" | "Hesitant Search";

    // Demographic-normalized scores (0..1)
    normalizedAccuracy: number;
    normalizedEfficiency: number;
    normalizedLatency: number;
    normalizedWrongTurns: number;
}

export interface NavigationAssessmentResult {
    id: string;
    sessionId: string;
    timestamp: Date;
    difficulty: NavigationDifficulty;
    mapId: string;
    moves: MovementRecord[];
    sessionMetadata: SessionMetadata;
    landmarkRecallResponses: LandmarkRecallResponse[];
    biomarkers: NavigationBiomarkers;
    navigationScore: number; // 0..100 composite score
    totalMoves: number;
    optimalMoves: number;
    completionTimeMs: number;
}
