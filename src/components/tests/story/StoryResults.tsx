import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, Icon, MotivationalQuoteBlock } from "../../common";
import { useTheme } from "../../../contexts/ThemeContext";
import type { StoryAssessmentResult } from "../../../types/storyTypes";

interface StoryResultsProps {
    result: StoryAssessmentResult;
    onRetake: () => void;
}

export function StoryResults({ result, onRetake }: StoryResultsProps) {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { storyRecallScore, biomarkers } = result;

    const radarData = [
        { subject: 'Recall Accuracy', A: Math.round(biomarkers.memory.recallAccuracy * 100), fullMark: 100 },
        { subject: 'Info Units', A: Math.round((biomarkers.memory.infoUnitsRecalled / biomarkers.memory.totalInfoUnits) * 100), fullMark: 100 },
        { subject: 'Comprehension', A: Math.round(biomarkers.comprehension.mcqAccuracy * 100), fullMark: 100 },
        { subject: 'Similarity', A: Math.round(biomarkers.narrative.similarityScore * 100), fullMark: 100 },
        { subject: 'Sequence & Flow', A: Math.round(biomarkers.narrative.storySequenceScore * 100), fullMark: 100 },
        { subject: 'Speech Rate', A: Math.min(100, Math.round((biomarkers.speech.speechRateWPM / 130) * 100)), fullMark: 100 },
    ];

    const getScoreTier = (score: number) => {
        if (score >= 80) return { label: 'Excellent Memory', level: 'stable' as const };
        if (score >= 60) return { label: 'Moderate Recall', level: 'change_detected' as const };
        return { label: 'Needs Attention', level: 'possible_risk' as const };
    };

    const tier = getScoreTier(storyRecallScore);

    // Determine trend (Improving vs Declining) by comparing with previous sessions or benchmark
    const trend: 'up' | 'down' = useMemo(() => {
        try {
            const raw = localStorage.getItem("vyomflow_story_results");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 1) {
                    const prev = parsed[parsed.length - 2];
                    const prevScore = prev?.storyRecallScore ?? prev?.score;
                    if (typeof prevScore === 'number') {
                        return storyRecallScore >= prevScore ? 'up' : 'down';
                    }
                }
            }
        } catch {
            // fallback
        }
        return storyRecallScore >= 60 ? 'up' : 'down';
    }, [storyRecallScore]);

    // Custom tick renderer with generous horizontal spacing for full-width legibility
    const renderCustomAxisTick = ({ payload, x, y, cx, cy }: any) => {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offsetX = dist > 0 ? x + (dx / dist) * 8 : x;
        const offsetY = dist > 0 ? y + (dy / dist) * 8 : y;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (dx > 12) {
            textAnchor = 'start';
        } else if (dx < -12) {
            textAnchor = 'end';
        }

        return (
            <text
                x={offsetX}
                y={offsetY}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill={isDark ? '#E2ECF2' : '#17324D'}
                fontSize={10}
                fontWeight={600}
                className="radar-axis-tick select-none"
            >
                {payload.value}
            </text>
        );
    };

    return (
        <div className="story-results-container animate-fadeIn">
            {/* Top Overview Card */}
            <Card className="results-overview-card">
                <div className="overview-header">
                    <div className="overview-title-group">
                        <h2 className="vyom-serif">Story Recall Profile</h2>
                        <span className={`story-trend-pill ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                            <Icon name={trend === 'up' ? 'trend-up' : 'trend-down'} size={13} />
                            <span>{trend === 'up' ? 'Improving' : 'Declining'}</span>
                        </span>
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

            {/* Biomarkers Breakdown Row (2x2 grid) */}
            <div className="biomarkers-grid-row">
                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>Memory Recall</h4>
                        <p className="metric-desc">{biomarkers.memory.infoUnitsRecalled} / {biomarkers.memory.totalInfoUnits} units</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.memory.recallAccuracy * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>MCQ Accuracy</h4>
                        <p className="metric-desc">{biomarkers.comprehension.correctCount} / {biomarkers.comprehension.totalQuestions} correct</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.comprehension.mcqAccuracy * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>Sequence & Flow</h4>
                        <p className="metric-desc">Timeline preservation</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.narrative.storySequenceScore * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>Speech Rate</h4>
                        <p className="metric-desc">{(biomarkers.speech.lexicalDiversity * 100).toFixed(0)}% diversity</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.speech.speechRateWPM)} <span className="metric-unit">WPM</span></div>
                </Card>
            </div>

            {/* Full-Length Biomarker Radar Card (Stretches across whole length) */}
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
            </Card>

            {/* Centered Actions */}
            <div className="results-actions">
                <button type="button" onClick={onRetake} className="story-retake-btn">
                    <Icon name="assess" size={16} /> Retake Test
                </button>
                <button 
                    type="button" 
                    className="story-primary-start-btn story-back-assessments-btn" 
                    onClick={() => navigate('/tests')}
                >
                    Back to Assessments
                </button>
            </div>
        </div>
    );
}
