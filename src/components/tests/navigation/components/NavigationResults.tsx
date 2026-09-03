import { useState, useEffect } from "react";
import type { MapGraph, NavigationAssessmentResult } from "../../../../types/navigationTypes";
import { Button, Card } from "../../../common";
import { MapBoard } from "./MapBoard";

interface NavigationResultsProps {
    map: MapGraph;
    result: NavigationAssessmentResult;
    onRetake: () => void;
    onBackToTests: () => void;
    isLevelUnlocked?: boolean;
    nextLevel?: number;
}

export function NavigationResults({
    map,
    result,
    onRetake,
    onBackToTests,
    isLevelUnlocked = false,
    nextLevel,
}: NavigationResultsProps) {
    const { biomarkers, navigationScore } = result;

    const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number>(5);
    const [isAutoPaused, setIsAutoPaused] = useState<boolean>(false);

    // Auto-advance timer countdown
    useEffect(() => {
        if (!isLevelUnlocked || !nextLevel || isAutoPaused) return;

        if (autoAdvanceTimer <= 0) {
            onRetake();
            return;
        }

        const timer = setInterval(() => {
            setAutoAdvanceTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isLevelUnlocked, nextLevel, isAutoPaused, autoAdvanceTimer, onRetake]);

    // Actual path taken (sequence of node IDs)
    const actualNodePath: string[] = [];
    if (result.moves.length > 0) {
        actualNodePath.push(result.moves[0].fromNode);
        for (const m of result.moves) {
            actualNodePath.push(m.toNode);
        }
    }

    const correctLandmarkCount = result.landmarkRecallResponses.filter((r) => r.isCorrect).length;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#10b981"; // Green
        if (score >= 60) return "#3b82f6"; // Blue
        if (score >= 40) return "#f59e0b"; // Orange
        return "#ef4444"; // Red
    };

    return (
        <div className="navigation-results-container">
            {/* Level Unlock Banner */}
            {isLevelUnlocked && nextLevel && (
                <div className="level-unlock-banner animate-bounce">
                    <span className="banner-icon">🎉</span>
                    <div className="banner-text">
                        <h4>Level {nextLevel} Unlocked!</h4>
                        <p>
                            Great job! Score: {navigationScore}/100.
                            {!isAutoPaused ? (
                                <span> Auto-starting Level {nextLevel} in <strong>{autoAdvanceTimer}s</strong>...</span>
                            ) : (
                                <span> Auto-advance paused.</span>
                            )}
                        </p>
                    </div>

                    {!isAutoPaused ? (
                        <button
                            type="button"
                            className="text-xs underline bg-white/20 px-2 py-1 rounded hover:bg-white/30 ml-auto"
                            onClick={() => setIsAutoPaused(true)}
                        >
                            Pause Timer
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="text-xs underline bg-white/20 px-2 py-1 rounded hover:bg-white/30 ml-auto"
                            onClick={() => setIsAutoPaused(false)}
                        >
                            Resume
                        </button>
                    )}
                </div>
            )}

            {/* Score Hero Section */}
            <Card className="results-hero-card">
                <div className="hero-grid">
                    <div className="score-gauge-wrapper">
                        <svg className="gauge-svg" viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r="52"
                                className="gauge-bg"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="52"
                                className="gauge-fill"
                                stroke={getScoreColor(navigationScore)}
                                strokeDasharray={326.72}
                                strokeDashoffset={326.72 * (1 - navigationScore / 100)}
                            />
                        </svg>
                        <div className="gauge-center-content">
                            <span className="gauge-value">{navigationScore}</span>
                            <span className="gauge-label">NAVIGATION SCORE</span>
                        </div>
                    </div>

                    <div className="hero-details">
                        <h2>Navigation Assessment Complete</h2>
                        <p className="results-map-title">
                            Level {result.difficulty} • Map: {map.name}
                        </p>

                        <div className="quick-stats-grid">
                            <div className="quick-stat">
                                <span className="stat-num">{(result.completionTimeMs / 1000).toFixed(1)}s</span>
                                <span className="stat-title">Completion Time</span>
                            </div>
                            <div className="quick-stat">
                                <span className="stat-num">{biomarkers.wrongTurnCount}</span>
                                <span className="stat-title">Wrong Turns</span>
                            </div>
                            <div className="quick-stat">
                                <span className="stat-num">{biomarkers.backtrackCount}</span>
                                <span className="stat-title">Backtracks</span>
                            </div>
                            <div className="quick-stat">
                                <span className="stat-num">{correctLandmarkCount}/3</span>
                                <span className="stat-title">Landmark Quiz</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Route Replay Card */}
            <Card className="results-replay-card">
                <h3>Route Replay & Deviation Map</h3>
                <p className="replay-subtitle">
                    Comparison between <span className="text-indigo font-bold">Optimal Route</span> and your{" "}
                    <span className="text-red font-bold">Actual Path</span>.
                </p>

                <div className="replay-map-wrapper">
                    <MapBoard
                        graph={map}
                        currentNodeId=""
                        highlightedPath={map.optimalPath}
                        actualPath={actualNodePath}
                        phase="results"
                    />
                </div>
            </Card>

            {/* Biomarker Metrics Bar Chart */}
            <Card className="results-biomarkers-card">
                <h3>Biomarker Breakdown</h3>

                <div className="biomarker-bars-list">
                    <div className="biomarker-bar-row">
                        <div className="bar-info">
                            <span className="bar-name">Navigation Accuracy</span>
                            <span className="bar-value">{Math.round(biomarkers.navigationAccuracy * 100)}%</span>
                        </div>
                        <div className="bar-track">
                            <div
                                className="bar-fill bg-green"
                                style={{ width: `${biomarkers.navigationAccuracy * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="biomarker-bar-row">
                        <div className="bar-info">
                            <span className="bar-name">Path Efficiency</span>
                            <span className="bar-value">{Math.round(biomarkers.pathEfficiency * 100)}%</span>
                        </div>
                        <div className="bar-track">
                            <div
                                className="bar-fill bg-indigo"
                                style={{ width: `${biomarkers.pathEfficiency * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="biomarker-bar-row">
                        <div className="bar-info">
                            <span className="bar-name">Avg Decision Latency</span>
                            <span className="bar-value">{biomarkers.decisionLatencyMs} ms</span>
                        </div>
                        <div className="bar-track">
                            <div
                                className="bar-fill bg-blue"
                                style={{
                                    width: `${Math.min(100, (biomarkers.decisionLatencyMs / 3000) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="biomarker-bar-row">
                        <div className="bar-info">
                            <span className="bar-name">Landmark Spatial Recall</span>
                            <span className="bar-value">{Math.round(biomarkers.landmarkRecallAccuracy * 100)}%</span>
                        </div>
                        <div className="bar-track">
                            <div
                                className="bar-fill bg-purple"
                                style={{ width: `${biomarkers.landmarkRecallAccuracy * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="results-actions">
                <Button variant="secondary" onClick={onBackToTests}>
                    ← Back to Tests
                </Button>

                <Button variant="primary" onClick={onRetake}>
                    {isLevelUnlocked && nextLevel ? `Start Level ${nextLevel} Now →` : "Retake Assessment 🔄"}
                </Button>
            </div>
        </div>
    );
}
