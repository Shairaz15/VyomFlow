import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, Icon, MotivationalQuoteBlock, SpecularButton } from "../../../common";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useLanguage } from "../../../../i18n/LanguageContext";
import type { ImmersiveNavigationResult } from "../../../../types/navigationTypes";
import "../../story/StoryAssessment.css";

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
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { t } = useLanguage();
    const isDark = theme === "dark";
    const { biomarkers, navigationScore } = result;

    const getScoreTier = (score: number) => {
        if (score >= 80) return { label: "Optimal Navigation", level: "stable" as const };
        if (score >= 60) return { label: "Good Spatial Recall", level: "change_detected" as const };
        return { label: "Needs Practice", level: "possible_risk" as const };
    };

    const tier = getScoreTier(navigationScore);

    // Trend determination
    const trend: "up" | "down" = useMemo(() => {
        try {
            const raw = localStorage.getItem("vyomflow_navigation_results");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 1) {
                    const prev = parsed[parsed.length - 2];
                    const prevScore = prev?.navigationScore ?? prev?.score;
                    if (typeof prevScore === "number") {
                        return navigationScore >= prevScore ? "up" : "down";
                    }
                }
            }
        } catch {
            // fallback
        }
        return navigationScore >= 60 ? "up" : "down";
    }, [navigationScore]);

    const speedScore = Math.max(15, Math.min(100, Math.round(100 - Math.max(0, (biomarkers.averageDecisionLatencyMs - 1200) / 35))));

    const radarData = [
        { subject: "Direction Fidelity", A: Math.round(biomarkers.navigationAccuracy * 100), fullMark: 100 },
        { subject: "Landmark Sequence", A: Math.round(biomarkers.landmarkSequenceAccuracy * 100), fullMark: 100 },
        { subject: "Scene Recognition", A: Math.round(biomarkers.landmarkRecognitionAccuracy * 100), fullMark: 100 },
        { subject: "Route Memory", A: Math.round(biomarkers.routeMemoryScore * 100), fullMark: 100 },
        { subject: "Visual Attention", A: Math.round(biomarkers.visualAttentionScore * 100), fullMark: 100 },
        { subject: "Decision Speed", A: speedScore, fullMark: 100 },
    ];

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

    const totalTurns = result.intersectionResponses?.length || 8;
    const correctTurns = Math.max(0, totalTurns - biomarkers.wrongTurnCount);

    return (
        <div className="story-results-container animate-fadeIn">
            {/* Top Overview Card */}
            <Card className="results-overview-card">
                <div className="overview-header">
                    <div className="overview-title-group">
                        <h2 className="vyom-serif">{t("navigation.profileTitle")}</h2>
                        <span className={`story-trend-pill ${trend === "up" ? "trend-up" : "trend-down"}`}>
                            <Icon name={trend === "up" ? "trend-up" : "trend-down"} size={13} />
                            <span>{trend === "up" ? t("vmra.improving") : t("vmra.declining")}</span>
                        </span>
                    </div>
                    <div className="score-badge-circle">
                        <span className="score-num">{navigationScore}</span>
                        <span className="score-denom">/ 100</span>
                    </div>
                </div>
            </Card>

            <MotivationalQuoteBlock
                category={tier.label}
                score={navigationScore}
            />

            {/* Biomarkers Breakdown Row (2x2 grid) */}
            <div className="biomarkers-grid-row">
                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("navigation.directionFidelity")}</h4>
                        <p className="metric-desc">{t("navigation.turnsCorrect", { correct: correctTurns, total: totalTurns })}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.navigationAccuracy * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("navigation.landmarkSequence")}</h4>
                        <p className="metric-desc">{t("navigation.routeAlignment")}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.landmarkSequenceAccuracy * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("navigation.routeMemory")}</h4>
                        <p className="metric-desc">{biomarkers.destinationRecallAccuracy === 1 ? t("navigation.destIdentified") : t("navigation.destMissed")}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.routeMemoryScore * 100)}%</div>
                </Card>

                <Card className="metric-card">
                    <div className="metric-info-col">
                        <h4>{t("navigation.decisionSpeed")}</h4>
                        <p className="metric-desc">{t("navigation.intersectionReactionTime")}</p>
                    </div>
                    <div className="metric-val">{Math.round(biomarkers.averageDecisionLatencyMs)} <span className="metric-unit">ms</span></div>
                </Card>
            </div>

            {/* Full-Length Biomarker Radar Card */}
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
                    <Icon name="assess" size={16} /> {t("navigation.retakeTest")}
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
                    onClick={onBackToTests || (() => navigate("/tests"))}
                    className="story-primary-start-btn story-back-assessments-btn"
                >
                    {t("navigation.backToAssessments")}
                </SpecularButton>
            </div>
        </div>
    );
}
