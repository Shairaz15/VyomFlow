/**
 * Unit tests for Statistical Longitudinal Drift Engine
 */

import { describe, it, expect } from 'vitest';
import {
    calculateSEM,
    calculateSED,
    calculateRCI,
    calculateModuleRCI,
    calculateTheilSenSlope,
    calculateZDrift,
    classifyTrajectory,
    evaluatePatientTrajectory,
    MODULE_RELIABILITIES,
} from '../statisticalDriftEngine';

describe('Statistical Longitudinal Drift Engine (RCI & Theil-Sen)', () => {
    it('should compute valid SEM and SED values matching theoretical definitions', () => {
        const sBaseline = 10.0;
        const rxx = 0.88; // SAVT reliability

        // SEM = 10 * sqrt(1 - 0.88) = 10 * sqrt(0.12) = 10 * 0.34641 = 3.4641
        const sem = calculateSEM(sBaseline, rxx);
        expect(sem).toBeCloseTo(3.4641, 3);

        // SED = sem * sqrt(2) = 3.4641 * 1.4142 = 4.8989
        const sed = calculateSED(sem);
        expect(sed).toBeCloseTo(4.8989, 3);
    });

    it('should compute correct RCI and identify statistical significance at p < 0.05', () => {
        const sem = calculateSEM(10.0, 0.88);
        const sed = calculateSED(sem);

        // No change
        expect(calculateRCI(80, 80, sed)).toBe(0);

        // Small drop (-2 pts): RCI = -2 / 4.8989 = -0.408 (not significant)
        const minorDropRCI = calculateRCI(78, 80, sed);
        expect(minorDropRCI).toBeCloseTo(-0.408, 2);

        // Large drop (-10 pts): RCI = -10 / 4.8989 = -2.041 (Significant, |RCI| >= 1.96)
        const sigDropRCI = calculateRCI(70, 80, sed);
        expect(sigDropRCI).toBeCloseTo(-2.041, 2);
        expect(Math.abs(sigDropRCI)).toBeGreaterThanOrEqual(1.96);
    });

    it('should calculate module-specific RCIs with correct reliability thresholds', () => {
        // VMRA with rxx=0.82
        const vmraResult = calculateModuleRCI('vmra', 60, 85);
        expect(vmraResult.isStatisticallySignificant).toBe(true);
        expect(vmraResult.direction).toBe('declined');
        expect(vmraResult.rci).toBeLessThan(-1.96);

        // Stable Language test
        const langResult = calculateModuleRCI('language', 85, 86);
        expect(langResult.isStatisticallySignificant).toBe(false);
        expect(langResult.direction).toBe('stable');
    });

    it('should compute robust non-parametric Theil-Sen slope across noisy multi-session data', () => {
        // Steady decline of -2.0 points per month with 1 noisy outlier in month 2
        const points = [
            { timeMonths: 0, score: 90 },
            { timeMonths: 1, score: 88 },
            { timeMonths: 2, score: 65 }, // Temporary bad day / acute fluctuation
            { timeMonths: 3, score: 84 },
            { timeMonths: 4, score: 82 },
        ];

        const slope = calculateTheilSenSlope(points);
        // Robust slope should be approximately -2.0 / month despite the acute dip in month 2
        expect(slope).toBeCloseTo(-2.0, 0.5);
    });

    it('should correctly classify 5-tier trajectory spectrum', () => {
        // Stable
        const stable = classifyTrajectory(-0.2, -0.01, 5.0);
        expect(stable.tier).toBe('Stable');

        // Possible Decline
        const possible = classifyTrajectory(-1.2, -0.08, 12.0);
        expect(possible.tier).toBe('Possible Decline');

        // Likely Decline
        const likely = classifyTrajectory(-2.1, -0.20, 16.0);
        expect(likely.tier).toBe('Likely Decline');

        // Rapid Decline
        const rapid = classifyTrajectory(-2.8, -0.45, 22.0);
        expect(rapid.tier).toBe('Rapid Decline');

        // Improving
        const improving = classifyTrajectory(2.2, 0.15, 6.0);
        expect(improving.tier).toBe('Improving');
    });

    it('should evaluate full longitudinal multi-session patient history', () => {
        const dayMs = 1000 * 60 * 60 * 24;
        const now = Date.now();

        const history = [
            { timestamp: now - 90 * dayMs, score: 88, domainScores: { memory: 88, attention: 86 } },
            { timestamp: now - 60 * dayMs, score: 85, domainScores: { memory: 84, attention: 85 } },
            { timestamp: now - 30 * dayMs, score: 82, domainScores: { memory: 80, attention: 84 } },
            { timestamp: now, score: 79, domainScores: { memory: 75, attention: 83 } },
        ];

        const evaluation = evaluatePatientTrajectory(history);

        expect(evaluation.sessionCount).toBe(4);
        expect(evaluation.elapsedMonths).toBeCloseTo(3.0, 1);
        expect(evaluation.historicalScores).toEqual([88, 85, 82, 79]);
        expect(evaluation.trajectory.theilSenSlopePerMonth).toBeLessThan(0);
        expect(evaluation.domainDrifts.memory).toBeDefined();
    });
});
