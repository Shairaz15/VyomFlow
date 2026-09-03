import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { PageWrapper } from "../components/layout";
import { useJourneyState, JOURNEY_NODES, type ActivityId, type JourneyNodeInfo } from "../hooks/useJourneyState";
import { JourneyMap } from "../components/journey/JourneyMap";
import { ActivityCompletionScreen } from "../components/journey/ActivityCompletionScreen";
import { JourneyCompletion } from "../components/journey/JourneyCompletion";
import { ActivityIntroModal } from "../components/journey/ActivityIntroModal";
import "./Tests.css";

export function Tests() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    const {
        completedActivityIds,
        completedCount,
        totalCount,
        activeNodeId,
        isJourneyComplete,
        activityLastCompletedMap,
    } = useJourneyState();

    // Modals state
    const [completedActivityToShow, setCompletedActivityToShow] = useState<ActivityId | null>(null);
    const [showJourneyCompleteModal, setShowJourneyCompleteModal] = useState(false);
    const [previewNode, setPreviewNode] = useState<JourneyNodeInfo | null>(null);

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
        if (hour < 12) return `Good morning, ${userName} 👋`;
        if (hour < 18) return `Good afternoon, ${userName} 👋`;
        return `Good evening, ${userName} 👋`;
    };

    const activeNode = JOURNEY_NODES.find((n) => n.id === activeNodeId) || JOURNEY_NODES[0];

    const handlePrimaryCtaClick = () => {
        if (isJourneyComplete) {
            setShowJourneyCompleteModal(true);
        } else {
            setPreviewNode(activeNode);
        }
    };

    const handleContinueJourney = () => {
        setCompletedActivityToShow(null);
        if (isJourneyComplete) {
            setShowJourneyCompleteModal(true);
        } else {
            const nextUncompleted = JOURNEY_NODES.find((n) => !completedActivityIds.has(n.id));
            if (nextUncompleted) {
                setPreviewNode(nextUncompleted);
            }
        }
    };

    return (
        <PageWrapper>
            <div className="journey-page container animate-fadeIn">
                {/* Desktop Compact Hero Greeting Header (>= 768px) */}
                <header className="hidden md:block journey-hero-compact">
                    <div className="hero-top-row">
                        <div className="hero-text-col">
                            <h1 className="hero-greeting-title">{getGreeting()}</h1>
                            <div className="hero-sub-row">
                                <span className="journey-badge-pill">✨ Your VyomFlow Journey</span>
                                <span className="journey-subtitle-dot">•</span>
                                <span className="journey-subtitle">
                                    A few short activities to track your cognitive performance over time.
                                </span>
                            </div>
                        </div>
                        <div className="hero-progress-pill">
                            <div className="progress-info-row">
                                <span className="progress-label">Today's progress</span>
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
                                className="journey-compact-cta"
                            >
                                {isJourneyComplete ? (
                                    <>✓ Journey complete</>
                                ) : completedCount > 0 ? (
                                    <>Continue ({activeNode.title}) →</>
                                ) : (
                                    <>Start today's journey →</>
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Mobile Journey Title (< 768px - Clean & Direct) */}
                <div className="md:hidden text-center mb-3 pt-2 px-2">
                    <h1 className="vyom-serif text-2xl font-bold text-[#17324D] dark:text-[#F7F4EC] tracking-tight">
                        Your Cognitive Journey
                    </h1>
                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] mt-0.5">
                        Explore your cognitive journey, one activity at a time.
                    </p>
                </div>

                {/* Main Feature: Spacious Organic Journey Map Landscape (70-80% Visual Focus) */}
                <main className="journey-map-main" aria-label="Journey Map">
                    <JourneyMap
                        completedActivityIds={completedActivityIds}
                        activeNodeId={activeNodeId}
                        activityLastCompletedMap={activityLastCompletedMap}
                    />
                </main>

                {/* Small Supporting Text Links */}
                <div className="journey-bottom-links">
                    <button className="link-chip" onClick={() => navigate("/progress")}>
                        🌱 My Progress & Growth →
                    </button>
                    <button className="link-chip" onClick={() => navigate("/privacy")}>
                        🔒 Privacy & Data Safeguards →
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

                {previewNode && (
                    <ActivityIntroModal
                        node={previewNode}
                        isCompleted={completedActivityIds.has(previewNode.id)}
                        onClose={() => setPreviewNode(null)}
                    />
                )}
            </div>
        </PageWrapper>
    );
}
