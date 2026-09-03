/**
 * Model Loader for VyomFlow Multi-Task ML Model and Trend Analysis
 * Handles loading and caching of the JSON model bundle.
 */

import type { VyomFlowMLModelBundle } from './types';

let mlBundleInstance: VyomFlowMLModelBundle | null = null;
let mlBundleLoadPromise: Promise<VyomFlowMLModelBundle | null> | null = null;

const ML_BUNDLE_PATH = '/models/vyomflow_ml_bundle.json';

/**
 * Loads the VyomFlow JSON Multi-Task Model Bundle
 */
export async function loadVyomFlowMLModel(): Promise<VyomFlowMLModelBundle | null> {
    if (mlBundleInstance) return mlBundleInstance;
    if (mlBundleLoadPromise) return mlBundleLoadPromise;

    mlBundleLoadPromise = (async () => {
        try {
            // Check if running in browser with fetch
            if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
                const response = await fetch(ML_BUNDLE_PATH);
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status} loading ${ML_BUNDLE_PATH}`);
                }
                mlBundleInstance = (await response.json()) as VyomFlowMLModelBundle;
                return mlBundleInstance;
            }

            return null;
        } catch (error) {
            console.error('[ML Loader] Failed to load VyomFlow ML Bundle:', error);
            return null;
        } finally {
            mlBundleLoadPromise = null;
        }
    })();

    return mlBundleLoadPromise;
}

export function setVyomFlowMLModel(bundle: VyomFlowMLModelBundle): void {
    mlBundleInstance = bundle;
}

export function isVyomFlowMLModelLoaded(): boolean {
    return !!mlBundleInstance;
}
