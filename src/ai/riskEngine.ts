/**
 * Risk Engine
 * Fuses signals from trend analysis, anomaly detection, and baseline deviation
 * to produce a final risk assessment.
 */

import type { TrendSlopes } from "./trendAnalyzer";
import type { AnomalyResult, BaselineVector } from "./anomalyDetector";
import type { ExtractedFeatures } from "./featureExtractor";
import type { RiskLevel } from "../ethics/messagingRules";
import { RISK_MESSAGES, RISK_LABELS } from "../ethics/messagingRules";
import type { TrendPrediction } from "../ml/types";

export interface RiskAnalysis {
    riskLevel: RiskLevel;
    riskLabel: string;
    riskMessage: string;
    riskConfidenceScore: number; // 0-1
    anomalyScore: number; // 0-1
    explanation: string;
    topFactors: string[];
    mlPrediction?: TrendPrediction;
}

export interface DeltaVector {
    memoryDelta: number;
    reactionDelta: number;
    patternDelta: number;
    speechDelta: number;
}

/**
 * Computes the delta between current features and baseline.
 */
export function computeDelta(
    current: ExtractedFeatures,
    baseline: BaselineVector
): DeltaVector {
    return {
        memoryDelta: current.memoryAccuracy - baseline.memoryAccuracy,
        reactionDelta: baseline.reactionTimeAvg - current.reactionTimeAvg, // Inverted: lower is better
        patternDelta: current.patternScore - baseline.patternScore,
        speechDelta: current.lexicalDiversity - baseline.lexicalDiversity,
    };
}

/**
 * Identifies the top contributing factors to risk.
 */
function identifyTopFactors(
    delta: DeltaVector,
    slopes: TrendSlopes,
    anomaly: AnomalyResult
): string[] {
    const factors: { name: string; severity: number }[] = [];

    // Check deltas (negative = decline)
    if (delta.memoryDelta < -0.1) {
        factors.push({ name: "memory decline", severity: Math.abs(delta.memoryDelta) });
    }
    if (delta.reactionDelta < -50) {
        factors.push({ name: "slower reaction time", severity: Math.abs(delta.reactionDelta) / 100 });
    }
    if (delta.patternDelta < -0.1) {
        factors.push({ name: "pattern recognition decline", severity: Math.abs(delta.patternDelta) });
    }
    if (delta.speechDelta < -0.1) {
        factors.push({ name: "reduced language complexity", severity: Math.abs(delta.speechDelta) });
    }

    // Check trend slopes
    if (slopes.memoryTrendSlope < -0.001) {
        factors.push({ name: "declining memory trend", severity: Math.abs(slopes.memoryTrendSlope) * 100 });
    }
    if (slopes.reactionTrendSlope < -0.001) {
        factors.push({ name: "declining reaction trend", severity: Math.abs(slopes.reactionTrendSlope) * 100 });
    }

    // Check anomaly deviations
    for (const [metric, deviation] of Object.entries(anomaly.deviations)) {
        if (deviation > 2) {
            factors.push({ name: `unusual ${metric}`, severity: deviation / 3 });
        }
    }

    // Sort by severity and return top 3
    factors.sort((a, b) => b.severity - a.severity);
    return factors.slice(0, 3).map((f) => f.name);
}

/**
 * Main risk computation function.
 * Combines all signals to produce final risk assessment.
 */
export function computeRisk(
    current: ExtractedFeatures,
    baseline: BaselineVector,
    slopes: TrendSlopes,
    anomaly: AnomalyResult,
    mlResult?: TrendPrediction | null
): RiskAnalysis {
    const delta = computeDelta(current, baseline);

    // Count negative signals (Rule-Based)
    let negativeSignals = 0;
    let ruleSignalStrength = 0;

    // Delta signals
    if (delta.memoryDelta < -0.1) { negativeSignals++; ruleSignalStrength += Math.abs(delta.memoryDelta); }
    if (delta.reactionDelta < -50) { negativeSignals++; ruleSignalStrength += Math.abs(delta.reactionDelta) / 200; }
    if (delta.patternDelta < -0.1) { negativeSignals++; ruleSignalStrength += Math.abs(delta.patternDelta); }
    if (delta.speechDelta < -0.1) { negativeSignals++; ruleSignalStrength += Math.abs(delta.speechDelta); }

    // Trend signals
    const avgSlope = (slopes.memoryTrendSlope + slopes.reactionTrendSlope + slopes.patternTrendSlope + slopes.languageTrendSlope) / 4;
    if (avgSlope < -0.0005) { negativeSignals++; ruleSignalStrength += Math.abs(avgSlope) * 100; }

    // Anomaly signal
    if (anomaly.isAnomaly) { negativeSignals++; ruleSignalStrength += anomaly.anomalyScore; }

    // Rule-Based Risk Score (0-1 approx)
    let ruleRiskScore = 0;
    if (negativeSignals >= 4) ruleRiskScore = 0.8;
    else if (negativeSignals >= 2) ruleRiskScore = 0.5;
    else ruleRiskScore = 0.1;

    // --- ENSEMBLE LOGIC ---
    let finalRiskScore = ruleRiskScore;
    let factors = identifyTopFactors(delta, slopes, anomaly);
    let confidence = Math.min(ruleSignalStrength / 2, 1);

    if (mlResult && mlResult.confidence >= 0.7 && mlResult.reliabilityFlag !== 'low') {
        const mlWeight = mlResult.confidence * 0.5; // Max 50%
        const ruleWeight = 1 - mlWeight;

        // Map ML direction to rough risk score
        let mlRiskContribution = 0;
        if (mlResult.direction === 'declining') mlRiskContribution = 0.8;
        else if (mlResult.direction === 'stable') mlRiskContribution = 0.2;
        else mlRiskContribution = 0.0;

        finalRiskScore = (ruleRiskScore * ruleWeight) + (mlRiskContribution * mlWeight);

        // Boost confidence if ML agrees with rules
        confidence = Math.min(1, confidence + 0.1);

        // Add ML factors
        if (mlResult.domainContributions) {
            Object.entries(mlResult.domainContributions)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 1) // Top ML factor
                .forEach(([domain]) => {
                    if (!factors.includes(`${domain} (ML detected)`)) {
                        factors.push(`${domain} (ML trend)`);
                    }
                });
        }
    }

    // Determine final level
    let riskLevel: RiskLevel;
    if (finalRiskScore > 0.6) riskLevel = "possible_risk";
    else if (finalRiskScore > 0.3) riskLevel = "change_detected";
    else riskLevel = "stable";

    // Re-verify tops factors are limited
    const topFactors = factors.slice(0, 3);

    // Generate explanation
    let explanation = "";
    if (topFactors.length > 0) {
        explanation = `Observed factors: ${topFactors.join(", ")}.`;
    } else {
        explanation = "No significant performance changes detected.";
    }

    return {
        riskLevel,
        riskLabel: RISK_LABELS[riskLevel],
        riskMessage: RISK_MESSAGES[riskLevel],
        riskConfidenceScore: confidence,
        anomalyScore: anomaly.anomalyScore,
        explanation,
        topFactors,
        mlPrediction: mlResult || undefined
    };
}
