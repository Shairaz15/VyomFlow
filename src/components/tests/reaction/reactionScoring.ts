/**
 * Reaction Scoring
 * Aggregate calculations for reaction test results.
 */

import type { RoundResult } from "./reactionLogic";

export interface ReactionAggregates {
    avg: number;
    median: number;
    variance: number;
    min: number;
    max: number;
    consistencyScore: number;
    fatigueSlope: number;
}

/**
 * Filters out calibration rounds and invalid results.
 */
function getScoredTimes(rounds: RoundResult[]): number[] {
    return rounds
        .filter((r) => !r.isCalibration && !r.isFalseStart && !r.isTimeout && r.reactionTime !== null)
        .map((r) => r.reactionTime as number);
}

/**
 * Calculates the median of an array.
 */
function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates variance.
 */
function calculateVariance(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
}

/**
 * Calculates fatigue slope (linear regression).
 * Positive slope = slowing down over time.
 */
function calculateFatigueSlope(times: number[]): number {
    if (times.length < 2) return 0;

    const n = times.length;
    const indices = times.map((_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = times.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * times[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Calculates all aggregate metrics from round results.
 */
export function calculateAggregates(rounds: RoundResult[]): ReactionAggregates {
    const times = getScoredTimes(rounds);

    if (times.length === 0) {
        return {
            avg: 0,
            median: 0,
            variance: 0,
            min: 0,
            max: 0,
            consistencyScore: 0,
            fatigueSlope: 0,
        };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const median = calculateMedian(times);
    const variance = calculateVariance(times, avg);
    const min = Math.min(...times);
    const max = Math.max(...times);

    // Consistency score: 1 - (coefficient of variation)
    // Higher = more consistent
    const coefficientOfVariation = avg > 0 ? Math.sqrt(variance) / avg : 0;
    const consistencyScore = Math.max(0, 1 - coefficientOfVariation);

    const fatigueSlope = calculateFatigueSlope(times);

    return {
        avg: Math.round(avg),
        median: Math.round(median),
        variance: Math.round(variance),
        min: Math.round(min),
        max: Math.round(max),
        consistencyScore: Math.round(consistencyScore * 100) / 100,
        fatigueSlope: Math.round(fatigueSlope * 100) / 100,
    };
}

/**
 * Counts false starts and timeouts.
 */
export function countErrors(rounds: RoundResult[]): {
    falseStartCount: number;
    missedStimulusCount: number;
} {
    const scoredRounds = rounds.filter((r) => !r.isCalibration);
    return {
        falseStartCount: scoredRounds.filter((r) => r.isFalseStart).length,
        missedStimulusCount: scoredRounds.filter((r) => r.isTimeout).length,
    };
}
