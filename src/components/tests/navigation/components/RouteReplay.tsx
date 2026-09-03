import { useState, useEffect } from "react";
import type { MapGraph, MovementRecord } from "../../../../types/navigationTypes";
import { MapView } from "./MapView";
import { Button } from "../../../common";

interface RouteReplayProps {
    graph: MapGraph;
    moves: MovementRecord[];
}

export function RouteReplay({ graph, moves }: RouteReplayProps) {
    const [stepIndex, setStepIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // 1000ms per step

    const totalSteps = moves.length;

    // Build user path sequence of node IDs
    const userPathNodeIds = [
        graph.optimalPath[0] || graph.nodes[0].id,
        ...moves.map((m) => m.currentNode),
    ];

    const currentMoveRecord = stepIndex > 0 ? moves[stepIndex - 1] : null;
    const currentNodeId = userPathNodeIds[Math.min(stepIndex, userPathNodeIds.length - 1)];

    // Playback ticker timer
    useEffect(() => {
        if (!isPlaying) return;

        if (stepIndex >= totalSteps) {
            setIsPlaying(false);
            return;
        }

        const timer = setInterval(() => {
            setStepIndex((prev) => {
                if (prev >= totalSteps) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, playbackSpeed);

        return () => clearInterval(timer);
    }, [isPlaying, stepIndex, totalSteps, playbackSpeed]);

    const handlePlayPause = () => {
        if (stepIndex >= totalSteps) {
            setStepIndex(0);
        }
        setIsPlaying((prev) => !prev);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPlaying(false);
        setStepIndex(parseInt(e.target.value, 10));
    };

    // Color-coded move status
    const wrongTurnNodes = moves
        .filter((m) => m.chosenDirection !== m.correctDirection)
        .map((m) => m.currentNode);

    const backtrackNodes = moves
        .filter((m) => m.backtrackStatus)
        .map((m) => m.currentNode);

    return (
        <div className="route-replay-container w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🎬 Annotated Route Replay</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Interactive Timeline
                        </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                        Step-by-step playback comparing optimal path vs participant navigation choices.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={isPlaying ? "secondary" : "primary"}
                        size="sm"
                        onClick={handlePlayPause}
                    >
                        {isPlaying ? "⏸️ Pause" : stepIndex >= totalSteps ? "🔄 Restart" : "▶️ Play"}
                    </Button>

                    <button
                        type="button"
                        className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                        onClick={() => setPlaybackSpeed((s) => (s === 1000 ? 500 : 1000))}
                    >
                        {playbackSpeed === 500 ? "2x Speed" : "1x Speed"}
                    </button>
                </div>
            </div>

            {/* 3D Map canvas replay */}
            <MapView
                graph={graph}
                currentNodeId={currentNodeId}
                highlightedPath={graph.optimalPath}
                phase="replay"
                replayUserPath={userPathNodeIds}
                replayStepIndex={stepIndex}
                wrongTurnNodes={wrongTurnNodes}
                backtrackNodes={backtrackNodes}
            />

            {/* Timeline Slider Controls (Requirement 8) */}
            <div className="timeline-controls-wrapper mt-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>Step {stepIndex} of {totalSteps}</span>
                    {currentMoveRecord && (
                        <span
                            className={`font-bold ${
                                currentMoveRecord.chosenDirection === currentMoveRecord.correctDirection
                                    ? "text-emerald-400"
                                    : currentMoveRecord.backtrackStatus
                                    ? "text-amber-400"
                                    : "text-rose-400"
                            }`}
                        >
                            {currentMoveRecord.chosenDirection === currentMoveRecord.correctDirection
                                ? "✓ Correct Move"
                                : currentMoveRecord.backtrackStatus
                                ? "↺ Backtrack"
                                : "❌ Wrong Turn"}{" "}
                            ({currentMoveRecord.chosenDirection.toUpperCase()}) — {currentMoveRecord.decisionLatency}ms
                        </span>
                    )}
                </div>

                <input
                    type="range"
                    min={0}
                    max={totalSteps}
                    value={stepIndex}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-cyan-400" /> Optimal Path
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-400" /> Correct Move
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500" /> Wrong Turn
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400" /> Backtrack
                    </span>
                </div>
            </div>
        </div>
    );
}
