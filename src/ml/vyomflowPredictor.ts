/**
 * VyomFlow Client-Side Multi-Task Machine Learning Predictor
 * ==========================================================
 * Performs 100% client-side, zero-latency inference using the pre-trained
 * VyomFlow JSON Model Bundle. Provides diagnostic classification, continuous
 * MoCA score estimation, cognitive domain breakdown, multi-factor confidence,
 * and SHAP-aligned local biomarker attributions.
 */

import { loadVyomFlowMLModel } from './modelLoader';
import type {
    VyomFlowMLModelBundle,
    VyomFlowMLPrediction,
    CognitiveDiagnosis,
    CognitiveRiskLevel,
    ClinicalAlertTier,
    BiomarkerAttribution
} from './types';

export type AssessmentInputFeatures = Record<string, number | string | boolean | undefined>;

/**
 * Normalizes an arbitrary feature input object against model feature schemas
 */
export function buildNormalizedFeatureVector(
    inputs: AssessmentInputFeatures,
    bundle: VyomFlowMLModelBundle
): { rawVector: number[]; normalizedVector: number[] } {
    const rawVector: number[] = [];
    const normalizedVector: number[] = [];

    const { feature_names, feature_means, feature_stds, categorical_mappings } = bundle;

    for (let i = 0; i < feature_names.length; i++) {
        const featName = feature_names[i];
        let val = inputs[featName];

        let numVal = 0;

        if (typeof val === 'number') {
            numVal = isNaN(val) ? feature_means[i] : val;
        } else if (typeof val === 'string') {
            // Check categorical mapping
            const catMap = categorical_mappings[featName];
            if (catMap && catMap[val] !== undefined) {
                numVal = catMap[val];
            } else {
                const parsed = parseFloat(val);
                numVal = isNaN(parsed) ? feature_means[i] : parsed;
            }
        } else if (typeof val === 'boolean') {
            numVal = val ? 1 : 0;
        } else {
            // Default to mean if missing
            numVal = feature_means[i];
        }

        rawVector.push(numVal);

        const mean = feature_means[i] ?? 0;
        const std = feature_stds[i] || 1.0;
        normalizedVector.push((numVal - mean) / std);
    }

    return { rawVector, normalizedVector };
}

/**
 * Softmax function for multinomial logistic regression outputs
 */
function softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const expValues = logits.map(z => Math.exp(z - maxLogit));
    const sumExp = expValues.reduce((a, b) => a + b, 0);
    return expValues.map(v => v / (sumExp || 1.0));
}

/**
 * Determines the 4-tier clinical decision-support alert level
 */
function determineClinicalAlertTier(
    diagnosis: CognitiveDiagnosis,
    moca: number,
    risk: CognitiveRiskLevel
): ClinicalAlertTier {
    if (diagnosis === 'Dementia' || moca < 19 || risk === 'High') {
        return 'Recommend Clinical Evaluation';
    }
    if (diagnosis === 'MCI' || moca < 24 || risk === 'Moderate') {
        return 'Recommend Earlier Re-Assessment';
    }
    if (moca < 26) {
        return 'Continue Monitoring';
    }
    return 'Stable';
}

/**
 * Computes local feature attribution (SHAP proxy)
 */
function computeLocalBiomarkerAttributions(
    normalizedVector: number[],
    bundle: VyomFlowMLModelBundle,
    targetClassIdx: number = 1 // default to MCI risk vector
): BiomarkerAttribution[] {
    const { feature_names, feature_domains, classifier, global_feature_importance } = bundle;
    const weights = classifier.coefficients[targetClassIdx] || classifier.coefficients[0];

    const attributions: BiomarkerAttribution[] = [];

    for (let i = 0; i < feature_names.length; i++) {
        const featName = feature_names[i];
        const normVal = normalizedVector[i];
        const weight = weights[i] ?? 0;
        const globalImp = global_feature_importance[featName] ?? 0;

        // Local additive impact
        const impact = weight * normVal;

        // Skip negligible impacts
        if (Math.abs(impact) < 0.005 && globalImp < 0.01) continue;

        attributions.push({
            biomarker: featName,
            domain: feature_domains[featName] || 'Cognitive Biomarker',
            importance: globalImp,
            impactValue: Math.round(impact * 1000) / 1000,
            direction: impact >= 0 ? 'risk' : 'protective'
        });
    }

    // Sort by absolute impact magnitude
    attributions.sort((a, b) => Math.abs(b.impactValue) - Math.abs(a.impactValue));
    return attributions.slice(0, 8);
}

/**
 * Primary synchronous prediction routine given a loaded model bundle
 */
export function predictWithBundle(
    inputs: AssessmentInputFeatures,
    bundle: VyomFlowMLModelBundle
): VyomFlowMLPrediction {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const { normalizedVector } = buildNormalizedFeatureVector(inputs, bundle);

    // 1. Classification (Normal vs MCI vs Dementia)
    const { classifier } = bundle;
    const logits: number[] = [];
    for (let k = 0; k < classifier.classes.length; k++) {
        let logit = classifier.intercept[k] ?? 0;
        const classWeights = classifier.coefficients[k];
        for (let i = 0; i < normalizedVector.length; i++) {
            logit += (classWeights[i] ?? 0) * normalizedVector[i];
        }
        logits.push(logit);
    }

    const probs = softmax(logits);
    let maxProbIdx = 0;
    for (let k = 1; k < probs.length; k++) {
        if (probs[k] > probs[maxProbIdx]) {
            maxProbIdx = k;
        }
    }

    const predictedDiagnosis = (classifier.classes[maxProbIdx] || 'Normal') as CognitiveDiagnosis;
    const predictedRiskLevel: CognitiveRiskLevel =
        predictedDiagnosis === 'Normal' ? 'Low' : predictedDiagnosis === 'MCI' ? 'Moderate' : 'High';

    // 2. MoCA Score Regression
    const { moca_regressor } = bundle;
    let mocaPred = moca_regressor.intercept;
    for (let i = 0; i < normalizedVector.length; i++) {
        mocaPred += (moca_regressor.coefficients[i] ?? 0) * normalizedVector[i];
    }
    const predictedMoCAScore = Math.max(
        moca_regressor.output_min,
        Math.min(moca_regressor.output_max, Math.round(mocaPred * 10) / 10)
    );

    // 3. Domain Score Regressors
    const { domain_regressors } = bundle;
    const predictDomain = (reg: { intercept: number; coefficients: number[]; output_min: number; output_max: number }) => {
        let val = reg.intercept;
        for (let i = 0; i < normalizedVector.length; i++) {
            val += (reg.coefficients[i] ?? 0) * normalizedVector[i];
        }
        return Math.max(reg.output_min, Math.min(reg.output_max, Math.round(val)));
    };

    const domainScores = {
        memory: predictDomain(domain_regressors.memory),
        attention: predictDomain(domain_regressors.attention),
        language: predictDomain(domain_regressors.language),
        executive: predictDomain(domain_regressors.executive)
    };

    // 4. Confidence Regression
    const { confidence_regressor } = bundle;
    let confPred = confidence_regressor.intercept;
    for (let i = 0; i < normalizedVector.length; i++) {
        confPred += (confidence_regressor.coefficients[i] ?? 0) * normalizedVector[i];
    }
    const confidenceScore = Math.max(
        confidence_regressor.output_min,
        Math.min(confidence_regressor.output_max, Math.round(confPred * 100) / 100)
    );

    // 5. 4-Tier Clinical Alert
    const clinicalAlertTier = determineClinicalAlertTier(predictedDiagnosis, predictedMoCAScore, predictedRiskLevel);

    // 6. Explainability & Local Attributions
    const biomarkerAttributions = computeLocalBiomarkerAttributions(normalizedVector, bundle, maxProbIdx);

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const inferenceLatencyMs = Math.round((endTime - startTime) * 100) / 100;

    return {
        predictedDiagnosis,
        diagnosisProbabilities: {
            normal: Math.round((probs[0] ?? 0) * 1000) / 1000,
            mci: Math.round((probs[1] ?? 0) * 1000) / 1000,
            dementia: Math.round((probs[2] ?? 0) * 1000) / 1000
        },
        predictedMoCAScore,
        predictedRiskLevel,
        domainScores,
        confidenceScore,
        clinicalAlertTier,
        biomarkerAttributions,
        inferenceLatencyMs
    };
}

/**
 * Main asynchronous prediction entry point (loads cached model bundle automatically)
 */
export async function predictCognitiveProfile(
    inputs: AssessmentInputFeatures
): Promise<VyomFlowMLPrediction | null> {
    const bundle = await loadVyomFlowMLModel();
    if (!bundle) {
        console.error('[VyomFlow Predictor] Model bundle unavailable');
        return null;
    }
    return predictWithBundle(inputs, bundle);
}
