import { Button, Card, Icon } from "../../../common";
import type { ImmersiveNavigationResult } from "../../../../types/navigationTypes";

interface NavigationResultsProps {
    result: ImmersiveNavigationResult;
    onRetake: () => void;
    onBackToTests: () => void;
}

export function NavigationResults({
    result,
    onRetake,
    onBackToTests,
}: NavigationResultsProps) {
    const { biomarkers, navigationScore } = result;

    // Score Color Scheme & Tier
    const getScoreTier = (score: number) => {
        if (score >= 80) return { label: "Excellent Visuospatial Navigation", color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" };
        if (score >= 60) return { label: "Good Spatial Orientation", color: "#38bdf8", bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400" };
        if (score >= 40) return { label: "Fair / Mild Spatial Hesitation", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" };
        return { label: "Attention Advised", color: "#f43f5e", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" };
    };

    const tier = getScoreTier(navigationScore);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeInUp">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon name="navigation" size={14} />
                    <span>Assessment Completed</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Navigation & Spatial Memory Results
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                    Multimodal evaluation of first-person route learning, reverse decision-making latency, and landmark sequence recall.
                </p>
            </div>

            {/* Composite Score Gauge Card */}
            <Card className="p-8 shadow-2xl flex flex-col md:flex-row items-center justify-around gap-8 text-center md:text-left">
                {/* Circular Score Gauge */}
                <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-slate-800"
                            strokeWidth="10"
                            fill="transparent"
                        />
                        {/* Progress Arc */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke={tier.color}
                            strokeWidth="10"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * navigationScore) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold text-white font-mono">
                            {navigationScore}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">/ 100</span>
                    </div>
                </div>

                {/* Score Summary & Key Takeaways */}
                <div className="space-y-3 max-w-md">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tier.bg} ${tier.border} ${tier.text} border`}>
                        {tier.label}
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        Visuospatial Navigation Index
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Your performance indicates high spatial orientation fidelity with an average intersection decision time of{" "}
                        <strong className="text-cyan-400 font-mono">{biomarkers.averageDecisionLatencyMs}ms</strong> and landmark sequence accuracy of{" "}
                        <strong className="text-emerald-400 font-mono">{Math.round(biomarkers.landmarkSequenceAccuracy * 100)}%</strong>.
                    </p>
                </div>
            </Card>

            {/* Biomarker Breakdown Grid (4 Categories) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Route Memory */}
                <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                            <Icon name="navigation" size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Route Learning & Execution</h3>
                            <span className="text-[11px] text-slate-400">Wayfinding fidelity across {result.intersectionResponses.length || 8} intersections</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Direction Decision Accuracy</span>
                            <span className="font-mono font-bold text-white">{Math.round(biomarkers.navigationAccuracy * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${biomarkers.navigationAccuracy * 100}%` }} />
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-400">Destination Recall</span>
                            <span className="font-semibold text-emerald-400">{biomarkers.destinationRecallAccuracy === 1 ? "Correct ✓" : "Incorrect ✕"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Wrong Turns</span>
                            <span className="font-mono font-semibold text-slate-200">{biomarkers.wrongTurnCount} / {result.intersectionResponses.length || 8}</span>
                        </div>
                    </div>
                </Card>

                {/* 2. Executive Function & Latency */}
                <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Icon name="reaction" size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Executive Function & Latency</h3>
                            <span className="text-[11px] text-slate-400">Processing speed & choice hesitation</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Average Decision Latency</span>
                            <span className="font-mono font-bold text-amber-300">{biomarkers.averageDecisionLatencyMs} ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Peak Single-Turn Latency</span>
                            <span className="font-mono font-semibold text-slate-300">{biomarkers.maxDecisionLatencyMs} ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Hesitation Count (&gt; 2× mean)</span>
                            <span className="font-mono font-semibold text-slate-300">{biomarkers.hesitationCount}</span>
                        </div>
                    </div>
                </Card>

                {/* 3. Spatial Landmark Memory */}
                <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Icon name="memory" size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Spatial Landmark Memory</h3>
                            <span className="text-[11px] text-slate-400">Visual discrimination & distractor suppression</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Landmark Recognition</span>
                            <span className="font-mono font-bold text-white">{Math.round(biomarkers.landmarkRecognitionAccuracy * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${biomarkers.landmarkRecognitionAccuracy * 100}%` }} />
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-400">Chronological Sequence Accuracy</span>
                            <span className="font-mono font-bold text-emerald-400">{Math.round(biomarkers.landmarkSequenceAccuracy * 100)}%</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">False Landmark Distractor Rate</span>
                            <span className="font-mono font-semibold text-slate-300">{Math.round(biomarkers.falseLandmarkRate * 100)}%</span>
                        </div>
                    </div>
                </Card>

                {/* 4. Episodic Memory & Composite Indices */}
                <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <Icon name="brain-circuit" size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Episodic & Cognitive Indices</h3>
                            <span className="text-[11px] text-slate-400">Integrative memory encoding scores</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Route Memory Index</span>
                            <span className="font-mono font-bold text-purple-300">{Math.round(biomarkers.routeMemoryScore * 100)} / 100</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Visual Attention Index</span>
                            <span className="font-mono font-bold text-purple-300">{Math.round(biomarkers.visualAttentionScore * 100)} / 100</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Episodic Encoding Index</span>
                            <span className="font-mono font-bold text-purple-300">{Math.round(biomarkers.episodicMemoryScore * 100)} / 100</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={onRetake}
                    className="min-w-[180px]"
                >
                    Retake Assessment
                </Button>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={onBackToTests}
                    className="min-w-[200px] shadow-xl shadow-cyan-500/20 font-semibold"
                >
                    Back to All Tests →
                </Button>
            </div>
        </div>
    );
}
