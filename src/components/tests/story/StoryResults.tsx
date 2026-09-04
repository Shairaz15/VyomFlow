import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, Icon, MotivationalQuoteBlock, SpecularButton } from "../../common";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { StoryAssessmentResult } from "../../../types/storyTypes";

interface StoryResultsProps {
    result: StoryAssessmentResult;
    onRetake: () => void;
}

export function StoryResults({ result, onRetake }: StoryResultsProps) {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { t } = useLanguage();
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
                if (Array.isArray(parsed) && parsed.length >= 2) {
                    const prev = parsed[parsed.length - 2]?.storyRecallScore || 60;
                    return storyRecallScore >= prev ? 'up' : 'down';
                }
            }
        } catch (e) {
            // fallback gracefully
        }
        return storyRecallScore >= 70 ? 'up' : 'down';
    }, [storyRecallScore]);

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

    return (
        <div className="story-results-container animate-fadeIn">
            {/* Top Overview Card */}
            <Card className="results-overview-card">
                <div className="overview-header">
                    <div className="overview-title-group">
                        <h2 className="vyom-serif">{t("story.profileTitle")}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`story-trend-pill ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                                <Icon name={trend === 'up' ? 'trend-up' : 'trend-down'} size={13} />
                                <span>{trend === 'up' ? t('vmra.improving') : t('vmra.declining')}</span>
                            </span>
                            {result.matchResult.evaluationSource === 'gemini' && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
                                    <Icon name="brain-circuit" size={11} />
                                    <span>AI Semantic Analysis</span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="score-badge-circle">
                        <span className="score-num">{storyRecallScore}</span>
                        <span className="score-denom">/ 100</span>
                    </div>
                </div>

                {/* Intrusion & Perseveration Clinical Indicators */}
                {(result.matchResult.falseRecalls?.length > 0 || (result.matchResult.perseverationCount || 0) > 0) && (
                    <div className="flex flex-wrap gap-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs mt-3">
                        {result.matchResult.falseRecalls.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span>⚠️</span>
                                <span><strong>{result.matchResult.falseRecalls.length} Intrusion(s):</strong> Non-story content/confabulation detected.</span>
                            </div>
                        )}
                        {(result.matchResult.perseverationCount || 0) > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span>🔄</span>
                                <span><strong>{result.matchResult.perseverationCount} Perseveration(s):</strong> Repetitive recall assertions.</span>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <MotivationalQuoteBlock
                category={tier.label}
                score={storyRecallScore}
            />

            {/* Biomarkers Breakdown Row (2x2 grid) */}
            <div className="biomarkers-grid-row">
                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("story.memoryRecall")}</h4>
                        <p className="metric-desc">{t("story.unitsRecalled", { count: biomarkers.memory.infoUnitsRecalled, total: biomarkers.memory.totalInfoUnits })}</p>
                        {(biomarkers.memory.verbatimRecallCount !== undefined || biomarkers.memory.gistRecallCount !== undefined) && (
                            <div className="text-[11px] flex items-center gap-2 mt-1 opacity-90">
                                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{biomarkers.memory.verbatimRecallCount || 0} Verbatim</span>
                                <span>•</span>
                                <span className="text-sky-700 dark:text-sky-300 font-semibold">{biomarkers.memory.gistRecallCount || 0} Gist</span>
                            </div>
                        )}
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.memory.recallAccuracy * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("story.mcqAccuracy")}</h4>
                        <p className="metric-desc">{t("story.mcqCorrect", { count: biomarkers.comprehension.correctCount, total: biomarkers.comprehension.totalQuestions })}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.comprehension.mcqAccuracy * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("story.sequenceFlow")}</h4>
                        <p className="metric-desc">{t("story.timelinePreservation")}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.narrative.storySequenceScore * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("story.speechRate")}</h4>
                        <p className="metric-desc">{t("story.lexicalDiversity", { percent: (biomarkers.speech.lexicalDiversity * 100).toFixed(0) })}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.speech.speechRateWPM)} <span className="metric-unit">WPM</span></div>
                </Card>
            </div>

            {/* Full-Length Biomarker Radar Card (Stretches across whole length) */}
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
            </Card>

            {/* Centered Actions */}
            <div className="results-actions">
                <SpecularButton
                    size="md"
                    radius={24}
                    tint="rgba(255, 255, 255, 0.14)"
                    tintOpacity={0.92}
                    lineColor="#38bdf8"
                    baseColor="rgba(255, 255, 255, 0.3)"
                    textColor="#FFFFFF"
                    intensity={1.15}
                    followMouse
                    onClick={onRetake}
                    className="story-retake-btn"
                >
                    <Icon name="assess" size={16} /> {t("story.retakeTest")}
                </SpecularButton>
                <SpecularButton
                    size="md"
                    radius={24}
                    tint="#4F7C78"
                    tintOpacity={0.96}
                    lineColor="#5EEAD4"
                    baseColor="#1e293b"
                    textColor="#FFFFFF"
                    intensity={1.25}
                    followMouse
                    autoAnimate
                    onClick={() => navigate('/tests')}
                    className="story-primary-start-btn story-back-assessments-btn"
                >
                    {t("story.backToAssessments")}
                </SpecularButton>
            </div>
        </div>
    );
}
