/**
 * Real-World PoV Video Navigation & Spatial Memory Assessment Types
 * Defines data structures for route segments, intersection responses,
 * destination recall, landmark chronology, digital biomarkers, and assessment results.
 */

/** Direction choices available at intersections */
export type NavigationDirection = 'left' | 'right' | 'straight' | 'back';

/** Waypoint labels on the route */
export type Waypoint = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/** A single route segment between two adjacent waypoints / intersections */
export interface RouteSegment {
    segmentId: string;              // e.g. "seg_01"
    approachVideoUrl: string;       // e.g. "/videos/navigation/inter-1.mp4"
    continuationVideoUrl: string;   // e.g. "/videos/navigation/af-1.mp4"
    videoUrl?: string;              // optional legacy fallback
    fromWaypoint: string;           // e.g. "Point B"
    toWaypoint: string;             // e.g. "Intersection 1"
    intersectionLabel: string;      // e.g. "Intersection 1: Campus Plaza Junction"
    correctDirection: NavigationDirection;
}

/** A landmark used in the chronology task */
export interface LandmarkItem {
    id: string;
    name: string;
    imageUrl: string;
    isReal: boolean;             // true = on the route, false = distractor
    chronologicalOrder: number;  // 1-N for real landmarks in sequence, -1 for distractors
}

/** Full route configuration */
export interface RouteConfig {
    routeId: string;
    routeName: string;
    description: string;
    encodingVideoUrl: string;    // Full A→B route video
    startVideoUrl?: string;      // Optional departure video starting from B
    destination: {
        question: string;
        options: string[];
        correctIndex: number;
    };
    segments: RouteSegment[];    // 8 intersection segments for B→A
    landmarks: LandmarkItem[];   // 21 landmarks (real + distractors)
}

/** Logged response for one intersection decision */
export interface IntersectionResponse {
    segmentId: string;
    chosenDirection: NavigationDirection;
    correctDirection: NavigationDirection;
    isCorrect: boolean;
    decisionLatencyMs: number;
    timestamp: number;
}

/** Result of the destination MCQ */
export interface DestinationAnswer {
    selectedIndex: number;
    isCorrect: boolean;
    responseTimeMs: number;
}

/** Result of the landmark ordering task */
export interface LandmarkOrderingResult {
    selectedLandmarkIds: string[];
    orderedLandmarkIds: string[];
    correctOrderIds: string[];
    recognitionAccuracy: number;   // 0-1
    sequenceAccuracy: number;      // 0-1
    falseLandmarkCount: number;
}

/** All 17+ digital biomarkers */
export interface NavigationBiomarkers {
    // Route Memory
    destinationRecallAccuracy: number;  // 0 or 1
    navigationAccuracy: number;         // 0-1 (out of 6 intersections)
    wrongTurnCount: number;             // out of 6
    correctDecisionRate: number;        // 0-1

    // Executive Function
    averageDecisionLatencyMs: number;
    maxDecisionLatencyMs: number;
    decisionLatencyVariance: number;
    hesitationCount: number;            // decisions > 2× average latency

    // Spatial Memory
    landmarkRecognitionAccuracy: number; // 0-1
    falseLandmarkRate: number;           // 0-1
    landmarkSequenceAccuracy: number;    // 0-1
    chronologicalRecallScore: number;    // 0-1

    // Composite Scores
    routeMemoryScore: number;            // 0-1
    visualAttentionScore: number;        // 0-1
    episodicMemoryScore: number;         // 0-1

    // Final
    navigationScore: number;             // 0-100
}

/** Full assessment result — this is what gets saved to Firestore */
export interface ImmersiveNavigationResult {
    id: string;
    sessionId: string;
    routeId: string;
    timestamp: Date;
    destinationAnswer: DestinationAnswer;
    intersectionResponses: IntersectionResponse[];  // 6 responses
    landmarkOrdering: LandmarkOrderingResult;
    biomarkers: NavigationBiomarkers;
    navigationScore: number;  // 0-100
}
