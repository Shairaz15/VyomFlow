import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { JOURNEY_NODES, type ActivityId, type JourneyNodeInfo, type ActivityScoreInfo } from "../../../hooks/useJourneyState";
import { Icon, type IconName } from "../../common";
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
        focus: "Recall accuracy, informational units & sequential preservation",
        tag: "Episodic Recall",
        rationale: "Assesses how effectively your brain encodes spoken stories, retains sequential details, and reconstructs the narrative timeline without cues.",
        biomarkers: "Biomarkers: Precision Recall (%), Verbatim Units, Phonation Hesitation Rate",
    },
    memory: {
        domain: "Visual Memory",
        focus: "Delayed object recognition & retention across distractors",
        tag: "Pattern Retention",
        rationale: "Measures visual short-term encoding and your ability to accurately recognize target objects when placed among visual distractors.",
        biomarkers: "Biomarkers: Recognition Accuracy (%), False-Alarm Sensitivity, Decision Latency",
    },
    reaction: {
        domain: "Processing Speed",
        focus: "Motor latency, response speed & attentional consistency",
        tag: "Motor Latency",
        rationale: "Evaluates rapid motor response speed and intra-individual neural reaction stability during unpredictable visual stimuli.",
        biomarkers: "Biomarkers: Median Reaction Time (ms), Response Variability (CV), Attentional Lapses",
    },
    pattern: {
        domain: "Working Memory",
        focus: "Spatial sequence span & visual-spatial chunking capacity",
        tag: "Spatial Span",
        rationale: "Tests non-verbal fluid intelligence, inductive reasoning, and the ability to identify complex completing matrix patterns.",
        biomarkers: "Biomarkers: Sequence Span, Matrix Match Accuracy (%), Spatial Chunking",
    },
    attention: {
        domain: "Inhibitory Control",
        focus: "Signal sensitivity (d′), impulse suppression & vigilance stability",
        tag: "Vigilance Index",
        rationale: "Measures sustained vigilance over time and your ability to suppress motor impulses when exposed to non-target distractors.",
        biomarkers: "Biomarkers: Signal Detection Index (d′), Commission Errors, Reaction Consistency",
    },
    navigation: {
        domain: "Spatial Navigation",
        focus: "Egocentric wayfinding, intersection choice & landmark sequencing",
        tag: "Route Memory",
        rationale: "Evaluates real-world topological orientation, spatial mapping, and decision accuracy at video-simulated urban intersections.",
        biomarkers: "Biomarkers: Route Accuracy (%), Intersection Latency, Landmark Orientation",
    },
    language: {
        domain: "Speech & Fluency",
        focus: "Guiraud vocabulary diversity, phonation ratio & fluency index",
        tag: "Acoustic Biomarkers",
        rationale: "Captures spontaneous natural speech to assess semantic richness, lexical variation, and acoustic pause dynamics.",
        biomarkers: "Biomarkers: Guiraud Lexical Richness, Speech-to-Pause Ratio, Acoustic Pitch Entropy",
    },
};

export function SynapseBeamTrail({
    completedActivityIds,
    activeNodeId,
    activityLatestScoreMap = {} as Record<ActivityId, ActivityScoreInfo | null>,
    filterMode = 'all',
}: SynapseBeamTrailProps) {
    const navigate = useNavigate();
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

    // Dynamically generate smooth Bezier spline path for the exact number of visible nodes
    const splinePath = useMemo(() => {
        const count = filteredNodes.length;
        if (count <= 1) return "";
        const points: Array<{ x: number; y: number }> = [];

        for (let i = 0; i < count; i++) {
            const y = 70 + i * 200;
            let x = 230;
            if (i === count - 1 && count > 1) {
                x = 400; // Center final node
            } else if (i % 2 === 1) {
                x = 570; // Right
            } else {
                x = 230; // Left
            }
            points.push({ x, y });
        }

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cp1Y = prev.y + 100;
            const cp2Y = curr.y - 100;
            d += ` C ${prev.x} ${cp1Y}, ${curr.x} ${cp2Y}, ${curr.x} ${curr.y}`;
        }
        return d;
    }, [filteredNodes.length]);

    const svgHeight = useMemo(() => {
        return Math.max(250, filteredNodes.length * 200 - 50);
    }, [filteredNodes.length]);

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
            <div className="synapse-stream-layout">
                {/* Continuous Winding SVG Neural River (Desktop >= 768px) */}
                {filteredNodes.length > 1 && splinePath && (
                    <svg
                        className="synapse-svg-spine hidden md:block"
                        viewBox={`0 0 800 ${svgHeight}`}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
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
                            d={splinePath}
                            className="synapse-path-bg"
                            stroke="url(#synapse-base-glow)"
                            strokeWidth="3.5"
                            strokeDasharray="6 6"
                        />

                        {/* Ambient Glow Spline */}
                        <path
                            d={splinePath}
                            className="synapse-path-glow"
                            stroke="var(--color-accent)"
                            strokeWidth="5"
                            strokeOpacity="0.3"
                            filter="url(#synapse-blur)"
                        />

                        {/* Traveling Light Beam */}
                        <path
                            d={splinePath}
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

                        return (
                            <div
                                key={node.id}
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

                                {/* 100% Solid Opaque Card */}
                                <div
                                    className="synapse-card"
                                    onClick={() => handleNodeClick(node)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleNodeClick(node);
                                        }
                                    }}
                                    aria-label={`${node.title}, ${isCompleted ? "Completed" : isActive ? "Current test" : "Upcoming test"}`}
                                >
                                    {/* 1. Card Top Metadata Row (Streamlined) */}
                                    <div className="synapse-card-top">
                                        <div className="top-meta-left">
                                            <span className="synapse-index-chip">0{originalIndex + 1}</span>
                                            <span className="synapse-domain-badge">{meta.domain}</span>
                                        </div>

                                        <div className="top-meta-right">
                                            <span className="synapse-time-chip">
                                                <Icon name="clock" size={11} /> {node.duration}
                                            </span>
                                            {isCompleted && (
                                                <span className="synapse-status-done">
                                                    <Icon name="check" size={11} /> Done
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="synapse-status-current">
                                                    <span className="current-dot" /> Up Next
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
                                                <span className="info-popover-title">Clinical Measurement Target</span>
                                                <button
                                                    type="button"
                                                    className="info-close-btn"
                                                    onClick={(e) => toggleInfo(node.id, e)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <p className="info-popover-rationale">{meta.rationale}</p>
                                            <div className="info-popover-biomarkers">
                                                <Icon name="brain-circuit" size={12} />
                                                <span>{meta.biomarkers}</span>
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
                                                <h3 className="synapse-card-title vyom-serif">{node.title}</h3>
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
                                            <p className="synapse-card-focus">{meta.focus}</p>
                                        </div>
                                    </div>

                                    {/* 3. Card Bottom Action Row */}
                                    <div className="synapse-card-bottom">
                                        <div className="bottom-meta-left">
                                            <span className="synapse-tag-pill">{meta.tag}</span>
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

                                        <button
                                            type="button"
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
                                                    <Icon name="assess" size={12} /> Retake
                                                </>
                                            ) : isActive ? (
                                                <>Start Test →</>
                                            ) : (
                                                <>Begin</>
                                            )}
                                        </button>
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
