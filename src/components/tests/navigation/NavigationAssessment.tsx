import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useNavigationResults } from "../../../hooks/useTestResults";
import { DEMO_ROUTE } from "../../../data/navigation/routeConfig";
import { computeNavigationBiomarkers } from "./services/BiomarkerEngine";
import type {
    DestinationAnswer,
    IntersectionResponse,
    LandmarkOrderingResult,
    ImmersiveNavigationResult,
} from "../../../types/navigationTypes";

import { VideoPlayer } from "./components/VideoPlayer";
import { InstructionsPhase } from "./components/InstructionsPhase";
import { DestinationQuestion } from "./components/DestinationQuestion";
import { SeamlessReverseNavigator } from "./components/SeamlessReverseNavigator";
import { LandmarkOrdering } from "./components/LandmarkOrdering";
import { NavigationResults } from "./components/NavigationResults";
import "./NavigationAssessment.css";

type Phase =
    | "instructions"
    | "encoding"
    | "destination_mcq"
    | "navigation"
    | "landmark_ordering"
    | "processing"
    | "results";

export function NavigationAssessment() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { saveResult } = useNavigationResults();

    const [phase, setPhase] = useState<Phase>("instructions");
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Collected session responses
    const [destinationAnswer, setDestinationAnswer] = useState<DestinationAnswer | null>(null);
    const [intersectionResponses, setIntersectionResponses] = useState<IntersectionResponse[]>([]);
    const [assessmentResult, setAssessmentResult] = useState<ImmersiveNavigationResult | null>(null);

    // 1. Begin Assessment
    const handleStartAssessment = () => {
        if (!isAuthenticated) return;
        setPhase("encoding");
    };

    // 2. Encoding Video Completed
    const handleEncodingEnded = () => {
        setPhase("destination_mcq");
    };

    // 3. Destination MCQ Answered
    const handleDestinationAnswer = (answer: DestinationAnswer) => {
        setDestinationAnswer(answer);
        setPhase("navigation");
    };

    // 4. Reverse Navigation Completed
    const handleReverseNavigationComplete = (responses: IntersectionResponse[]) => {
        setIntersectionResponses(responses);
        setPhase("landmark_ordering");
    };

    // 5. Landmark Ordering Completed -> Compute Biomarkers
    const handleLandmarkComplete = (landmarkResult: LandmarkOrderingResult) => {
        setPhase("processing");

        setTimeout(() => {
            if (!destinationAnswer) return;

            const biomarkers = computeNavigationBiomarkers(
                destinationAnswer,
                intersectionResponses,
                landmarkResult
            );

            const finalResult: ImmersiveNavigationResult = {
                id: `nav_${Date.now()}`,
                sessionId: `session_${Date.now()}`,
                routeId: DEMO_ROUTE.routeId,
                timestamp: new Date(),
                destinationAnswer,
                intersectionResponses,
                landmarkOrdering: landmarkResult,
                biomarkers,
                navigationScore: biomarkers.navigationScore,
            };

            saveResult(finalResult);
            setAssessmentResult(finalResult);
            setPhase("results");
        }, 1500);
    };

    // Retake Test
    const handleRetake = () => {
        setDestinationAnswer(null);
        setIntersectionResponses([]);
        setAssessmentResult(null);
        setPhase("instructions");
    };

    // Exit Handling
    const handleExitClick = () => {
        if (phase === "instructions" || phase === "results") {
            navigate("/tests");
            return;
        }
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        navigate("/tests");
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    return (
        <PageWrapper>
            <div className="nav-assessment-container container">
                {/* Top Navigation Bar: Back / Exit Control */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label={t("navigation.backToAssessments")}
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>{t("navigation.backToAssessments")}</span>
                    </button>
                </div>

                {/* Primary Test Header (shown only on instructions intro) */}
                {phase === "instructions" && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">{t("navigation.title")}</h1>
                        <p className="story-subtitle">
                            {t("navigation.subtitle")}
                        </p>
                    </div>
                )}

                {/* Active Stage Viewport */}
                <div className="story-stage-viewport nav-stage-viewport">
                    {/* Phase 1: Simplified Instructions */}
                    {phase === "instructions" && (
                        <InstructionsPhase onStart={handleStartAssessment} />
                    )}

                    {/* Phase 2: Route Encoding Video (Point A → Point B) */}
                    {phase === "encoding" && (
                        <div className="nav-encoding-card animate-fadeIn">
                            <div className="nav-phase-indicator">
                                <span className="nav-phase-badge">{t("navigation.phase1")}</span>
                                <span className="nav-phase-hint">{t("navigation.phase1Hint")}</span>
                            </div>
                            <VideoPlayer
                                src={DEMO_ROUTE.encodingVideoUrl}
                                onEnded={handleEncodingEnded}
                                label={t("navigation.forwardRouteObs")}
                                subLabel={t("navigation.forwardRouteSub")}
                            />
                        </div>
                    )}

                    {/* Phase 3: Destination Recall MCQ */}
                    {phase === "destination_mcq" && (
                        <DestinationQuestion
                            question={DEMO_ROUTE.destination.question}
                            options={DEMO_ROUTE.destination.options}
                            correctIndex={DEMO_ROUTE.destination.correctIndex}
                            onAnswer={handleDestinationAnswer}
                        />
                    )}

                    {/* Phase 4: Seamless Reverse Navigation (Point B → Point A, 8 Intersections) */}
                    {phase === "navigation" && (
                        <SeamlessReverseNavigator
                            route={DEMO_ROUTE}
                            onComplete={handleReverseNavigationComplete}
                        />
                    )}

                    {/* Phase 5: Landmark Chronology Ordering */}
                    {phase === "landmark_ordering" && (
                        <LandmarkOrdering
                            landmarks={DEMO_ROUTE.landmarks}
                            onComplete={handleLandmarkComplete}
                        />
                    )}

                    {/* Phase 6: Processing */}
                    {phase === "processing" && (
                        <div className="nav-processing-arena animate-fadeIn">
                            <div className="nav-scoring-spinner" />
                            <h2>{t("navigation.computingBiomarkers")}</h2>
                            <p>{t("navigation.analyzingTrajectory")}</p>
                        </div>
                    )}

                    {/* Phase 7: Simplified Results & Score Display */}
                    {phase === "results" && assessmentResult && (
                        <NavigationResults
                            result={assessmentResult}
                            onRetake={handleRetake}
                            onBackToTests={() => navigate("/tests")}
                        />
                    )}
                </div>

                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="story-modal-backdrop animate-fadeIn" role="dialog" aria-modal="true">
                        <div className="story-exit-modal animate-scaleUp">
                            <div className="exit-modal-icon">⚠️</div>
                            <h3 className="exit-modal-title vyom-serif">{t("navigation.leaveAssessment")}</h3>
                            <p className="exit-modal-text">
                                {t("navigation.leaveWarning")}
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    {t("navigation.continueTest")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    {t("navigation.leaveTest")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
