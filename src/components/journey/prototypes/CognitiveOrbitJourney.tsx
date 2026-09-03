import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JOURNEY_NODES, type ActivityId } from "../../../hooks/useJourneyState";
import { Icon, type IconName } from "../../common";
import "./CognitiveOrbitJourney.css";

interface CognitiveOrbitJourneyProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
}

export function CognitiveOrbitJourney({
    completedActivityIds,
    activeNodeId,
}: CognitiveOrbitJourneyProps) {
    const navigate = useNavigate();
    const [selectedNodeId, setSelectedNodeId] = useState<ActivityId>(activeNodeId);

    const completedCount = completedActivityIds.size;
    const totalCount = JOURNEY_NODES.length;
    const completionPct = Math.round((completedCount / totalCount) * 100);

    const selectedNode = JOURNEY_NODES.find((n) => n.id === selectedNodeId) || JOURNEY_NODES[0];
    const isSelectedCompleted = completedActivityIds.has(selectedNode.id);
    const isSelectedActive = selectedNode.id === activeNodeId;

    const handleLaunchSelected = () => {
        navigate(selectedNode.route);
    };

    // Circular SVG Progress Math
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completionPct / 100) * circumference;

    return (
        <div className="orbit-journey-root animate-fadeIn">
            {/* Center Cognitive Hub */}
            <div className="orbit-center-hub glass-card">
                <div className="orbit-ring-wrapper">
                    <svg className="orbit-svg-ring" viewBox="0 0 160 160">
                        {/* Background Track */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            className="orbit-ring-track"
                        />
                        {/* Animated Progress Arc */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            className="orbit-ring-progress"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                            }}
                        />
                    </svg>
                    <div className="orbit-hub-center-content">
                        <span className="hub-metric-num">{completedCount}</span>
                        <span className="hub-metric-denom">/ {totalCount}</span>
                        <span className="hub-metric-sub">Complete</span>
                    </div>
                </div>

                <div className="orbit-hub-text">
                    <span className="hub-status-kicker">Session Trajectory</span>
                    <h2 className="hub-headline vyom-serif">Cognitive Orbit</h2>
                    <p className="hub-subtitle">
                        {completedCount === totalCount
                            ? "All 7 cognitive dimensions completed for today's screening."
                            : `${totalCount - completedCount} domains remaining in your daily session.`}
                    </p>
                </div>
            </div>

            {/* Orbital Domain Cards Grid */}
            <div className="orbit-domains-grid">
                {JOURNEY_NODES.map((node, index) => {
                    const isDone = completedActivityIds.has(node.id);
                    const isActive = node.id === activeNodeId;
                    const isFocused = node.id === selectedNodeId;

                    return (
                        <div
                            key={node.id}
                            className={`orbit-node-cell glass-card ${
                                isDone ? "orbit-done" : isActive ? "orbit-active" : "orbit-pending"
                            } ${isFocused ? "orbit-focused" : ""}`}
                            onClick={() => setSelectedNodeId(node.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedNodeId(node.id);
                                }
                            }}
                            aria-label={`${node.title}, ${isDone ? "Completed" : isActive ? "Current test" : "Pending"}`}
                        >
                            {/* Top Badge */}
                            <div className="orbit-node-top">
                                <div className="orbit-node-index">{String(index + 1).padStart(2, "0")}</div>
                                <div className="orbit-icon-circle">
                                    <Icon name={node.iconName as IconName} size={18} />
                                </div>
                                <div className="orbit-status-dot-wrap">
                                    {isDone ? (
                                        <span className="orbit-status-check">✓</span>
                                    ) : isActive ? (
                                        <span className="orbit-pulse-halo" />
                                    ) : (
                                        <span className="orbit-status-idle" />
                                    )}
                                </div>
                            </div>

                            {/* Node Title & Duration */}
                            <h4 className="orbit-node-title vyom-serif">{node.title}</h4>
                            <div className="orbit-node-meta">
                                <span className="orbit-time">
                                    <Icon name="clock" size={11} /> {node.duration}
                                </span>
                                <span className="orbit-domain-lbl">{node.canonicalTitle}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Focused Inspection Drawer / Launchpad */}
            <div className="orbit-launchpad-card glass-card animate-scaleUp">
                <div className="launchpad-left">
                    <div className="launchpad-icon-wrap">
                        <Icon name={selectedNode.iconName as IconName} size={24} />
                    </div>
                    <div className="launchpad-details">
                        <div className="launchpad-tag-row">
                            <span className="launchpad-tag">Selected Protocol</span>
                            <span className="launchpad-time">{selectedNode.duration} Duration</span>
                        </div>
                        <h3 className="launchpad-title vyom-serif">{selectedNode.title}</h3>
                        <p className="launchpad-desc">{selectedNode.description}</p>
                    </div>
                </div>

                <div className="launchpad-right">
                    <button
                        type="button"
                        className={`launchpad-btn ${isSelectedActive ? "btn-active-launch" : "btn-normal-launch"}`}
                        onClick={handleLaunchSelected}
                    >
                        {isSelectedCompleted ? "Retake Assessment" : isSelectedActive ? "Launch Assessment →" : "Start Test"}
                    </button>
                </div>
            </div>
        </div>
    );
}
