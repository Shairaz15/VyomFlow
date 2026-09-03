/**
 * ML Trend Analysis & Multi-Task Cognitive Estimator Types
 * Defines interfaces for ML predictions, features, model bundles, and explainability.
 */

export type CognitiveDiagnosis = 'Normal' | 'MCI' | 'Dementia';
export type CognitiveRiskLevel = 'Low' | 'Moderate' | 'High';
export type ClinicalAlertTier = 'Stable' | 'Continue Monitoring' | 'Recommend Earlier Re-Assessment' | 'Recommend Clinical Evaluation';

export interface BiomarkerAttribution {
    biomarker: string;
    domain: string;
    importance: number;
    impactValue: number;
    direction: 'risk' | 'protective';
    description?: string;
}

export interface VyomFlowMLPrediction {
    predictedDiagnosis: CognitiveDiagnosis;
    diagnosisProbabilities: {
        normal: number;
        mci: number;
        dementia: number;
    };
    predictedMoCAScore: number; // 0 to 30 continuous scale
    predictedRiskLevel: CognitiveRiskLevel;
    domainScores: {
        memory: number;      // 0 to 100
        attention: number;   // 0 to 100
        language: number;    // 0 to 100
        executive: number;   // 0 to 100
    };
    confidenceScore: number; // 0.0 to 1.0
    clinicalAlertTier: ClinicalAlertTier;
    biomarkerAttributions: BiomarkerAttribution[];
    inferenceLatencyMs: number;
}

export interface VyomFlowMLModelBundle {
    metadata: {
        model_name: string;
        version: string;
        architecture: string;
        dataset: string;
        trained_at: string;
        n_features: number;
        target_classes: string[];
        risk_levels: string[];
    };
    validation_metrics: {
        diagnosis_balanced_accuracy: number;
        diagnosis_macro_f1: number;
        moca_mae: number;
        moca_r2: number;
        domain_maes: {
            memory: number;
            attention: number;
            language: number;
            executive: number;
        };
        confidence_mae: number;
    };
    feature_names: string[];
    feature_domains: Record<string, string>;
    feature_means: number[];
    feature_stds: number[];
    categorical_mappings: Record<string, Record<string, number>>;
    classifier: {
        classes: string[];
        intercept: number[];
        coefficients: number[][];
    };
    moca_regressor: {
        intercept: number;
        coefficients: number[];
        output_min: number;
        output_max: number;
    };
    domain_regressors: {
        memory: { intercept: number; coefficients: number[]; output_min: number; output_max: number };
        attention: { intercept: number; coefficients: number[]; output_min: number; output_max: number };
        language: { intercept: number; coefficients: number[]; output_min: number; output_max: number };
        executive: { intercept: number; coefficients: number[]; output_min: number; output_max: number };
    };
    confidence_regressor: {
        intercept: number;
        coefficients: number[];
        output_min: number;
        output_max: number;
    };
    global_feature_importance: Record<string, number>;
    top_biomarkers: Array<{ rank: number; feature: string; importance: number }>;
}

export interface TrendPrediction {
    direction: 'stable' | 'declining' | 'improving';
    confidence: number;        // 0-1
    anomalyProbability?: number; // 0-1

    domainContributions?: {
        memory?: number;       // 0-1 importance
        reaction?: number;
        pattern?: number;
        language?: number;
    };

    reliabilityFlag?: 'high' | 'medium' | 'low';
}

export type FeatureVector = number[];

export interface NormalizedSession {
    features: FeatureVector;
    timestamp: number;
    sessionIndex: number;
}
