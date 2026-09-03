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
import { Button, Card, Icon, TutorialVideoPlaceholder, MotivationalQuoteBlock } from '../../common';
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
const COLOR_TINTS: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', text: '#15803d' },
    red: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#b91c1c' },
    blue: { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', text: '#1d4ed8' },
    orange: { bg: 'rgba(249, 115, 22, 0.12)', border: '#f97316', text: '#c2410c' },
};

export function SavtAssessment() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { saveResult } = useAttentionResults();
    const config = DEFAULT_SAVT_CONFIG;

    // ─── State ────────────────────────────────────────────────────
    const [phase, setPhase] = useState<SavtPhase>('instructions');
    const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
    const [showStimulus, setShowStimulus] = useState(false);
    const [trialIndex, setTrialIndex] = useState(0);
    const [result, setResult] = useState<SavtAssessmentResult | null>(null);
    const [sessionTarget, setSessionTarget] = useState<SessionTarget>(() => pickSessionTarget());
    const [showExitConfirm, setShowExitConfirm] = useState(false);

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
    const activeStageRef = useRef<HTMLDivElement>(null);

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
        if (!isAuthenticated) return;
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

        setTimeout(() => {
            runPracticeTrial(seq, 0, target);
        }, 150);
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
        }, 1500);
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
        }, 150);
    }, [config, clearAllTimers, runTestTrial]);

    // ─── Global Keyboard Listener (Spacebar & Enter) ──────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter') {
                if (phaseRef.current === 'practice') {
                    e.preventDefault();
                    handlePracticeResponse();
                } else if (phaseRef.current === 'testing') {
                    e.preventDefault();
                    handleTestResponse();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePracticeResponse, handleTestResponse]);

    // ─── Exit Navigation ──────────────────────────────────────────
    const handleExitClick = () => {
        if (phase === 'instructions' || phase === 'results') {
            navigate('/tests');
            return;
        }
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        clearAllTimers();
        setShowExitConfirm(false);
        navigate('/tests');
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    const handleRetake = () => {
        clearAllTimers();
        setPhase('instructions');
        setResult(null);
        setSessionTarget(pickSessionTarget());
        setTrialIndex(0);
        setPracticeIndex(0);
        setPracticeComplete(false);
    };

    // ─── Stimulus Renderer ────────────────────────────────────────
    const renderStimulus = (stim: Stimulus, isSmall = false) => {
        const colorMap: Record<string, string> = {
            green: '#22c55e',
            red: '#ef4444',
            blue: '#3b82f6',
            orange: '#f97316',
        };
        const fill = colorMap[stim.color] || '#22c55e';

        return (
            <div className={`savt-stimulus ${isSmall ? 'savt-stimulus-small' : 'savt-stimulus-large'}`} aria-label={stim.label}>
                {stim.shape === 'circle' && (
                    <svg viewBox="0 0 100 100" className="savt-svg">
                        <circle cx="50" cy="50" r="42" fill={fill} />
                    </svg>
                )}
                {stim.shape === 'square' && (
                    <svg viewBox="0 0 100 100" className="savt-svg">
                        <rect x="10" y="10" width="80" height="80" rx="8" fill={fill} />
                    </svg>
                )}
                {stim.shape === 'triangle' && (
                    <svg viewBox="0 0 100 100" className="savt-svg">
                        <polygon points="50,10 90,85 10,85" fill={fill} />
                    </svg>
                )}
                {stim.shape === 'diamond' && (
                    <svg viewBox="0 0 100 100" className="savt-svg">
                        <polygon points="50,5 95,50 50,95 5,50" fill={fill} />
                    </svg>
                )}
            </div>
        );
    };

    const progressPct = phase === 'testing'
        ? Math.round(((trialIndex + 1) / config.totalTrials) * 100)
        : phase === 'practice'
            ? Math.round(((practiceIndex + 1) / Math.max(1, practiceTotal)) * 100)
            : 0;

    const goTint = COLOR_TINTS[sessionTarget.color] || COLOR_TINTS.green;

    // ─── Render ───────────────────────────────────────────────────

    return (
        <PageWrapper>
            <div className="savt-test-page story-assessment-container container">
                {/* Top Navigation Bar: Back / Exit Control */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label="Back to Assessments"
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>Back to Assessments</span>
                    </button>

                    <div className="story-module-badge">
                        <span className="badge-dot" aria-hidden="true" />
                        <span>Cognitive Assessment</span>
                    </div>
                </div>

                {/* Primary Test Header (shown only on instructions intro) */}
                {phase === 'instructions' && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">Attention</h1>
                        <p className="story-subtitle">
                            Sustained visual vigilance and inhibitory control assessment.
                        </p>
                    </div>
                )}

                {/* Active Stage Viewport */}
                <div ref={activeStageRef} className="story-stage-viewport savt-stage-viewport">
                    {/* 1. Simplified Instructions Phase */}
                    {phase === 'instructions' && (
                        <div className="instructions-with-tutorial-layout animate-fadeIn">
                            <Card className="instructions-card savt-intro-card">
                                <div className="instructions-content">
                                    <div className="instructions-icon-wrapper" aria-hidden="true">
                                        <Icon name="attention" size={28} />
                                    </div>
                                    <h2 className="instructions-card-title vyom-serif">How this assessment works</h2>

                                    {/* Clear Side-by-Side Target Rule Cards */}
                                    <div className="savt-rules-comparison">
                                        <div className="savt-rule-card savt-rule-target" style={{ background: goTint.bg, borderColor: goTint.border }}>
                                            <div className="savt-rule-icon">
                                                {renderStimulus(createStimulus('go', sessionTarget), true)}
                                            </div>
                                            <div className="savt-rule-detail">
                                                <span className="savt-rule-pill go" style={{ background: goTint.border, color: '#FFFFFF' }}>TAP</span>
                                                <div className="rule-title">{sessionTarget.label}</div>
                                                <p className="rule-desc">Tap ONLY for this exact shape & color</p>
                                            </div>
                                        </div>

                                        <div className="savt-rule-card savt-rule-distractor">
                                            <div className="savt-rule-icon">
                                                {renderStimulus(createStimulus('nogo', sessionTarget), true)}
                                            </div>
                                            <div className="savt-rule-detail">
                                                <span className="savt-rule-pill nogo">DON'T TAP</span>
                                                <div className="rule-title">Any Other Item</div>
                                                <p className="rule-desc">Ignore different shape OR color</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3 Clear Simple Instructions */}
                                    <ol className="instructions-step-list">
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">1</div>
                                            <div className="step-content">
                                                <strong>Target Match:</strong>
                                                <span>Respond ONLY when you see the <strong>{sessionTarget.label}</strong>.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">2</div>
                                            <div className="step-content">
                                                <strong>Inhibit Distractors:</strong>
                                                <span>Do NOT tap for any other shape or color.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">3</div>
                                            <div className="step-content">
                                                <strong>Controls:</strong>
                                                <span>Tap the screen, click, or press <strong>Spacebar</strong>.</span>
                                            </div>
                                        </li>
                                    </ol>

                                    <div className="instructions-action-row">
                                        <Button
                                            variant="primary"
                                            className="story-primary-start-btn"
                                            onClick={startPractice}
                                        >
                                            Start Practice
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Tutorial Video Placeholder */}
                            <TutorialVideoPlaceholder />
                        </div>
                    )}

                    {/* 2. Practice Arena (Large, Perfectly Sized Canvas) */}
                    {phase === 'practice' && (
                        <div
                            className="savt-gameplay-arena animate-fadeIn"
                            onClick={handlePracticeResponse}
                            role="button"
                            tabIndex={0}
                            aria-label="Tap area for practice — or press spacebar"
                        >
                            {/* Top Progress Bar */}
                            <div className="savt-top-progress-bar">
                                <div className="savt-progress-track">
                                    <div className="savt-progress-fill practice" style={{ width: `${progressPct}%` }} />
                                </div>
                                <div className="savt-progress-info">
                                    <span className="savt-round-lbl">Practice {practiceIndex + 1} of {practiceTotal}</span>
                                    <span className="savt-target-pill" style={{ background: goTint.bg, color: goTint.text, borderColor: goTint.border }}>
                                        Target: {sessionTarget.label}
                                    </span>
                                </div>
                            </div>

                            {/* Center Large Stimulus Stage */}
                            <div className="savt-stimulus-stage">
                                {showStimulus && currentStimulus && renderStimulus(currentStimulus, false)}
                                {!showStimulus && !practiceFeedback.show && !practiceComplete && (
                                    <div className="savt-fixation-cross">+</div>
                                )}
                                {practiceFeedback.show && (
                                    <div className={`savt-feedback-pill ${practiceFeedback.correct ? 'correct' : 'incorrect'}`}>
                                        {practiceFeedback.message}
                                    </div>
                                )}
                            </div>

                            {practiceComplete && !practiceFeedback.show ? (
                                <div className="savt-practice-done-modal animate-fadeInUp">
                                    <h3>Practice Complete!</h3>
                                    <p>You are ready for the scored assessment.</p>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={(e) => { e.stopPropagation(); startTest(); }}
                                    >
                                        Start Scored Assessment
                                    </Button>
                                </div>
                            ) : (
                                <p className="savt-bottom-hint">Tap screen or press <strong>Spacebar</strong> when target appears</p>
                            )}
                        </div>
                    )}

                    {/* 3. Scored Test Arena (Large, Perfectly Sized Canvas) */}
                    {phase === 'testing' && (
                        <div
                            className="savt-gameplay-arena animate-fadeIn"
                            onClick={handleTestResponse}
                            role="button"
                            tabIndex={0}
                            aria-label="Tap area for test — or press spacebar"
                        >
                            {/* Top Progress Bar */}
                            <div className="savt-top-progress-bar">
                                <div className="savt-progress-track">
                                    <div className="savt-progress-fill" style={{ width: `${progressPct}%` }} />
                                </div>
                                <div className="savt-progress-info">
                                    <span className="savt-round-lbl">Trial {Math.min(trialIndex + 1, config.totalTrials)} of {config.totalTrials}</span>
                                    <span className="savt-target-pill" style={{ background: goTint.bg, color: goTint.text, borderColor: goTint.border }}>
                                        Target: {sessionTarget.label}
                                    </span>
                                </div>
                            </div>

                            {/* Center Large Stimulus Stage */}
                            <div className="savt-stimulus-stage">
                                {showStimulus && currentStimulus && renderStimulus(currentStimulus, false)}
                                {!showStimulus && (
                                    <div className="savt-fixation-cross">+</div>
                                )}
                            </div>

                            <p className="savt-bottom-hint">Tap screen or press <strong>Spacebar</strong> for target cue only</p>
                        </div>
                    )}

                    {/* 4. Scoring Phase */}
                    {phase === 'scoring' && (
                        <div className="savt-scoring-arena animate-fadeIn">
                            <div className="savt-scoring-spinner" />
                            <h2>Analyzing Vigilance Profile...</h2>
                            <p>Computing signal detection sensitivity and response latency</p>
                        </div>
                    )}

                    {/* 5. Results Phase */}
                    {phase === 'results' && result && (
                        <div className="savt-results-container animate-fadeIn">
                            <Card className="savt-results-card">
                                <div className="results-overview-header">
                                    <div>
                                        <h2 className="vyom-serif">Attention Profile</h2>
                                        <p className="results-sub">Sustained vigilance, signal sensitivity, and response inhibition.</p>
                                    </div>
                                    <div className="savt-icon-badge">🎯</div>
                                </div>

                                {(() => {
                                    const feedback = getAttentionFeedback(result.features.dPrime);
                                    const stars = result.profile.starRating;

                                    return (
                                        <>
                                            <div className="savt-stars-row">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <span key={s} className={`savt-star ${s <= stars ? 'filled' : ''}`}>★</span>
                                                ))}
                                            </div>

                                            <div className="savt-split-results-grid">
                                                {/* Left Column: Core Performance Metrics */}
                                                <div className="savt-metric-column">
                                                    <div className="savt-summary-box">
                                                        <div className="savt-score-num">{result.profile.compositeScore}</div>
                                                        <div className="savt-score-tag">Composite Score</div>
                                                    </div>
                                                    <div className="savt-mini-metrics">
                                                        <div className="mini-metric-item">
                                                            <span className="mini-lbl">Sensitivity (d′)</span>
                                                            <span className="mini-val">{result.features.dPrime}</span>
                                                        </div>
                                                        <div className="mini-metric-item">
                                                            <span className="mini-lbl">Hit Rate</span>
                                                            <span className="mini-val">{Math.round(result.features.hitRate * 100)}%</span>
                                                        </div>
                                                        <div className="mini-metric-item">
                                                            <span className="mini-lbl">False Alarms</span>
                                                            <span className="mini-val">{Math.round(result.features.falseAlarmRate * 100)}%</span>
                                                        </div>
                                                        <div className="mini-metric-item">
                                                            <span className="mini-lbl">Mean Reaction</span>
                                                            <span className="mini-val">{result.features.meanResponseTimeMs}ms</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Error Breakdown & Feedback */}
                                                <div className="savt-metric-column">
                                                    <div className="savt-feedback-box">
                                                        <div className="feedback-badge">{feedback.category}</div>
                                                        <p className="feedback-text">{feedback.message}</p>
                                                    </div>

                                                    <div className="savt-errors-list">
                                                        <div className="error-item">
                                                            <span>Commission Errors (Impulsivity)</span>
                                                            <span className="error-val">{Math.round(result.features.commissionErrorRate * 100)}%</span>
                                                        </div>
                                                        <div className="error-item">
                                                            <span>Omission Errors (Inattention)</span>
                                                            <span className="error-val">{Math.round(result.features.omissionErrorRate * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <MotivationalQuoteBlock
                                                category={feedback.category}
                                                starRating={stars}
                                                score={result.profile.compositeScore}
                                            />
                                        </>
                                    );
                                })()}

                                <div className="results-actions">
                                    <Button variant="secondary" onClick={handleRetake}>
                                        <Icon name="assess" size={16} /> Retake Test
                                    </Button>
                                    <Button variant="primary" onClick={() => navigate('/tests')}>
                                        Back to Assessments
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="story-modal-backdrop animate-fadeIn" role="dialog" aria-modal="true">
                        <div className="story-exit-modal animate-scaleUp">
                            <div className="exit-modal-icon">⚠️</div>
                            <h3 className="exit-modal-title vyom-serif">Leave this assessment?</h3>
                            <p className="exit-modal-text">
                                Your current assessment progress will be lost if you leave now.
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    Continue Test
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    Leave Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
