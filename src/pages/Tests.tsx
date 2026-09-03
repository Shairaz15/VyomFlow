import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Icon } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { PageWrapper } from "../components/layout";
import { useJourneyState, JOURNEY_NODES, type ActivityId } from "../hooks/useJourneyState";
import { JourneyMap } from "../components/journey/JourneyMap";
import { ActivityCompletionScreen } from "../components/journey/ActivityCompletionScreen";
import { JourneyCompletion } from "../components/journey/JourneyCompletion";
import "./Tests.css";

export function Tests() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const [filterMode, setFilterMode] = useState<'all' | 'remaining' | 'completed'>('all');

    const {
        completedActivityIds,
        completedCount,
        totalCount,
        activeNodeId,
        isJourneyComplete,
        activityLastCompletedMap,
        activityLatestScoreMap,
    } = useJourneyState();

    // Modals state
    const [completedActivityToShow, setCompletedActivityToShow] = useState<ActivityId | null>(null);
    const [showJourneyCompleteModal, setShowJourneyCompleteModal] = useState(false);

    // Check query params for completion notification
    useEffect(() => {
        const completedParam = searchParams.get("completed") as ActivityId | null;
        if (completedParam) {
            setCompletedActivityToShow(completedParam);
            // Clear URL param after reading
            searchParams.delete("completed");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Handle greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        const userName = user?.displayName?.split(" ")[0] || "Participant";
        if (hour < 12) return `Good morning, ${userName}`;
        if (hour < 18) return `Good afternoon, ${userName}`;
        return `Good evening, ${userName}`;
    };

    const activeNode = JOURNEY_NODES.find((n) => n.id === activeNodeId) || JOURNEY_NODES[0];

    // Compute dynamic remaining estimated protocol duration
    const remainingMinutes = useMemo(() => {
        const remainingNodes = JOURNEY_NODES.filter((n) => !completedActivityIds.has(n.id));
        const totalMin = remainingNodes.reduce((acc, n) => {
            const num = parseFloat(n.duration) || 2;
            return acc + num;
        }, 0);
        return Math.ceil(totalMin);
    }, [completedActivityIds]);

    const handlePrimaryCtaClick = () => {
        if (isJourneyComplete) {
            navigate("/dashboard");
        } else {
            navigate(activeNode.route);
        }
    };

    const handleContinueJourney = () => {
        setCompletedActivityToShow(null);
        if (isJourneyComplete) {
            setShowJourneyCompleteModal(true);
        } else {
            const nextUncompleted = JOURNEY_NODES.find((n) => !completedActivityIds.has(n.id));
            if (nextUncompleted) {
                navigate(nextUncompleted.route);
            }
        }
    };

    return (
        <PageWrapper>
            <div className="journey-page container animate-fadeIn">
                {/* Responsive Unified Hero Header */}
                <header className="journey-hero-compact">
                    <div className={`hero-top-row ${isJourneyComplete ? "is-protocol-complete" : ""}`}>
                        <div className="hero-text-col">
                            <h1 className="hero-greeting-title">{getGreeting()}</h1>
                            <div className="hero-sub-row">
                                <span className={`journey-badge-pill ${isJourneyComplete ? "badge-pill-success" : ""}`}>
                                    {isJourneyComplete ? "✓ Protocol Complete" : "Cognitive Protocol"}
                                </span>
                                <span className="journey-subtitle-dot">•</span>
                                <span className="journey-subtitle">
                                    {isJourneyComplete ? (
                                        "All 7 clinical biomarkers assessed today • Ready for clinical review"
                                    ) : completedCount > 0 ? (
                                        `${totalCount - completedCount} activities remaining • ~${remainingMinutes} min left • Track performance & biomarkers`
                                    ) : (
                                        "7 clinical activities • ~18 min total • Track performance & biomarkers"
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="hero-progress-pill">
                            <div className="progress-info-row">
                                <span className="progress-label">Protocol Progress</span>
                                <span className="progress-pill-count">
                                    <strong>{completedCount}</strong> of {totalCount} complete
                                </span>
                            </div>

                            {/* Dot progress indicator */}
                            <div className="dots-mini-row" aria-label={`Progress: ${completedCount} of 7 complete`}>
                                {JOURNEY_NODES.map((node) => {
                                    const isDone = completedActivityIds.has(node.id);
                                    const isCurrent = node.id === activeNodeId;
                                    return (
                                        <span
                                            key={node.id}
                                            className={`dot-mini ${isDone ? "done" : isCurrent ? "current" : "pending"}`}
                                            title={`${node.title} (${isDone ? "Completed" : isCurrent ? "Up Next" : "Upcoming"})`}
                                        />
                                    );
                                })}
                            </div>

                            <Button
                                variant="primary"
                                onClick={handlePrimaryCtaClick}
                                className={`journey-compact-cta ${isJourneyComplete ? "journey-completed-cta" : ""}`}
                            >
                                {isJourneyComplete ? (
                                    <>
                                        <Icon name="chart-line-up" size={14} /> View Full Clinical Report →
                                    </>
                                ) : completedCount > 0 ? (
                                    <>Continue ({activeNode.title}) →</>
                                ) : (
                                    <>Start Protocol →</>
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Protocol Focus Filter Tabs */}
                <div className="journey-filter-bar" role="tablist" aria-label="Assessment Filters">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filterMode === 'all'}
                        className={`filter-pill-btn ${filterMode === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterMode('all')}
                    >
                        All Activities <span className="filter-pill-badge">{totalCount}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filterMode === 'remaining'}
                        className={`filter-pill-btn ${filterMode === 'remaining' ? 'active' : ''}`}
                        onClick={() => setFilterMode('remaining')}
                    >
                        Remaining <span className="filter-pill-badge">{totalCount - completedCount}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filterMode === 'completed'}
                        className={`filter-pill-btn ${filterMode === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilterMode('completed')}
                    >
                        Completed <span className="filter-pill-badge">{completedCount}</span>
                    </button>
                </div>

                {/* Main Feature: Spacious Organic Journey Map Landscape */}
                <main className="journey-map-main" aria-label="Journey Map">
                    <JourneyMap
                        completedActivityIds={completedActivityIds}
                        activeNodeId={activeNodeId}
                        activityLastCompletedMap={activityLastCompletedMap}
                        activityLatestScoreMap={activityLatestScoreMap}
                        filterMode={filterMode}
                    />
                </main>

                {/* Small Supporting Text Links */}
                <div className="journey-bottom-links">
                    <button className="link-chip" onClick={() => navigate("/dashboard")}>
                        <Icon name="chart-line-up" size={13} /> View Clinical Dashboard →
                    </button>
                    <button className="link-chip" onClick={() => navigate("/progress")}>
                        <Icon name="timeline" size={13} /> My Progress & Growth →
                    </button>
                    <button className="link-chip" onClick={() => navigate("/privacy")}>
                        Privacy & Data Safeguards →
                    </button>
                </div>

                {/* Modals */}
                {completedActivityToShow && (
                    <ActivityCompletionScreen
                        completedActivityId={completedActivityToShow}
                        onContinue={handleContinueJourney}
                    />
                )}

                {showJourneyCompleteModal && (
                    <JourneyCompletion onClose={() => setShowJourneyCompleteModal(false)} />
                )}
            </div>
        </PageWrapper>
    );
}
