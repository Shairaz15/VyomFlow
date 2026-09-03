/**
 * VMRA Scoring Engine
 * 
 * Computes 15+ cognitive biomarkers from raw tap data.
 * Includes: accuracy metrics, temporal biomarkers, serial position effects,
 * error analysis, spatial bias, and session quality flags.
 */

import type {
    VmraRawMetrics,
    VmraFeatures,
    VmraProfile,
    TapEvent,
    ConfusionPair,
    SpatialBias,
    VmraAssessmentResult,
    VmraSessionConfig,
} from '../types/vmraTypes';
import { IMAGE_CATALOG } from '../data/vmraImageCatalog';

// ─── Accuracy Metrics ─────────────────────────────────────────────

export function calcRecallAccuracy(correctHits: number, totalTargets: number): number {
    if (totalTargets === 0) return 0;
    return correctHits / totalTargets;
}

export function calcFalsePositiveRate(falsePositives: number, totalDistractors: number): number {
    if (totalDistractors === 0) return 0;
    return falsePositives / totalDistractors;
}

export function calcPrecision(correctHits: number, falsePositives: number): number {
    const total = correctHits + falsePositives;
    if (total === 0) return 0;
    return correctHits / total;
}

export function calcF1Score(precision: number, recall: number): number {
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
}

export function calcNetRecallScore(correctHits: number, falsePositives: number): number {
    return Math.max(0, correctHits - falsePositives);
}

// ─── Temporal Biomarkers ──────────────────────────────────────────

export function calcSelectionLatencies(tapEvents: TapEvent[], recallStartTime: number) {
    // Only consider selections (not deselections)
    const selections = tapEvents.filter(e => !e.isDeselection);

    if (selections.length === 0) {
        return {
            meanSelectionLatencyMs: 0,
            firstTapLatencyMs: 0,
            meanInterTapIntervalMs: 0,
            latencyVariance: 0,
        };
    }

    // Latencies from recall start
    const latencies = selections.map(e => e.timestamp - recallStartTime);

    // First tap latency
    const firstTapLatencyMs = latencies[0] || 0;

    // Mean latency
    const meanSelectionLatencyMs = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;

    // Inter-tap intervals
    let meanInterTapIntervalMs = 0;
    if (latencies.length > 1) {
        const intervals: number[] = [];
        for (let i = 1; i < latencies.length; i++) {
            intervals.push(latencies[i] - latencies[i - 1]);
        }
        meanInterTapIntervalMs = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
    }

    // Latency variance (standard deviation)
    const mean = meanSelectionLatencyMs;
    const variance = latencies.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / latencies.length;
    const latencyVariance = Math.sqrt(variance);

    return {
        meanSelectionLatencyMs,
        firstTapLatencyMs,
        meanInterTapIntervalMs,
        latencyVariance,
    };
}

// ─── Serial Position Effects ──────────────────────────────────────

export function calcSerialPositionEffects(
    encodingOrder: string[],
    selectedIds: string[]
) {
    const selectedSet = new Set(selectedIds);
    const total = encodingOrder.length;

    if (total < 4) {
        return { primacyBias: 0, recencyBias: 0, midListDeficit: 0 };
    }

    // First 2 items = primacy zone
    const primacyItems = encodingOrder.slice(0, 2);
    const primacyHits = primacyItems.filter(id => selectedSet.has(id)).length;
    const primacyBias = primacyHits / primacyItems.length;

    // Last 2 items = recency zone
    const recencyItems = encodingOrder.slice(-2);
    const recencyHits = recencyItems.filter(id => selectedSet.has(id)).length;
    const recencyBias = recencyHits / recencyItems.length;

    // Middle items
    const midItems = encodingOrder.slice(2, -2);
    const midHits = midItems.length > 0
        ? midItems.filter(id => selectedSet.has(id)).length / midItems.length
        : 0;
    const midListDeficit = 1 - midHits; // Higher = worse mid recall

    return { primacyBias, recencyBias, midListDeficit };
}

// ─── Error Analysis ───────────────────────────────────────────────

export function calcConfusionPairs(
    targetIds: string[],
    _distractorIds: string[],
    selectedIds: string[]
): ConfusionPair[] {
    const pairs: ConfusionPair[] = [];
    const targetSet = new Set(targetIds);

    // Build a lookup for which targets each distractor is similar to
    const catalogMap = new Map(IMAGE_CATALOG.map(img => [img.id, img]));

    for (const selectedId of selectedIds) {
        if (targetSet.has(selectedId)) continue; // correct hit, skip

        const distractor = catalogMap.get(selectedId);
        if (!distractor) continue;

        // Find which target this distractor is similar to
        const confusedWith = targetIds.find(tid => distractor.similarTo.includes(tid));

        if (confusedWith) {
            pairs.push({
                targetId: confusedWith,
                selectedDistractorId: selectedId,
                category: distractor.category,
            });
        }
    }

    return pairs;
}

export function calcIntrusionErrors(
    targetIds: string[],
    selectedIds: string[]
): number {
    const targetSet = new Set(targetIds);
    const catalogMap = new Map(IMAGE_CATALOG.map(img => [img.id, img]));

    let intrusions = 0;
    for (const selectedId of selectedIds) {
        if (targetSet.has(selectedId)) continue;

        const distractor = catalogMap.get(selectedId);
        if (!distractor) { intrusions++; continue; }

        // Check if it's similar to ANY target
        const isSimilarToTarget = targetIds.some(tid => distractor.similarTo.includes(tid));
        if (!isSimilarToTarget) {
            intrusions++; // Not similar to any target = intrusion error
        }
    }

    return intrusions;
}

// ─── Spatial Bias Analysis ────────────────────────────────────────

export function calcSpatialBias(
    tapEvents: TapEvent[],
    gridColumns: number,
    gridRows: number
): SpatialBias {
    const selections = tapEvents.filter(e => !e.isDeselection);

    if (selections.length === 0) {
        return { topHalf: 0, bottomHalf: 0, leftHalf: 0, rightHalf: 0, dominant: 'none' };
    }

    const halfRow = gridRows / 2;
    const halfCol = gridColumns / 2;

    let top = 0, bottom = 0, left = 0, right = 0;

    for (const tap of selections) {
        const row = Math.floor(tap.gridPosition / gridColumns);
        const col = tap.gridPosition % gridColumns;

        if (row < halfRow) top++; else bottom++;
        if (col < halfCol) left++; else right++;
    }

    const total = selections.length;
    const topHalf = top / total;
    const bottomHalf = bottom / total;
    const leftHalf = left / total;
    const rightHalf = right / total;

    // Determine dominant quadrant
    const quadrants = {
        'top-left': topHalf * leftHalf,
        'top-right': topHalf * rightHalf,
        'bottom-left': bottomHalf * leftHalf,
        'bottom-right': bottomHalf * rightHalf,
        'center': 0,
    };

    // If no strong bias (all < 0.65), mark as 'none'
    const maxBias = Math.max(topHalf, bottomHalf, leftHalf, rightHalf);
    let dominant: SpatialBias['dominant'] = 'none';

    if (maxBias > 0.65) {
        const entries = Object.entries(quadrants) as [SpatialBias['dominant'], number][];
        dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    return { topHalf, bottomHalf, leftHalf, rightHalf, dominant };
}

export function calcGridCoverage(
    tapEvents: TapEvent[],
    totalGridCells: number
): number {
    const interactedPositions = new Set(tapEvents.map(e => e.gridPosition));
    return interactedPositions.size / totalGridCells;
}

// ─── Session Quality Flags ────────────────────────────────────────

export function detectGuessing(
    selectedCount: number,
    totalGridCells: number,
    meanLatencyMs: number
): { possibleGuessing: boolean; possibleRandomTapping: boolean } {
    // Flag if > 80% of grid selected
    const possibleGuessing = selectedCount / totalGridCells > 0.8;

    // Flag if mean latency < 300ms (impossibly fast)
    const possibleRandomTapping = meanLatencyMs > 0 && meanLatencyMs < 300;

    return { possibleGuessing, possibleRandomTapping };
}

// ─── Star Rating ──────────────────────────────────────────────────

export function calcStarRating(accuracy: number): 1 | 2 | 3 | 4 | 5 {
    if (accuracy >= 0.9) return 5;
    if (accuracy >= 0.75) return 4;
    if (accuracy >= 0.6) return 3;
    if (accuracy >= 0.4) return 2;
    return 1;
}

// ─── Composite Profile ────────────────────────────────────────────

export function calcProfile(
    features: VmraFeatures,
    _previousAccuracies: number[] = []
): VmraProfile {
    // Accuracy component (0-1 scale, weight: 50%)
    const accuracy = features.recallAccuracy;

    // Speed component (normalized, 0-1, lower latency = higher score)
    // Typical mean latency range: 500ms (fast) to 5000ms (slow)
    const normalizedLatency = Math.max(0, Math.min(1,
        1 - (features.meanSelectionLatencyMs - 500) / 4500
    ));

    // Consistency (compared to previous sessions)
    // If no previous data, assume perfect consistency
    let consistency = 1;
    if (_previousAccuracies.length > 0) {
        const prevMean = _previousAccuracies.reduce((s, v) => s + v, 0) / _previousAccuracies.length;
        const deviation = Math.abs(accuracy - prevMean);
        consistency = Math.max(0, 1 - deviation * 2); // Penalize large deviations
    }

    // Composite: weighted average
    const compositeScore = Math.round(
        (accuracy * 0.5 + normalizedLatency * 0.25 + consistency * 0.25) * 100
    );

    return {
        accuracy,
        speed: normalizedLatency,
        consistency,
        compositeScore: Math.max(0, Math.min(100, compositeScore)),
        starRating: calcStarRating(accuracy),
    };
}

// ─── Full Feature Extraction ──────────────────────────────────────

export function extractVmraFeatures(
    rawMetrics: VmraRawMetrics,
    recallStartTime: number,
    gridColumns: number,
    gridRows: number
): VmraFeatures {
    const totalTargets = rawMetrics.targetImages.length;
    const totalDistractors = rawMetrics.distractorImages.length;

    // Accuracy
    const recallAccuracy = calcRecallAccuracy(rawMetrics.correctHits, totalTargets);
    const falsePositiveRate = calcFalsePositiveRate(rawMetrics.falsePositives, totalDistractors);
    const precision = calcPrecision(rawMetrics.correctHits, rawMetrics.falsePositives);
    const f1Score = calcF1Score(precision, recallAccuracy);
    const netRecallScore = calcNetRecallScore(rawMetrics.correctHits, rawMetrics.falsePositives);

    // Temporal
    const latencies = calcSelectionLatencies(rawMetrics.tapEvents, recallStartTime);

    // Serial position
    const serialPosition = calcSerialPositionEffects(
        rawMetrics.targetImages,
        rawMetrics.selectedImages
    );

    // Error analysis
    const confusionPairs = calcConfusionPairs(
        rawMetrics.targetImages,
        rawMetrics.distractorImages,
        rawMetrics.selectedImages
    );
    const intrusionErrors = calcIntrusionErrors(
        rawMetrics.targetImages,
        rawMetrics.selectedImages
    );

    // Spatial
    const spatialBias = calcSpatialBias(rawMetrics.tapEvents, gridColumns, gridRows);
    const gridCoverage = calcGridCoverage(
        rawMetrics.tapEvents,
        gridColumns * gridRows
    );

    // Quality flags
    const qualityFlags = detectGuessing(
        rawMetrics.selectedImages.length,
        gridColumns * gridRows,
        latencies.meanSelectionLatencyMs
    );

    return {
        recallAccuracy,
        falsePositiveRate,
        precision,
        f1Score,
        netRecallScore,
        meanSelectionLatencyMs: latencies.meanSelectionLatencyMs,
        firstTapLatencyMs: latencies.firstTapLatencyMs,
        meanInterTapIntervalMs: latencies.meanInterTapIntervalMs,
        latencyVariance: latencies.latencyVariance,
        primacyBias: serialPosition.primacyBias,
        recencyBias: serialPosition.recencyBias,
        midListDeficit: serialPosition.midListDeficit,
        intrusionErrors,
        confusionPairs,
        spatialBias,
        gridCoverage,
        possibleGuessing: qualityFlags.possibleGuessing,
        possibleRandomTapping: qualityFlags.possibleRandomTapping,
    };
}

// ─── Key Factors (Explainability) ─────────────────────────────────

export function identifyVmraKeyFactors(features: VmraFeatures): string[] {
    const factors: string[] = [];

    if (features.recallAccuracy >= 0.85) {
        factors.push('Excellent visual recall performance');
    } else if (features.recallAccuracy < 0.5) {
        factors.push('Visual recall was below typical range');
    }

    if (features.falsePositiveRate > 0.3) {
        factors.push('Higher-than-typical distractor selections may indicate less confident recall');
    }

    if (features.primacyBias > 0.8 && features.midListDeficit > 0.6) {
        factors.push('Stronger recall for images shown first — a common pattern');
    }

    if (features.recencyBias > 0.8 && features.midListDeficit > 0.6) {
        factors.push('Stronger recall for images shown last — a recency effect');
    }

    if (features.midListDeficit > 0.7) {
        factors.push('Images shown in the middle were harder to recall — this is typical');
    }

    if (features.firstTapLatencyMs > 5000) {
        factors.push('Took extra time before starting selections — may indicate careful deliberation');
    }

    if (features.intrusionErrors > 1) {
        factors.push('Some selections were unrelated to target images');
    }

    if (features.spatialBias.dominant !== 'none') {
        factors.push(`Selections tended toward the ${features.spatialBias.dominant} area of the grid`);
    }

    if (features.possibleGuessing) {
        factors.push('Selection pattern suggests possible guessing — this session may be less reliable');
    }

    if (features.possibleRandomTapping) {
        factors.push('Very fast tap speed detected — ensure comfortable interaction speed');
    }

    if (factors.length === 0) {
        factors.push('Performance within typical range for this assessment');
    }

    return factors;
}

// ─── Build Full Session Result ────────────────────────────────────

export function buildSessionResult(
    rawMetrics: VmraRawMetrics,
    config: VmraSessionConfig,
    recallStartTime: number,
    previousAccuracies: number[] = []
): VmraAssessmentResult {
    const features = extractVmraFeatures(
        rawMetrics,
        recallStartTime,
        config.gridColumns,
        config.gridRows
    );

    const profile = calcProfile(features, previousAccuracies);
    const keyFactors = identifyVmraKeyFactors(features);

    return {
        sessionId: `vmra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date(),
        config,
        rawMetrics,
        features,
        profile,
        explainability: { keyFactors },
    };
}
