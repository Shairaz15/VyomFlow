import { Button, Card, Icon, MotivationalQuoteBlock } from "../../../common";
import type { ImmersiveNavigationResult } from "../../../../types/navigationTypes";

interface NavigationResultsProps {
    result: ImmersiveNavigationResult;
    onRetake: () => void;
    onBackToTests: () => void;
}

export function NavigationResults({
    result,
    onRetake,
    onBackToTests,
}: NavigationResultsProps) {
    const { biomarkers, navigationScore } = result;

    // Score Tier Category & Feedback
    const getScoreTier = (score: number) => {
        if (score >= 80) return { category: "Optimal Visuospatial Navigation", feedback: "High spatial orientation fidelity with swift, accurate decision-making and strong landmark sequencing." };
        if (score >= 60) return { category: "Good Spatial Orientation", feedback: "Solid route recall with minor hesitation at select intersections." };
        if (score >= 40) return { category: "Fair / Mild Hesitation", feedback: "Noticeable decision delay at intersections and partial landmark sequence displacement." };
        return { category: "Attention Advised", feedback: "Frequent wrong turns and difficulty reconstructing chronological route landmarks." };
    };

    const tier = getScoreTier(navigationScore);

    return (
        <div className="nav-results-container animate-fadeIn">
            <Card className="nav-results-card">
                <div className="results-overview-header">
                    <div>
                        <h2 className="vyom-serif">Navigation Profile</h2>
                        <p className="results-sub">Route learning, intersection decision latency, and spatial memory.</p>
                    </div>
                    <div className="nav-icon-badge">
                        <Icon name="navigation" size={24} />
                    </div>
                </div>

                <div className="nav-split-results-grid">
                    {/* Left Column: Composite Score & Accuracy */}
                    <div className="nav-metric-column">
                        <div className="nav-summary-box">
                            <div className="nav-score-num">{navigationScore}</div>
                            <div className="nav-score-tag">Navigation Index (/100)</div>
                        </div>

                        <div className="nav-mini-metrics">
                            <div className="mini-metric-item">
                                <span className="mini-lbl">Direction Accuracy</span>
                                <span className="mini-val">{Math.round(biomarkers.navigationAccuracy * 100)}%</span>
                            </div>
                            <div className="mini-metric-item">
                                <span className="mini-lbl">Landmark Sequence</span>
                                <span className="mini-val">{Math.round(biomarkers.landmarkSequenceAccuracy * 100)}%</span>
                            </div>
                            <div className="mini-metric-item">
                                <span className="mini-lbl">Mean Turn Latency</span>
                                <span className="mini-val">{biomarkers.averageDecisionLatencyMs}ms</span>
                            </div>
                            <div className="mini-metric-item">
                                <span className="mini-lbl">Wrong Turns</span>
                                <span className="mini-val">{biomarkers.wrongTurnCount} / {result.intersectionResponses.length || 8}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Feedback & Biomarker Indices */}
                    <div className="nav-metric-column">
                        <div className="nav-feedback-box">
                            <div className="feedback-badge">{tier.category}</div>
                            <p className="feedback-text">{tier.feedback}</p>
                        </div>

                        <div className="nav-sub-indices">
                            <div className="sub-index-item">
                                <span>Route Memory Index</span>
                                <span className="sub-index-val">{Math.round(biomarkers.routeMemoryScore * 100)}%</span>
                            </div>
                            <div className="sub-index-item">
                                <span>Destination Recall</span>
                                <span className="sub-index-val text-emerald-600 dark:text-emerald-400">
                                    {biomarkers.destinationRecallAccuracy === 1 ? "Correct ✓" : "Incorrect ✕"}
                                </span>
                            </div>
                            <div className="sub-index-item">
                                <span>False Distractor Rate</span>
                                <span className="sub-index-val">{Math.round(biomarkers.falseLandmarkRate * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <MotivationalQuoteBlock
                    category={tier.category}
                    score={navigationScore}
                />

                <div className="results-actions">
                    <Button variant="secondary" onClick={onRetake}>
                        <Icon name="assess" size={16} /> Retake Test
                    </Button>
                    <Button variant="primary" onClick={onBackToTests}>
                        Back to Assessments
                    </Button>
                </div>
            </Card>
        </div>
    );
}
