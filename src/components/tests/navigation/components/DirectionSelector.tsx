import { useState, useEffect, useRef } from "react";
import { Card, Icon } from "../../../common";
import type { NavigationDirection, IntersectionResponse } from "../../../../types/navigationTypes";

interface DirectionSelectorProps {
    intersectionLabel: string;
    correctDirection: NavigationDirection;
    onDecision: (response: IntersectionResponse) => void;
    segmentId: string;
}

export function DirectionSelector({
    intersectionLabel,
    correctDirection,
    onDecision,
    segmentId,
}: DirectionSelectorProps) {
    const [chosenDirection, setChosenDirection] = useState<NavigationDirection | null>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const startTimeRef = useRef<number>(performance.now());

    useEffect(() => {
        startTimeRef.current = performance.now();
        setChosenDirection(null);
        setIsSubmitted(false);
    }, [segmentId]);

    const handleChooseDirection = (direction: NavigationDirection) => {
        if (isSubmitted) return;

        const decisionLatencyMs = Math.round(performance.now() - startTimeRef.current);
        const isCorrect = direction === correctDirection;

        setChosenDirection(direction);
        setIsSubmitted(true);

        const response: IntersectionResponse = {
            segmentId,
            chosenDirection: direction,
            correctDirection,
            isCorrect,
            decisionLatencyMs,
            timestamp: Date.now(),
        };

        const delay = isCorrect ? 500 : 1500;
        setTimeout(() => {
            onDecision(response);
        }, delay);
    };

    const getButtonClass = (direction: NavigationDirection) => {
        const isChosen = chosenDirection === direction;
        const isTarget = direction === correctDirection;

        if (!isSubmitted) {
            return "bg-slate-800/90 hover:bg-slate-700/90 hover:border-cyan-500/60 border-slate-700 text-slate-200 active:scale-95";
        }

        if (isChosen && isTarget) {
            return "bg-emerald-500/25 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 scale-105";
        }

        if (isChosen && !isTarget) {
            return "bg-rose-500/25 border-rose-500 text-rose-300 ring-2 ring-rose-500/50";
        }

        if (isTarget) {
            return "bg-emerald-500/15 border-emerald-500/70 text-emerald-300 animate-pulse";
        }

        return "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-40";
    };

    return (
        <div className="max-w-xl mx-auto py-6 px-4 space-y-6 animate-fadeInUp">
            {/* Header info */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon name="navigation" size={14} />
                    <span>Reverse Route Decision</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {intersectionLabel}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                    Which direction should you take to retrace your path back to Main Gate 1 (Point A)?
                </p>
            </div>

            {/* Diamond / Cross Direction Buttons Container */}
            <Card className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl">
                <div className="flex flex-col items-center justify-center space-y-3">
                    {/* Top: Straight */}
                    <div>
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("straight")}
                            className={`min-w-[130px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm ${getButtonClass("straight")}`}
                        >
                            <span className="text-xl">↑</span>
                            <span>Straight</span>
                        </button>
                    </div>

                    {/* Middle: Left, Compass Icon, Right */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Left */}
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("left")}
                            className={`min-w-[130px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm ${getButtonClass("left")}`}
                        >
                            <span className="text-xl">←</span>
                            <span>Turn Left</span>
                        </button>

                        {/* Center Orientation Badge */}
                        <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400/70 shadow-inner">
                            <Icon name="navigation" size={20} />
                        </div>

                        {/* Right */}
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("right")}
                            className={`min-w-[130px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm ${getButtonClass("right")}`}
                        >
                            <span className="text-xl">→</span>
                            <span>Turn Right</span>
                        </button>
                    </div>

                    {/* Bottom: Back */}
                    <div>
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("back")}
                            className={`min-w-[130px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm ${getButtonClass("back")}`}
                        >
                            <span className="text-xl">↓</span>
                            <span>Turn Back</span>
                        </button>
                    </div>
                </div>
            </Card>

            <div className="text-center text-xs text-slate-500">
                Decision latency is measured with high precision for cognitive executive processing.
            </div>
        </div>
    );
}
