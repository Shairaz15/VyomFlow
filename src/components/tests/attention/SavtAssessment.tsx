/**
 * Sustained Attention & Vigilance Test (SAVT)
 * 
 * Go/No-Go continuous performance test measuring sustained attention,
 * inhibitory control, and vigilance decrement.
 * 
 * 4 shapes × 4 colors = 16 combos. Each session picks a random target.
 * Target = TAP (go), Everything else = DON'T TAP (nogo).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../common';
import { PageWrapper } from '../../layout';
import type {
    SavtPhase,
    StimulusType,
    Stimulus,
    TrialEvent,
    SavtAssessmentResult,
} from '../../../types/savtTypes';
import {
    DEFAULT_SAVT_CONFIG,
    generateTrialSequence,
    generatePracticeSequence,
    createStimulus,
    getRandomIsi,
    getBlockIndex,
    getTrialOutcome,
    pickSessionTarget,
    type SessionTarget,
} from './savtLogic';
import { createSavtResult } from './savtFeatures';
import { useAttentionResults } from '../../../hooks/useTestResults';
import { getAttentionFeedback } from '../../../utils/normativeStats';
import './SavtAssessment.css';

/** Maps target color to a CSS tint for rule cards */
const COLOR_TINTS: Record<string, { bg: string; border: string }> = {
    green: { bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.25)' },
    red: { bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.25)' },
    blue: { bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.25)' },
    orange: { bg: 'rgba(249, 115, 22, 0.10)', border: 'rgba(249, 115, 22, 0.25)' },
};

export function SavtAssessment() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { saveResult } = useAttentionResults();
    const config = DEFAULT_SAVT_CONFIG;

    // ─── State ────────────────────────────────────────────────────
    const [phase, setPhase] = useState<SavtPhase>('instructions');
    const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
    const [showStimulus, setShowStimulus] = useState(false);
    const [trialIndex, setTrialIndex] = useState(0);
    const [result, setResult] = useState<SavtAssessmentResult | null>(null);
    const [sessionTarget, setSessionTarget] = useState<SessionTarget>(() => pickSessionTarget());

    // Practice UI state
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceTotal, setPracticeTotal] = useState(0);
    const [practiceFeedback, setPracticeFeedback] = useState<{
        show: boolean;
        correct: boolean;
        message: string;
    }>({ show: false, correct: false, message: '' });
    const [practiceComplete, setPracticeComplete] = useState(false);

    // ─── Refs (avoid stale closures) ──────────────────────────────
    const phaseRef = useRef<SavtPhase>('instructions');
    const sessionTargetRef = useRef<SessionTarget>(sessionTarget);
    const trialsRef = useRef<TrialEvent[]>([]);
    const trialIndexRef = useRef(0);
    const sequenceRef = useRef<StimulusType[]>([]);
    const practiceSeqRef = useRef<StimulusType[]>([]);
    const practiceIdxRef = useRef(0);
    const stimulusOnsetRef = useRef(0);
    const testStartTimeRef = useRef(0);
    const respondedRef = useRef(false);
    const currentStimulusRef = useRef<Stimulus | null>(null);

    // Timers
    const isiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stimulusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const responseWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync refs
    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { sessionTargetRef.current = sessionTarget; }, [sessionTarget]);

    // ─── Timer Cleanup ────────────────────────────────────────────
    const clearAllTimers = useCallback(() => {
        if (isiTimerRef.current) { clearTimeout(isiTimerRef.current); isiTimerRef.current = null; }
        if (stimulusTimerRef.current) { clearTimeout(stimulusTimerRef.current); stimulusTimerRef.current = null; }
        if (responseWindowTimerRef.current) { clearTimeout(responseWindowTimerRef.current); responseWindowTimerRef.current = null; }
    }, []);

    useEffect(() => () => clearAllTimers(), [clearAllTimers]);

    // ─── Stimulus Display Helpers ─────────────────────────────────

    const showStimulusOnScreen = useCallback((stim: Stimulus) => {
        currentStimulusRef.current = stim;
        setCurrentStimulus(stim);
        setShowStimulus(true);
        stimulusOnsetRef.current = Date.now();
    }, []);

    const hideStimulusFromScreen = useCallback(() => {
        setShowStimulus(false);
    }, []);

    // ─── Practice Logic ───────────────────────────────────────────

    const runPracticeTrial = useCallback((seq: StimulusType[], idx: number, target: SessionTarget) => {
        if (idx >= seq.length) {
            setPracticeComplete(true);
            setPracticeFeedback({ show: false, correct: false, message: '' });
            setCurrentStimulus(null);
            currentStimulusRef.current = null;
            setShowStimulus(false);
            return;
        }

        setPracticeComplete(false);
        setPracticeFeedback({ show: false, correct: false, message: '' });
        respondedRef.current = false;
        practiceIdxRef.current = idx;
        setPracticeIndex(idx);

        isiTimerRef.current = setTimeout(() => {
            if (phaseRef.current !== 'practice') return;

            const stim = createStimulus(seq[idx], target);
            showStimulusOnScreen(stim);

            stimulusTimerRef.current = setTimeout(() => {
                hideStimulusFromScreen();

                responseWindowTimerRef.current = setTimeout(() => {
                    if (respondedRef.current) return;
                    // No response
                    const correct = seq[idx] === 'nogo';
                    setPracticeFeedback({
                        show: true,
                        correct,
                        message: correct
                            ? '✓ Correct! You held back.'
                            : `✗ Missed! Tap the ${target.label}.`,
                    });

                    setTimeout(() => {
                        runPracticeTrial(seq, idx + 1, target);
                    }, 1200);
                }, config.responseWindowMs);
            }, config.stimulusDurationMs);
        }, getRandomIsi(config));
    }, [config, showStimulusOnScreen, hideStimulusFromScreen]);

    const handlePracticeResponse = useCallback(() => {
        if (respondedRef.current || !currentStimulusRef.current) return;
        if (phaseRef.current !== 'practice') return;
        respondedRef.current = true;

        clearAllTimers();
        hideStimulusFromScreen();

        const stim = currentStimulusRef.current;
        const target = sessionTargetRef.current;
        const correct = stim.type === 'go';

        setPracticeFeedback({
            show: true,
            correct,
            message: correct
                ? '✓ Correct! Quick response.'
                : `✗ Only tap the ${target.label}!`,
        });

        const seq = practiceSeqRef.current;
        const nextIdx = practiceIdxRef.current + 1;

        setTimeout(() => {
            setPracticeIndex(nextIdx);
            if (nextIdx >= seq.length) {
                setPracticeComplete(true);
                setPracticeFeedback({ show: false, correct: false, message: '' });
                setCurrentStimulus(null);
                currentStimulusRef.current = null;
            } else {
                runPracticeTrial(seq, nextIdx, target);
            }
        }, 1200);
    }, [clearAllTimers, hideStimulusFromScreen, runPracticeTrial]);

    const startPractice = useCallback(() => {
        clearAllTimers();
        const target = pickSessionTarget();
        setSessionTarget(target);
        sessionTargetRef.current = target;

        const seq = generatePracticeSequence(config);
        practiceSeqRef.current = seq;
        setPracticeTotal(seq.length);
        setPracticeIndex(0);
        practiceIdxRef.current = 0;
        setPracticeComplete(false);
        setPhase('practice');

        // Small delay to let state settle
        setTimeout(() => {
            runPracticeTrial(seq, 0, target);
        }, 100);
    }, [config, clearAllTimers, runPracticeTrial]);

    // ─── Test Logic ───────────────────────────────────────────────

    const finishTest = useCallback(() => {
        clearAllTimers();
        setPhase('scoring');
        setShowStimulus(false);
        setCurrentStimulus(null);
        currentStimulusRef.current = null;

        const totalDuration = Date.now() - testStartTimeRef.current;
        const finalTrials = trialsRef.current;

        setTimeout(() => {
            const assessmentResult = createSavtResult(
                finalTrials,
                config,
                totalDuration,
                user?.uid ? `${user.uid}-savt-${Date.now()}` : undefined
            );
            setResult(assessmentResult);
            saveResult(assessmentResult);
            setPhase('results');
        }, 2000);
    }, [config, user, clearAllTimers, saveResult]);

    const runTestTrial = useCallback((seq: StimulusType[], idx: number, target: SessionTarget) => {
        if (idx >= seq.length) {
            finishTest();
            return;
        }

        respondedRef.current = false;
        trialIndexRef.current = idx;
        setTrialIndex(idx);

        isiTimerRef.current = setTimeout(() => {
            if (phaseRef.current !== 'testing') return;

            const stim = createStimulus(seq[idx], target);
            showStimulusOnScreen(stim);

            stimulusTimerRef.current = setTimeout(() => {
                if (phaseRef.current !== 'testing') return;
                hideStimulusFromScreen();

                responseWindowTimerRef.current = setTimeout(() => {
                    if (phaseRef.current !== 'testing') return;
                    if (respondedRef.current) return;

                    // No response — record trial
                    const trial: TrialEvent = {
                        trialIndex: idx,
                        stimulus: stim,
                        responseTimestamp: null,
                        stimulusOnsetTimestamp: stimulusOnsetRef.current,
                        stimulusOffsetTimestamp: stimulusOnsetRef.current + config.stimulusDurationMs,
                        reactionTimeMs: null,
                        didRespond: false,
                        outcome: getTrialOutcome(seq[idx], false),
                        blockIndex: getBlockIndex(idx, config),
                    };
                    trialsRef.current = [...trialsRef.current, trial];

                    // Next trial
                    runTestTrial(seq, idx + 1, target);
                }, config.responseWindowMs);
            }, config.stimulusDurationMs);
        }, getRandomIsi(config));
    }, [config, showStimulusOnScreen, hideStimulusFromScreen, finishTest]);

    const handleTestResponse = useCallback(() => {
        if (respondedRef.current || phaseRef.current !== 'testing') return;
        if (!currentStimulusRef.current) return;
        respondedRef.current = true;

        clearAllTimers();
        const responseTime = Date.now();
        const rt = responseTime - stimulusOnsetRef.current;
        const idx = trialIndexRef.current;
        const seq = sequenceRef.current;
        const stim = currentStimulusRef.current;

        const trial: TrialEvent = {
            trialIndex: idx,
            stimulus: stim,
            responseTimestamp: responseTime,
            stimulusOnsetTimestamp: stimulusOnsetRef.current,
            stimulusOffsetTimestamp: stimulusOnsetRef.current + config.stimulusDurationMs,
            reactionTimeMs: rt,
            didRespond: true,
            outcome: getTrialOutcome(seq[idx], true),
            blockIndex: getBlockIndex(idx, config),
        };

        trialsRef.current = [...trialsRef.current, trial];
        hideStimulusFromScreen();

        // Next trial
        runTestTrial(seq, idx + 1, sessionTargetRef.current);
    }, [config, clearAllTimers, hideStimulusFromScreen, runTestTrial]);

    const startTest = useCallback(() => {
        clearAllTimers();
        const seq = generateTrialSequence(config);
        sequenceRef.current = seq;
        trialsRef.current = [];
        trialIndexRef.current = 0;
        setTrialIndex(0);
        testStartTimeRef.current = Date.now();
        setPhase('testing');

        setTimeout(() => {
            runTestTrial(seq, 0, sessionTargetRef.current);
        }, 100);
    }, [config, clearAllTimers, runTestTrial]);

    // ─── Keyboard support (spacebar + enter) ──────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                e.stopPropagation();

                if (phaseRef.current === 'practice') {
                    handlePracticeResponse();
                } else if (phaseRef.current === 'testing') {
                    handleTestResponse();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePracticeResponse, handleTestResponse]);

    // ─── Stimulus Rendering ───────────────────────────────────────

    const renderStimulus = (stim: Stimulus, large = true) => {
        const sizeClass = large ? 'savt-stimulus-large' : 'savt-stimulus-small';
        const colorClass = `savt-color-${stim.color}`;

        return (
            <div className={`savt-stimulus ${sizeClass} ${colorClass}`}
                aria-label={stim.label}
                role="img">
                {stim.shape === 'circle' && (
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" />
                    </svg>
                )}
                {stim.shape === 'square' && (
                    <svg viewBox="0 0 100 100">
                        <rect x="10" y="10" width="80" height="80" rx="4" />
                    </svg>
                )}
                {stim.shape === 'triangle' && (
                    <svg viewBox="0 0 100 100">
                        <polygon points="50,5 95,90 5,90" />
                    </svg>
                )}
                {stim.shape === 'diamond' && (
                    <svg viewBox="0 0 100 100">
                        <polygon points="50,5 95,50 50,95 5,50" />
                    </svg>
                )}
            </div>
        );
    };

    // ─── Progress ─────────────────────────────────────────────────

    const progress = phase === 'testing'
        ? Math.round((trialIndex / config.totalTrials) * 100)
        : phase === 'practice'
            ? Math.round((practiceIndex / Math.max(1, practiceTotal)) * 100)
            : 0;

    // ─── Phase Rendering ──────────────────────────────────────────

    const renderPhase = () => {
        switch (phase) {
            case 'instructions': {
                const goTint = COLOR_TINTS[sessionTarget.color] || COLOR_TINTS.green;
                return (
                    <div className="savt-phase savt-instructions animate-fadeInUp">
                        <div className="savt-title-section">
                            <h1>Sustained Attention Test</h1>
                            <p className="savt-subtitle">Go / No-Go Assessment</p>
                        </div>

                        <div className="savt-rules glass-card">
                            <h3>How It Works</h3>
                            <p className="savt-rules-desc">You must match <strong>BOTH the shape AND the color</strong> — not just one!</p>
                            <div className="savt-rule-grid">
                                <div className="savt-rule"
                                    style={{ background: goTint.bg, border: `1px solid ${goTint.border}` }}>
                                    <div className="savt-rule-stimulus">
                                        {renderStimulus(createStimulus('go', sessionTarget), false)}
                                    </div>
                                    <div className="savt-rule-text">
                                        <span className="savt-rule-action go" style={{ background: goTint.bg, color: goTint.border }}>
                                            TAP
                                        </span>
                                        <p><strong>{sessionTarget.label}</strong></p>
                                        <p className="savt-rule-hint">This exact shape + color</p>
                                    </div>
                                </div>
                                <div className="savt-rule savt-rule-nogo">
                                    <div className="savt-rule-stimulus">
                                        {renderStimulus(createStimulus('nogo', sessionTarget), false)}
                                    </div>
                                    <div className="savt-rule-text">
                                        <span className="savt-rule-action nogo">DON'T TAP</span>
                                        <p>Everything else</p>
                                        <p className="savt-rule-hint">Different shape OR color</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="savt-info glass-card">
                            <ul>
                                <li><strong>Both shape AND color</strong> must match the target</li>
                                <li>The target changes each time you take the test</li>
                                <li>You'll do 5 practice rounds, then {config.totalTrials} real trials</li>
                                <li>Use tap, click, or <strong>spacebar</strong> to respond</li>
                            </ul>
                        </div>

                        <Button
                            variant="primary"
                            className="savt-start-btn"
                            onClick={startPractice}
                        >
                            Start Practice
                        </Button>
                    </div>
                );
            }

            case 'practice':
                return (
                    <div className="savt-phase savt-test-area"
                        onClick={handlePracticeResponse}
                        role="button"
                        tabIndex={0}
                        aria-label="Tap area for practice — or press spacebar">
                        <div className="savt-progress-bar">
                            <div className="savt-progress-fill practice"
                                style={{ width: `${progress}%` }} />
                        </div>
                        <p className="savt-phase-label">Practice — Only tap the <strong>{sessionTarget.label}</strong></p>

                        <div className="savt-stimulus-area">
                            {showStimulus && currentStimulus && renderStimulus(currentStimulus)}
                            {!showStimulus && !practiceFeedback.show && !practiceComplete && (
                                <div className="savt-fixation">+</div>
                            )}
                            {practiceFeedback.show && (
                                <div className={`savt-feedback ${practiceFeedback.correct ? 'correct' : 'incorrect'}`}>
                                    {practiceFeedback.message}
                                </div>
                            )}
                        </div>

                        {practiceComplete && !practiceFeedback.show && (
                            <div className="savt-practice-done animate-fadeInUp">
                                <h2>Practice Complete!</h2>
                                <p>You're ready for the real test.</p>
                                <Button
                                    variant="primary"
                                    className="savt-start-btn"
                                    onClick={(e) => { e.stopPropagation(); startTest(); }}
                                >
                                    Start Assessment
                                </Button>
                            </div>
                        )}
                    </div>
                );

            case 'testing':
                return (
                    <div className="savt-phase savt-test-area"
                        onClick={handleTestResponse}
                        role="button"
                        tabIndex={0}
                        aria-label="Tap area for test — or press spacebar">
                        <div className="savt-progress-bar">
                            <div className="savt-progress-fill"
                                style={{ width: `${progress}%` }} />
                        </div>
                        <p className="savt-phase-label">
                            Trial {Math.min(trialIndex + 1, config.totalTrials)} of {config.totalTrials} — Only tap <strong>{sessionTarget.label}</strong>
                        </p>

                        <div className="savt-stimulus-area">
                            {showStimulus && currentStimulus && renderStimulus(currentStimulus)}
                            {!showStimulus && (
                                <div className="savt-fixation">+</div>
                            )}
                        </div>
                    </div>
                );

            case 'scoring':
                return (
                    <div className="savt-phase savt-scoring animate-fadeIn">
                        <div className="savt-scoring-spinner" />
                        <h2>Analyzing Performance...</h2>
                        <p>Computing signal detection metrics</p>
                    </div>
                );

            case 'results':
                if (!result) return null;
                const feedback = getAttentionFeedback(result.features.dPrime);
                return (
                    <div className="savt-phase savt-results animate-fadeInUp">
                        <h1>Results</h1>

                        <div className="savt-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star}
                                    className={`savt-star ${star <= result.profile.starRating ? 'filled' : ''}`}>
                                    ★
                                </span>
                            ))}
                        </div>

                        <div className="savt-score-circle glass-card">
                            <div className="savt-score-value">{result.profile.compositeScore}</div>
                            <div className="savt-score-label">Composite Score</div>
                            <div className={`savt-feedback-badge ${feedback.color}`}>
                                {feedback.category}
                            </div>
                        </div>

                        <div className="savt-subscores">
                            <div className="savt-subscore glass-card">
                                <div className="savt-subscore-value">{result.profile.attention}</div>
                                <div className="savt-subscore-label">Attention</div>
                            </div>
                            <div className="savt-subscore glass-card">
                                <div className="savt-subscore-value">{result.profile.inhibition}</div>
                                <div className="savt-subscore-label">Inhibition</div>
                            </div>
                            <div className="savt-subscore glass-card">
                                <div className="savt-subscore-value">{result.profile.vigilance}</div>
                                <div className="savt-subscore-label">Vigilance</div>
                            </div>
                        </div>

                        <div className="savt-metrics glass-card">
                            <h3>Signal Detection</h3>
                            <div className="savt-metric-grid">
                                <div className="savt-metric">
                                    <span className="savt-metric-val">{result.features.dPrime}</span>
                                    <span className="savt-metric-key">d′ (Sensitivity)</span>
                                </div>
                                <div className="savt-metric">
                                    <span className="savt-metric-val">{Math.round(result.features.hitRate * 100)}%</span>
                                    <span className="savt-metric-key">Hit Rate</span>
                                </div>
                                <div className="savt-metric">
                                    <span className="savt-metric-val">{Math.round(result.features.falseAlarmRate * 100)}%</span>
                                    <span className="savt-metric-key">False Alarm Rate</span>
                                </div>
                                <div className="savt-metric">
                                    <span className="savt-metric-val">{result.features.meanResponseTimeMs}ms</span>
                                    <span className="savt-metric-key">Mean RT</span>
                                </div>
                            </div>
                        </div>

                        <div className="savt-vigilance-chart glass-card">
                            <h3>Vigilance Over Time</h3>
                            <div className="savt-block-bars">
                                {result.rawMetrics.blockHitRates.map((rate, i) => (
                                    <div key={i} className="savt-block-bar-wrapper">
                                        <div className="savt-block-bar"
                                            style={{ height: `${Math.max(5, rate * 100)}%` }}>
                                            <span className="savt-block-val">{Math.round(rate * 100)}%</span>
                                        </div>
                                        <span className="savt-block-label">Q{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="savt-errors glass-card">
                            <h3>Error Analysis</h3>
                            <div className="savt-error-row">
                                <span>Commission Errors (Impulsivity)</span>
                                <span className={result.features.commissionErrorRate > 0.3 ? 'text-danger' : ''}>
                                    {Math.round(result.features.commissionErrorRate * 100)}%
                                </span>
                            </div>
                            <div className="savt-error-row">
                                <span>Omission Errors (Inattention)</span>
                                <span className={result.features.omissionErrorRate > 0.3 ? 'text-danger' : ''}>
                                    {Math.round(result.features.omissionErrorRate * 100)}%
                                </span>
                            </div>
                            <div className="savt-error-row">
                                <span>Response Time Variability</span>
                                <span>{result.features.rtVariability}ms SD</span>
                            </div>
                        </div>

                        <div className="savt-factors glass-card">
                            <h3>Key Insights</h3>
                            <ul>
                                {result.explainability.keyFactors.map((f, i) => (
                                    <li key={i}>{f}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="savt-actions">
                            <Button variant="secondary" onClick={() => navigate('/tests')}>
                                Back to Tests
                            </Button>
                            <Button variant="primary" onClick={() => navigate('/dashboard')}>
                                View Dashboard
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // ─── Render ───────────────────────────────────────────────────

    return (
        <PageWrapper>
            <div className="savt container">
                {renderPhase()}
            </div>
        </PageWrapper>
    );
}
