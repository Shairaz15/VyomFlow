import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { Icon, SpecularButton } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
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
    const { t } = useLanguage();
    const [filterMode, setFilterMode] = useState<'all' | 'remaining' | 'completed'>('all');

    const {
        completedActivityIds,
        completedCount,
        totalCount,
        activeNodeId,
        isJourneyComplete,
        activityLastCompletedMap,
        activityLatestScoreMap,
        isLoading,
        isExpandedBattery,
        activeNodes,
    } = useJourneyState();

    // Modals state
    const [completedActivityToShow, setCompletedActivityToShow] = useState<ActivityId | null>(null);
    const [showJourneyCompleteModal, setShowJourneyCompleteModal] = useState(false);

    // Auto-scroll smoothly to whatever test is left, or remain at the top if all are completed
    useEffect(() => {
        if (isLoading) return;

        // Give the DOM and dynamic SVGs time to render cleanly before scrolling
        const timer = setTimeout(() => {
            if (isJourneyComplete) {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else if (activeNodeId) {
                const targetElement = document.getElementById(`journey-node-${activeNodeId}`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }
        }, 220);

        return () => clearTimeout(timer);
    }, [activeNodeId, isJourneyComplete, isLoading, filterMode]);

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
        const userName = user?.displayName?.split(" ")[0] || t("journey.participant");
        if (hour < 12) return t("journey.goodMorning", { name: userName });
        if (hour < 18) return t("journey.goodAfternoon", { name: userName });
        return t("journey.goodEvening", { name: userName });
    };

    const activeNode = activeNodes.find((n) => n.id === activeNodeId) || activeNodes[0] || JOURNEY_NODES[0];

    // Compute dynamic remaining estimated protocol duration
    const remainingMinutes = useMemo(() => {
        const remainingNodes = activeNodes.filter((n) => !completedActivityIds.has(n.id));
        const totalMin = remainingNodes.reduce((acc, n) => {
            const num = parseFloat(n.duration) || 2;
            return acc + num;
        }, 0);
        return Math.ceil(totalMin);
    }, [activeNodes, completedActivityIds]);

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
            const nextUncompleted = activeNodes.find((n) => !completedActivityIds.has(n.id));
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
                                    {isJourneyComplete ? `✓ ${t("journey.protocolComplete")}` : t("journey.cognitiveProtocol")}
                                </span>
                                <span className="journey-subtitle-dot">•</span>
                                <span className="journey-subtitle">
                                    {isJourneyComplete ? (
                                        t("journey.allActivitiesAssessed")
                                    ) : completedCount > 0 ? (
                                        `${t("journey.activitiesRemaining", { count: totalCount - completedCount })} • ${t("journey.minLeft", { min: remainingMinutes })} • ${t("journey.trackPerformance")}`
                                    ) : (
                                        t("journey.sevenActivities")
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="hero-progress-pill">
                            <div className="progress-info-row">
                                <span className="progress-label">{t("journey.protocolProgress")}</span>
                                <span className="progress-pill-count">
                                    <strong>{completedCount}</strong> of {totalCount} {t("journey.complete")}
                                </span>
                            </div>

                            {/* Dot progress indicator */}
                            <div className="dots-mini-row" aria-label={`Progress: ${completedCount} of ${totalCount} complete`}>
                                {activeNodes.map((node) => {
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

                            <SpecularButton
                                size="md"
                                radius={14}
                                tint={isJourneyComplete ? "#15803d" : "#4F7C78"}
                                tintOpacity={0.94}
                                lineColor={isJourneyComplete ? "#6ee7b7" : "#5EEAD4"}
                                baseColor="#1e293b"
                                textColor="#FFFFFF"
                                intensity={1.25}
                                followMouse
                                autoAnimate
                                onClick={handlePrimaryCtaClick}
                                className={`journey-compact-cta ${isJourneyComplete ? "journey-completed-cta" : ""}`}
                            >
                                {isJourneyComplete ? (
                                    <>
                                        <Icon name="chart-line-up" size={14} /> {t("journey.viewClinicalReport")} →
                                    </>
                                ) : completedCount > 0 ? (
                                    <>{t("journey.continue")} ({activeNode.title}) →</>
                                ) : (
                                    <>{t("journey.startProtocol")} →</>
                                )}
                            </SpecularButton>
                        </div>
                    </div>
                </header>

                {/* Protocol Focus Filter Tabs & Simulation Switcher */}
                <div className="journey-filter-bar" role="tablist" aria-label="Assessment Filters">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filterMode === 'all'}
                        className={`filter-pill-btn ${filterMode === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterMode('all')}
                    >
                        {t("journey.allActivities")} <span className="filter-pill-badge">{totalCount}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filterMode === 'remaining'}
                        className={`filter-pill-btn ${filterMode === 'remaining' ? 'active' : ''}`}
                        onClick={() => setFilterMode('remaining')}
                    >
                        {t("journey.remaining")} <span className="filter-pill-badge">{totalCount - completedCount}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filterMode === 'completed'}
                        className={`filter-pill-btn ${filterMode === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilterMode('completed')}
                    >
                        {t("journey.completed")} <span className="filter-pill-badge">{completedCount}</span>
                    </button>

                </div>

                {/* Adaptive Protocol Status Strip — clean, minimal one-liner */}
                <div className={`protocol-status-strip animate-fadeIn ${isExpandedBattery ? 'expanded' : 'baseline'}`}>
                    {isExpandedBattery ? (
                        <>
                            <ShieldCheck size={16} className="strip-icon expanded" />
                            <span className="strip-text">Full diagnostic battery active — <strong>all {totalCount} assessments</strong> unlocked</span>
                        </>
                    ) : (
                        <>
                            <Lock size={16} className="strip-icon baseline" />
                            <span className="strip-text">Baseline protocol — <strong>{totalCount} of 7 assessments</strong> active</span>
                            <span className="strip-hint">Additional tests unlock when needed</span>
                        </>
                    )}
                </div>

                {/* Main Feature: Spacious Organic Journey Map Landscape */}
                <main className="journey-map-main" aria-label="Journey Map">
                    <JourneyMap
                        completedActivityIds={completedActivityIds}
                        activeNodeId={activeNodeId}
                        activityLastCompletedMap={activityLastCompletedMap}
                        activityLatestScoreMap={activityLatestScoreMap}
                        filterMode={filterMode}
                        activeNodes={activeNodes}
                    />
                </main>

                {/* Supporting Action Links */}
                <div className="journey-bottom-links">
                    <button className="link-chip group" onClick={() => navigate("/dashboard")}>
                        <LayoutDashboard className="w-4 h-4 text-[#4F7C78] dark:text-[#8FAF8B] shrink-0" strokeWidth={1.8} />
                        <span>{t("journey.viewClinicalDashboard")}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                    </button>
                    <button className="link-chip group" onClick={() => navigate("/privacy")}>
                        <ShieldCheck className="w-4 h-4 text-[#4F7C78] dark:text-[#8FAF8B] shrink-0" strokeWidth={1.8} />
                        <span>{t("journey.privacySafeguards")}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
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
