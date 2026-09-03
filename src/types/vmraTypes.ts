/**
 * Visual Memory Recall Assessment (VMRA) Types
 * 
 * Type definitions for the image-based visual memory assessment module.
 * Replaces word-based verbal memory test with culturally inclusive
 * Indian-context image stimuli and tap-based recall.
 */

// ─── Image Stimulus ───────────────────────────────────────────────

export type ImageCategory =
    | 'fruits'
    | 'kitchen'
    | 'transport'
    | 'animals'
    | 'household'
    | 'nature'
    | 'cultural'
    | 'tools';

export type Region = 'pan-india' | 'south' | 'north' | 'east' | 'west' | 'northeast';

export type SimilarityTier = 'low' | 'medium' | 'high';

export interface ImageStimulus {
    id: string;
    name: string;                // Internal name (not shown to user)
    category: ImageCategory;
    svgComponent: string;        // Key to inline SVG component
    region: Region;              // Cultural region familiarity
    similarTo: string[];         // IDs of visually similar images (for distractor pairing)
    similarityTier: SimilarityTier;
    difficultyWeight: number;    // 1-10, higher = harder to distinguish
}

export interface DistractorPair {
    targetId: string;
    distractorId: string;
    similarityTier: SimilarityTier;
}

// ─── Phase Management ─────────────────────────────────────────────

export type VmraPhase =
    | 'onboarding'
    | 'encoding'
    | 'retention'
    | 'recall'
    | 'delayed-recall'
    | 'scoring'
    | 'results';

// ─── Tap Events ───────────────────────────────────────────────────

export interface TapEvent {
    imageId: string;
    timestamp: number;           // Date.now() ms
    gridPosition: number;        // 0-indexed position in grid
    isDeselection: boolean;      // true if user tapped to remove selection
}

// ─── Session Configuration ────────────────────────────────────────

export interface VmraSessionConfig {
    targetCount: number;          // 5–8 images depending on difficulty
    distractorCount: number;      // Same as targetCount
    encodingTimePerImage: number; // ms per image (default 3000)
    fadeDuration: number;         // ms fade transition (default 1000)
    retentionDuration: number;    // ms for distractor task (default 15000)
    similarityLevel: SimilarityTier; // Distractor difficulty
    gridColumns: number;          // 3 or 4
    gridRows: number;             // 3 or 4
}

// ─── Raw Metrics (from direct measurement) ─────────────────────────

export interface VmraRawMetrics {
    // Stimulus data
    targetImages: string[];       // IDs of presented images (encoding order)
    distractorImages: string[];   // IDs of distractors in the grid
    gridLayout: string[];         // IDs in grid order (shuffled)

    // User responses
    selectedImages: string[];     // IDs user tapped (final selection)
    tapEvents: TapEvent[];        // Full tap log with timestamps

    // Basic counts
    correctHits: number;          // Targets correctly selected
    falsePositives: number;       // Distractors incorrectly selected
    misses: number;               // Targets not selected
    correctRejections: number;    // Distractors correctly NOT selected

    // Timing
    totalRecallDurationMs: number;
    encodingDurationMs: number;
    retentionDurationMs: number;

    // Interference task (not scored but recorded)
    interferenceCorrect: number;
    interferenceTotal: number;
}

// ─── Derived Features (computed biomarkers) ─────────────────────────

export interface VmraFeatures {
    // Accuracy metrics
    recallAccuracy: number;       // 0–1: correctHits / targetCount
    falsePositiveRate: number;    // 0–1: falsePositives / distractorCount
    precision: number;            // correctHits / (correctHits + falsePositives)
    f1Score: number;              // Harmonic mean of precision & recall
    netRecallScore: number;       // correctHits - falsePositives (penalized)

    // Temporal biomarkers
    meanSelectionLatencyMs: number;
    firstTapLatencyMs: number;
    meanInterTapIntervalMs: number;
    latencyVariance: number;      // SD of tap latencies

    // Serial position effects
    primacyBias: number;          // 0–1: recall rate of first 2 items
    recencyBias: number;          // 0–1: recall rate of last 2 items
    midListDeficit: number;       // 0–1: recall rate of middle items

    // Error analysis
    intrusionErrors: number;      // Distractors selected that aren't similar to any target
    confusionPairs: ConfusionPair[];

    // Spatial analysis
    spatialBias: SpatialBias;
    gridCoverage: number;         // 0–1: proportion of grid positions interacted with

    // Session quality flags
    possibleGuessing: boolean;
    possibleRandomTapping: boolean;
}

export interface ConfusionPair {
    targetId: string;
    selectedDistractorId: string;
    category: ImageCategory;
}

export interface SpatialBias {
    topHalf: number;              // proportion of taps in top half
    bottomHalf: number;
    leftHalf: number;
    rightHalf: number;
    dominant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'none';
}

// ─── Profile (composite scores) ──────────────────────────────────

export interface VmraProfile {
    accuracy: number;             // Weighted accuracy composite
    speed: number;                // Normalized latency score (lower = faster = better)
    consistency: number;          // Compared to previous sessions
    compositeScore: number;       // Overall 0–100 score
    starRating: 1 | 2 | 3 | 4 | 5;
}

// ─── Delayed Recall ───────────────────────────────────────────────

export interface DelayedRecallData {
    delayMinutes: number;         // Time gap between immediate and delayed
    delayedRawMetrics: VmraRawMetrics;
    delayedFeatures: VmraFeatures;
    delayedRecallRatio: number;   // delayedAccuracy / immediateAccuracy
    forgettingCurveSlope: number; // Rate of memory decay
}

// ─── Full Session Result ──────────────────────────────────────────

export interface VmraAssessmentResult {
    sessionId: string;
    timestamp: Date;
    config: VmraSessionConfig;
    rawMetrics: VmraRawMetrics;
    features: VmraFeatures;
    profile: VmraProfile;
    delayedRecall?: DelayedRecallData;
    explainability: {
        keyFactors: string[];
    };
}

// ─── Longitudinal Tracking ────────────────────────────────────────

export interface VmraDeclineSignal {
    type: 'accuracy-drop' | 'forgetting-steepening' | 'fp-spike' | 'strategy-shift' | 'delayed-collapse' | 'consistency-breakdown';
    severity: 'watch' | 'attention';
    description: string;
    value: number;
    threshold: number;
    detectedAt: Date;
}
