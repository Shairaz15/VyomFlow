/**
 * Feature Explainability Module
 * Uses gradient-based sensitivity analysis to determine feature importance.
 */

import * as tf from '@tensorflow/tfjs';
import { FEATURE_COUNT } from './featureNormalizer';

// Names corresponding to feature indices
export const FEATURE_NAMES = [
    "Memory Accuracy",
    "Reaction Speed",
    "Pattern Recognition",
    "Language Fluency",
    "Reaction Consistency",
    "Overall Score",
    "Time Factor",
    "Trend Slope"
];

export const DOMAIN_MAPPING: Record<string, string[]> = {
    memory: ["Memory Accuracy", "Trend Slope"],
    reaction: ["Reaction Speed", "Reaction Consistency"],
    pattern: ["Pattern Recognition"],
    language: ["Language Fluency"]
};

/**
 * Computes feature importance using input gradients.
 * (Simplified Saliency Map)
 */
export function computeFeatureImportance(model: tf.LayersModel, inputTensor: tf.Tensor): Record<string, number> {
    return tf.tidy(() => {
        // We want the gradient of the winning class score w.r.t input
        // const pred = model.predict(inputTensor) as tf.Tensor;
        // const bestClassIndex = pred.argMax(-1).dataSync()[0];

        // This is a simplified heuristic since TFJS gradient API is tricky in inference mode
        // For MVP, we use a permutation-based approach which is more robust in browser
        return computePermutationImportance(model, inputTensor);
    });
}

/**
 * Computes importance by perturbing each feature and measuring output variance.
 */
function computePermutationImportance(model: tf.LayersModel, inputTensor: tf.Tensor): Record<string, number> {
    const baselinePred = model.predict(inputTensor) as tf.Tensor;
    const baselineScores = baselinePred.dataSync();

    // Convert tensor to array for manipulation
    // Shape: [1, Window, Features]
    const inputData = inputTensor.dataSync(); // Flat array
    const windowSize = inputTensor.shape[1] || 6;

    const importanceScores = new Array(FEATURE_COUNT).fill(0);

    // For each feature index (0-7)
    for (let f = 0; f < FEATURE_COUNT; f++) {
        // Create perturbed input: zero out this feature across expected window
        const perturbed = Float32Array.from(inputData);

        for (let w = 0; w < windowSize; w++) {
            const idx = w * FEATURE_COUNT + f;
            perturbed[idx] = 0; // Nullify feature
        }

        const perturbedTensor = tf.tensor([perturbed], inputTensor.shape);
        const newPred = model.predict(perturbedTensor) as tf.Tensor;
        const newScores = newPred.dataSync();

        // Measure L2 distance between baseline and perturbed output
        let diff = 0;
        for (let i = 0; i < 3; i++) {
            diff += Math.pow(baselineScores[i] - newScores[i], 2);
        }

        importanceScores[f] = Math.sqrt(diff);
    }

    // Aggregate by domain
    const domains = {
        memory: (importanceScores[0] + importanceScores[7]) / 2,
        reaction: (importanceScores[1] + importanceScores[4]) / 2,
        pattern: importanceScores[2],
        language: importanceScores[3]
    };

    // Normalize to sum to 1
    const total = Object.values(domains).reduce((a, b) => a + b, 0) || 1;

    return {
        memory: domains.memory / total,
        reaction: domains.reaction / total,
        pattern: domains.pattern / total,
        language: domains.language / total
    };
}
