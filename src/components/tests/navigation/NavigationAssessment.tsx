import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { useAuth } from "../../../contexts/AuthContext";
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

    // 2. Encoding Video Finished (Full A → B Route)
    const handleEncodingEnded = () => {
        setPhase("destination_mcq");
    };

    // 3. Destination MCQ Answered
    const handleDestinationAnswer = (answer: DestinationAnswer) => {
        setDestinationAnswer(answer);
        setPhase("navigation");
    };

    // 4. Reverse Navigation Completed (All 8 Intersections finished seamlessly)
    const handleReverseNavigationComplete = (responses: IntersectionResponse[]) => {
        setIntersectionResponses(responses);
        setPhase("landmark_ordering");
    };

    // 5. Landmark Chronology Task Completed
    const handleLandmarkComplete = (result: LandmarkOrderingResult) => {
        setPhase("processing");

        if (!destinationAnswer) return;

        const allResponses = [...intersectionResponses];
        const biomarkers = computeNavigationBiomarkers(destinationAnswer, allResponses, result);

        const finalResult: ImmersiveNavigationResult = {
            id: `nav_res_${Date.now()}`,
            sessionId: `sess_nav_${Date.now()}`,
            routeId: DEMO_ROUTE.routeId,
            timestamp: new Date(),
            destinationAnswer,
            intersectionResponses: allResponses,
            landmarkOrdering: result,
            biomarkers,
            navigationScore: biomarkers.navigationScore,
        };

        setAssessmentResult(finalResult);
        saveResult(finalResult);
        setPhase("results");
    };

    // Retake Handler
    const handleRetake = () => {
        setDestinationAnswer(null);
        setIntersectionResponses([]);
        setAssessmentResult(null);
        setPhase("instructions");
    };

    // Exit Safeguard Handlers
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
            <div className="navigation-assessment-page story-assessment-container container">
                {/* Top Navigation Bar: Back / Exit Control */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label="Back to Assessments"
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>Back to Assessments</span>
                    </button>

                    <div className="story-module-badge">
                        <span className="badge-dot" aria-hidden="true" />
                        <span>Cognitive Assessment</span>
                    </div>
                </div>

                {/* Primary Test Header (shown only on instructions intro) */}
                {phase === "instructions" && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">Immersive Navigation</h1>
                        <p className="story-subtitle">
                            Observe a real-world route video and navigate back by making directional choices at key intersections.
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
                                <span className="nav-phase-badge">Phase 1 of 4: Route Encoding</span>
                                <span className="nav-phase-hint">Watch carefully • Observe pathways & landmarks</span>
                            </div>
                            <VideoPlayer
                                src={DEMO_ROUTE.encodingVideoUrl}
                                onEnded={handleEncodingEnded}
                                label="Forward Route Observation (Main Gate 1 → Sports Plaza)"
                                subLabel="Observe the entire path from Point A to Point B including buildings, turns, and sculptures."
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
                            <h2>Computing Navigation Biomarkers...</h2>
                            <p>Analyzing decision latencies across intersections, trajectory accuracy, and landmark sequence fidelity.</p>
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
                            <h3 className="exit-modal-title vyom-serif">Leave this assessment?</h3>
                            <p className="exit-modal-text">
                                Your current assessment progress will be lost if you leave now.
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    Continue Test
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    Leave Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
