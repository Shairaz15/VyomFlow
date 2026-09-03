import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Button, Card, CardHeader, CardContent, Icon, RiskBadge } from "../../common";
import type { StoryAssessmentResult } from "../../../types/storyTypes";

interface StoryResultsProps {
    result: StoryAssessmentResult;
    onRetake: () => void;
}

export function StoryResults({ result, onRetake }: StoryResultsProps) {
    const navigate = useNavigate();
    const { storyRecallScore, biomarkers, englishTranslation } = result;

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
                    <div>
                        <h2>Story Narration Recall Profile</h2>
                        <RiskBadge level={tier.level} />
                    </div>
                    <div className="score-badge-circle">
                        <span className="score-num">{storyRecallScore}</span>
                        <span className="score-denom">/ 100</span>
                    </div>
                </div>

                <p className="overview-subtitle">
                    Composite score derived from episodic memory recall, comprehension accuracy, information unit retention, and acoustic speech biomarkers.
                </p>
            </Card>

            {/* Radar Chart Card */}
            <Card className="radar-chart-card">
                <CardHeader title="Multidimensional Memory Radar" subtitle="Breakdown across 6 biomarker categories" />
                <CardContent>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" />
                                <Radar
                                    name="Biomarkers"
                                    dataKey="A"
                                    stroke="#38bdf8"
                                    fill="#38bdf8"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Breakdown Grid */}
            <div className="biomarkers-grid">
                <Card className="metric-card">
                    <h4>Memory Recall</h4>
                    <div className="metric-val">{Math.round(biomarkers.memory.recallAccuracy * 100)}%</div>
                    <p className="metric-desc">{biomarkers.memory.infoUnitsRecalled} of {biomarkers.memory.totalInfoUnits} key story units recalled</p>
                </Card>

                <Card className="metric-card">
                    <h4>Comprehension MCQ</h4>
                    <div className="metric-val">{Math.round(biomarkers.comprehension.mcqAccuracy * 100)}%</div>
                    <p className="metric-desc">{biomarkers.comprehension.correctCount} of {biomarkers.comprehension.totalQuestions} questions correct</p>
                </Card>

                <Card className="metric-card">
                    <h4>Sequence & Flow</h4>
                    <div className="metric-val">{Math.round(biomarkers.narrative.storySequenceScore * 100)}%</div>
                    <p className="metric-desc">Timeline preservation score</p>
                </Card>

                <Card className="metric-card">
                    <h4>Speech Biomarkers</h4>
                    <div className="metric-val">{Math.round(biomarkers.speech.speechRateWPM)} WPM</div>
                    <p className="metric-desc">Lexical diversity: {(biomarkers.speech.lexicalDiversity * 100).toFixed(0)}%</p>
                </Card>
            </div>

            {/* Spoken Recall Transcript */}
            <Card className="transcript-card">
                <CardHeader title="English Translated Story Recall" subtitle="Transcribed via Sarvam AI Speech-to-Text" />
                <CardContent>
                    <p className="transcript-body">{englishTranslation || result.nativeTranscript}</p>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="results-actions">
                <Button variant="secondary" onClick={onRetake}>
                    <Icon name="assess" size={16} /> Take Another Story Assessment
                </Button>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                    View Dashboard Trends
                </Button>
            </div>
        </div>
    );
}
