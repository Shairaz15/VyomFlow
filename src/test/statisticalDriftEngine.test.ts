import { describe, it, expect } from 'vitest';
import {
  calculateRCI,
  calculateTheilSenSlope,
  calculateZDrift,
  calculateCV,
  evaluateLongitudinalDrift,
  SessionData,
  MODULE_RELIABILITY
} from '../services/statisticalDriftEngine';

describe('Statistical Drift Engine', () => {

  describe('Reliable Change Index (RCI)', () => {
    it('should correctly calculate RCI and identify significant decline', () => {
      // Current = 70, Base = 90, Std = 10, rxx = 0.8
      // SEM = 10 * sqrt(1 - 0.8) = 10 * sqrt(0.2) = 10 * 0.447 = 4.47
      // SED = sqrt(2 * 4.47^2) = sqrt(2 * 20) = sqrt(40) = 6.32
      // RCI = (70 - 90) / 6.32 = -20 / 6.32 = -3.16
      const rci = calculateRCI(70, 90, 10, 0.8);
      expect(rci).toBeCloseTo(-3.16, 1);
      expect(rci).toBeLessThan(-1.96); // Significant decline
    });

    it('should correctly identify significant improvement', () => {
      const rci = calculateRCI(90, 70, 10, 0.8);
      expect(rci).toBeCloseTo(3.16, 1);
      expect(rci).toBeGreaterThan(1.96); // Significant improvement
    });

    it('should identify no meaningful change', () => {
      const rci = calculateRCI(85, 90, 10, 0.8);
      expect(rci).toBeCloseTo(-0.79, 1);
      expect(rci).toBeGreaterThan(-1.0); // Stable
    });
  });

  describe('Theil-Sen Slope', () => {
    it('should estimate a stable trajectory', () => {
      const scores = [80, 81, 79, 80, 82];
      const times = [0, 1, 2, 3, 4]; // months
      const slope = calculateTheilSenSlope(scores, times);
      expect(Math.abs(slope)).toBeLessThan(1.0);
    });

    it('should estimate a declining trajectory robust to outliers', () => {
      const scores = [90, 85, 95, 75, 70]; // 95 is a positive outlier
      const times = [0, 1, 2, 3, 4];
      const slope = calculateTheilSenSlope(scores, times);
      expect(slope).toBeLessThan(0);
    });
  });

  describe('Intra-Individual Z-Score Deviation', () => {
    it('should calculate correct Z-score for normal deviation', () => {
      const z = calculateZDrift(85, 90, 10);
      expect(z).toBeCloseTo(-0.5, 2);
    });

    it('should calculate correct Z-score for extreme deviation', () => {
      const z = calculateZDrift(60, 90, 10);
      expect(z).toBeCloseTo(-3.0, 2);
    });
  });

  describe('Volatility Index (CV)', () => {
    it('should calculate CV for a stable participant', () => {
      const cv = calculateCV([90, 91, 89, 90]);
      expect(cv).toBeLessThan(5); // Less than 5% variance
    });

    it('should calculate CV for a highly variable participant', () => {
      const cv = calculateCV([60, 95, 70, 90]);
      expect(cv).toBeGreaterThan(15); // High volatility
    });
  });

  describe('Overall Trajectory Classification', () => {
    const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

    it('should classify as RAPID_DECLINE for severe drops', () => {
      const sessions: SessionData[] = [
        { sessionId: '1', timestamp: 0, moduleScores: { VMRA: 90 } },
        { sessionId: '2', timestamp: MS_PER_MONTH * 1, moduleScores: { VMRA: 75 } },
        { sessionId: '3', timestamp: MS_PER_MONTH * 2, moduleScores: { VMRA: 50 } }
      ];
      // beta will be ~ (50-90)/2 = -20/mo
      // RCI will be severe
      const metrics = evaluateLongitudinalDrift(sessions, 10);
      expect(metrics.overallTrajectory).toBe('RAPID_DECLINE');
    });

    it('should classify as STABLE for normal fluctuations', () => {
      const sessions: SessionData[] = [
        { sessionId: '1', timestamp: 0, moduleScores: { SAVT: 85 } },
        { sessionId: '2', timestamp: MS_PER_MONTH * 6, moduleScores: { SAVT: 86 } },
        { sessionId: '3', timestamp: MS_PER_MONTH * 12, moduleScores: { SAVT: 84 } }
      ];
      const metrics = evaluateLongitudinalDrift(sessions, 10);
      expect(metrics.overallTrajectory).toBe('STABLE');
    });

    it('should classify as POSSIBLE_DECLINE for subtle drops', () => {
      const sessions: SessionData[] = [
        { sessionId: '1', timestamp: 0, moduleScores: { LANGUAGE: 90 } },
        { sessionId: '3', timestamp: MS_PER_MONTH * 60, moduleScores: { LANGUAGE: 82 } }
      ];
      // beta = (82-90)/60 = -8/60 = -0.133 (between -0.05 and -0.15)
      // length < 3 -> std fallback 10. SED = 6.63. RCI = (82-90)/6.63 = -1.2 (between -1.0 and -1.96)
      const metrics = evaluateLongitudinalDrift(sessions, 10);
      expect(metrics.overallTrajectory).toBe('POSSIBLE_DECLINE');
    });
  });
});
