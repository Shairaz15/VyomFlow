/**
 * Unit tests for Multi-Factor Confidence & 4-Tier Clinical Alert Layer
 */

import { describe, it, expect } from 'vitest';
import {
    calculateDensityConfidence,
    calculateCompletenessConfidence,
    calculateUncertaintyConfidence,
    calculateHistoryConfidence,
    calculateCompositeConfidence,
    determineClinicalAlert,
} from '../clinicalAlertService';

describe('Multi-Factor Confidence & Clinical Alert Layer', () => {
    it('should compute valid 5-factor confidence components', () => {
        const density = calculateDensityConfidence(68, 14);
        expect(density).toBeGreaterThanOrEqual(0.9);

        const completeness = calculateCompletenessConfidence(6, 6);
        expect(completeness).toBe(1.0);

        const uncertainty = calculateUncertaintyConfidence({
            normal: 0.95,
            mci: 0.04,
            dementia: 0.01,
        });
        expect(uncertainty).toBeGreaterThanOrEqual(0.75);

        const history = calculateHistoryConfidence(4);
        expect(history).toBe(1.0);
    });

    it('should calculate weighted composite confidence score', () => {
        const result = calculateCompositeConfidence({
            demographics: { age: 60, yearsOfEducation: 16 },
            completedModulesCount: 6,
            totalRequiredModules: 6,
            predictionProbabilities: { normal: 0.90, mci: 0.08, dementia: 0.02 },
            sessionHistoryCount: 3,
        });

        expect(result.compositeScore).toBeGreaterThanOrEqual(0.85);
        expect(result.confidenceLevel).toBe('High');
        expect(result.dimensions.completeness).toBe(1.0);
    });

    it('should assign Tier 1 (STABLE) for healthy consistent profiles', () => {
        const alert = determineClinicalAlert({
            completedModulesCount: 6,
            sessionHistoryCount: 3,
            estimatedMoCA: 29.0,
            predictionProbabilities: { normal: 0.94, mci: 0.05, dementia: 0.01 },
        });

        expect(alert.tier).toBe('STABLE');
        expect(alert.icon).toBe('🟢');
        expect(alert.badgeColor).toBe('emerald');
        expect(alert.recommendation).toContain('annual');
    });

    it('should assign Tier 2 (CONTINUE_MONITORING) for subtle fluctuations', () => {
        const alert = determineClinicalAlert({
            completedModulesCount: 6,
            sessionHistoryCount: 2,
            estimatedMoCA: 24.5,
            predictionProbabilities: { normal: 0.70, mci: 0.28, dementia: 0.02 },
        });

        expect(alert.tier).toBe('CONTINUE_MONITORING');
        expect(alert.icon).toBe('🟡');
        expect(alert.recommendation).toContain('6–8 weeks');
    });

    it('should assign Tier 3 (RECOMMEND_EARLIER_REASSESSMENT) for noticeable drops', () => {
        const alert = determineClinicalAlert({
            completedModulesCount: 6,
            sessionHistoryCount: 2,
            estimatedMoCA: 22.0,
            predictionProbabilities: { normal: 0.15, mci: 0.80, dementia: 0.05 },
        });

        expect(alert.tier).toBe('RECOMMEND_EARLIER_REASSESSMENT');
        expect(alert.icon).toBe('🟠');
        expect(alert.recommendation).toContain('3–4 weeks');
    });

    it('should assign Tier 4 (RECOMMEND_CLINICAL_EVALUATION) for marked impairment', () => {
        const alert = determineClinicalAlert({
            completedModulesCount: 6,
            sessionHistoryCount: 3,
            estimatedMoCA: 16.5,
            predictionProbabilities: { normal: 0.01, mci: 0.25, dementia: 0.74 },
        });

        expect(alert.tier).toBe('RECOMMEND_CLINICAL_EVALUATION');
        expect(alert.icon).toBe('🔴');
        expect(alert.recommendation).toContain('healthcare provider');
    });
});
