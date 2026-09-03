import type { MapGraph, NavigationAssessmentResult } from "../../../../types/navigationTypes";
import { Card, Button } from "../../../common";
import { RouteReplay } from "./RouteReplay";

interface NavigationResultsProps {
    map: MapGraph;
    result: NavigationAssessmentResult;
    isLevelUnlocked: boolean;
    nextLevel?: number;
    onRetake: () => void;
    onBackToTests: () => void;
}

export function NavigationResults({
    map,
    result,
    isLevelUnlocked,
    nextLevel,
    onRetake,
    onBackToTests,
}: NavigationResultsProps) {
    const { biomarkers, navigationScore, moves, sessionMetadata } = result;

    const scoreColor =
        navigationScore >= 85
            ? "text-emerald-400 border-emerald-500"
            : navigationScore >= 70
            ? "text-cyan-400 border-cyan-500"
            : "text-amber-400 border-amber-500";

    return (
        <div className="navigation-results-wrapper space-y-6 max-w-4xl mx-auto">
            {/* Header Score Card */}
            <Card className="score-summary-card p-6 md:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono text-xs uppercase tracking-wider mb-4">
                    3D Spatial Navigation Biomarker Report
                </div>

                <div className="flex flex-col items-center justify-center my-4">
                    <div className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center ${scoreColor} bg-slate-950/80 shadow-2xl`}>
                        <span className="text-4xl font-extrabold font-mono">{navigationScore}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">Out of 100</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-4">
                        Strategy: <span className="text-cyan-400">{biomarkers.navigationStrategy}</span>
                    </h2>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                        Demographic-normalized evaluation across visuospatial memory, spatial orientation, executive decision stability, and landmark recall.
                    </p>
                </div>

                {/* Adaptive Progression Notice (Requirement 2) */}
                <div className={`p-4 rounded-2xl border text-sm max-w-md mx-auto ${
                    isLevelUnlocked
                        ? "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                        : "bg-amber-950/50 border-amber-800/80 text-amber-300"
                }`}>
                    {isLevelUnlocked ? (
                        <div className="flex items-center justify-center gap-2 font-semibold">
                            <span>🎉</span> Level {nextLevel} Unlocked! (Score ≥ 70)
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 font-semibold">
                            <span>🔁</span> Practice Level {result.difficulty} again to reach 70+ cutoff.
                        </div>
                    )}
                </div>
            </Card>

            {/* Biomarker Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Spatial Memory & Efficiency */}
                <Card className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl">
                    <h4 className="text-sm font-mono uppercase text-slate-400 mb-4 flex items-center gap-2">
                        <span>🧩 Spatial Memory & Path Metrics</span>
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                                <span>Path Efficiency</span>
                                <span>{Math.round(biomarkers.pathEfficiency * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-cyan-400 h-full rounded-full"
                                    style={{ width: `${Math.min(100, biomarkers.pathEfficiency * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                                <span>Navigation Accuracy</span>
                                <span>{Math.round(biomarkers.navigationAccuracy * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-400 h-full rounded-full"
                                    style={{ width: `${Math.min(100, biomarkers.navigationAccuracy * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                                <span>Landmark Recall Accuracy</span>
                                <span>{Math.round(biomarkers.landmarkRecallAccuracy * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-400 h-full rounded-full"
                                    style={{ width: `${Math.min(100, biomarkers.landmarkRecallAccuracy * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">Exploration Ratio</span>
                                <span className="text-lg font-bold text-amber-300">{biomarkers.explorationRatio}</span>
                            </div>

                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 block text-[10px]">Wrong Turns</span>
                                <span className="text-lg font-bold text-rose-400">{biomarkers.wrongTurnCount}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. Expanded Decision Latency Analytics (Requirements 6 & 9) */}
                <Card className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl">
                    <h4 className="text-sm font-mono uppercase text-slate-400 mb-4 flex items-center gap-2">
                        <span>⚡ Executive Decision Latency Analytics</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Mean Latency</span>
                            <span className="text-xl font-bold text-cyan-300">{biomarkers.decisionLatencyMean} ms</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Median Latency</span>
                            <span className="text-xl font-bold text-cyan-300">{biomarkers.decisionLatencyMedian} ms</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Max Latency</span>
                            <span className="text-xl font-bold text-amber-300">{biomarkers.decisionLatencyMax} ms</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Latency Variance</span>
                            <span className="text-xl font-bold text-emerald-300">{biomarkers.decisionLatencyVariance}</span>
                        </div>
                    </div>

                    {/* Session Metadata (Requirement 9) */}
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap justify-between gap-2">
                        <span>Device: {sessionMetadata.deviceType}</span>
                        <span>FPS: {sessionMetadata.fps}</span>
                        <span>Input: {sessionMetadata.inputMethod}</span>
                    </div>
                </Card>
            </div>

            {/* Route Replay (Requirement 8) */}
            <RouteReplay graph={map} moves={moves} />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={onRetake}>
                    🔄 {isLevelUnlocked ? `Start Level ${nextLevel}` : "Retake Assessment"}
                </Button>

                <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={onBackToTests}>
                    Back to Assessments Dashboard →
                </Button>
            </div>
        </div>
    );
}
