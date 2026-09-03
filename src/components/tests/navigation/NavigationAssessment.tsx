import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
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
    const { saveResult } = useNavigationResults();

    const [phase, setPhase] = useState<Phase>("instructions");

    // Collected session responses
    const [destinationAnswer, setDestinationAnswer] = useState<DestinationAnswer | null>(null);
    const [intersectionResponses, setIntersectionResponses] = useState<IntersectionResponse[]>([]);
    const [assessmentResult, setAssessmentResult] = useState<ImmersiveNavigationResult | null>(null);

    // 1. Begin Assessment
    const handleStartAssessment = () => {
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

    return (
        <PageWrapper>
            <div className="navigation-assessment min-h-[85vh] py-6 px-4">
                {/* Phase 1: Instructions */}
                {phase === "instructions" && (
                    <InstructionsPhase onStart={handleStartAssessment} />
                )}

                {/* Phase 2: Route Encoding Video (Point A → Point B) */}
                {phase === "encoding" && (
                    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Phase 1 of 4: Route Encoding (A → B)
                            </span>
                            <span className="text-xs text-slate-400">
                                Watch carefully • Observe paths & key landmarks
                            </span>
                        </div>
                        <VideoPlayer
                            src={DEMO_ROUTE.encodingVideoUrl}
                            onEnded={handleEncodingEnded}
                            label="Full Forward Route Encoding (Main Gate 1 → Sports Plaza)"
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
                    <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-fadeIn">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center animate-spin">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">Computing Biomarkers...</h2>
                        <p className="text-xs text-slate-400">
                            Analyzing decision latencies across 8 intersections, trajectory accuracy, and spatial landmark sequence fidelity.
                        </p>
                    </div>
                )}

                {/* Phase 7: Results & Score Display */}
                {phase === "results" && assessmentResult && (
                    <NavigationResults
                        result={assessmentResult}
                        onRetake={handleRetake}
                        onBackToTests={() => navigate("/tests")}
                    />
                )}
            </div>
        </PageWrapper>
    );
}
