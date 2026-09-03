/**
 * VyomFlow Multi-Factor Confidence & 4-Tier Clinical Alert Layer
 * ==============================================================
 * Implements Sections 7 & 8 of VyomFlow_AI_Architecture.md:
 * - 5-Factor Composite Confidence Estimator ($C_{\text{composite}}$)
 * - 4-Tier SaMD Non-Diagnostic Decision Support Guidance Engine
 */

import type { TrajectoryClassification } from './statisticalDriftEngine';

export type ClinicalAlertTierCode =
    | 'STABLE'
    | 'CONTINUE_MONITORING'
    | 'RECOMMEND_EARLIER_REASSESSMENT'
    | 'RECOMMEND_CLINICAL_EVALUATION';

export interface ConfidenceDimensions {
    density: number;     // C_density (0.0 to 1.0)
    completeness: number;// C_complete (0.0 to 1.0)
    oodDistance: number; // C_OOD (0.0 to 1.0)
    uncertainty: number; // C_uncertainty (0.0 to 1.0)
    historyDepth: number;// C_history (0.0 to 1.0)
}

export interface ClinicalAlertDecision {
    tier: ClinicalAlertTierCode;
    title: string;
    description: string;
    recommendation: string;
    badgeColor: string;
    icon: string;
    confidence: {
        compositeScore: number; // 0.0 to 1.0
        confidenceLevel: 'High' | 'Moderate' | 'Low';
        dimensions: ConfidenceDimensions;
    };
    clinicalDisclaimer: string;
    triggeredFactors: string[];
}

export interface PatientSessionContext {
    demographics?: {
        age?: number;
        yearsOfEducation?: number;
    };
    completedModulesCount: number; // e.g. 5 out of 6 modules completed
    totalRequiredModules?: number;
    predictionProbabilities?: {
        normal: number;
        mci: number;
        dementia: number;
    };
    estimatedMoCA?: number;
    trajectory?: TrajectoryClassification;
    sessionHistoryCount: number;
    domainDiscrepancies?: Array<{ domain: string; dropMagnitude: number }>;
}

const DEFAULT_DISCLAIMER =
    'VyomFlow is an AI-assisted cognitive screening and longitudinal digital biomarker platform aligned with FDA SaMD non-diagnostic enforcement discretion guidelines. All alert tiers represent decision-support insights and do not constitute formal medical diagnoses.';

/**
 * Calculates demographic density confidence (C_density)
 */
export function calculateDensityConfidence(age?: number, education?: number): number {
    if (!age || age <= 0) return 0.75;

    // Highest density in typical adult/senior screening ages (40 to 85)
    let ageScore = 1.0;
    if (age < 20 || age > 95) ageScore = 0.65;
    else if (age < 35 || age > 88) ageScore = 0.85;

    let eduScore = 1.0;
    if (education !== undefined) {
        if (education < 3 || education > 24) eduScore = 0.80;
    }

    return Math.round((ageScore * 0.7 + eduScore * 0.3) * 100) / 100;
}

/**
 * Calculates sub-task feature completeness confidence (C_complete)
 */
export function calculateCompletenessConfidence(
    completedModulesCount: number,
    totalRequired: number = 6
): number {
    if (totalRequired <= 0) return 1.0;
    const ratio = Math.min(1.0, completedModulesCount / totalRequired);
    return Math.round(ratio * 100) / 100;
}

/**
 * Calculates Shannon Entropy-based Prediction Uncertainty Confidence (C_uncertainty)
 * C_uncertainty = 1 - (H(p) / log(K))
 */
export function calculateUncertaintyConfidence(
    probs?: { normal: number; mci: number; dementia: number }
): number {
    if (!probs) return 0.85;

    const p = [probs.normal, probs.mci, probs.dementia].filter((v) => v > 0);
    if (p.length <= 1) return 1.0;

    // Shannon Entropy H(p) = -sum(p_i * log(p_i))
    const entropy = -p.reduce((sum, val) => sum + val * Math.log(val), 0);
    const maxEntropy = Math.log(3); // log(K) for 3 classes = 1.0986

    const normalizedEntropy = Math.min(1.0, entropy / maxEntropy);
    const uncertaintyConfidence = Math.max(0.1, 1.0 - normalizedEntropy);

    return Math.round(uncertaintyConfidence * 100) / 100;
}

/**
 * Calculates History Depth Confidence (C_history)
 */
export function calculateHistoryConfidence(sessionCount: number): number {
    if (sessionCount <= 0) return 0.4;
    if (sessionCount === 1) return 0.55;
    if (sessionCount === 2) return 0.75;
    if (sessionCount === 3) return 0.90;
    return 1.0;
}

/**
 * 5-Factor Composite Confidence Score:
 * C_composite = w1*C_density + w2*C_complete + w3*C_OOD + w4*C_uncertainty + w5*C_history
 */
export function calculateCompositeConfidence(
    context: PatientSessionContext,
    customOOD: number = 0.90
): { compositeScore: number; confidenceLevel: 'High' | 'Moderate' | 'Low'; dimensions: ConfidenceDimensions } {
    const density = calculateDensityConfidence(context.demographics?.age, context.demographics?.yearsOfEducation);
    const completeness = calculateCompletenessConfidence(
        context.completedModulesCount,
        context.totalRequiredModules || 6
    );
    const oodDistance = Math.min(1.0, Math.max(0.0, customOOD));
    const uncertainty = calculateUncertaintyConfidence(context.predictionProbabilities);
    const historyDepth = calculateHistoryConfidence(context.sessionHistoryCount);

    const weights = {
        density: 0.15,
        completeness: 0.25,
        oodDistance: 0.20,
        uncertainty: 0.20,
        historyDepth: 0.20,
    };

    const rawScore =
        weights.density * density +
        weights.completeness * completeness +
        weights.oodDistance * oodDistance +
        weights.uncertainty * uncertainty +
        weights.historyDepth * historyDepth;

    const compositeScore = Math.round(Math.min(1.0, Math.max(0.1, rawScore)) * 100) / 100;

    let confidenceLevel: 'High' | 'Moderate' | 'Low' = 'Low';
    if (compositeScore >= 0.80) confidenceLevel = 'High';
    else if (compositeScore >= 0.60) confidenceLevel = 'Moderate';

    return {
        compositeScore,
        confidenceLevel,
        dimensions: {
            density,
            completeness,
            oodDistance,
            uncertainty,
            historyDepth,
        },
    };
}

/**
 * Evaluates patient context and determines 4-Tier Decision-Support Clinical Alert
 */
export function determineClinicalAlert(
    context: PatientSessionContext
): ClinicalAlertDecision {
    const confidence = calculateCompositeConfidence(context);
    const triggeredFactors: string[] = [];

    const moca = context.estimatedMoCA ?? 28;
    const mciProb = context.predictionProbabilities?.mci ?? 0;
    const dementiaProb = context.predictionProbabilities?.dementia ?? 0;
    const trajTier = context.trajectory?.tier;

    // Check critical drop conditions (Tier 4: Recommend Clinical Evaluation)
    const isRapidDecline = trajTier === 'Rapid Decline';
    const isDementiaLikely = dementiaProb > 0.45 || moca < 19;
    const hasSevereMultiDomainDrops = (context.domainDiscrepancies?.filter(d => d.dropMagnitude >= 20).length ?? 0) >= 2;

    if (isRapidDecline || isDementiaLikely || hasSevereMultiDomainDrops) {
        if (isRapidDecline) triggeredFactors.push('Multi-session trajectory indicates statistically marked decline (p < 0.01)');
        if (isDementiaLikely) triggeredFactors.push(`Estimated MoCA (${moca.toFixed(1)}) or multi-class confidence indicates marked cognitive shift`);
        if (hasSevereMultiDomainDrops) triggeredFactors.push('Severe multi-domain drop exceeding clinical thresholds');

        return {
            tier: 'RECOMMEND_CLINICAL_EVALUATION',
            title: 'Recommend Clinical Evaluation',
            description: 'Persistent, statistically significant decline observed across cognitive testing batteries.',
            recommendation: 'Share summary report with a qualified healthcare provider for formal in-person clinical evaluation.',
            badgeColor: 'rose',
            icon: '🔴',
            confidence,
            clinicalDisclaimer: DEFAULT_DISCLAIMER,
            triggeredFactors,
        };
    }

    // Check early shift conditions (Tier 3: Recommend Earlier Re-Assessment)
    const isLikelyDecline = trajTier === 'Likely Decline';
    const isMciLikely = mciProb > 0.40 || (moca >= 19 && moca < 24);
    const hasSingleDomainDrop = (context.domainDiscrepancies?.some(d => d.dropMagnitude >= 15)) ?? false;

    if (isLikelyDecline || isMciLikely || hasSingleDomainDrop) {
        if (isLikelyDecline) triggeredFactors.push('Reliable Change Index (RCI) exceeds test-retest error (p < 0.05)');
        if (isMciLikely) triggeredFactors.push(`Scores indicate subtle pattern variance (Estimated MoCA: ${moca.toFixed(1)})`);
        if (hasSingleDomainDrop) triggeredFactors.push('Noticeable isolated domain decline observed relative to personal baseline');

        return {
            tier: 'RECOMMEND_EARLIER_REASSESSMENT',
            title: 'Recommend Earlier Re-Assessment',
            description: 'Statistically noticeable shift detected in specific cognitive domains.',
            recommendation: 'Re-assess in 3–4 weeks; review sleep, acute stress, and metabolic lifestyle factors.',
            badgeColor: 'amber',
            icon: '🟠',
            confidence,
            clinicalDisclaimer: DEFAULT_DISCLAIMER,
            triggeredFactors,
        };
    }

    // Check subtle fluctuation conditions (Tier 2: Continue Monitoring)
    const isPossibleDecline = trajTier === 'Possible Decline';
    const isMildBorderline = moca >= 24 && moca < 26;

    if (isPossibleDecline || isMildBorderline) {
        if (isPossibleDecline) triggeredFactors.push('Subtle downward trend observed within expected physiological bounds');
        if (isMildBorderline) triggeredFactors.push('Mild borderline baseline score');

        return {
            tier: 'CONTINUE_MONITORING',
            title: 'Continue Monitoring',
            description: 'Minor score fluctuations observed within expected physiological test-retest bounds.',
            recommendation: 'Repeat assessment in 6–8 weeks to confirm ongoing longitudinal stability.',
            badgeColor: 'yellow',
            icon: '🟡',
            confidence,
            clinicalDisclaimer: DEFAULT_DISCLAIMER,
            triggeredFactors,
        };
    }

    // Tier 1: Stable
    return {
        tier: 'STABLE',
        title: 'Stable',
        description: 'Cognitive performance is consistent with personal historical baseline within expected bounds.',
        recommendation: 'Continue routine annual or semi-annual cognitive check-in schedule.',
        badgeColor: 'emerald',
        icon: '🟢',
        confidence,
        clinicalDisclaimer: DEFAULT_DISCLAIMER,
        triggeredFactors: ['Cognitive markers consistent with healthy normative baseline'],
    };
}
