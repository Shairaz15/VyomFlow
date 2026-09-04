import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { Button, Card, Icon, TutorialVideoPlaceholder, MotivationalQuoteBlock } from "../../common";
import { PageWrapper } from "../../layout";
import { usePatternResults } from "../../../hooks/useTestResults";
import { extractPatternFeatures } from "../../../ai/patternFeatures";
import type { PatternRoundData, PatternAssessmentResult } from "../../../types/patternTypes";
import "../story/StoryAssessment.css";
import "./PatternAssessment.css";

type Phase = 'instructions' | 'demonstration' | 'calibration' | 'assessment' | 'complete';
type GameState = 'idle' | 'showing' | 'waiting';

export function PatternAssessment() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { results, saveResult } = usePatternResults();

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

    // Core State
    const [phase, setPhase] = useState<Phase>('instructions');
    const [gameState, setGameState] = useState<GameState>('idle');
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Game Logic State
    const [level, setLevel] = useState(1);
    const [gridSize, setGridSize] = useState(3);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [feedbackTile, setFeedbackTile] = useState<{ index: number, status: 'correct' | 'wrong' } | null>(null);
    const [message, setMessage] = useState("");

    // Data Collection
    const [rounds, setRounds] = useState<PatternRoundData[]>([]);
    const roundStartTimeRef = useRef<number>(0);
    const sequenceShowTimeRef = useRef<number>(0);
    const activeStageRef = useRef<HTMLDivElement>(null);
    const sequenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Constants
    const BASE_SPEED = 800;

    // Generate scale based on difficulty
    const getGridSize = (lvl: number) => {
        if (lvl <= 2) return 3; // 3x3
        if (lvl <= 5) return 4; // 4x4
        return 5; // 5x5
    };

    const getSequenceLength = (lvl: number) => {
        return 3 + Math.floor((lvl - 1) / 2);
    };

    // Initialize Round
    const startRound = useCallback(() => {
        if (!isAuthenticated) return;
        const size = getGridSize(level);
        setGridSize(size);
        const length = getSequenceLength(level);
        const totalTiles = size * size;

        // Generate Sequence
        const newSequence = Array.from({ length }, () => Math.floor(Math.random() * totalTiles));
        setSequence(newSequence);
        setUserSequence([]);
        setGameState('showing');
        setFeedbackTile(null);
        setMessage(t("pattern.watchPattern"));

        // Determine speed (gets faster)
        const speed = Math.max(300, BASE_SPEED - (level * 30));

        // Play Sequence
        let i = 0;
        sequenceShowTimeRef.current = Date.now();

        if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);

        sequenceIntervalRef.current = setInterval(() => {
            if (i >= newSequence.length) {
                if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
                setActiveTile(null);
                setGameState('waiting');
                setMessage(t("pattern.yourTurn"));
                roundStartTimeRef.current = Date.now();
                return;
            }

            setActiveTile(newSequence[i]);

            setTimeout(() => {
                setActiveTile(null);
            }, speed * 0.7);

            i++;
        }, speed);

    }, [level, isAuthenticated, t]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
        };
    }, []);

    // Handle Tile Click
    const handleTileClick = (index: number) => {
        if (gameState !== 'waiting') return;

        const currentInput = [...userSequence, index];
        setUserSequence(currentInput);

        const stepIndex = currentInput.length - 1;

        if (index === sequence[stepIndex]) {
            // Correct input
            setFeedbackTile({ index, status: 'correct' });
            setTimeout(() => setFeedbackTile(null), 200);

            if (currentInput.length === sequence.length) {
                // Round Complete - Success
                handleRoundEnd(true);
            }
        } else {
            // Wrong input
            setFeedbackTile({ index, status: 'wrong' });
            setTimeout(() => setFeedbackTile(null), 800);
            handleRoundEnd(false);
        }
    };

    // Round End Logic
    const handleRoundEnd = (success: boolean) => {
        const now = Date.now();
        setGameState('idle');

        const roundData: PatternRoundData = {
            level,
            gridSize,
            sequenceLength: sequence.length,
            targetSequence: sequence,
            userInput: userSequence,
            isCorrect: success,
            displayTime: roundStartTimeRef.current - sequenceShowTimeRef.current,
            responseLatency: now - roundStartTimeRef.current,
            completionTime: now - roundStartTimeRef.current,
            timestamp: now
        };

        if (phase === 'assessment') {
            setRounds(prev => [...prev, roundData]);

            if (success) {
                setMessage(t("pattern.correct"));
                setTimeout(() => {
                    setLevel(prev => prev + 1);
                }, 1000);
            } else {
                setMessage(t("pattern.sequenceEnded"));
                setTimeout(() => {
                    setFeedbackTile(null);
                    setActiveTile(null);
                    setPhase('complete');
                }, 1500);
                return;
            }
        } else if (phase === 'demonstration') {
            setMessage(success ? t("pattern.greatPractice") : t("pattern.letsBeginReal"));
            setTimeout(() => setPhase('calibration'), 1500);
            return;
        } else if (phase === 'calibration') {
            setMessage(t("pattern.calibrationComplete"));
            setTimeout(() => {
                setPhase('assessment');
                setLevel(1);
            }, 1500);
            return;
        }

        // Next round trigger
        setTimeout(() => {
            startRound();
        }, 1500);
    };

    // Auto-start rounds when entering phases
    useEffect(() => {
        if (phase === 'demonstration' || phase === 'calibration' || (phase === 'assessment' && rounds.length > 0)) {
            const timer = setTimeout(() => startRound(), 1000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Handle first assessment round trigger
    useEffect(() => {
        if (phase === 'assessment' && rounds.length === 0) {
            startRound();
        }
    }, [phase]);

    // Save Data on Complete
    useEffect(() => {
        if (phase === 'complete') {
            const features = extractPatternFeatures(rounds);
            const correctCount = rounds.filter(r => r.isCorrect).length;
            const totalCount = rounds.length;
            const accuracyScore = Math.round((correctCount / Math.max(1, totalCount)) * 100);

            const result: PatternAssessmentResult & { score?: number } = {
                id: crypto.randomUUID(),
                sessionId: crypto.randomUUID(),
                timestamp: new Date(),
                score: accuracyScore,
                metrics: {
                    maxLevelReached: Math.max(...rounds.filter(r => r.isCorrect).map(r => r.level), 0),
                    totalRounds: totalCount,
                    correctRounds: correctCount,
                    averageResponseLatency: rounds.reduce((a, b) => a + b.responseLatency, 0) / (rounds.length || 1),
                    averageCompletionTime: rounds.reduce((a, b) => a + b.completionTime, 0) / (rounds.length || 1),
                    inputErrors: rounds.filter(r => !r.isCorrect).length,
                    falseInputs: 0,
                    retries: 0
                },
                derivedFeatures: features,
                rawSequenceData: rounds
            };
            sessionStorage.setItem("lastPatternResult", JSON.stringify(result));
            saveResult(result as any);
        }
    }, [phase]);

    // Exit Navigation
    const handleExitClick = () => {
        if (phase === 'instructions' || phase === 'complete') {
            navigate('/tests');
            return;
        }
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
        setShowExitConfirm(false);
        navigate('/tests');
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    const handleRetake = () => {
        if (sequenceIntervalRef.current) {
            clearInterval(sequenceIntervalRef.current);
            sequenceIntervalRef.current = null;
        }
        setFeedbackTile(null);
        setActiveTile(null);
        setSequence([]);
        setUserSequence([]);
        setRounds([]);
        setLevel(1);
        setGridSize(3);
        setGameState('idle');
        setMessage("");
        setPhase('instructions');
    };

    const handleStartTest = () => {
        if (sequenceIntervalRef.current) {
            clearInterval(sequenceIntervalRef.current);
            sequenceIntervalRef.current = null;
        }
        setFeedbackTile(null);
        setActiveTile(null);
        setSequence([]);
        setUserSequence([]);
        setRounds([]);
        setLevel(1);
        setGridSize(3);
        setGameState('idle');
        setMessage(t("pattern.watchPattern"));
        setPhase('demonstration');
    };

    // Render Helpers
    const renderGrid = () => {
        const tiles = [];
        const total = gridSize * gridSize;

        for (let i = 0; i < total; i++) {
            let className = "pattern-grid-tile";
            if (activeTile === i) className += " active";
            if (feedbackTile?.index === i) className += ` user-${feedbackTile.status}`;

            const row = Math.floor(i / gridSize) + 1;
            const col = (i % gridSize) + 1;
            tiles.push(
                <button
                    key={i}
                    className={className}
                    onClick={() => handleTileClick(i)}
                    aria-label={`Grid cell ${row}, ${col} of ${gridSize}x${gridSize}`}
                    disabled={gameState !== 'waiting'}
                    aria-pressed={activeTile === i || feedbackTile?.index === i}
                />
            );
        }
        return (
            <div className={`pattern-grid-box grid-${gridSize}`} role="grid" aria-label={`Pattern grid ${gridSize} by ${gridSize}`}>
                {tiles}
            </div>
        );
    };

    return (
        <PageWrapper>
            <div className="pattern-test-page story-assessment-container container">
                {/* Top Navigation Bar: Back / Exit Control */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label={t("pattern.backToAssessments")}
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>{t("pattern.backToAssessments")}</span>
                    </button>
                </div>

                {/* Primary Test Header (shown only on instructions intro) */}
                {phase === 'instructions' && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">{t("pattern.title")}</h1>
                        <p className="story-subtitle">
                            {t("pattern.subtitle")}
                        </p>
                    </div>
                )}

                {/* Active Stage Viewport */}
                <div ref={activeStageRef} className="story-stage-viewport pattern-stage-viewport">
                    {/* 1. Instructions / Idle Phase */}
                    {phase === 'instructions' && (
                        <div className="instructions-with-tutorial-layout animate-fadeIn">
                            <Card className="instructions-card">
                                <div className="instructions-content">
                                    <div className="instructions-icon-wrapper" aria-hidden="true">
                                        <Icon name="pattern" size={28} />
                                    </div>
                                    <h2 className="instructions-card-title vyom-serif">{t("pattern.howItWorks")}</h2>

                                    <ol className="instructions-step-list">
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">1</div>
                                            <div className="step-content">
                                                <strong>{t("pattern.step1Title")}</strong>
                                                <span>{t("pattern.step1Desc")}</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">2</div>
                                            <div className="step-content">
                                                <strong>{t("pattern.step2Title")}</strong>
                                                <span>{t("pattern.step2Desc")}</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">3</div>
                                            <div className="step-content">
                                                <strong>{t("pattern.step3Title")}</strong>
                                                <span>{t("pattern.step3Desc")}</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">4</div>
                                            <div className="step-content">
                                                <strong>{t("pattern.step4Title")}</strong>
                                                <span>{t("pattern.step4Desc")}</span>
                                            </div>
                                        </li>
                                    </ol>

                                    <div className="instructions-action-row">
                                        <Button
                                            variant="primary"
                                            className="story-primary-start-btn"
                                            onClick={handleStartTest}
                                        >
                                            {t("pattern.startTest")}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Tutorial Video Placeholder */}
                            <TutorialVideoPlaceholder />
                        </div>
                    )}

                    {/* 2. Active Game Arena (Demonstration, Calibration, Assessment) */}
                    {(phase === 'demonstration' || phase === 'calibration' || phase === 'assessment') && (
                        <div className="pattern-arena-card animate-fadeIn">
                            <div className="pattern-status-header">
                                <div className="pattern-level-pill">
                                    <span>{t("pattern.level", { level }) || t("pattern.levelDisplay", { level }) || `Level ${level}`}</span>
                                </div>
                                <div className="pattern-mode-badge">
                                    {phase === 'demonstration' ? t("pattern.practiceMode") : phase === 'calibration' ? t("pattern.calibration") : t("pattern.scoredAssessment")}
                                </div>
                            </div>

                            <p 
                                className={`pattern-turn-indicator ${gameState === 'showing' ? 'watch' : 'repeat'}`}
                                role="status"
                                aria-live="polite"
                            >
                                {message}
                            </p>

                            {renderGrid()}
                        </div>
                    )}

                    {/* 3. Test Complete / Results Phase */}
                    {phase === 'complete' && (() => {
                        const maxLevel = Math.max(...rounds.filter(r => r.isCorrect).map(r => r.level), 0);
                        const correctRounds = rounds.filter(r => r.isCorrect).length;
                        const totalRounds = rounds.length;
                        const accuracy = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;
                        const avgLatency = rounds.length > 0
                            ? Math.round(rounds.reduce((a, b) => a + (b.responseLatency || 0), 0) / rounds.length)
                            : 0;

                        const spanScore = Math.min(100, Math.round((maxLevel / 6) * 100));
                        const scorePercent = Math.max(10, Math.min(100, Math.round((accuracy * 0.6) + (spanScore * 0.4))));

                        const getScoreTier = (score: number) => {
                            if (score >= 80) return { label: "High Working Memory", level: "stable" as const };
                            if (score >= 60) return { label: "Moderate Span", level: "change_detected" as const };
                            return { label: "Needs Practice", level: "possible_risk" as const };
                        };

                        const tier = getScoreTier(scorePercent);

                        // Trend computation
                        const pastResults = results || [];
                        const prevSession = pastResults.length > 0 ? pastResults[pastResults.length - 1] : null;
                        const prevScore = (prevSession as any)?.score ?? (prevSession as any)?.metrics?.correctRounds;
                        const isImproving = prevScore ? (scorePercent >= prevScore) : (scorePercent >= 60);
                        const trend: "up" | "down" = isImproving ? "up" : "down";

                        const speedScore = Math.max(15, Math.min(100, Math.round(100 - Math.max(0, (avgLatency - 800) / 25))));
                        const learningRate = Math.max(20, Math.min(100, Math.round((correctRounds / Math.max(1, totalRounds)) * 100)));

                        const radarData = [
                            { subject: "Memory Span", A: spanScore, fullMark: 100 },
                            { subject: "Sequence Accuracy", A: accuracy, fullMark: 100 },
                            { subject: "Spatial Precision", A: Math.round((spanScore + accuracy) / 2), fullMark: 100 },
                            { subject: "Processing Speed", A: speedScore, fullMark: 100 },
                            { subject: "Learning Curve", A: learningRate, fullMark: 100 },
                            { subject: "Task Efficiency", A: scorePercent, fullMark: 100 },
                        ];

                        return (
                            <div className="story-results-container animate-fadeIn">
                                {/* Top Overview Card */}
                                <Card className="results-overview-card">
                                    <div className="overview-header">
                                        <div className="overview-title-group">
                                            <h2 className="vyom-serif">{t("pattern.profileTitle")}</h2>
                                            <span className={`story-trend-pill ${trend === "up" ? "trend-up" : "trend-down"}`}>
                                                <Icon name={trend === "up" ? "trend-up" : "trend-down"} size={13} />
                                                <span>{trend === "up" ? t("vmra.improving") : t("vmra.declining")}</span>
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
                                            <h4>{t("pattern.memorySpan")}</h4>
                                            <p className="metric-desc">{t("pattern.maxLevelReached")}</p>
                                        </div>
                                        <div className="metric-val">{t("pattern.level", { level: maxLevel }) || t("pattern.levelDisplay", { level: maxLevel }) || `Level ${maxLevel}`}</div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>{t("pattern.sequenceAccuracy")}</h4>
                                            <p className="metric-desc">{t("pattern.trialsCompleted", { correct: correctRounds, total: totalRounds })}</p>
                                        </div>
                                        <div className="metric-val">{accuracy}%</div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>{t("pattern.decisionLatency")}</h4>
                                            <p className="metric-desc">{t("pattern.avgResponseSpeed") || t("pattern.responseSpeed") || "Avg sequence response speed"}</p>
                                        </div>
                                        <div className="metric-val">{(avgLatency / 1000).toFixed(2)} <span className="metric-unit">s</span></div>
                                    </Card>

                                    <Card className="metric-card">
                                        <div className="metric-info-col">
                                            <h4>{t("pattern.visuospatialCapacity")}</h4>
                                            <p className="metric-desc">{t("pattern.gridRetention")}</p>
                                        </div>
                                        <div className="metric-val">{spanScore}%</div>
                                    </Card>
                                </div>

                                {/* Full-Length Biomarker Radar & Progression Card */}
                                <Card className="radar-chart-card full-width-radar">
                                    <h3 className="radar-title">{t("vmra.biomarkerRadar")}</h3>
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

                                    {/* Level-by-Level Sequence Progression */}
                                    <div className="pattern-trials-section">
                                        <div className="pattern-trials-header">
                                            <span className="pattern-trials-title">{t("pattern.sequenceProgression")}</span>
                                            <span className="pattern-trials-badge">{t("pattern.successfulCount", { correct: correctRounds, total: totalRounds })}</span>
                                        </div>
                                        <div className="pattern-trials-grid">
                                            {rounds.map((r, i) => (
                                                <div key={i} className={`pattern-trial-chip ${r.isCorrect ? "valid" : "wrong"}`}>
                                                    <span className="trial-chip-tag">Lvl {r.level}</span>
                                                    <span className="trial-chip-val">{r.isCorrect ? t("pattern.passed") : t("pattern.failed")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Centered Actions */}
                                <div className="results-actions">
                                    <button type="button" onClick={handleRetake} className="story-retake-btn">
                                        <Icon name="reaction" size={15} /> {t("pattern.retakeTest")}
                                    </button>
                                    <button
                                        type="button"
                                        className="story-primary-start-btn story-back-assessments-btn"
                                        onClick={() => navigate("/tests")}
                                    >
                                        {t("pattern.backToAssessments")}
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
                            <h3 className="exit-modal-title vyom-serif">{t("pattern.leaveAssessment")}</h3>
                            <p className="exit-modal-text">
                                {t("pattern.leaveWarning")}
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    {t("pattern.continueTest")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    {t("pattern.leaveTest")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
