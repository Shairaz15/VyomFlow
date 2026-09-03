/**
 * SAVT Scoring
 * Aggregate calculations and Signal Detection Theory metrics
 * for the Sustained Attention & Vigilance Test.
 */

import type { TrialEvent, SavtRawMetrics, SavtSessionConfig } from '../../../types/savtTypes';

// ─── Z-Score Lookup (for d-prime calculation) ─────────────────────

/**
 * Approximate inverse normal CDF (probit function).
 * Uses Abramowitz & Stegun rational approximation.
 */
function zScore(p: number): number {
    // Clamp to avoid infinity
    const clamped = Math.max(0.001, Math.min(0.999, p));

    if (clamped === 0.5) return 0;

    const a = clamped < 0.5 ? clamped : 1 - clamped;
    const t = Math.sqrt(-2 * Math.log(a));

    // Coefficients
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    const z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);

    return clamped < 0.5 ? -z : z;
}

// ─── Core Calculations ────────────────────────────────────────────

/**
 * Calculates hit rate with log-linear correction.
 * Avoids 0 and 1 rates which break d-prime.
 */
export function calculateHitRate(hits: number, totalGo: number): number {
    if (totalGo === 0) return 0;
    // Log-linear correction: (hits + 0.5) / (totalGo + 1)
    return (hits + 0.5) / (totalGo + 1);
}

/**
 * Calculates false alarm rate with log-linear correction.
 */
export function calculateFalseAlarmRate(falseAlarms: number, totalNogo: number): number {
    if (totalNogo === 0) return 0;
    return (falseAlarms + 0.5) / (totalNogo + 1);
}

/**
 * Calculates d-prime (sensitivity index).
 * d' = z(hit rate) - z(false alarm rate)
 * Higher d' = better ability to distinguish go from nogo.
 */
export function calculateDPrime(hitRate: number, falseAlarmRate: number): number {
    return zScore(hitRate) - zScore(falseAlarmRate);
}

/**
 * Calculates response bias (criterion β).
 * β > 1 = conservative (tends to withhold), β < 1 = liberal (tends to respond)
 */
export function calculateResponseBias(hitRate: number, falseAlarmRate: number): number {
    const zH = zScore(hitRate);
    const zF = zScore(falseAlarmRate);
    return Math.exp(-0.5 * (zH * zH - zF * zF));
}

/**
 * Calculates vigilance decrement: slope of hit rates across blocks.
 * Negative slope = declining attention.
 */
export function calculateVigilanceDecrement(blockHitRates: number[]): number {
    if (blockHitRates.length < 2) return 0;

    const n = blockHitRates.length;
    const indices = blockHitRates.map((_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = blockHitRates.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * blockHitRates[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
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
 * Calculates variance (sample).
 */
function calculateVariance(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
}

// ─── Aggregate Builder ────────────────────────────────────────────

/**
 * Builds raw metrics from trial events.
 */
export function buildRawMetrics(
    trials: TrialEvent[],
    config: SavtSessionConfig,
    totalDurationMs: number
): SavtRawMetrics {
    let hits = 0;
    let misses = 0;
    let falseAlarms = 0;
    let correctRejections = 0;
    let totalGo = 0;
    let totalNogo = 0;
    const responseTimes: number[] = [];

    // Per-block tracking
    const blockHits: number[] = new Array(config.blocksCount).fill(0);
    const blockGoTrials: number[] = new Array(config.blocksCount).fill(0);
    const blockFAs: number[] = new Array(config.blocksCount).fill(0);
    const blockNogoTrials: number[] = new Array(config.blocksCount).fill(0);
    const blockRtSums: number[] = new Array(config.blocksCount).fill(0);
    const blockRtCounts: number[] = new Array(config.blocksCount).fill(0);

    for (const trial of trials) {
        const block = trial.blockIndex;

        if (trial.stimulus.type === 'go') {
            totalGo++;
            blockGoTrials[block]++;
        } else {
            totalNogo++;
            blockNogoTrials[block]++;
        }

        switch (trial.outcome) {
            case 'hit':
                hits++;
                blockHits[block]++;
                if (trial.reactionTimeMs !== null) {
                    responseTimes.push(trial.reactionTimeMs);
                    blockRtSums[block] += trial.reactionTimeMs;
                    blockRtCounts[block]++;
                }
                break;
            case 'miss':
                misses++;
                break;
            case 'false_alarm':
                falseAlarms++;
                blockFAs[block]++;
                if (trial.reactionTimeMs !== null) {
                    responseTimes.push(trial.reactionTimeMs);
                }
                break;
            case 'correct_rejection':
                correctRejections++;
                break;
        }
    }

    // Calculate per-block rates
    const blockHitRates = blockGoTrials.map((g, i) =>
        g > 0 ? blockHits[i] / g : 0
    );
    const blockFalseAlarmRates = blockNogoTrials.map((n, i) =>
        n > 0 ? blockFAs[i] / n : 0
    );
    const blockMeanRtMs = blockRtCounts.map((c, i) =>
        c > 0 ? Math.round(blockRtSums[i] / c) : 0
    );

    return {
        hits,
        misses,
        falseAlarms,
        correctRejections,
        totalGoTrials: totalGo,
        totalNogoTrials: totalNogo,
        responseTimesMs: responseTimes,
        totalTestDurationMs: totalDurationMs,
        blockHitRates,
        blockFalseAlarmRates,
        blockMeanRtMs,
    };
}

/**
 * Calculates aggregate response time statistics.
 */
export function calculateRtAggregates(responseTimes: number[]): {
    mean: number;
    median: number;
    variance: number;
    sd: number;
    cv: number;
} {
    if (responseTimes.length === 0) {
        return { mean: 0, median: 0, variance: 0, sd: 0, cv: 0 };
    }

    const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = calculateMedian(responseTimes);
    const variance = calculateVariance(responseTimes, mean);
    const sd = Math.sqrt(variance);
    const cv = mean > 0 ? sd / mean : 0;

    return {
        mean: Math.round(mean),
        median: Math.round(median),
        variance: Math.round(variance),
        sd: Math.round(sd * 100) / 100,
        cv: Math.round(cv * 100) / 100,
    };
}
