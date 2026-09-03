import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon } from "../../common";
import type {
    MapGraph,
    NavigationDifficulty,
    MovementRecord,
    LandmarkRecallQuestion,
    LandmarkRecallResponse,
    NavigationAssessmentResult,
} from "../../../types/navigationTypes";
import { getMapByDifficulty, generateLandmarkQuestions } from "../../../data/navigation/curatedMaps";
import { getAvailableDirections } from "./utils/graphAlgorithms";
import { MovementLogger } from "./services/MovementLogger";
import { RouteManager } from "./services/RouteManager";
import { extractNavigationBiomarkers } from "./services/NavigationAnalytics";
import { computeNavigationScore } from "./services/NavigationScoring";
import { SessionMetadataCollector } from "./services/SessionMetadataCollector";
import { MapView } from "./components/MapView";
import { NavigationControls } from "./components/NavigationControls";
import { ShapeDistractor } from "./components/ShapeDistractor";
import { NavigationHUD } from "./components/NavigationHUD";
import { LandmarkRecall } from "./components/LandmarkRecall";
import { NavigationResults } from "./components/NavigationResults";
import { useNavigationResults } from "../../../hooks/useTestResults";
import "./NavigationAssessment.css";

type Phase =
    | "instructions"
    | "encoding"
    | "distractor"
    | "navigation"
    | "landmark_recall"
    | "processing"
    | "results";

export function NavigationAssessment() {
    const navigate = useNavigate();
    const { saveResult } = useNavigationResults();

    const [phase, setPhase] = useState<Phase>("instructions");
    const [difficulty, setDifficulty] = useState<NavigationDifficulty>(1);
    const [map, setMap] = useState<MapGraph>(() => getMapByDifficulty(1));
    const [questions, setQuestions] = useState<LandmarkRecallQuestion[]>([]);

    // Services & Loggers
    const loggerRef = useRef<MovementLogger>(new MovementLogger());
    const routeManagerRef = useRef<RouteManager | null>(null);
    const metadataCollectorRef = useRef<SessionMetadataCollector | null>(null);

    // Navigation UI State
    const [currentNodeId, setCurrentNodeId] = useState<string>("");
    const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
    const [moveRecords, setMoveRecords] = useState<MovementRecord[]>([]);

    // Timers
    const [encodingTimer, setEncodingTimer] = useState<number>(15);
    const navStartTimeRef = useRef<number>(0);
    const [navElapsedTime, setNavElapsedTime] = useState<number>(0);

    // Results state
    const [assessmentResult, setAssessmentResult] = useState<NavigationAssessmentResult | null>(null);
    const [isLevelUnlocked, setIsLevelUnlocked] = useState<boolean>(false);
    const [nextLevel, setNextLevel] = useState<NavigationDifficulty>(1);

    // Start assessment with adaptive progression (Requirement 2)
    const handleStartAssessment = (targetDifficulty: NavigationDifficulty = difficulty) => {
        setDifficulty(targetDifficulty);
        const selectedMap = getMapByDifficulty(targetDifficulty);
        setMap(selectedMap);
        setQuestions(generateLandmarkQuestions(selectedMap));
        setEncodingTimer(selectedMap.encodingTimeSeconds);

        // Initialize Services
        loggerRef.current.reset();
        routeManagerRef.current = new RouteManager(selectedMap, loggerRef.current);
        metadataCollectorRef.current = new SessionMetadataCollector();

        setPhase("encoding");
    };

    // Encoding phase timer ticker
    useEffect(() => {
        if (phase !== "encoding") return;

        if (encodingTimer <= 0) {
            setPhase("distractor");
            return;
        }

        const timer = setInterval(() => {
            setEncodingTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, encodingTimer]);

    // Distractor complete -> Transition to navigation phase
    const handleDistractorComplete = () => {
        if (!routeManagerRef.current) {
            routeManagerRef.current = new RouteManager(map, loggerRef.current);
        }

        const startNodeId = routeManagerRef.current.getCurrentNodeId();
        setCurrentNodeId(startNodeId);
        setVisitedNodes([startNodeId]);
        setMoveRecords([]);

        navStartTimeRef.current = Date.now();
        setNavElapsedTime(0);
        setPhase("navigation");
    };

    // Navigation timer ticker for HUD
    useEffect(() => {
        if (phase !== "navigation") return;

        const timer = setInterval(() => {
            setNavElapsedTime((Date.now() - navStartTimeRef.current) / 1000);
        }, 200);

        return () => clearInterval(timer);
    }, [phase]);

    // Handle directional move input (Requirement 3: Movement Logger Layer)
    const handleMove = useCallback(
        (direction: "north" | "south" | "east" | "west") => {
            if (phase !== "navigation" || !routeManagerRef.current) return;

            const res = routeManagerRef.current.executeMove(direction);
            if (!res.success || !res.targetNode) return;

            setCurrentNodeId(res.targetNode.id);
            setVisitedNodes(routeManagerRef.current.getVisitedNodes());
            setMoveRecords(loggerRef.current.getMovementHistory());

            // Destination reached check
            if (res.isDestinationReached) {
                const totalNavTimeMs = Date.now() - navStartTimeRef.current;
                setNavElapsedTime(totalNavTimeMs / 1000);
                setPhase("landmark_recall");
            }
        },
        [phase]
    );

    // Landmark recall complete -> Calculate biomarkers & score
    const handleLandmarkComplete = (quizResponses: LandmarkRecallResponse[]) => {
        setPhase("processing");

        const totalNavTimeMs = Date.now() - navStartTimeRef.current;

        // Read EXCLUSIVELY from MovementLogger (Requirement 3)
        const moveLogs = loggerRef.current.getMovementHistory();

        // Extract 10+ Biomarkers
        const biomarkers = extractNavigationBiomarkers(
            map,
            moveLogs,
            quizResponses,
            totalNavTimeMs
        );

        // Demographic Normalization & Scoring (Requirement 5)
        const scoreResult = computeNavigationScore(biomarkers, difficulty);

        // Session Metadata (Requirement 9)
        const metadata = metadataCollectorRef.current
            ? metadataCollectorRef.current.collect(totalNavTimeMs)
            : {
                  browser: "Browser",
                  deviceType: "desktop" as const,
                  screenResolution: "1024x768",
                  viewportSize: "1024x768",
                  inputMethod: "keyboard" as const,
                  fps: 60,
                  timestamp: Date.now(),
                  durationMs: totalNavTimeMs,
              };

        const optimalMoveCount = Math.max(1, map.optimalPath.length - 1);
        const totalMoveCount = moveLogs.length;

        const finalResult: NavigationAssessmentResult = {
            id: `nav_res_${Date.now()}`,
            sessionId: `sess_${Date.now()}`,
            timestamp: new Date(),
            difficulty,
            mapId: map.id,
            moves: moveLogs,
            sessionMetadata: metadata,
            landmarkRecallResponses: quizResponses,
            biomarkers,
            navigationScore: scoreResult.navigationScore,
            totalMoves: totalMoveCount,
            optimalMoves: optimalMoveCount,
            completionTimeMs: totalNavTimeMs,
        };

        saveResult(finalResult);
        setAssessmentResult(finalResult);
        setIsLevelUnlocked(scoreResult.isLevelUnlocked);
        setNextLevel(scoreResult.nextRecommendedLevel);

        setPhase("results");
    };

    const startNode = map.nodes.find((n) => n.isStart) || map.nodes[0];
    const destNode = map.nodes.find((n) => n.isDestination) || map.nodes[map.nodes.length - 1];
    const currentNode = map.nodes.find((n) => n.id === currentNodeId) || startNode;
    const availableDirs = getAvailableDirections(map, currentNodeId);

    return (
        <PageWrapper>
            <div className="navigation-assessment-container py-4 md:py-8 px-2 sm:px-4 max-w-5xl mx-auto">
                {/* 1. INSTRUCTIONS PHASE */}
                {phase === "instructions" && (
                    <Card className="nav-instructions-card p-6 md:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl mx-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                                <Icon name="navigation" size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">3D Navigation Assessment</h2>
                                <p className="text-xs text-slate-400">
                                    Standardized 3D Visuospatial & Spatial Orientation Assessment
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                            Navigate through curated 3D fictional neighborhood environments to measure visuospatial memory, executive decision latency, path planning efficiency, and landmark recall.
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">1</span>
                                <div className="text-xs text-slate-300">
                                    <strong className="text-white block">Encoding Phase</strong>
                                    Memorize the 3D optimal path before the countdown timer expires.
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs flex items-center justify-center font-bold">2</span>
                                <div className="text-xs text-slate-300">
                                    <strong className="text-white block">Shape Interference Task</strong>
                                    Tap target shapes during a 10-second interference phase.
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center justify-center font-bold">3</span>
                                <div className="text-xs text-slate-300">
                                    <strong className="text-white block">3D Navigation Phase</strong>
                                    Use the D-pad or Arrow keys to navigate node-by-node to the destination.
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs flex items-center justify-center font-bold">4</span>
                                <div className="text-xs text-slate-300">
                                    <strong className="text-white block">Landmark Spatial Recall</strong>
                                    Answer 3 spatial memory questions about landmarks.
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => handleStartAssessment(1)}
                        >
                            Start Assessment (Level 1) →
                        </Button>
                    </Card>
                )}

                {/* 2. ENCODING PHASE */}
                {phase === "encoding" && (
                    <Card className="nav-encoding-card p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Memorize the Highlighted Route!</h3>
                                <p className="text-xs text-slate-400">Study the 3D neighborhood route. The route will disappear when the timer hits 0.</p>
                            </div>
                            <div className="px-4 py-2 bg-amber-500/20 text-amber-300 font-mono font-bold text-lg rounded-2xl border border-amber-500/40">
                                ⏱️ {encodingTimer}s
                            </div>
                        </div>

                        <MapView
                            graph={map}
                            currentNodeId=""
                            highlightedPath={map.optimalPath}
                            phase="encoding"
                        />
                    </Card>
                )}

                {/* 3. DISTRACTOR PHASE */}
                {phase === "distractor" && (
                    <ShapeDistractor onComplete={handleDistractorComplete} />
                )}

                {/* 4. NAVIGATION PHASE */}
                {phase === "navigation" && (
                    <div className="nav-active-layout space-y-4">
                        <NavigationHUD
                            currentNode={currentNode}
                            destinationNode={destNode}
                            moveCount={moveRecords.length}
                            elapsedTimeSeconds={navElapsedTime}
                        />

                        <MapView
                            graph={map}
                            currentNodeId={currentNodeId}
                            visitedNodes={visitedNodes}
                            phase="navigation"
                        />

                        <NavigationControls
                            availableDirections={availableDirs}
                            onMove={handleMove}
                        />
                    </div>
                )}

                {/* 5. LANDMARK RECALL PHASE */}
                {phase === "landmark_recall" && (
                    <LandmarkRecall
                        questions={questions}
                        onComplete={handleLandmarkComplete}
                    />
                )}

                {/* 6. PROCESSING PHASE */}
                {phase === "processing" && (
                    <Card className="text-center py-16 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl">
                        <div className="animate-spin inline-block text-4xl mb-4">🌀</div>
                        <h3 className="text-xl font-bold text-white">Analyzing 3D Navigation Biomarkers...</h3>
                        <p className="text-xs text-slate-400 mt-2">
                            Computing normalized decision latency variance, path efficiency, exploration ratio, and score...
                        </p>
                    </Card>
                )}

                {/* 7. RESULTS PHASE */}
                {phase === "results" && assessmentResult && (
                    <NavigationResults
                        map={map}
                        result={assessmentResult}
                        isLevelUnlocked={isLevelUnlocked}
                        nextLevel={nextLevel}
                        onRetake={() => handleStartAssessment(nextLevel)}
                        onBackToTests={() => navigate("/tests")}
                    />
                )}
            </div>
        </PageWrapper>
    );
}
