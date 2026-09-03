import { PageWrapper } from "../components/layout";
import { GardenGrowthWidget } from "../components/journey/GardenGrowthWidget";
import { useJourneyState, JOURNEY_NODES } from "../hooks/useJourneyState";
import { Button } from "../components/common";
import { useNavigate } from "react-router-dom";
import "./ProgressPage.css";

export function ProgressPage() {
    const navigate = useNavigate();
    const {
        totalSessionsCompleted,
        growthLevel,
        completedCount,
        totalCount,
        completedActivityIds,
    } = useJourneyState();

    const STAGES = [
        { level: 1, name: "Seed", icon: "🌱", req: "1 check-in", desc: "Planted your daily check-in habit." },
        { level: 2, name: "Sprout", icon: "🌿", req: "3 check-ins", desc: "Consistency is beginning to take root." },
        { level: 3, name: "Flower", icon: "🌸", req: "7 check-ins", desc: "A flourishing rhythm of routine check-ins." },
        { level: 4, name: "Small Tree", icon: "🌳", req: "14 check-ins", desc: "Deeply established health monitoring habit." },
        { level: 5, name: "Flourishing Garden", icon: "🏡", req: "30 check-ins", desc: "A thriving personal cognitive health baseline." },
    ];

    return (
        <PageWrapper>
            <div className="progress-page container animate-fadeIn">
                <header className="progress-header">
                    <div className="header-badge">
                        <span className="badge-emoji">{growthLevel.icon}</span>
                        <span>{growthLevel.stage}</span>
                    </div>
                    <h1>My Progress & Consistency</h1>
                    <p className="progress-subtitle">
                        Tracking your participation rhythm and habit growth over time.
                    </p>
                </header>

                {/* Primary Growth Card */}
                <div className="growth-hero-wrapper">
                    <GardenGrowthWidget
                        totalSessions={totalSessionsCompleted}
                        growthLevel={growthLevel}
                    />
                </div>

                {/* Stage Milestone Timeline */}
                <section className="stages-section">
                    <h2 className="section-title">Growth Milestones</h2>
                    <div className="stages-grid">
                        {STAGES.map((stage) => {
                            const threshold = stage.level === 1 ? 1 : stage.level === 2 ? 3 : stage.level === 3 ? 7 : stage.level === 4 ? 14 : 30;
                            const isAchieved = totalSessionsCompleted >= threshold;
                            const isCurrent = growthLevel.label === stage.name;

                            return (
                                <div
                                    key={stage.level}
                                    className={`stage-card ${isAchieved ? "achieved" : ""} ${isCurrent ? "current" : ""}`}
                                >
                                    <div className="stage-icon">{stage.icon}</div>
                                    <div className="stage-info">
                                        <h3>{stage.name}</h3>
                                        <span className="stage-req">{stage.req}</span>
                                        <p>{stage.desc}</p>
                                    </div>
                                    {isAchieved && <span className="stage-checkmark">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Today's Activity Progress */}
                <section className="today-progress-section">
                    <div className="today-header">
                        <h2>Today's Journey Activities</h2>
                        <span className="today-count-pill">{completedCount} / {totalCount} Complete</span>
                    </div>
                    <div className="activities-list">
                        {JOURNEY_NODES.map((node, index) => {
                            const isCompleted = completedActivityIds.has(node.id);
                            return (
                                <div key={node.id} className={`activity-row-card ${isCompleted ? "completed" : ""}`}>
                                    <div className="activity-row-left">
                                        <span className="row-step-num">0{index + 1}</span>
                                        <span className="row-icon">{node.biome.icon}</span>
                                        <div>
                                            <h4>{node.title}</h4>
                                            <span className="row-category">{node.canonicalTitle}</span>
                                        </div>
                                    </div>
                                    <div className="activity-row-right">
                                        <span className={`status-pill ${isCompleted ? "done" : "pending"}`}>
                                            {isCompleted ? "✓ Complete" : "○ Pending"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Bottom Action Footer */}
                <div className="progress-actions-footer">
                    <Button variant="primary" size="lg" onClick={() => navigate("/tests")}>
                        Return to Journey Map →
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
