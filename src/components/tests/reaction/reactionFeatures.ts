/**
 * Reaction Features
 * ML feature extraction for reaction test results.
 */

import type { RoundResult } from "./reactionLogic";
import type { ReactionAggregates } from "./reactionScoring";
import { calculateAggregates, countErrors } from "./reactionScoring";

export interface ReactionDerivedFeatures {
    stabilityIndex: number;
    fatigueSlope: number;
    attentionVariability: number;
    baselineDeviation: number;
    anomalyScore: number;
}

export interface ReactionTestResult {
    sessionId: string;
    timestamp: Date;
    rounds: RoundResult[];
    aggregates: ReactionAggregates;
    falseStartCount: number;
    missedStimulusCount: number;
    derivedFeatures?: ReactionDerivedFeatures;
}

/**
 * Extracts ML-ready features from reaction test result.
 * @param result - Current test result
 * @param baseline - User's baseline average reaction time (from previous sessions)
 */
export function extractReactionFeatures(
    result: ReactionTestResult,
    baseline?: number
): ReactionDerivedFeatures {
    const { aggregates, falseStartCount, missedStimulusCount, rounds } = result;

    // Stability index: inverse of coefficient of variation
    // Range: 0 (unstable) to 1 (perfectly stable)
    const cv = aggregates.avg > 0 ? Math.sqrt(aggregates.variance) / aggregates.avg : 0;
    const stabilityIndex = Math.max(0, Math.min(1, 1 - cv));

    // Fatigue slope: already calculated in aggregates
    const fatigueSlope = aggregates.fatigueSlope;

    // Attention variability: based on error counts and variance
    const errorRate = (falseStartCount + missedStimulusCount) / Math.max(1, rounds.length);
    const attentionVariability = errorRate + (cv / 2);

    // Baseline deviation: how much current avg differs from baseline
    const baselineDeviation = baseline && baseline > 0
        ? (aggregates.avg - baseline) / baseline
        : 0;

    // Anomaly score: composite of deviations
    // Higher = more anomalous
    let anomalyScore = 0;
    if (baselineDeviation > 0.2) anomalyScore += 0.3; // 20% slower than baseline
    if (fatigueSlope > 10) anomalyScore += 0.2; // Significant fatigue
    if (attentionVariability > 0.3) anomalyScore += 0.2; // High error/variance
    if (stabilityIndex < 0.5) anomalyScore += 0.3; // Inconsistent
    anomalyScore = Math.min(1, anomalyScore);

    return {
        stabilityIndex: Math.round(stabilityIndex * 100) / 100,
        fatigueSlope: Math.round(fatigueSlope * 100) / 100,
        attentionVariability: Math.round(attentionVariability * 100) / 100,
        baselineDeviation: Math.round(baselineDeviation * 100) / 100,
        anomalyScore: Math.round(anomalyScore * 100) / 100,
    };
}

/**
 * Creates a complete reaction test result from rounds.
 */
export function createReactionTestResult(
    rounds: RoundResult[],
    sessionId?: string
): ReactionTestResult {
    const aggregates = calculateAggregates(rounds);
    const { falseStartCount, missedStimulusCount } = countErrors(rounds);

    const result: ReactionTestResult = {
        sessionId: sessionId || `session-${Date.now()}`,
        timestamp: new Date(),
        rounds,
        aggregates,
        falseStartCount,
        missedStimulusCount,
    };

    // Add derived features
    result.derivedFeatures = extractReactionFeatures(result);

    return result;
}
