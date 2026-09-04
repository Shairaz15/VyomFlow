import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { JOURNEY_NODES, type ActivityId, type JourneyNodeInfo, type ActivityScoreInfo } from "../../../hooks/useJourneyState";
import { Icon, SpecularButton, type IconName } from "../../common";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../contexts/ThemeContext";
import "./SynapseBeamTrail.css";

interface SynapseBeamTrailProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
    activityLatestScoreMap?: Record<ActivityId, ActivityScoreInfo | null>;
    filterMode?: 'all' | 'remaining' | 'completed';
}

// Domain and clinical biomarker metadata
const DOMAIN_MAP: Record<
    ActivityId,
    { domain: string; focus: string; tag: string; rationale: string; biomarkers: string }
> = {
    story: {
        domain: "Narrative Memory",
        focus: "Listen to a short story and retell what you remember.",
        tag: "Story Recall",
        rationale: "Assesses how well you listen, remember key details, and recount a story in your own words.",
        biomarkers: "Biomarkers: Story Recall, Key Details, Speech Flow",
    },
    memory: {
        domain: "Visual Memory",
        focus: "Remember a set of pictures and pick them out from a grid.",
        tag: "Picture Memory",
        rationale: "Tests your visual memory by checking how easily you recognize pictures you saw earlier.",
        biomarkers: "Biomarkers: Picture Recognition, Memory Precision, Decision Speed",
    },
    reaction: {
        domain: "Processing Speed",
        focus: "Tap as quickly as possible when the screen turns green.",
        tag: "Reflex Speed",
        rationale: "Measures your quick reflexes and how steadily you stay alert.",
        biomarkers: "Biomarkers: Reaction Time, Response Steadiness, Alertness",
    },
    pattern: {
        domain: "Working Memory",
        focus: "Watch tiles light up and repeat the sequence in order.",
        tag: "Pattern Memory",
        rationale: "Evaluates short-term memory by challenging you to repeat patterns that grow longer each round.",
        biomarkers: "Biomarkers: Sequence Length, Pattern Accuracy, Memory Span",
    },
    attention: {
        domain: "Inhibitory Control",
        focus: "Stay focused and tap only when you see or hear the target cue.",
        tag: "Focus & Alertness",
        rationale: "Measures how well you stay alert and avoid tapping when distracting signals appear.",
        biomarkers: "Biomarkers: Target Accuracy, Distractor Avoidance, Alertness",
    },
    navigation: {
        domain: "Spatial Navigation",
        focus: "Watch a walking path and choose the right turns to find your way.",
        tag: "Wayfinding",
        rationale: "Checks how well you remember visual landmarks and make correct turns along a route.",
        biomarkers: "Biomarkers: Correct Turns, Landmark Memory, Path Speed",
    },
    language: {
        domain: "Speech & Fluency",
        focus: "Speak freely about an image or topic in your own words.",
        tag: "Speech & Flow",
        rationale: "Evaluates your natural speech flow, vocabulary ease, and clarity of expression.",
        biomarkers: "Biomarkers: Vocabulary Diversity, Speaking Rhythm, Articulation",
    },
};

export function SynapseBeamTrail({
    completedActivityIds,
    activeNodeId,
    activityLatestScoreMap = {} as Record<ActivityId, ActivityScoreInfo | null>,
    filterMode = 'all',
}: SynapseBeamTrailProps) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [hoveredNodeId, setHoveredNodeId] = useState<ActivityId | null>(null);
    const [activeInfoId, setActiveInfoId] = useState<ActivityId | null>(null);

    const handleNodeClick = (node: JourneyNodeInfo) => {
        navigate(node.route);
    };

    const toggleInfo = (id: ActivityId, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveInfoId((prev) => (prev === id ? null : id));
    };

    // Filter nodes according to selected tab
    const filteredNodes = useMemo(() => {
        return JOURNEY_NODES.filter((node) => {
            const isCompleted = completedActivityIds.has(node.id);
            if (filterMode === 'completed') return isCompleted;
            if (filterMode === 'remaining') return !isCompleted;
            return true;
        });
    }, [completedActivityIds, filterMode]);

    const streamLayoutRef = useRef<HTMLDivElement>(null);
    const [splineData, setSplineData] = useState<{ path: string; width: number; height: number }>({
        path: "",
        width: 800,
        height: 400,
    });

    useLayoutEffect(() => {
        const calculateSpine = () => {
            if (!streamLayoutRef.current) return;
            const container = streamLayoutRef.current;
            const containerRect = container.getBoundingClientRect();
            const orbElements = container.querySelectorAll<HTMLElement>('.synapse-junction-orb');

            if (orbElements.length <= 1) {
                setSplineData({ path: "", width: Math.round(containerRect.width) || 800, height: Math.round(containerRect.height) || 400 });
                return;
            }

            const points: Array<{ x: number; y: number }> = [];
            orbElements.forEach((orb) => {
                const orbRect = orb.getBoundingClientRect();
                const x = Math.round(orbRect.left - containerRect.left + orbRect.width / 2);
                const y = Math.round(orbRect.top - containerRect.top + orbRect.height / 2);
                points.push({ x, y });
            });

            if (points.length <= 1) {
                setSplineData({ path: "", width: Math.round(containerRect.width) || 800, height: Math.round(containerRect.height) || 400 });
                return;
            }

            // Path connects from points[0] and strictly ends at the last test points[points.length - 1]
            // It never extends beyond the last test
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const dy = curr.y - prev.y;
                const cp1Y = prev.y + dy * 0.5;
                const cp2Y = curr.y - dy * 0.5;
                d += ` C ${prev.x} ${cp1Y}, ${curr.x} ${cp2Y}, ${curr.x} ${curr.y}`;
            }

            setSplineData({
                path: d,
                width: Math.max(100, Math.round(containerRect.width)),
                height: Math.max(100, Math.round(containerRect.height)),
            });
        };

        calculateSpine();

        const raf = requestAnimationFrame(calculateSpine);
        const timeout = setTimeout(calculateSpine, 80);
        window.addEventListener('resize', calculateSpine);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timeout);
            window.removeEventListener('resize', calculateSpine);
        };
    }, [filteredNodes, filterMode]);

    // Empty state when filter produces 0 items
    if (filteredNodes.length === 0) {
        return (
            <div className="synapse-empty-trail animate-fadeIn">
                <div className="empty-trail-card">
                    <div className="empty-trail-icon">
                        <Icon
                            name={filterMode === "completed" ? "assess" : "check"}
                            size={32}
                        />
                    </div>
                    <h3 className="empty-trail-title">
                        {filterMode === "completed"
                            ? "No Completed Activities Yet"
                            : "All Activities Completed!"}
                    </h3>
                    <p className="empty-trail-desc">
                        {filterMode === "completed"
                            ? "You haven't completed any assessments in the last 7 days. Begin your protocol to track cognitive biomarkers."
                            : "You've successfully completed all 7 assessments in your protocol. View your full diagnostic report or retake any test."}
                    </p>
                    <button
                        type="button"
                        className="empty-trail-cta"
                        onClick={() => {
                            if (filterMode === "completed") {
                                navigate(JOURNEY_NODES[0].route);
                            } else {
                                navigate("/dashboard");
                            }
                        }}
                    >
                        {filterMode === "completed"
                            ? "Start First Assessment →"
                            : "View Full Clinical Dashboard →"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="synapse-beam-container animate-fadeIn">
            {/* Winding Synaptic Stream Layout */}
            <div className="synapse-stream-layout" ref={streamLayoutRef}>
                {/* Continuous Winding SVG Neural River (Desktop >= 768px) */}
                {filteredNodes.length > 1 && splineData.path && (
                    <svg
                        className="synapse-svg-spine hidden md:block"
                        viewBox={`0 0 ${splineData.width} ${splineData.height}`}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <defs>
                            {/* Base Inactive Gradient */}
                            <linearGradient id="synapse-base-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
                                <stop offset="50%" stopColor="var(--color-accent-secondary)" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.25" />
                            </linearGradient>

                            {/* Traveling Light Pulse Gradient */}
                            <linearGradient id="synapse-pulse-beam" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="transparent" stopOpacity="0" />
                                <stop offset="35%" stopColor="var(--color-accent)" stopOpacity="0.9" />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                                <stop offset="65%" stopColor="var(--color-accent)" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </linearGradient>

                            {/* Soft Glow Filter */}
                            <filter id="synapse-blur" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Background Guide Spline */}
                        <path
                            d={splineData.path}
                            className="synapse-path-bg"
                            stroke="url(#synapse-base-glow)"
                            strokeWidth="3.5"
                            strokeDasharray="6 6"
                        />

                        {/* Ambient Glow Spline */}
                        <path
                            d={splineData.path}
                            className="synapse-path-glow"
                            stroke="var(--color-accent)"
                            strokeWidth="5"
                            strokeOpacity="0.3"
                            filter="url(#synapse-blur)"
                        />

                        {/* Traveling Light Beam */}
                        <path
                            d={splineData.path}
                            className="synapse-path-pulse"
                            stroke="url(#synapse-pulse-beam)"
                            strokeWidth="4"
                        />
                    </svg>
                )}

                {/* Nodes Stack */}
                <div className="synapse-nodes-flow">
                    {filteredNodes.map((node, visibleIndex) => {
                        const isCompleted = completedActivityIds.has(node.id);
                        const isActive = node.id === activeNodeId;
                        const isHovered = hoveredNodeId === node.id;
                        const isLast = visibleIndex === filteredNodes.length - 1 && filteredNodes.length > 1;
                        const isEven = visibleIndex % 2 === 0;
                        const meta = DOMAIN_MAP[node.id];
                        const latestScore = activityLatestScoreMap[node.id];
                        const isInfoOpen = activeInfoId === node.id;
                        const originalIndex = JOURNEY_NODES.findIndex((n) => n.id === node.id);

                        const nodeTitle = t(`journeyNodes.${node.id}.title`) || node.title;
                        const nodeDomain = t(`journeyNodes.${node.id}.domain`) || meta.domain;
                        const nodeFocus = t(`journeyNodes.${node.id}.focus`) || meta.focus;
                        const nodeTag = t(`journeyNodes.${node.id}.tag`) || meta.tag;
                        const nodeRationale = t(`journeyNodes.${node.id}.rationale`) || meta.rationale;
                        const nodeBiomarkers = meta.biomarkers; // Keep in English for clinical precision

                        return (
                            <div
                                key={node.id}
                                id={`journey-node-${node.id}`}
                                data-activity-id={node.id}
                                className={`synapse-node-wrapper ${
                                    isLast ? "node-center" : isEven ? "node-left" : "node-right"
                                } ${isCompleted ? "is-completed" : isActive ? "is-active" : "is-pending"} ${
                                    isHovered ? "is-hovered" : ""
                                }`}
                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                onMouseLeave={() => setHoveredNodeId(null)}
                            >
                                {/* Synaptic Anchor Junction */}
                                <div className="synapse-junction-orb" aria-hidden="true">
                                    <div className="orb-center">
                                        {isCompleted ? (
                                            <Icon name="check" size={13} className="orb-check-icon" />
                                        ) : (
                                            <span className="orb-num">{originalIndex + 1}</span>
                                        )}
                                    </div>
                                    {isActive && <div className="orb-halo-pulse" />}
                                </div>

                                {/* 100% Solid Opaque Card with Sazzad Aurora Glassmorphism for Up Next */}
                                <div
                                    className={`synapse-card ${isActive ? "sazzad-card" : ""}`}
                                    onClick={() => handleNodeClick(node)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleNodeClick(node);
                                        }
                                    }}
                                    aria-label={`${nodeTitle}, ${isCompleted ? t("journey.completed") : isActive ? t("journey.upNext") : t("journey.upcoming")}`}
                                >
                                    {/* Up Next: Animated Sazzad Aurora Blobs (Behind Content Layer) */}
                                    {isActive && (
                                        <>
                                            <div className="sazzad-aurora sazzad-aurora-primary" aria-hidden="true" />
                                            <div className="sazzad-aurora sazzad-aurora-secondary" aria-hidden="true" />
                                            <div className="sazzad-bg" aria-hidden="true" />
                                        </>
                                    )}

                                    {/* Card Content Layer */}
                                    <div className="synapse-card-content">
                                        {/* 1. Card Top Metadata Row (Streamlined) */}
                                        <div className="synapse-card-top">
                                        <div className="top-meta-left">
                                            <span className="synapse-index-chip">0{originalIndex + 1}</span>
                                            <span className="synapse-domain-badge">{nodeDomain}</span>
                                        </div>

                                        <div className="top-meta-right">
                                            <span className="synapse-time-chip">
                                                <Icon name="clock" size={11} /> {node.duration}
                                            </span>
                                            {isCompleted && (
                                                <span className="synapse-status-done">
                                                    <Icon name="check" size={11} /> {t("journey.done")}
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="synapse-status-current">
                                                    <span className="current-dot" /> {t("journey.upNext")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Interactive Clinical Info Popover */}
                                    {isInfoOpen && (
                                        <div
                                            className="synapse-info-popover animate-fadeIn"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="info-popover-header">
                                                <span className="info-popover-title">{t("journey.clinicalTarget")}</span>
                                                <button
                                                    type="button"
                                                    className="info-close-btn"
                                                    onClick={(e) => toggleInfo(node.id, e)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <p className="info-popover-rationale">{nodeRationale}</p>
                                            <div className="info-popover-biomarkers">
                                                <Icon name="brain-circuit" size={12} />
                                                <span>{nodeBiomarkers}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Main Body: Icon + Title (with info trigger) + Focus */}
                                    <div className="synapse-card-main">
                                        <div className="synapse-icon-bubble">
                                            <Icon name={node.iconName as IconName} size={20} />
                                        </div>
                                        <div className="synapse-title-wrap">
                                            <div className="synapse-title-row">
                                                <h3 className="synapse-card-title vyom-serif">{nodeTitle}</h3>
                                                <button
                                                    type="button"
                                                    className={`synapse-info-trigger ${isInfoOpen ? "active" : ""}`}
                                                    onClick={(e) => toggleInfo(node.id, e)}
                                                    title="What does this assessment measure?"
                                                    aria-label="Assessment information"
                                                >
                                                    <Icon name="info" size={11} />
                                                </button>
                                            </div>
                                            <p className="synapse-card-focus">{nodeFocus}</p>
                                        </div>
                                    </div>

                                    {/* 3. Card Bottom Action Row */}
                                    <div className="synapse-card-bottom">
                                        <div className="bottom-meta-left">
                                            <span className="synapse-tag-pill">{nodeTag}</span>
                                            {isCompleted && latestScore && (
                                                <span
                                                    className={`synapse-score-badge ${
                                                        latestScore.trend === "down" ? "trend-down" : "trend-up"
                                                    }`}
                                                    title={
                                                        latestScore.previousScore && latestScore.previousScore > 0 && latestScore.trend !== "neutral"
                                                            ? `Latest: ${latestScore.label} (${
                                                                  latestScore.trend === "up"
                                                                      ? node.id === "reaction"
                                                                          ? "Faster"
                                                                          : "Improved"
                                                                      : node.id === "reaction"
                                                                      ? "Slower"
                                                                      : "Lower"
                                                              } vs previous ${Math.round(latestScore.previousScore)}${
                                                                  latestScore.label.includes("ms") ? " ms" : "%"
                                                              })`
                                                            : `Latest: ${latestScore.label}`
                                                    }
                                                >
                                                    <Icon
                                                        name={latestScore.trend === "down" ? "trend-down" : "trend-up"}
                                                        size={11}
                                                    />{" "}
                                                    {latestScore.label}
                                                </span>
                                            )}
                                        </div>

                                        <SpecularButton
                                            size="sm"
                                            radius={10}
                                            tint={isActive ? (isDark ? "#174341" : "#4F7C78") : isCompleted ? (isDark ? "#123b2c" : "#15803d") : (isDark ? "#1a2a3a" : "#475569")}
                                            tintOpacity={isActive ? 0.96 : 0.88}
                                            lineColor={isActive ? "#5EEAD4" : isCompleted ? "#34d399" : (isDark ? "#94a3b8" : "#cbd5e1")}
                                            baseColor={isDark ? "#0f172a" : "#334155"}
                                            textColor="#FFFFFF"
                                            intensity={isActive ? 1.4 : 0.85}
                                            followMouse
                                            autoAnimate={isActive}
                                            className={`synapse-cta-btn ${
                                                isActive
                                                    ? "cta-btn-active"
                                                    : isCompleted
                                                    ? "cta-btn-completed"
                                                    : "cta-btn-subtle"
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNodeClick(node);
                                            }}
                                        >
                                            {isCompleted ? (
                                                <>
                                                    <Icon name="assess" size={12} /> {t("buttons.retry")}
                                                </>
                                            ) : isActive ? (
                                                <>{t("buttons.startAssessment")} →</>
                                            ) : (
                                                <>{t("journey.startActivity")}</>
                                            )}
                                        </SpecularButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);
}
