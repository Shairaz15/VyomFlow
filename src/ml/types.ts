/**
 * ML Trend Analysis Types
 * Defines interfaces for ML predictions, features, and model outputs.
 */

export interface TrendPrediction {
    direction: 'stable' | 'declining' | 'improving';
    confidence: number;        // 0-1
    anomalyProbability: number; // 0-1

    domainContributions: {
        memory?: number;       // 0-1 importance
        reaction?: number;
        pattern?: number;
        language?: number;
    };

    reliabilityFlag: 'high' | 'medium' | 'low';
}

export type FeatureVector = number[];

export interface NormalizedSession {
    features: FeatureVector;
    timestamp: number;
    sessionIndex: number;
}

export interface MLModelConfig {
    minSessions: number;
    windowSize: number;
    thresholds: {
        highConfidence: number;
        mediumConfidence: number;
    };
}

export const ML_CONFIG: MLModelConfig = {
    minSessions: 3,
    windowSize: 6,
    thresholds: {
        highConfidence: 0.7,
        mediumConfidence: 0.5
    }
};
