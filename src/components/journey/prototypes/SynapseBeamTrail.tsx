import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JOURNEY_NODES, type ActivityId, type JourneyNodeInfo } from "../../../hooks/useJourneyState";
import { Icon, type IconName } from "../../common";
import "./SynapseBeamTrail.css";

interface SynapseBeamTrailProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
}

// Domain and biomarker metadata
const DOMAIN_MAP: Record<ActivityId, { domain: string; focus: string; tag: string }> = {
    story: {
        domain: "Narrative Memory",
        focus: "Recall accuracy, informational units & sequential preservation",
        tag: "Episodic Recall",
    },
    memory: {
        domain: "Visual Memory",
        focus: "Delayed object recognition & retention across distractors",
        tag: "Pattern Retention",
    },
    reaction: {
        domain: "Processing Speed",
        focus: "Motor latency, response speed & attentional consistency",
        tag: "Motor Latency",
    },
    pattern: {
        domain: "Working Memory",
        focus: "Spatial sequence span & visual-spatial chunking capacity",
        tag: "Spatial Span",
    },
    attention: {
        domain: "Inhibitory Control",
        focus: "Signal sensitivity (d′), impulse suppression & vigilance stability",
        tag: "Vigilance Index",
    },
    navigation: {
        domain: "Spatial Navigation",
        focus: "Egocentric wayfinding, intersection choice & landmark sequencing",
        tag: "Route Memory",
    },
    language: {
        domain: "Speech & Fluency",
        focus: "Guiraud vocabulary diversity, phonation ratio & fluency index",
        tag: "Acoustic Biomarkers",
    },
};

export function SynapseBeamTrail({
    completedActivityIds,
    activeNodeId,
}: SynapseBeamTrailProps) {
    const navigate = useNavigate();
    const [hoveredNodeId, setHoveredNodeId] = useState<ActivityId | null>(null);

    const handleNodeClick = (node: JourneyNodeInfo) => {
        navigate(node.route);
    };

    return (
        <div className="synapse-beam-container animate-fadeIn">
            {/* Winding Synaptic Stream Layout */}
            <div className="synapse-stream-layout">
                {/* Continuous Winding SVG Neural River (Desktop >= 768px) */}
                <svg
                    className="synapse-svg-spine hidden md:block"
                    viewBox="0 0 800 1350"
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

                        {/* Traveling Light Pulse Gradient (Magic UI Beam) */}
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

                    {/* Background Guide Spline (Connecting nodes organically in a sinuous S-curve) */}
                    <path
                        d="M 230 70 C 420 70, 380 270, 570 270 C 760 270, 40 470, 230 470 C 420 470, 380 670, 570 670 C 760 670, 40 870, 230 870 C 420 870, 380 1070, 570 1070 C 760 1070, 250 1270, 400 1270"
                        className="synapse-path-bg"
                        stroke="url(#synapse-base-glow)"
                        strokeWidth="3.5"
                        strokeDasharray="6 6"
                    />

                    {/* Ambient Glow Spline */}
                    <path
                        d="M 230 70 C 420 70, 380 270, 570 270 C 760 270, 40 470, 230 470 C 420 470, 380 670, 570 670 C 760 670, 40 870, 230 870 C 420 870, 380 1070, 570 1070 C 760 1070, 250 1270, 400 1270"
                        className="synapse-path-glow"
                        stroke="var(--color-accent)"
                        strokeWidth="5"
                        strokeOpacity="0.3"
                        filter="url(#synapse-blur)"
                    />

                    {/* Traveling Magic UI Light Beam */}
                    <path
                        d="M 230 70 C 420 70, 380 270, 570 270 C 760 270, 40 470, 230 470 C 420 470, 380 670, 570 670 C 760 670, 40 870, 230 870 C 420 870, 380 1070, 570 1070 C 760 1070, 250 1270, 400 1270"
                        className="synapse-path-pulse"
                        stroke="url(#synapse-pulse-beam)"
                        strokeWidth="4"
                    />
                </svg>

                {/* Nodes Stack */}
                <div className="synapse-nodes-flow">
                    {JOURNEY_NODES.map((node, index) => {
                        const isCompleted = completedActivityIds.has(node.id);
                        const isActive = node.id === activeNodeId;
                        const isHovered = hoveredNodeId === node.id;
                        const isLast = index === JOURNEY_NODES.length - 1;
                        const isEven = index % 2 === 0;
                        const meta = DOMAIN_MAP[node.id];

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
                                {/* Synaptic Anchor Badge */}
                                <div className="synapse-junction-orb" aria-hidden="true">
                                    <div className="orb-center">
                                        {isCompleted ? (
                                            <Icon name="check" size={13} className="orb-check-icon" />
                                        ) : (
                                            <span className="orb-num">{index + 1}</span>
                                        )}
                                    </div>
                                    {isActive && <div className="orb-halo-pulse" />}
                                </div>

                                {/* Solid Opaque Card (Covers the trail beneath with zero bleed-through) */}
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
                                    {/* 1. Card Top Metadata Row */}
                                    <div className="synapse-card-top">
                                        <div className="top-meta-left">
                                            <span className="synapse-index-chip">0{index + 1}</span>
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

                                    {/* 2. Main Body: Icon + Title + Focus */}
                                    <div className="synapse-card-main">
                                        <div className="synapse-icon-bubble">
                                            <Icon name={node.iconName as IconName} size={20} />
                                        </div>
                                        <div className="synapse-title-wrap">
                                            <h3 className="synapse-card-title vyom-serif">{node.title}</h3>
                                            <p className="synapse-card-focus">{meta.focus}</p>
                                        </div>
                                    </div>

                                    {/* 3. Card Bottom Action Row */}
                                    <div className="synapse-card-bottom">
                                        <span className="synapse-tag-pill">{meta.tag}</span>
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
