/**
 * SAVT Features
 * ML feature extraction and result assembly for the
 * Sustained Attention & Vigilance Test.
 */

import type {
    TrialEvent,
    SavtFeatures,
    SavtProfile,
    SavtAssessmentResult,
    SavtSessionConfig,
} from '../../../types/savtTypes';
import {
    buildRawMetrics,
    calculateHitRate,
    calculateFalseAlarmRate,
    calculateDPrime,
    calculateResponseBias,
    calculateVigilanceDecrement,
    calculateRtAggregates,
} from './savtScoring';

// ─── Feature Extraction ──────────────────────────────────────────

/**
 * Extracts ML-ready derived features from trial data.
 */
export function extractSavtFeatures(
    trials: TrialEvent[],
    config: SavtSessionConfig,
    totalDurationMs: number
): { features: SavtFeatures; rawMetrics: ReturnType<typeof buildRawMetrics> } {
    const rawMetrics = buildRawMetrics(trials, config, totalDurationMs);

    const hitRate = calculateHitRate(rawMetrics.hits, rawMetrics.totalGoTrials);
    const falseAlarmRate = calculateFalseAlarmRate(rawMetrics.falseAlarms, rawMetrics.totalNogoTrials);
    const dPrime = calculateDPrime(hitRate, falseAlarmRate);
    const responseBias = calculateResponseBias(hitRate, falseAlarmRate);
    const vigilanceDecrement = calculateVigilanceDecrement(rawMetrics.blockHitRates);

    const rtStats = calculateRtAggregates(rawMetrics.responseTimesMs);

    // Commission error rate (impulsivity): falseAlarms / totalNogo
    const commissionErrorRate = rawMetrics.totalNogoTrials > 0
        ? rawMetrics.falseAlarms / rawMetrics.totalNogoTrials
        : 0;

    // Omission error rate (inattention): misses / totalGo
    const omissionErrorRate = rawMetrics.totalGoTrials > 0
        ? rawMetrics.misses / rawMetrics.totalGoTrials
        : 0;

    // Vigilance stability: 1 - variance of block hit rates
    const blockRateVariance = rawMetrics.blockHitRates.length > 1
        ? calculateArrayVariance(rawMetrics.blockHitRates)
        : 0;
    const vigilanceStability = Math.max(0, Math.min(1, 1 - blockRateVariance * 4));

    const features: SavtFeatures = {
        hitRate: round(hitRate),
        falseAlarmRate: round(falseAlarmRate),
        dPrime: round(dPrime),
        responseBias: round(responseBias),
        commissionErrorRate: round(commissionErrorRate),
        omissionErrorRate: round(omissionErrorRate),
        meanResponseTimeMs: rtStats.mean,
        medianResponseTimeMs: rtStats.median,
        rtVariability: rtStats.sd,
        rtCoefficientOfVariation: rtStats.cv,
        vigilanceDecrement: round(vigilanceDecrement),
        vigilanceStability: round(vigilanceStability),
        possibleGuessing: Math.abs(dPrime) < 0.5,
        possibleInattention: omissionErrorRate > 0.5,
    };

    return { features, rawMetrics };
}

// ─── Profile Generation ──────────────────────────────────────────

/**
 * Generates composite profile scores from features.
 */
export function generateSavtProfile(features: SavtFeatures): SavtProfile {
    // Attention score: based on hit rate and omission errors
    // Higher hit rate + lower omissions = better attention
    const attention = Math.round(
        ((1 - features.omissionErrorRate) * 0.6 + features.hitRate * 0.4) * 100
    );

    // Inhibition score: based on false alarm rate and commission errors
    // Lower FA rate + lower commissions = better inhibition
    const inhibition = Math.round(
        ((1 - features.commissionErrorRate) * 0.6 + (1 - features.falseAlarmRate) * 0.4) * 100
    );

    // Vigilance score: based on vigilance stability and decrement
    // Less decrement + more stability = better sustained attention
    const decrementPenalty = Math.max(0, -features.vigilanceDecrement * 200); // Penalize negative slopes
    const vigilance = Math.round(
        Math.max(0, Math.min(100, features.vigilanceStability * 100 - decrementPenalty))
    );

    // Composite: weighted average
    const compositeScore = Math.round(
        attention * 0.35 + inhibition * 0.35 + vigilance * 0.30
    );

    // Star rating
    let starRating: 1 | 2 | 3 | 4 | 5;
    if (compositeScore >= 90) starRating = 5;
    else if (compositeScore >= 75) starRating = 4;
    else if (compositeScore >= 55) starRating = 3;
    else if (compositeScore >= 35) starRating = 2;
    else starRating = 1;

    return {
        attention: clamp(attention),
        inhibition: clamp(inhibition),
        vigilance: clamp(vigilance),
        compositeScore: clamp(compositeScore),
        starRating,
    };
}

// ─── Explainability ──────────────────────────────────────────────

/**
 * Generates human-readable key factors.
 */
function generateKeyFactors(features: SavtFeatures): string[] {
    const factors: string[] = [];

    // d-prime interpretation
    if (features.dPrime >= 3.0) {
        factors.push('Excellent ability to distinguish target from distractor stimuli.');
    } else if (features.dPrime >= 2.0) {
        factors.push('Good stimulus discrimination ability.');
    } else if (features.dPrime >= 1.0) {
        factors.push('Moderate difficulty distinguishing targets from distractors.');
    } else {
        factors.push('Significant difficulty in stimulus discrimination — needs attention.');
    }

    // Impulsivity
    if (features.commissionErrorRate > 0.3) {
        factors.push(`High false alarm rate (${Math.round(features.commissionErrorRate * 100)}%) suggests impulsive responding.`);
    } else if (features.commissionErrorRate < 0.1) {
        factors.push('Excellent impulse control — very few false alarms.');
    }

    // Inattention
    if (features.omissionErrorRate > 0.3) {
        factors.push(`Frequent missed targets (${Math.round(features.omissionErrorRate * 100)}%) suggests lapses in attention.`);
    } else if (features.omissionErrorRate < 0.1) {
        factors.push('Strong sustained focus — very few missed targets.');
    }

    // Vigilance decrement
    if (features.vigilanceDecrement < -0.1) {
        factors.push('Performance declined over the test, suggesting attention fatigue.');
    } else if (Math.abs(features.vigilanceDecrement) < 0.05) {
        factors.push('Consistent performance throughout — good vigilance maintenance.');
    }

    // Response time
    if (features.rtCoefficientOfVariation > 0.4) {
        factors.push('Highly variable response times indicate inconsistent attention.');
    }

    return factors;
}

// ─── Result Assembly ─────────────────────────────────────────────

/**
 * Creates a complete SAVT assessment result.
 */
export function createSavtResult(
    trials: TrialEvent[],
    config: SavtSessionConfig,
    totalDurationMs: number,
    sessionId?: string
): SavtAssessmentResult {
    const { features, rawMetrics } = extractSavtFeatures(trials, config, totalDurationMs);
    const profile = generateSavtProfile(features);
    const keyFactors = generateKeyFactors(features);

    return {
        sessionId: sessionId || `savt-${Date.now()}`,
        timestamp: new Date(),
        config,
        rawMetrics,
        features,
        profile,
        trials,
        explainability: { keyFactors },
    };
}

// ─── Helpers ──────────────────────────────────────────────────────

function round(n: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
}

function clamp(n: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, n));
}

function calculateArrayVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
}
