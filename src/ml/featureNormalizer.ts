/**
 * Feature Normalizer for ML Trend Analysis
 * Prepares session data for 1D-CNN input.
 * 
 * Strategy:
 * - Per-user normalization (Z-score)
 * - Temporal encoding
 * - Stability metrics calculation
 * - Sequence padding/truncation
 */

import type { SessionDataPoint } from '../ai/trendAnalyzer';
import type { NormalizedSession } from './types';
import { ML_CONFIG } from './types';

// Feature indices for reference
// 0: Memory Accuracy (0-1)
// 1: Reaction Time (Normalized)
// 2: Pattern Score (0-1)
// 3: Language Fluency (0-1)
// 4: Reaction Variance (Stability)
// 5: Time Decayed Score (Weighted Recency)
// 6: Days Since Baseline (Temporal)
// 7: Rolling Slope (Trend)

export const FEATURE_COUNT = 8;

/**
 * Normalizes a sequence of sessions into a tensor-ready 2D array.
 * Shape: [WindowSize, FeatureCount]
 */
export function normalizeSessionSequence(allSessions: SessionDataPoint[]): number[][] {
    if (allSessions.length === 0) return createZeroSequence();

    // 1. Sort by timestamp
    const sortedSessions = [...allSessions].sort((a, b) => a.timestamp - b.timestamp);

    // 2. Select relevant window (last N sessions)
    // We take more than window size if available to calculate slopes/variance
    const contextSize = ML_CONFIG.windowSize + 2;
    const contextSessions = sortedSessions.slice(-contextSize);

    // 3. Compute derived features
    const normalizedContext: NormalizedSession[] = contextSessions.map((session, index, arr) => {
        const baselineTime = arr[0].timestamp;

        // Core features
        const memory = session.features.memoryAccuracy; // Already 0-1

        // Reaction: Invert and scale (assuming 200ms-1000ms range)
        // Lower is better, so 1.0 = fast, 0.0 = slow
        const reactionRaw = session.features.reactionTimeAvg;
        const reactionNorm = Math.max(0, Math.min(1, 1 - (reactionRaw - 200) / 800));

        const pattern = session.features.patternScore / 10; // Normalize approx max score
        const language = Math.min(1, session.features.lexicalDiversity / 100); // Approx max

        // Stability (Variance of previous 2 sessions if available)
        let stability = 1.0;
        if (index > 0) {
            const prevReaction = arr[index - 1].features.reactionTimeAvg;
            const variation = Math.abs(reactionRaw - prevReaction) / prevReaction;
            stability = Math.max(0, 1 - variation * 2); // Penalty for high variance
        }

        // Temporal
        const daysSince = (session.timestamp - baselineTime) / (1000 * 60 * 60 * 24);
        const temporalNorm = Math.min(1, daysSince / 30); // Cap at 30 days

        // Rolling Slope (Simple difference from previous)
        let slope = 0.5; // Neutral
        if (index > 0) {
            const prevMemory = arr[index - 1].features.memoryAccuracy;
            const delta = memory - prevMemory;
            slope = 0.5 + Math.max(-0.5, Math.min(0.5, delta)); // 0-1 range, 0.5 is flat
        }

        // Combined Score (Time Decayed) - experimental feature
        const combined = (memory * 0.4 + reactionNorm * 0.3 + pattern * 0.2 + language * 0.1);

        return {
            timestamp: session.timestamp,
            sessionIndex: index,
            features: [
                memory,
                reactionNorm,
                pattern,
                language,
                stability,
                combined,
                temporalNorm,
                slope
            ]
        };
    });

    // 4. Pad or truncate to exact window size
    // We want the most recent N sessions
    const recentSessions = normalizedContext.slice(-ML_CONFIG.windowSize);

    const result: number[][] = [];

    // Front-pad with zeros if we don't have enough data
    const paddingNeeded = ML_CONFIG.windowSize - recentSessions.length;
    for (let i = 0; i < paddingNeeded; i++) {
        result.push(new Array(FEATURE_COUNT).fill(0));
    }

    // Add actual data
    recentSessions.forEach(s => result.push(s.features));

    return result;
}

function createZeroSequence(): number[][] {
    const seq: number[][] = [];
    for (let i = 0; i < ML_CONFIG.windowSize; i++) {
        seq.push(new Array(FEATURE_COUNT).fill(0));
    }
    return seq;
}
