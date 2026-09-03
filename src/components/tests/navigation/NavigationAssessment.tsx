import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon } from "../../common";
import type {
    MapGraph,
    NavigationDifficulty,
    MoveRecord,
    LandmarkRecallQuestion,
    LandmarkRecallResponse,
    NavigationAssessmentResult,
} from "../../../types/navigationTypes";
import { getMapByDifficulty, generateLandmarkQuestions } from "../../../data/navigation/mapData";
import { getAvailableDirections, getAdjacentNodes } from "./utils/graphAlgorithms";
import { extractNavigationBiomarkers } from "./services/NavigationAnalytics";
import { computeNavigationScore } from "./services/NavigationScoring";
import { MapBoard } from "./components/MapBoard";
import { NavigationDpad } from "./components/NavigationDpad";
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

    // Navigation state
    const [currentNodeId, setCurrentNodeId] = useState<string>("");
    const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
    const [moves, setMoves] = useState<MoveRecord[]>([]);

    // Timers & timestamps
    const [encodingTimer, setEncodingTimer] = useState<number>(15);
    const navStartTimeRef = useRef<number>(0);
    const lastMoveTimeRef = useRef<number>(0);
    const [navElapsedTime, setNavElapsedTime] = useState<number>(0);

    // Quiz & results state
    const [assessmentResult, setAssessmentResult] = useState<NavigationAssessmentResult | null>(null);
    const [isLevelUnlocked, setIsLevelUnlocked] = useState<boolean>(false);
    const [nextLevel, setNextLevel] = useState<number | undefined>(undefined);

    // Start assessment -> Setup map & transition to encoding
    const handleStartAssessment = (selectedDifficulty?: NavigationDifficulty) => {
        const diff = selectedDifficulty ?? difficulty;
        setDifficulty(diff);
        const selectedMap = getMapByDifficulty(diff);
        setMap(selectedMap);
        setQuestions(generateLandmarkQuestions(selectedMap));
        setEncodingTimer(selectedMap.encodingTimeSeconds);
        setPhase("encoding");
    };

    // Encoding phase timer
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

    // Distractor complete -> Transition to navigation
    const handleDistractorComplete = () => {
        const startNode = map.nodes.find((n) => n.isStart) || map.nodes[0];
        setCurrentNodeId(startNode.id);
        setVisitedNodes([startNode.id]);
        setMoves([]);
        navStartTimeRef.current = Date.now();
        lastMoveTimeRef.current = Date.now();
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

    // Handle D-pad directional move
    const handleMove = useCallback(
        (direction: "north" | "south" | "east" | "west") => {
            if (phase !== "navigation") return;

            const adjacentNodes = getAdjacentNodes(map, currentNodeId);
            const target = adjacentNodes.find((item) => item.direction === direction);

            if (!target) return; // Invalid move direction

            const now = Date.now();
            const decisionTimeMs = now - lastMoveTimeRef.current;
            lastMoveTimeRef.current = now;

            const targetNodeId = target.node.id;

            // Check if correct move (target is on optimal path at next step)
            const currOptimalIdx = map.optimalPath.indexOf(currentNodeId);
            const isCorrectMove =
                currOptimalIdx !== -1 &&
                map.optimalPath[currOptimalIdx + 1] === targetNodeId;

            // Check if backtrack (returning to previous visited node)
            const isBacktrack =
                visitedNodes.length > 1 && visitedNodes[visitedNodes.length - 2] === targetNodeId;

            const moveRecord: MoveRecord = {
                timestamp: now,
                fromNode: currentNodeId,
                toNode: targetNodeId,
                direction,
                decisionTimeMs,
                isCorrectMove,
                isBacktrack,
            };

            const updatedMoves = [...moves, moveRecord];
            const updatedVisited = [...visitedNodes, targetNodeId];

            setMoves(updatedMoves);
            setVisitedNodes(updatedVisited);
            setCurrentNodeId(targetNodeId);

            // Check destination reached
            if (target.node.isDestination) {
                const totalNavTimeMs = Date.now() - navStartTimeRef.current;
                setNavElapsedTime(totalNavTimeMs / 1000);
                setPhase("landmark_recall");
            }
        },
        [phase, map, currentNodeId, visitedNodes, moves]
    );

    // Landmark recall complete -> Calculate biomarkers & score
    const handleLandmarkComplete = (responses: LandmarkRecallResponse[]) => {
        setPhase("processing");

        const totalNavTimeMs = Date.now() - navStartTimeRef.current;

        const biomarkers = extractNavigationBiomarkers(
            map,
            moves,
            responses,
            totalNavTimeMs
        );

        const optimalMoveCount = Math.max(1, map.optimalPath.length - 1);
        const totalMoveCount = moves.length;

        const scoreResult = computeNavigationScore(
            biomarkers,
            difficulty,
            totalMoveCount,
            optimalMoveCount
        );

        const finalResult: NavigationAssessmentResult = {
            id: `nav_res_${Date.now()}`,
            sessionId: `sess_${Date.now()}`,
            timestamp: new Date(),
            difficulty,
            mapId: map.id,
            moves,
            landmarkRecallResponses: responses,
            biomarkers,
            navigationScore: scoreResult.navigationScore,
            totalMoves: totalMoveCount,
            optimalMoves: optimalMoveCount,
            completionTimeMs: totalNavTimeMs,
        };

        saveResult(finalResult);
        setAssessmentResult(finalResult);

        // Difficulty Auto-Advancement logic
        if (scoreResult.navigationScore >= 70 && difficulty < 4) {
            setIsLevelUnlocked(true);
            setNextLevel(difficulty + 1);
        } else {
            setIsLevelUnlocked(false);
            setNextLevel(undefined);
        }

        setPhase("results");
    };



    const startNode = map.nodes.find((n) => n.isStart) || map.nodes[0];
    const destNode = map.nodes.find((n) => n.isDestination) || map.nodes[map.nodes.length - 1];
    const currentNode = map.nodes.find((n) => n.id === currentNodeId) || startNode;
    const availableDirs = getAvailableDirections(map, currentNodeId);

    return (
        <PageWrapper>
            <div className="navigation-assessment-container">
                {/* 1. INSTRUCTIONS PHASE */}
                {phase === "instructions" && (
                    <Card className="nav-instructions-card">
                        <div className="nav-icon-badge">
                            <Icon name="navigation" size={32} />
                        </div>

                        <h2>Indian Map Navigation Assessment</h2>
                        <p className="nav-subtitle">
                            Evaluate visuospatial memory, spatial orientation, executive route planning, and landmark recall.
                        </p>

                        <div className="nav-steps-list">
                            <div className="nav-step-item">
                                <span className="step-num">1</span>
                                <div className="step-content">
                                    <strong>Encoding Phase</strong>
                                    <p>Memorize the highlighted route to your destination before the timer runs out.</p>
                                </div>
                            </div>

                            <div className="nav-step-item">
                                <span className="step-num">2</span>
                                <div className="step-content">
                                    <strong>Distractor Phase</strong>
                                    <p>Tap target shapes during a brief 10-second interference task.</p>
                                </div>
                            </div>

                            <div className="nav-step-item">
                                <span className="step-num">3</span>
                                <div className="step-content">
                                    <strong>Navigation Phase</strong>
                                    <p>Use the D-pad buttons or Arrow keys to navigate node-by-node from Start to Destination.</p>
                                </div>
                            </div>

                            <div className="nav-step-item">
                                <span className="step-num">4</span>
                                <div className="step-content">
                                    <strong>Landmark Recall Quiz</strong>
                                    <p>Answer 3 quick spatial memory questions about landmarks along your journey.</p>
                                </div>
                            </div>
                        </div>

                        {/* Difficulty Selector */}
                        <div className="difficulty-select-wrapper">
                            <label htmlFor="nav-difficulty-select">Difficulty Level:</label>
                            <div className="difficulty-pills">
                                {([1, 2, 3, 4] as NavigationDifficulty[]).map((lvl) => (
                                    <button
                                        key={`diff_${lvl}`}
                                        type="button"
                                        className={`diff-pill ${difficulty === lvl ? "active" : ""}`}
                                        onClick={() => setDifficulty(lvl)}
                                    >
                                        Level {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full mt-4"
                            onClick={() => handleStartAssessment(difficulty)}
                        >
                            Start Level {difficulty} Assessment →
                        </Button>
                    </Card>
                )}

                {/* 2. ENCODING PHASE */}
                {phase === "encoding" && (
                    <Card className="nav-encoding-card">
                        <div className="encoding-header">
                            <div className="encoding-timer-badge">
                                ⏱️ {encodingTimer}s
                            </div>
                            <h3>Memorize the Highlighted Route!</h3>
                            <p>Study the map carefully. The highlighted route will disappear when the timer hits 0.</p>
                        </div>

                        <MapBoard
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
                    <div className="nav-active-layout">
                        <NavigationHUD
                            currentNode={currentNode}
                            destinationNode={destNode}
                            moveCount={moves.length}
                            elapsedTimeSeconds={navElapsedTime}
                        />

                        <MapBoard
                            graph={map}
                            currentNodeId={currentNodeId}
                            visitedNodes={visitedNodes}
                            phase="navigation"
                        />

                        <NavigationDpad
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
                    <Card className="text-center py-12">
                        <div className="animate-spin inline-block text-3xl mb-4">🌀</div>
                        <h3>Analyzing Navigation Performance...</h3>
                        <p className="text-gray-500">Calculating spatial biomarkers, path efficiency, and score...</p>
                    </Card>
                )}

                {/* 7. RESULTS PHASE */}
                {phase === "results" && assessmentResult && (
                    <NavigationResults
                        map={map}
                        result={assessmentResult}
                        isLevelUnlocked={isLevelUnlocked}
                        nextLevel={nextLevel}
                        onRetake={() => handleStartAssessment(nextLevel as NavigationDifficulty ?? difficulty)}
                        onBackToTests={() => navigate("/tests")}
                    />
                )}
            </div>
        </PageWrapper>
    );
}
