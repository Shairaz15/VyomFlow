import type { TrajectoryCategory } from './statisticalDriftEngine';

/**
 * Clinical Alert & Confidence Engine
 * 
 * Implements Sections 7 & 8 of the VyomFlow AI Architecture.
 * Translates statistical findings into patient-friendly, non-diagnostic guidance
 * augmented by a composite confidence score.
 */

export interface ConfidenceMetrics {
  density: number; // Training Sample Density (0-100%)
  completeness: number; // Feature Completeness (0-100%)
  oodDistance: number; // Out-of-Distribution Distance inverted (0-100%)
  uncertainty: number; // Prediction Certainty (0-100%)
  history: number; // Session History Depth Score (0-100%)
}

export interface AlertOutput {
  alertLevel: 'STABLE' | 'MONITOR' | 'RE_ASSESS' | 'EVALUATE';
  confidenceScore: number;
  recommendationText: string;
  colorCode: string;
}

/**
 * Computes the Composite Reliability & Confidence Score (0-100%)
 */
export function computeCompositeConfidence(metrics: ConfidenceMetrics): number {
  // Weights defined by internal clinical standards (can be adjusted)
  const weights = {
    density: 0.15,
    completeness: 0.35, // High weight: if tasks weren't finished, score is unreliable
    oodDistance: 0.20,
    uncertainty: 0.15,
    history: 0.15
  };

  const composite = 
    (metrics.density * weights.density) +
    (metrics.completeness * weights.completeness) +
    (metrics.oodDistance * weights.oodDistance) +
    (metrics.uncertainty * weights.uncertainty) +
    (metrics.history * weights.history);

  return Math.max(0, Math.min(100, composite));
}

/**
 * Calculates a history score based on number of past sessions
 * 1 session = 30%, 2 sessions = 60%, >=3 sessions = 100%
 */
export function calculateHistoryScore(sessionCount: number): number {
  if (sessionCount <= 1) return 30;
  if (sessionCount === 2) return 60;
  return 100;
}

/**
 * Generates the final clinical alert based on trajectory and current cross-sectional risk
 * 
 * @param trajectory The computed trajectory from the Statistical Drift Engine
 * @param crossSectionalRisk Probabilistic risk (0.0 to 1.0) of impairment from ML Model
 */
export function generateClinicalAlert(trajectory: TrajectoryCategory, crossSectionalRisk: number, confidenceMetrics: ConfidenceMetrics): AlertOutput {
  const confidenceScore = computeCompositeConfidence(confidenceMetrics);

  let alertLevel: AlertOutput['alertLevel'] = 'STABLE';
  let recommendationText = '';
  let colorCode = '';

  // Decision Logic Matrix
  if (trajectory === 'RAPID_DECLINE' || (trajectory === 'LIKELY_DECLINE' && crossSectionalRisk > 0.7)) {
    alertLevel = 'EVALUATE';
    colorCode = 'RED'; // 🔴
    recommendationText = 'Persistent, statistically significant decline observed across visits. Recommendation: Share summary report with a qualified healthcare provider for formal clinical evaluation.';
  } else if (trajectory === 'LIKELY_DECLINE' || trajectory === 'POSSIBLE_DECLINE' && crossSectionalRisk > 0.4) {
    alertLevel = 'RE_ASSESS';
    colorCode = 'ORANGE'; // 🟠
    recommendationText = 'Statistically noticeable shift detected in specific cognitive domains. Recommendation: Re-assess in 3–4 weeks; review lifestyle/sleep factors.';
  } else if (trajectory === 'POSSIBLE_DECLINE' || (trajectory === 'STABLE' && crossSectionalRisk > 0.6)) {
    alertLevel = 'MONITOR';
    colorCode = 'YELLOW'; // 🟡
    recommendationText = 'Minor fluctuations observed within expected physiological bounds. Recommendation: Repeat assessment in 6–8 weeks to confirm stability.';
  } else {
    // STABLE or IMPROVING
    alertLevel = 'STABLE';
    colorCode = 'GREEN'; // 🟢
    recommendationText = 'Cognitive performance is consistent with previous baseline sessions. Recommendation: Continue routine annual / semi-annual check-ins.';
  }

  // Modulate recommendation based on low confidence
  if (confidenceScore < 50) {
    recommendationText += ` (Note: This result has low confidence (${confidenceScore.toFixed(1)}%) due to missing data or limited session history. Please retake the assessment in optimal conditions.)`;
  }

  return {
    alertLevel,
    confidenceScore,
    recommendationText,
    colorCode
  };
}
