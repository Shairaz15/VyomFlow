import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { Button, Card, Icon, TutorialVideoPlaceholder, MotivationalQuoteBlock } from "../../common";
import type { ReactionState, RoundResult } from "./reactionLogic";
import {
    DEFAULT_CONFIG,
    getRandomWaitTime,
    isCalibrationRound,
    isTestComplete,
    STATE_MESSAGES,
} from "./reactionLogic";
import { createReactionTestResult } from "./reactionFeatures";
import { useReactionResults } from "../../../hooks/useTestResults";
import { getReactionFeedback } from "../../../utils/normativeStats";
import { PageWrapper } from "../../layout";
import "./ReactionTimeTest.css";

export function ReactionTimeTest() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { saveResult } = useReactionResults();
    const [state, setState] = useState<ReactionState>("idle");
    const [roundIndex, setRoundIndex] = useState(0);
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);
    const [message, setMessage] = useState(STATE_MESSAGES.idle);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const stimulusStartTime = useRef<number>(0);
    const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeStageRef = useRef<HTMLDivElement>(null);

    const config = DEFAULT_CONFIG;

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
            if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
        };
    }, []);

    // Begin a round (wait phase)
    const startRound = useCallback(() => {
        const isCalibration = isCalibrationRound(roundIndex, config);
        setState(isCalibration ? "calibration" : "wait");
        setMessage(isCalibration ? STATE_MESSAGES.calibration : STATE_MESSAGES.wait);
        setCurrentReactionTime(null);

        const waitTime = getRandomWaitTime(config);
        waitTimeoutRef.current = setTimeout(() => {
            // Show stimulus
            setState("stimulus");
            setMessage(STATE_MESSAGES.stimulus);
            stimulusStartTime.current = performance.now();

            // Start timeout timer
            responseTimeoutRef.current = setTimeout(() => {
                handleTimeout();
            }, config.timeoutMs);
        }, waitTime);
    }, [roundIndex, config]);

    // Start the test from idle
    const handleStart = useCallback(() => {
        if (!isAuthenticated) return;
        setRoundIndex(0);
        setRounds([]);
        startRound();
    }, [isAuthenticated, startRound]);

    // Advance to next round or complete test
    const advanceRound = useCallback(() => {
        const nextRound = roundIndex + 1;
        if (isTestComplete(nextRound, config)) {
            setState("test_complete");
            setMessage(STATE_MESSAGES.test_complete);
        } else {
            setRoundIndex(nextRound);
            setState("round_complete");
            setMessage(STATE_MESSAGES.round_complete);
        }
    }, [roundIndex, config]);

    // Handle user click during different states
    const handleClick = useCallback(() => {
        const isCalibration = isCalibrationRound(roundIndex, config);

        if (state === "wait" || state === "calibration") {
            // False start
            if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
            setState("false_start");
            setMessage(STATE_MESSAGES.false_start);

            const result: RoundResult = {
                reactionTime: null,
                isFalseStart: true,
                isTimeout: false,
                roundIndex,
                isCalibration,
            };
            setRounds((prev) => [...prev, result]);

            setTimeout(() => {
                advanceRound();
            }, config.roundDelayMs);
        } else if (state === "stimulus") {
            // Valid response
            if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
            const reactionTime = Math.round(performance.now() - stimulusStartTime.current);
            setCurrentReactionTime(reactionTime);
            setState("response");
            setMessage(`${reactionTime} ms`);

            const result: RoundResult = {
                reactionTime,
                isFalseStart: false,
                isTimeout: false,
                roundIndex,
                isCalibration,
            };
            setRounds((prev) => [...prev, result]);

            setTimeout(() => {
                advanceRound();
            }, config.roundDelayMs);
        }
    }, [state, roundIndex, config, advanceRound]);

    // Handle timeout when user doesn't respond in time
    const handleTimeout = useCallback(() => {
        const isCalibration = isCalibrationRound(roundIndex, config);
        setState("timeout");
        setMessage(STATE_MESSAGES.timeout);

        const result: RoundResult = {
            reactionTime: null,
            isFalseStart: false,
            isTimeout: true,
            roundIndex,
            isCalibration,
        };
        setRounds((prev) => [...prev, result]);

        setTimeout(() => {
            advanceRound();
        }, config.roundDelayMs);
    }, [roundIndex, config, advanceRound]);

    // Global keyboard listener for spacebar and enter (captures anywhere on the page)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === " " || e.code === "Space" || e.key === "Enter") {
                if (["wait", "calibration", "stimulus"].includes(state)) {
                    e.preventDefault();
                    handleClick();
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown, { passive: false });
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [state, handleClick]);

    // Continue to next round after round_complete
    useEffect(() => {
        if (state === "round_complete") {
            const timer = setTimeout(() => {
                startRound();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [state, startRound]);

    // Complete test and navigate to results
    const handleFinish = () => {
        const result = createReactionTestResult(rounds);
        sessionStorage.setItem("lastReactionResult", JSON.stringify(result));
        saveResult(result);
        navigate("/tests");
    };

    const handleRetake = () => {
        setState("idle");
        setRoundIndex(0);
        setRounds([]);
        setCurrentReactionTime(null);
        setMessage(STATE_MESSAGES.idle);
    };

    // Exit / Back Navigation
    const handleExitClick = () => {
        if (state === "idle" || state === "test_complete") {
            navigate("/tests");
            return;
        }
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
        if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
        setShowExitConfirm(false);
        navigate("/tests");
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    // Get background state class
    const getBackgroundClass = () => {
        switch (state) {
            case "wait":
            case "calibration":
                return "bg-ready";
            case "stimulus":
                return "bg-stimulus";
            case "false_start":
                return "bg-error";
            case "response":
                return "bg-success";
            case "timeout":
                return "bg-error";
            default:
                return "";
        }
    };

    return (
        <PageWrapper>
            <div className="reaction-test-page story-assessment-container container">
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
                {state === "idle" && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">Reaction Time</h1>
                        <p className="story-subtitle">
                            Respond rapidly to visual cues to measure motor processing speed and attentional vigilance.
                        </p>
                    </div>
                )}

                {/* Active Stage Viewport */}
                <div ref={activeStageRef} className="story-stage-viewport reaction-stage-viewport">
                    {/* 1. Instructions / Idle Phase */}
                    {state === "idle" && (
                        <div className="instructions-with-tutorial-layout animate-fadeIn">
                            <Card className="instructions-card">
                                <div className="instructions-content">
                                    <div className="instructions-icon-wrapper" aria-hidden="true">
                                        <Icon name="reaction" size={28} />
                                    </div>
                                    <h2 className="instructions-card-title vyom-serif">How this assessment works</h2>

                                    <ol className="instructions-step-list">
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">1</div>
                                            <div className="step-content">
                                                <strong>Wait for Color Shift:</strong>
                                                <span>Keep your finger or mouse poised while the screen is waiting.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">2</div>
                                            <div className="step-content">
                                                <strong>Instant Response:</strong>
                                                <span>Tap, click, or press spacebar as soon as the glowing stimulus appears.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">3</div>
                                            <div className="step-content">
                                                <strong>Avoid False Starts:</strong>
                                                <span>Tapping too early registers a false start penalty for that trial.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">4</div>
                                            <div className="step-content">
                                                <strong>Complete 6 Rounds:</strong>
                                                <span>Round 1 calibrates latency followed by 5 scored precision trials.</span>
                                            </div>
                                        </li>
                                    </ol>

                                    <div className="instructions-action-row">
                                        <Button
                                            variant="primary"
                                            className="story-primary-start-btn"
                                            onClick={handleStart}
                                        >
                                            Start Test
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Tutorial Video Placeholder */}
                            <TutorialVideoPlaceholder />
                        </div>
                    )}

                    {/* 2. Active Game Arena */}
                    {state !== "idle" && state !== "test_complete" && (
                        <div
                            className={`reaction-interactive-card animate-fadeIn ${getBackgroundClass()}`}
                            onClick={["wait", "calibration", "stimulus"].includes(state) ? handleClick : undefined}
                            role="button"
                            tabIndex={0}
                            aria-label={
                                state === "wait" || state === "calibration"
                                    ? "Wait for green light, then click or press spacebar as quickly as possible"
                                    : state === "stimulus"
                                        ? "Green light - click or press spacebar now!"
                                        : undefined
                            }
                        >
                            {/* Round Progress Pill */}
                            <div className="reaction-progress-pill">
                                <span>Round {Math.min(roundIndex + 1, config.totalRounds)} of {config.totalRounds}</span>
                                {roundIndex < config.calibrationRounds && (
                                    <span className="calib-tag">Calibration</span>
                                )}
                            </div>

                            {/* State Visual Indicator Icon */}
                            <div className="reaction-state-icon-bubble" aria-hidden="true">
                                {state === "stimulus" && <span className="icon-pulse">⚡</span>}
                                {(state === "wait" || state === "calibration") && <span className="icon-wait">🔴</span>}
                                {state === "false_start" && <span>⚠️</span>}
                                {state === "timeout" && <span>⏱️</span>}
                                {state === "response" && <span>✓</span>}
                            </div>

                            {/* Main Message */}
                            <h2 className="reaction-prompt-message">{message}</h2>

                            {/* Reaction time display */}
                            {currentReactionTime !== null && (
                                <div className="reaction-time-stat">
                                    <span className="stat-val">{currentReactionTime}</span>
                                    <span className="stat-unit">ms</span>
                                </div>
                            )}

                            {/* Tap Hint */}
                            {["wait", "calibration", "stimulus"].includes(state) && (
                                <p className="reaction-tap-hint">
                                    {state === "stimulus" ? "⚡ PRESS SPACEBAR OR TAP NOW ⚡" : "Tap screen or press spacebar"}
                                </p>
                            )}
                        </div>
                    )}

                    {/* 3. Test Complete / Results Phase */}
                    {state === "test_complete" && (
                        <div className="reaction-results-container animate-fadeIn">
                            <Card className="reaction-results-card">
                                <div className="results-overview-header">
                                    <div>
                                        <h2 className="vyom-serif">Reaction Time Profile</h2>
                                        <p className="results-sub">Attentional vigilance and motor processing latency.</p>
                                    </div>
                                    <div className="reaction-icon-badge">⚡</div>
                                </div>

                                {(() => {
                                    const testRounds = rounds.filter((r) => !r.isCalibration);
                                    const validRounds = testRounds.filter((r) => !r.isFalseStart && !r.isTimeout);
                                    const falseStarts = testRounds.filter((r) => r.isFalseStart).length;
                                    const timeouts = testRounds.filter((r) => r.isTimeout).length;
                                    const avgTime = validRounds.length > 0 
                                        ? Math.round(validRounds.reduce((a, b) => a + (b.reactionTime || 0), 0) / validRounds.length)
                                        : 0;
                                    const fastestTime = validRounds.length > 0
                                        ? Math.min(...validRounds.map(r => r.reactionTime || 9999))
                                        : 0;
                                    const feedback = getReactionFeedback(avgTime || 300);

                                    return (
                                        <>
                                            <div className="reaction-metrics-grid">
                                                <div className="reaction-metric-box">
                                                    <span className="metric-tag">Fastest Response</span>
                                                    <div className="metric-num">
                                                        {fastestTime > 0 ? fastestTime : "—"} <span className="unit">ms</span>
                                                    </div>
                                                </div>
                                                <div className="reaction-metric-box">
                                                    <span className="metric-tag">Average Response</span>
                                                    <div className="metric-num">
                                                        {avgTime > 0 ? avgTime : "—"} <span className="unit">ms</span>
                                                    </div>
                                                </div>
                                                <div className="reaction-metric-box">
                                                    <span className="metric-tag">False Starts</span>
                                                    <div className="metric-num">{falseStarts}</div>
                                                </div>
                                                <div className="reaction-metric-box">
                                                    <span className="metric-tag">Timeouts</span>
                                                    <div className="metric-num">{timeouts}</div>
                                                </div>
                                            </div>

                                            <div className="reaction-feedback-pill">
                                                <span className="feedback-cat">{feedback.category}</span>
                                                <span className="feedback-dot">•</span>
                                                <span className="feedback-desc">{feedback.message}</span>
                                            </div>

                                            <MotivationalQuoteBlock
                                                category={feedback.category}
                                                score={avgTime > 350 ? 45 : 80}
                                            />
                                        </>
                                    );
                                })()}

                                <div className="results-actions">
                                    <Button variant="secondary" onClick={handleRetake}>
                                        <Icon name="assess" size={16} /> Retake Test
                                    </Button>
                                    <Button variant="primary" onClick={handleFinish}>
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
