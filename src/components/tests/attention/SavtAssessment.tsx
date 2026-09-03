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
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
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
import '../story/StoryAssessment.css';
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { user, isAuthenticated } = useAuth();
    const { results, saveResult } = useAttentionResults();
    const config = DEFAULT_SAVT_CONFIG;

    // Custom tick renderer for Radar Chart
    const renderCustomAxisTick = ({ payload, x, y, cx, cy }: any) => {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offsetX = dist > 0 ? x + (dx / dist) * 8 : x;
        const offsetY = dist > 0 ? y + (dy / dist) * 8 : y;

        let textAnchor: "start" | "middle" | "end" = "middle";
        if (dx > 12) {
            textAnchor = "start";
        } else if (dx < -12) {
            textAnchor = "end";
        }

        return (
            <text
                x={offsetX}
                y={offsetY}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill={isDark ? "#E2ECF2" : "#17324D"}
                fontSize={10}
                fontWeight={600}
                className="radar-axis-tick select-none"
            >
                {payload.value}
            </text>
        );
    };

    // ─── State ────────────────────────────────────────────────────
    const [phase, setPhase] = useState<SavtPhase>('instructions');
    const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
    const [showStimulus, setShowStimulus] = useState(false);
    const [trialIndex, setTrialIndex] = useState(0);
    const [result, setResult] = useState<SavtAssessmentResult | null>(null);
    const [sessionTarget, setSessionTarget] = useState<SessionTarget>(() => pickSessionTarget());
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Practice & Test Feedback UI state
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceTotal, setPracticeTotal] = useState(0);
    const [practiceFeedback, setPracticeFeedback] = useState<{
        show: boolean;
        correct: boolean;
        message: string;
    }>({ show: false, correct: false, message: '' });
    const [testFeedback, setTestFeedback] = useState<{
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
        const target = sessionTargetRef.current;

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
    }, [config, clearAllTimers, runPracticeTrial, isAuthenticated]);

    const finishTest = useCallback(() => {
        clearAllTimers();
        setPhase('scoring');
        setShowStimulus(false);
        setTestFeedback({ show: false, correct: false, message: '' });
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
        setTestFeedback({ show: false, correct: false, message: '' });

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
                    const outcome = getTrialOutcome(seq[idx], false);
                    const trial: TrialEvent = {
                        trialIndex: idx,
                        stimulus: stim,
                        responseTimestamp: null,
                        stimulusOnsetTimestamp: stimulusOnsetRef.current,
                        stimulusOffsetTimestamp: stimulusOnsetRef.current + config.stimulusDurationMs,
                        reactionTimeMs: null,
                        didRespond: false,
                        outcome,
                        blockIndex: getBlockIndex(idx, config),
                    };
                    trialsRef.current = [...trialsRef.current, trial];

                    // Immediate feedback for withholding
                    const correct = outcome === 'correct_rejection';
                    setTestFeedback({
                        show: true,
                        correct,
                        message: correct
                            ? '✓ Correct! You held back.'
                            : `✗ Missed! Tap the ${target.label}.`,
                    });

                    setTimeout(() => {
                        setTestFeedback({ show: false, correct: false, message: '' });
                        runTestTrial(seq, idx + 1, target);
                    }, 1000);
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
        const target = sessionTargetRef.current;

        const outcome = getTrialOutcome(seq[idx], true);
        const trial: TrialEvent = {
            trialIndex: idx,
            stimulus: stim,
            responseTimestamp: responseTime,
            stimulusOnsetTimestamp: stimulusOnsetRef.current,
            stimulusOffsetTimestamp: stimulusOnsetRef.current + config.stimulusDurationMs,
            reactionTimeMs: rt,
            didRespond: true,
            outcome,
            blockIndex: getBlockIndex(idx, config),
        };

        trialsRef.current = [...trialsRef.current, trial];
        hideStimulusFromScreen();

        // Immediate feedback for tap
        const correct = outcome === 'hit';
        setTestFeedback({
            show: true,
            correct,
            message: correct
                ? '✓ Correct! Quick response.'
                : `✗ Only tap the ${target.label}!`,
        });

        setTimeout(() => {
            setTestFeedback({ show: false, correct: false, message: '' });
            runTestTrial(seq, idx + 1, target);
        }, 1000);
    }, [config, clearAllTimers, hideStimulusFromScreen, runTestTrial]);

    const startTest = useCallback(() => {
        clearAllTimers();
        const seq = generateTrialSequence(config);
        sequenceRef.current = seq;
        trialsRef.current = [];
        trialIndexRef.current = 0;
        setTrialIndex(0);
        setTestFeedback({ show: false, correct: false, message: '' });
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
                                {!showStimulus && !testFeedback.show && (
                                    <div className="savt-fixation-cross">+</div>
                                )}
                                {testFeedback.show && (
                                    <div className={`savt-feedback-pill ${testFeedback.correct ? 'correct' : 'incorrect'}`}>
                                        {testFeedback.message}
                                    </div>
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
                    {phase === 'results' && result && (() => {
                        const scorePercent = result.profile.compositeScore;
                        const hitRatePercent = Math.round(result.features.hitRate * 100);
                        const dPrime = result.features.dPrime.toFixed(2);
                        const commissionErrorPercent = Math.round(result.features.commissionErrorRate * 100);
                        const inhibitionPercent = Math.max(0, 100 - commissionErrorPercent);
                        const meanRt = result.features.meanResponseTimeMs > 0 ? Math.round(result.features.meanResponseTimeMs) : 0;
                        const stabilityPercent = Math.round(Math.max(10, Math.min(100, 100 - (result.features.omissionErrorRate * 100))));

                        const raw = result.rawMetrics || (result as any).metrics || {};
                        const totalGo = raw.totalGoTrials ?? 28;
                        const hits = raw.hits ?? Math.round((result.features?.hitRate || 0) * totalGo);
                        const blockRates: number[] = raw.blockHitRates && raw.blockHitRates.length > 0
                            ? raw.blockHitRates
                            : [result.features?.hitRate || 0.85, result.features?.hitRate || 0.85, result.features?.hitRate || 0.85, result.features?.hitRate || 0.85];

                        const getScoreTier = (score: number) => {
                            if (score >= 80) return { label: "High Vigilance", level: "stable" as const };
                            if (score >= 60) return { label: "Moderate Vigilance", level: "change_detected" as const };
                            return { label: "Needs Practice", level: "possible_risk" as const };
                        };

                        const tier = getScoreTier(scorePercent);

                        // Trend computation
                        const pastResults = results || [];
                        const prevSession = pastResults.length > 0 ? pastResults[pastResults.length - 1] : null;
                        const prevScore = (prevSession as any)?.profile?.compositeScore ?? (prevSession as any)?.score;
                        const isImproving = prevScore ? (scorePercent >= prevScore) : (scorePercent >= 60);
                        const trend: "up" | "down" = isImproving ? "up" : "down";

                        const speedScore = Math.max(15, Math.min(100, Math.round(100 - Math.max(0, (meanRt - 250) / 4.5))));
                        const sensitivityScore = Math.round(Math.min(100, Math.max(10, (result.features.dPrime / 3.8) * 100)));

                        const radarData = [
                            { subject: "Sensitivity (d′)", A: sensitivityScore, fullMark: 100 },
                            { subject: "Target Hit Rate", A: hitRatePercent, fullMark: 100 },
                            { subject: "Inhibitory Control", A: inhibitionPercent, fullMark: 100 },
                            { subject: "Response Speed", A: speedScore, fullMark: 100 },
                            { subject: "Vigilance Stability", A: stabilityPercent, fullMark: 100 },
                            { subject: "Task Efficiency", A: scorePercent, fullMark: 100 },
                        ];

                        return (
                            <div className="story-results-container animate-fadeIn">
                                {/* Top Overview Card */}
                                <Card className="results-overview-card">
                                    <div className="overview-header">
                                        <div className="overview-title-group">
                                            <h2 className="vyom-serif">Attention Profile</h2>
                                            <span className={`story-trend-pill ${trend === "up" ? "trend-up" : "trend-down"}`}>
                                                <Icon name={trend === "up" ? "trend-up" : "trend-down"} size={13} />
                                                <span>{trend === "up" ? "Improving" : "Declining"}</span>
                                            </span>
                                        </div>
                                        <div className="score-badge-circle">
                                            <span className="score-num">{scorePercent}</span>
                                            <span className="score-denom">/ 100</span>
                                        </div>
                                    </div>
                                </Card>

                                <MotivationalQuoteBlock
                                    category={tier.label}
                                    score={scorePercent}
                                />

                                {/* Biomarkers Breakdown Row (2x2 grid) */}
                                <div className="biomarkers-grid-row">
                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Target Sensitivity</h4>
                                            <p className="metric-desc">Signal discrimination (d′: {dPrime})</p>
                                        </div>
                                        <div className="metric-val">{hitRatePercent}%</div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Inhibitory Control</h4>
                                            <p className="metric-desc">Distractor suppression rate</p>
                                        </div>
                                        <div className="metric-val">{inhibitionPercent}%</div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Response Latency</h4>
                                            <p className="metric-desc">Average target reaction speed</p>
                                        </div>
                                        <div className="metric-val">{meanRt > 0 ? meanRt : "—"} <span className="metric-unit">ms</span></div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>Vigilance Stability</h4>
                                            <p className="metric-desc">Sustained attention over blocks</p>
                                        </div>
                                        <div className="metric-val">{stabilityPercent}%</div>
                                    </Card>
                                </div>

                                {/* Full-Length Biomarker Radar & Block Performance Card */}
                                <Card className="radar-chart-card full-width-radar">
                                    <h3 className="radar-title">Biomarker Radar</h3>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={155}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="52%" data={radarData}>
                                                <PolarGrid stroke={isDark ? "rgba(0, 201, 183, 0.22)" : "rgba(79, 124, 120, 0.22)"} />
                                                <PolarAngleAxis
                                                    dataKey="subject"
                                                    tick={renderCustomAxisTick}
                                                    tickLine={false}
                                                />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" tick={false} />
                                                <Radar
                                                    name="Biomarkers"
                                                    dataKey="A"
                                                    stroke={isDark ? "#00C9B7" : "#4F7C78"}
                                                    fill={isDark ? "#00C9B7" : "#4F7C78"}
                                                    fillOpacity={isDark ? 0.35 : 0.28}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Block-by-Block Vigilance Performance */}
                                    <div className="savt-blocks-section">
                                        <div className="savt-blocks-header">
                                            <span className="savt-blocks-title">Vigilance Over Time</span>
                                            <span className="savt-blocks-badge">{hits} / {totalGo} Targets Hit</span>
                                        </div>
                                        <div className="savt-blocks-grid">
                                            {blockRates.map((rate, i) => (
                                                <div key={i} className="savt-block-chip">
                                                    <span className="block-chip-tag">Quarter {i + 1}</span>
                                                    <span className="block-chip-val">{Math.round(rate * 100)}% Hit</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Centered Actions */}
                                <div className="results-actions">
                                    <button type="button" onClick={handleRetake} className="story-retake-btn">
                                        <Icon name="reaction" size={15} /> Retake Test
                                    </button>
                                    <button
                                        type="button"
                                        className="story-primary-start-btn story-back-assessments-btn"
                                        onClick={() => navigate("/tests")}
                                    >
                                        Back to Assessments
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
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
