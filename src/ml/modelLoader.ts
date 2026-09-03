/**
 * Model Loader for Trend Analysis
 * Handles loading of the TFJS model with singleton pattern.
 */

import * as tf from '@tensorflow/tfjs';

let modelInstance: tf.LayersModel | null = null;
let loadError: Error | null = null;

const MODEL_PATH = '/models/trend-cnn/model.json';

export async function loadTrendModel(): Promise<tf.LayersModel | null> {
    if (modelInstance) return modelInstance;
    if (loadError) return null; // Don't retry if failed once

    try {
        console.log('[ML Debug] Loading Trend Model from:', MODEL_PATH);
        modelInstance = await tf.loadLayersModel(MODEL_PATH);
        console.log('[ML Debug] Trend Model Loaded Successfully');
        return modelInstance;
    } catch (error) {
        console.error('[ML Debug] Failed to load Trend Model:', error);
        loadError = error as Error;
        return null;
    }
}

export function isModelLoaded(): boolean {
    return !!modelInstance;
}
