/**
 * Sustained Attention & Vigilance Test (SAVT) Types
 * 
 * Type definitions for the Go/No-Go continuous performance test.
 * Measures sustained attention, inhibitory control, and vigilance decrement.
 */

// ─── Stimulus Types ───────────────────────────────────────────────

export type StimulusType = 'go' | 'nogo';

export type StimulusShape = 'circle' | 'square' | 'triangle' | 'diamond';

export type StimulusColor = 'green' | 'red' | 'blue' | 'orange';

export interface Stimulus {
    type: StimulusType;
    shape: StimulusShape;
    color: StimulusColor;
    label: string; // Accessibility label
}

// ─── Phase Management ─────────────────────────────────────────────

export type SavtPhase =
    | 'instructions'
    | 'practice'
    | 'testing'
    | 'scoring'
    | 'results';

// ─── Trial Events ─────────────────────────────────────────────────

export type TrialOutcome =
    | 'hit'              // Correctly tapped go stimulus
    | 'miss'             // Failed to tap go stimulus (omission error)
    | 'false_alarm'      // Incorrectly tapped nogo stimulus (commission error)
    | 'correct_rejection'; // Correctly withheld from nogo stimulus

export interface TrialEvent {
    trialIndex: number;
    stimulus: Stimulus;
    responseTimestamp: number | null; // null if no response
    stimulusOnsetTimestamp: number;
    stimulusOffsetTimestamp: number;
    reactionTimeMs: number | null;   // null if no response
    didRespond: boolean;
    outcome: TrialOutcome;
    blockIndex: number;              // Which quarter of the test (0-3)
}

// ─── Session Configuration ────────────────────────────────────────

export interface SavtSessionConfig {
    totalTrials: number;          // 40 trials
    practiceTrials: number;       // 5 practice trials
    goRatio: number;              // 0.7 = 70% go trials
    stimulusDurationMs: number;   // 500ms stimulus display
    responseWindowMs: number;     // 1500ms max response time
    minIsiMs: number;             // 1000ms min inter-stimulus interval
    maxIsiMs: number;             // 2000ms max inter-stimulus interval
    maxConsecutiveNogo: number;   // 3 max consecutive nogo trials
    blocksCount: number;          // 4 blocks for vigilance analysis
}

// ─── Raw Metrics ──────────────────────────────────────────────────

export interface SavtRawMetrics {
    // Signal detection counts
    hits: number;                 // Correct go responses
    misses: number;               // Missed go stimuli (omission errors)
    falseAlarms: number;          // Nogo responses (commission errors)
    correctRejections: number;    // Correct nogo withholdings

    // Trial counts
    totalGoTrials: number;
    totalNogoTrials: number;

    // Timing
    responseTimesMs: number[];    // All valid response times
    totalTestDurationMs: number;

    // Per-block breakdown (for vigilance decrement)
    blockHitRates: number[];      // Hit rate per quarter
    blockFalseAlarmRates: number[]; // FA rate per quarter
    blockMeanRtMs: number[];      // Mean RT per quarter
}

// ─── Derived Features (computed biomarkers) ───────────────────────

export interface SavtFeatures {
    // Signal Detection Theory
    hitRate: number;              // 0-1: hits / totalGoTrials
    falseAlarmRate: number;       // 0-1: falseAlarms / totalNogoTrials
    dPrime: number;               // Sensitivity: z(hitRate) - z(falseAlarmRate)
    responseBias: number;         // Criterion β: response tendency

    // Error analysis
    commissionErrorRate: number;  // 0-1: impulsivity marker
    omissionErrorRate: number;    // 0-1: inattention marker

    // Temporal biomarkers
    meanResponseTimeMs: number;
    medianResponseTimeMs: number;
    rtVariability: number;        // SD of response times
    rtCoefficientOfVariation: number;

    // Vigilance
    vigilanceDecrement: number;   // Slope of hit rate across blocks (negative = declining)
    vigilanceStability: number;   // 0-1: consistency of performance across blocks

    // Session quality
    possibleGuessing: boolean;    // d-prime near 0
    possibleInattention: boolean; // omission rate > 50%
}

// ─── Profile (composite scores) ──────────────────────────────────

export interface SavtProfile {
    attention: number;            // Weighted attention composite (0-100)
    inhibition: number;           // Inhibitory control score (0-100)
    vigilance: number;            // Sustained attention score (0-100)
    compositeScore: number;       // Overall 0-100
    starRating: 1 | 2 | 3 | 4 | 5;
}

// ─── Full Session Result ──────────────────────────────────────────

export interface SavtAssessmentResult {
    sessionId: string;
    timestamp: Date;
    config: SavtSessionConfig;
    rawMetrics: SavtRawMetrics;
    features: SavtFeatures;
    profile: SavtProfile;
    trials: TrialEvent[];
    explainability: {
        keyFactors: string[];
    };
}
