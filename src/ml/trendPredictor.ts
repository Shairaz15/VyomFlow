/**
 * Trend Predictor Service
 * Orchestrates: Data -> Normalization -> Inference -> Result
 */

import * as tf from '@tensorflow/tfjs';
import type { SessionDataPoint } from '../ai/trendAnalyzer';
import { normalizeSessionSequence } from './featureNormalizer';
import { loadTrendModel } from './modelLoader';
import { computeFeatureImportance } from './explainability';
import type { TrendPrediction } from './types';
import { ML_CONFIG } from './types';

const CLASS_LABELS = ['stable', 'declining', 'improving'] as const;

export async function predictTrend(sessions: SessionDataPoint[]): Promise<TrendPrediction | null> {
    // 1. Check data sufficiency
    if (sessions.length < ML_CONFIG.minSessions) {
        console.warn("Insufficient sessions for ML prediction");
        return null;
    }

    // 2. Load model
    console.log("[ML Debug] Loading trend model...");
    const model = await loadTrendModel();
    if (!model) {
        console.warn("[ML Debug] Failed to load trend model. Using heuristic fallback.");
        return calculateHeuristicTrend(sessions);
    }
    console.log("[ML Debug] Model loaded successfully");

    try {
        // 3. Prepare Input
        const sequence = normalizeSessionSequence(sessions);
        console.log("[ML Debug] Normalized sequence:", sequence);
        // Shape: [1, Window, Features]
        const inputTensor = tf.tensor([sequence]);

        // 4. Run Inference
        const predTensor = model.predict(inputTensor) as tf.Tensor;
        const probabilities = predTensor.dataSync(); // [stable, declining, improving]
        console.log("[ML Debug] Prediction probabilities:", probabilities);

        // 5. Determine Result
        const maxProbIndex = predTensor.argMax(-1).dataSync()[0];
        const confidence = probabilities[maxProbIndex];
        const direction = CLASS_LABELS[maxProbIndex];
        console.log(`[ML Debug] Prediction: ${direction} (${confidence})`);

        // 6. Explainability
        const contributions = computeFeatureImportance(model, inputTensor);

        // 7. Cleanup
        inputTensor.dispose();
        predTensor.dispose();

        // 8. Determine reliability
        let reliability: 'high' | 'medium' | 'low' = 'low';
        if (confidence >= ML_CONFIG.thresholds.highConfidence && sessions.length >= 5) {
            reliability = 'high';
        } else if (confidence >= ML_CONFIG.thresholds.mediumConfidence) {
            reliability = 'medium';
        }

        return {
            direction,
            confidence,
            anomalyProbability: probabilities[1], // Probability of 'declining' acts as anomaly proxy here
            domainContributions: contributions,
            reliabilityFlag: reliability
        };

    } catch (err) {
        console.error("Prediction failed:", err);
        return null;
    }
}

/**
 * Fallback heuristic when ML model is unavailable.
 * Uses linear regression on weighted cognitive scores.
 */
function calculateHeuristicTrend(sessions: SessionDataPoint[]): TrendPrediction {
    // Extract domain arrays
    const memoryScores = sessions.map(s => s.features.memoryAccuracy * 100);
    const reactionScores = sessions.map(s => Math.max(0, 1000 - s.features.reactionTimeAvg) / 10 * 2);
    const patternScores = sessions.map(s => s.features.patternScore);
    const speechScores = sessions.map(s => s.features.speechWPM / 2);

    // Helper to calculate slope for a single series
    const calculateSlope = (values: number[]): number => {
        const n = values.length;
        if (n < 2) return 0;
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        // Avoid division by zero (variance of x is 0 only if n=1, handled above)
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    };

    const slopes = {
        memory: calculateSlope(memoryScores),
        reaction: calculateSlope(reactionScores),
        pattern: calculateSlope(patternScores),
        speech: calculateSlope(speechScores)
    };

    console.log("[ML Heuristic] Slopes:", slopes);

    // Determine direction based on worst performer (clinical safety: catch decline)
    // or best performer?
    // Usually, we want to flag ANY significant decline.
    // However, if we have default data (flat line), slope is 0.
    // Significant decline > -1.5 (from previous logic). Let's be slightly more sensitive since we don't average: -1.2

    let direction: 'stable' | 'declining' | 'improving' = 'stable';
    let confidence = 0.5;

    const minSlope = Math.min(...Object.values(slopes));
    const maxSlope = Math.max(...Object.values(slopes));

    // Priority 1: Decline detection (Relaxed to -2.0)
    if (minSlope < -2.0) {
        direction = 'declining';
        confidence = Math.min(0.95, 0.6 + Math.abs(minSlope) * 0.1);
    }
    // Priority 2: Improvement (only if no significant decline)
    else if (maxSlope > 2.0) {
        direction = 'improving';
        confidence = Math.min(0.95, 0.6 + maxSlope * 0.1);
    }
    // Fallback: Stable
    else {
        direction = 'stable';
        confidence = 0.8; // Higher confidence in stability for flat slopes
    }

    // Boost confidence with more data
    const n = sessions.length;
    if (n >= 5) confidence += 0.1;
    confidence = Math.min(0.99, confidence);

    console.log(`[ML Heuristic] Result: ${direction}, Conf: ${confidence.toFixed(2)}`);

    // Calculate relative contributions (importance)
    // Simply use absolute slope magnitude relative to total magnitude
    const totalMag = Math.abs(slopes.memory) + Math.abs(slopes.reaction) + Math.abs(slopes.pattern) + Math.abs(slopes.speech) || 1;

    return {
        direction,
        confidence,
        anomalyProbability: direction === 'declining' ? 0.7 : 0.1,
        domainContributions: {
            memory: Math.abs(slopes.memory) / totalMag,
            reaction: Math.abs(slopes.reaction) / totalMag,
            pattern: Math.abs(slopes.pattern) / totalMag,
            language: Math.abs(slopes.speech) / totalMag
        },
        reliabilityFlag: n >= 5 ? 'high' : 'medium'
    };
}
