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
import { DirectionSelector } from "./components/DirectionSelector";
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
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
    const [isAwaitingDirection, setIsAwaitingDirection] = useState<boolean>(false);

    // Collected session responses
    const [destinationAnswer, setDestinationAnswer] = useState<DestinationAnswer | null>(null);
    const [intersectionResponses, setIntersectionResponses] = useState<IntersectionResponse[]>([]);
    const [assessmentResult, setAssessmentResult] = useState<ImmersiveNavigationResult | null>(null);

    // 1. Begin Assessment
    const handleStartAssessment = () => {
        setPhase("encoding");
    };

    // 2. Encoding Video Finished (Full A → H Route)
    const handleEncodingEnded = () => {
        setPhase("destination_mcq");
    };

    // 3. Destination MCQ Answered
    const handleDestinationAnswer = (answer: DestinationAnswer) => {
        setDestinationAnswer(answer);
        setCurrentSegmentIndex(0);
        setIsAwaitingDirection(false);
        setPhase("navigation");
    };

    // 4. Reverse Navigation Clip Ended
    const handleSegmentClipEnded = () => {
        const totalSegments = DEMO_ROUTE.segments.length; // 7 segments (0 to 6)

        // For segments 0 through 5, ask direction at the upcoming intersection
        if (currentSegmentIndex < totalSegments - 1) {
            setIsAwaitingDirection(true);
        } else {
            // Final segment (B→A) arrived at start point A! Move to Landmark Chronology.
            setIsAwaitingDirection(false);
            setPhase("landmark_ordering");
        }
    };

    // 5. Intersection Direction Decision Made
    const handleDirectionDecision = (response: IntersectionResponse) => {
        setIntersectionResponses((prev) => [...prev, response]);
        setIsAwaitingDirection(false);
        setCurrentSegmentIndex((prev) => prev + 1);
    };

    // 6. Landmark Chronology Task Completed
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
        setCurrentSegmentIndex(0);
        setIsAwaitingDirection(false);
        setPhase("instructions");
    };

    const currentSegment = DEMO_ROUTE.segments[currentSegmentIndex];

    return (
        <PageWrapper>
            <div className="navigation-assessment min-h-[85vh] py-6 px-4">
                {/* Phase 1: Instructions */}
                {phase === "instructions" && (
                    <InstructionsPhase onStart={handleStartAssessment} />
                )}

                {/* Phase 2: Route Encoding Video (A → H) */}
                {phase === "encoding" && (
                    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Phase 1 of 4: Route Encoding (A → H)
                            </span>
                            <span className="text-xs text-slate-400">
                                Watch carefully • Observe key landmarks
                            </span>
                        </div>
                        <VideoPlayer
                            src={DEMO_ROUTE.encodingVideoUrl}
                            onEnded={handleEncodingEnded}
                            label="Full Route Encoding (Start A → Destination H)"
                            subLabel="Observe the entire walking path and all buildings, gates, and monuments you pass."
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

                {/* Phase 4: Reverse Navigation (H → A, 7 Segments, 6 Direction Decisions) */}
                {phase === "navigation" && (
                    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
                        {/* Segment Progress Badge */}
                        <div className="flex items-center justify-between px-2 text-xs">
                            <span className="font-semibold text-cyan-400">
                                Reverse Navigation (H → A): Clip {currentSegmentIndex + 1} of {DEMO_ROUTE.segments.length}
                            </span>
                            <span className="text-slate-400">
                                Waypoint {currentSegment.fromWaypoint} → {currentSegment.toWaypoint}
                            </span>
                        </div>

                        {!isAwaitingDirection ? (
                            <VideoPlayer
                                key={currentSegment.segmentId}
                                src={currentSegment.videoUrl}
                                onEnded={handleSegmentClipEnded}
                                label={`Segment ${currentSegmentIndex + 1}: Point ${currentSegment.fromWaypoint} to ${currentSegment.toWaypoint}`}
                                subLabel={currentSegment.intersectionLabel}
                            />
                        ) : (
                            <DirectionSelector
                                key={`dir_${currentSegment.segmentId}`}
                                intersectionLabel={currentSegment.intersectionLabel}
                                correctDirection={currentSegment.correctDirection}
                                segmentId={currentSegment.segmentId}
                                onDecision={handleDirectionDecision}
                            />
                        )}
                    </div>
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
                            Analyzing decision latencies, trajectory accuracy, and spatial landmark sequence fidelity.
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
