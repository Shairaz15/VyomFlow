/**
 * SAVT Logic
 * State machine, configuration, and stimulus generation for the
 * Sustained Attention & Vigilance Test (Go/No-Go paradigm).
 * 
 * 4 shapes × 4 colors = 16 combos. Each session, ONE random combo
 * is the "go" target — everything else is "nogo".
 */

import type { Stimulus, StimulusType, StimulusShape, StimulusColor, SavtSessionConfig, TrialOutcome } from '../../../types/savtTypes';

// ─── All Shapes & Colors ──────────────────────────────────────────

export const ALL_SHAPES: StimulusShape[] = ['circle', 'square', 'triangle', 'diamond'];
export const ALL_COLORS: StimulusColor[] = ['green', 'red', 'blue', 'orange'];

export const COLOR_LABELS: Record<StimulusColor, string> = {
    green: 'Green',
    red: 'Red',
    blue: 'Blue',
    orange: 'Orange',
};

export const SHAPE_LABELS: Record<StimulusShape, string> = {
    circle: 'Circle',
    square: 'Square',
    triangle: 'Triangle',
    diamond: 'Diamond',
};

// ─── Session Target ───────────────────────────────────────────────

export interface SessionTarget {
    shape: StimulusShape;
    color: StimulusColor;
    label: string; // e.g. "Blue Triangle"
}

/**
 * Picks a random shape+color combo as this session's go target.
 * Changes every time the test is taken.
 */
export function pickSessionTarget(): SessionTarget {
    const shape = ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)];
    const color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
    return {
        shape,
        color,
        label: `${COLOR_LABELS[color]} ${SHAPE_LABELS[shape]}`,
    };
}

// ─── Default Configuration ────────────────────────────────────────

export const DEFAULT_SAVT_CONFIG: SavtSessionConfig = {
    totalTrials: 20,
    practiceTrials: 5,
    goRatio: 0.7,
    stimulusDurationMs: 500,
    responseWindowMs: 1500,
    minIsiMs: 1000,
    maxIsiMs: 2000,
    maxConsecutiveNogo: 3,
    blocksCount: 4,
};

// ─── State Machine ────────────────────────────────────────────────

export type SavtState =
    | 'idle'
    | 'instructions'
    | 'practice_wait'
    | 'practice_stimulus'
    | 'practice_feedback'
    | 'practice_complete'
    | 'test_wait'
    | 'test_stimulus'
    | 'test_response'
    | 'test_timeout'
    | 'round_complete'
    | 'test_complete';

export const STATE_MESSAGES: Record<SavtState, string> = {
    idle: 'Ready to begin',
    instructions: 'How It Works',
    practice_wait: 'Get ready...',
    practice_stimulus: 'Respond!',
    practice_feedback: 'Feedback',
    practice_complete: 'Practice complete!',
    test_wait: 'Focus on the center...',
    test_stimulus: 'Respond!',
    test_response: 'Response recorded',
    test_timeout: 'No response',
    round_complete: 'Next trial...',
    test_complete: 'Assessment complete',
};

// ─── Stimulus Generation ──────────────────────────────────────────

/**
 * Creates a stimulus based on the session target.
 * If type is 'go', returns the target combo.
 * If type is 'nogo', returns a random NON-target combo.
 */
export function createStimulus(type: StimulusType, target: SessionTarget): Stimulus {
    if (type === 'go') {
        return {
            type: 'go',
            shape: target.shape,
            color: target.color,
            label: `${target.label} — TAP`,
        };
    }

    // Pick a random distractor that ISN'T the target
    let shape: StimulusShape;
    let color: StimulusColor;
    do {
        shape = ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)];
        color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
    } while (shape === target.shape && color === target.color);

    return {
        type: 'nogo',
        shape,
        color,
        label: `${COLOR_LABELS[color]} ${SHAPE_LABELS[shape]} — DON'T TAP`,
    };
}

/**
 * Generates a constrained random trial sequence.
 * - Respects go/nogo ratio
 * - Never exceeds maxConsecutiveNogo consecutive nogo trials
 * - Balanced across blocks
 */
export function generateTrialSequence(config: SavtSessionConfig): StimulusType[] {
    const { totalTrials, goRatio, maxConsecutiveNogo } = config;
    const nogoCount = Math.round(totalTrials * (1 - goRatio));
    const goCount = totalTrials - nogoCount;

    let sequence: StimulusType[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        // Create raw pool and shuffle
        const pool: StimulusType[] = [
            ...Array(goCount).fill('go' as StimulusType),
            ...Array(nogoCount).fill('nogo' as StimulusType),
        ];
        sequence = fisherYatesShuffle(pool);

        // Validate constraints
        if (isValidSequence(sequence, maxConsecutiveNogo)) {
            return sequence;
        }
        attempts++;
    }

    // Fallback: repair the sequence
    return repairSequence(sequence, maxConsecutiveNogo);
}

/**
 * Generates a practice trial sequence.
 */
export function generatePracticeSequence(config: SavtSessionConfig): StimulusType[] {
    const { practiceTrials } = config;
    // Ensure at least 1 nogo in practice
    const nogoCount = Math.max(1, Math.round(practiceTrials * 0.3));
    const goCount = practiceTrials - nogoCount;

    const pool: StimulusType[] = [
        ...Array(goCount).fill('go' as StimulusType),
        ...Array(nogoCount).fill('nogo' as StimulusType),
    ];

    return fisherYatesShuffle(pool);
}

/**
 * Random ISI within configured range.
 */
export function getRandomIsi(config: SavtSessionConfig): number {
    const range = config.maxIsiMs - config.minIsiMs;
    return Math.floor(Math.random() * range) + config.minIsiMs;
}

/**
 * Determines which block a trial belongs to.
 */
export function getBlockIndex(trialIndex: number, config: SavtSessionConfig): number {
    const blockSize = Math.ceil(config.totalTrials / config.blocksCount);
    return Math.min(Math.floor(trialIndex / blockSize), config.blocksCount - 1);
}

/**
 * Determines trial outcome from stimulus type and user response.
 */
export function getTrialOutcome(stimulusType: StimulusType, didRespond: boolean): TrialOutcome {
    if (stimulusType === 'go') {
        return didRespond ? 'hit' : 'miss';
    } else {
        return didRespond ? 'false_alarm' : 'correct_rejection';
    }
}

// ─── Internal Helpers ─────────────────────────────────────────────

function fisherYatesShuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function isValidSequence(sequence: StimulusType[], maxConsecutiveNogo: number): boolean {
    let consecutiveNogo = 0;
    for (const s of sequence) {
        if (s === 'nogo') {
            consecutiveNogo++;
            if (consecutiveNogo > maxConsecutiveNogo) return false;
        } else {
            consecutiveNogo = 0;
        }
    }
    return true;
}

function repairSequence(sequence: StimulusType[], maxConsecutiveNogo: number): StimulusType[] {
    const result = [...sequence];
    let consecutiveNogo = 0;

    for (let i = 0; i < result.length; i++) {
        if (result[i] === 'nogo') {
            consecutiveNogo++;
            if (consecutiveNogo > maxConsecutiveNogo) {
                // Swap with nearest go
                const swapIdx = findNearestGo(result, i);
                if (swapIdx !== -1) {
                    [result[i], result[swapIdx]] = [result[swapIdx], result[i]];
                    consecutiveNogo = 0;
                }
            }
        } else {
            consecutiveNogo = 0;
        }
    }
    return result;
}

function findNearestGo(sequence: StimulusType[], fromIndex: number): number {
    // Search forward first, then backward
    for (let i = fromIndex + 1; i < sequence.length; i++) {
        if (sequence[i] === 'go') return i;
    }
    for (let i = fromIndex - 1; i >= 0; i--) {
        if (sequence[i] === 'go') return i;
    }
    return -1;
}
