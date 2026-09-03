/**
 * Unit tests for VyomFlow Multi-Task ML Predictor
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { loadVyomFlowMLModel } from '../modelLoader';
import { predictWithBundle, predictCognitiveProfile } from '../vyomflowPredictor';
import type { VyomFlowMLModelBundle } from '../types';
import fixtures from './fixtures.json';

describe('VyomFlow Multi-Task Machine Learning Predictor', () => {
    let bundle: VyomFlowMLModelBundle | null = null;

    beforeAll(async () => {
        bundle = await loadVyomFlowMLModel();
    });

    it('should successfully load the serialized JSON model bundle', () => {
        expect(bundle).not.toBeNull();
        expect(bundle?.metadata.model_name).toContain('VyomFlow');
        expect(bundle?.feature_names.length).toBeGreaterThan(100);
        expect(bundle?.classifier.classes).toEqual(['Normal', 'MCI', 'Dementia']);
    });

    it('should have publication-grade validation metrics from 5-fold CV', () => {
        expect(bundle?.validation_metrics.diagnosis_macro_f1).toBeGreaterThanOrEqual(0.90);
        expect(bundle?.validation_metrics.diagnosis_balanced_accuracy).toBeGreaterThanOrEqual(0.90);
        expect(bundle?.validation_metrics.moca_mae).toBeLessThan(2.0);
        expect(bundle?.validation_metrics.moca_r2).toBeGreaterThanOrEqual(0.75);
    });

    it('should correctly predict a verified healthy profile from cohort', () => {
        if (!bundle) throw new Error('Bundle not loaded');

        const prediction = predictWithBundle(fixtures.normal as any, bundle);

        expect(prediction.predictedDiagnosis).toBe('Normal');
        expect(prediction.predictedRiskLevel).toBe('Low');
        expect(prediction.predictedMoCAScore).toBeGreaterThanOrEqual(26);
        expect(prediction.clinicalAlertTier).toBe('Stable');
        expect(prediction.domainScores.memory).toBeGreaterThan(70);
        expect(prediction.confidenceScore).toBeGreaterThan(0.6);
        expect(prediction.diagnosisProbabilities.normal).toBeGreaterThan(0.8);
        expect(prediction.inferenceLatencyMs).toBeLessThan(50);
        expect(prediction.biomarkerAttributions.length).toBeGreaterThan(0);
    });

    it('should correctly predict a verified MCI profile from cohort', () => {
        if (!bundle) throw new Error('Bundle not loaded');

        const prediction = predictWithBundle(fixtures.mci as any, bundle);

        expect(prediction.predictedDiagnosis).toBe('MCI');
        expect(prediction.predictedRiskLevel).toBe('Moderate');
        expect(prediction.predictedMoCAScore).toBeLessThanOrEqual(25);
        expect(['Recommend Earlier Re-Assessment', 'Recommend Clinical Evaluation']).toContain(prediction.clinicalAlertTier);
        expect(prediction.diagnosisProbabilities.mci).toBeGreaterThan(0.7);
    });

    it('should correctly predict a verified Dementia profile from cohort', () => {
        if (!bundle) throw new Error('Bundle not loaded');

        const prediction = predictWithBundle(fixtures.dementia as any, bundle);

        expect(['MCI', 'Dementia']).toContain(prediction.predictedDiagnosis);
        expect(prediction.predictedRiskLevel).toMatch(/Moderate|High/);
        expect(prediction.predictedMoCAScore).toBeLessThanOrEqual(22);
        expect(prediction.clinicalAlertTier).toBe('Recommend Clinical Evaluation');
    });

    it('should work via the asynchronous predictCognitiveProfile entry point with partial inputs', async () => {
        const result = await predictCognitiveProfile({
            age: 50,
            yearsOfEducation: 12,
            nav_navigationScore: 85,
            lang_cognitiveSpeechIndex: 85,
            vmra_compositeMemoryScore: 85,
            savt_compositeSAVTScore: 85,
            cross_previousMoCAEstimate: 28
        });

        expect(result).not.toBeNull();
        expect(result?.predictedDiagnosis).toBeDefined();
        expect(result?.predictedMoCAScore).toBeGreaterThan(0);
        expect(result?.clinicalAlertTier).toBeDefined();
    });
});
