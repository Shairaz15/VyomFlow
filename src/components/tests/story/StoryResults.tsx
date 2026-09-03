import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Button, Card, Icon, RiskBadge, MotivationalQuoteBlock } from "../../common";
import type { StoryAssessmentResult } from "../../../types/storyTypes";

interface StoryResultsProps {
    result: StoryAssessmentResult;
    onRetake: () => void;
}

export function StoryResults({ result, onRetake }: StoryResultsProps) {
    const navigate = useNavigate();
    const { storyRecallScore, biomarkers } = result;

    const radarData = [
        { subject: 'Recall Accuracy', A: Math.round(biomarkers.memory.recallAccuracy * 100), fullMark: 100 },
        { subject: 'Info Units', A: Math.round((biomarkers.memory.infoUnitsRecalled / biomarkers.memory.totalInfoUnits) * 100), fullMark: 100 },
        { subject: 'Comprehension', A: Math.round(biomarkers.comprehension.mcqAccuracy * 100), fullMark: 100 },
        { subject: 'Similarity', A: Math.round(biomarkers.narrative.similarityScore * 100), fullMark: 100 },
        { subject: 'Organization', A: Math.round(biomarkers.narrative.storySequenceScore * 100), fullMark: 100 },
        { subject: 'Speech Rate', A: Math.min(100, Math.round((biomarkers.speech.speechRateWPM / 130) * 100)), fullMark: 100 },
    ];

    const getScoreTier = (score: number) => {
        if (score >= 80) return { label: 'Excellent Memory', level: 'stable' as const };
        if (score >= 60) return { label: 'Moderate Recall', level: 'change_detected' as const };
        return { label: 'Needs Attention', level: 'possible_risk' as const };
    };

    const tier = getScoreTier(storyRecallScore);

    return (
        <div className="story-results-container animate-fadeIn">
            {/* Top Overview Card */}
            <Card className="results-overview-card">
                <div className="overview-header">
                    <div className="overview-title-group">
                        <h2 className="vyom-serif">Story Recall Profile</h2>
                        <RiskBadge level={tier.level} />
                    </div>
                    <div className="score-badge-circle">
                        <span className="score-num">{storyRecallScore}</span>
                        <span className="score-denom">/ 100</span>
                    </div>
                </div>
            </Card>

            <MotivationalQuoteBlock
                category={tier.label}
                score={storyRecallScore}
            />

            {/* Split Row: Radar Chart + Biomarkers */}
            <div className="results-split-grid">
                {/* Left / Top: Biomarkers Breakdown Grid */}
                <div className="biomarkers-grid">
                    <Card className="metric-card">
                        <h4>Memory Recall</h4>
                        <div className="metric-val">{Math.round(biomarkers.memory.recallAccuracy * 100)}%</div>
                        <p className="metric-desc">{biomarkers.memory.infoUnitsRecalled} / {biomarkers.memory.totalInfoUnits} units</p>
                    </Card>

                    <Card className="metric-card">
                        <h4>MCQ Accuracy</h4>
                        <div className="metric-val">{Math.round(biomarkers.comprehension.mcqAccuracy * 100)}%</div>
                        <p className="metric-desc">{biomarkers.comprehension.correctCount} / {biomarkers.comprehension.totalQuestions} correct</p>
                    </Card>

                    <Card className="metric-card">
                        <h4>Sequence & Flow</h4>
                        <div className="metric-val">{Math.round(biomarkers.narrative.storySequenceScore * 100)}%</div>
                        <p className="metric-desc">Timeline preservation</p>
                    </Card>

                    <Card className="metric-card">
                        <h4>Speech Rate</h4>
                        <div className="metric-val">{Math.round(biomarkers.speech.speechRateWPM)} WPM</div>
                        <p className="metric-desc">{(biomarkers.speech.lexicalDiversity * 100).toFixed(0)}% diversity</p>
                    </Card>
                </div>

                {/* Right: Radar Chart Card */}
                <Card className="radar-chart-card">
                    <h3 className="radar-title">Biomarker Radar</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={170}>
                            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                                <PolarGrid stroke="rgba(79, 124, 120, 0.2)" />
                                <PolarAngleAxis dataKey="subject" stroke="#40566B" fontSize={10} tickLine={false} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" tick={false} />
                                <Radar
                                    name="Biomarkers"
                                    dataKey="A"
                                    stroke="#4F7C78"
                                    fill="#4F7C78"
                                    fillOpacity={0.35}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Actions */}
            <div className="results-actions">
                <Button variant="secondary" onClick={onRetake}>
                    <Icon name="assess" size={16} /> Retake Test
                </Button>
                <Button variant="primary" onClick={() => navigate('/tests')}>
                    Back to Assessments
                </Button>
            </div>
        </div>
    );
}
