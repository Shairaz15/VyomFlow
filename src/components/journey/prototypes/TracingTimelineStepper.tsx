import { useNavigate } from "react-router-dom";
import { JOURNEY_NODES, type ActivityId, type JourneyNodeInfo } from "../../../hooks/useJourneyState";
import { Icon, type IconName } from "../../common";
import "./TracingTimelineStepper.css";

interface TracingTimelineStepperProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
}

// Biomarker details for clinical clarity
const BIOMARKER_MAP: Record<ActivityId, { category: string; biomarkers: string[]; estimatedTime: string }> = {
    story: {
        category: "Narrative Memory",
        biomarkers: ["Recall Accuracy", "Information Units", "Speech Sequence"],
        estimatedTime: "5 mins",
    },
    memory: {
        category: "Episodic Retention",
        biomarkers: ["Target Recognition", "Delayed Recall", "Distractor Resistance"],
        estimatedTime: "2 mins",
    },
    reaction: {
        category: "Attentional Latency",
        biomarkers: ["Mean Response Time", "Vigilance Consistency", "False Starts"],
        estimatedTime: "1 min",
    },
    pattern: {
        category: "Working Memory",
        biomarkers: ["Max Span Capacity", "Spatial Sequence", "Chunking Latency"],
        estimatedTime: "2 mins",
    },
    attention: {
        category: "Inhibitory Control",
        biomarkers: ["Sensitivity Index (d′)", "Commission Errors", "Vigilance Slope"],
        estimatedTime: "3 mins",
    },
    navigation: {
        category: "Spatial Orientation",
        biomarkers: ["Route Learning", "Landmark Ordering", "Decision Latency"],
        estimatedTime: "3 mins",
    },
    language: {
        category: "Speech Biomarkers",
        biomarkers: ["Guiraud Vocabulary TTR", "Phonation Ratio", "Fluency Index"],
        estimatedTime: "2 mins",
    },
};

export function TracingTimelineStepper({
    completedActivityIds,
    activeNodeId,
}: TracingTimelineStepperProps) {
    const navigate = useNavigate();

    const handleNodeSelect = (node: JourneyNodeInfo) => {
        navigate(node.route);
    };

    return (
        <div className="tracing-stepper-root animate-fadeIn">
            {/* Minimal Stepper Header */}
            <div className="tracing-stepper-intro">
                <span className="stepper-kicker">Clinical Progression Protocol</span>
                <h2 className="stepper-title vyom-serif">Cognitive Assessment Sequence</h2>
                <p className="stepper-desc">
                    Each module evaluates discrete neurocognitive biomarkers with standardized normative scoring.
                </p>
            </div>

            {/* Timeline Stream */}
            <div className="tracing-timeline-track">
                {/* Tracing Rail Line */}
                <div className="tracing-rail-line" aria-hidden="true" />

                {/* Stepper Nodes */}
                <div className="tracing-steps-container">
                    {JOURNEY_NODES.map((node, index) => {
                        const isCompleted = completedActivityIds.has(node.id);
                        const isActive = node.id === activeNodeId;
                        const meta = BIOMARKER_MAP[node.id];

                        return (
                            <div
                                key={node.id}
                                className={`tracing-step-row ${
                                    isCompleted ? "is-completed" : isActive ? "is-active" : "is-pending"
                                }`}
                            >
                                {/* Step Indicator Anchor on Rail */}
                                <div className="tracing-step-indicator">
                                    <div className="indicator-core">
                                        {isCompleted ? (
                                            <Icon name="check" size={14} className="indicator-icon" />
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>
                                    {isActive && <div className="indicator-halo" />}
                                </div>

                                {/* Step Milestone Card */}
                                <div
                                    className="tracing-step-card glass-card"
                                    onClick={() => handleNodeSelect(node)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleNodeSelect(node);
                                        }
                                    }}
                                >
                                    {/* Card Top Line */}
                                    <div className="step-card-header">
                                        <div className="step-tag-group">
                                            <span className="step-category-tag">{meta.category}</span>
                                            <span className="step-time-tag">
                                                <Icon name="clock" size={12} /> {meta.estimatedTime}
                                            </span>
                                        </div>

                                        <div className="step-status-badge">
                                            {isCompleted ? (
                                                <span className="badge-done">Recorded</span>
                                            ) : isActive ? (
                                                <span className="badge-current">Up Next</span>
                                            ) : (
                                                <span className="badge-queued">Scheduled</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Title */}
                                    <div className="step-card-title-row">
                                        <div className="step-icon-box">
                                            <Icon name={node.iconName as IconName} size={20} />
                                        </div>
                                        <h3 className="step-title vyom-serif">{node.title}</h3>
                                    </div>

                                    {/* Description */}
                                    <p className="step-description">{node.description}</p>

                                    {/* Biomarker Chips */}
                                    <div className="step-biomarkers-row">
                                        {meta.biomarkers.map((bio, i) => (
                                            <span key={i} className="biomarker-chip">
                                                {bio}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA Footer */}
                                    <div className="step-card-footer">
                                        <button
                                            type="button"
                                            className={`step-cta-btn ${isActive ? "btn-launch" : "btn-view"}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNodeSelect(node);
                                            }}
                                        >
                                            {isCompleted ? "Retake Module" : isActive ? "Start Assessment →" : "View Protocol"}
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
