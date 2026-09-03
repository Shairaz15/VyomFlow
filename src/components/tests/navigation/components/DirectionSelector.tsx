import { useState, useEffect, useRef, useCallback } from "react";
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

    const handleChooseDirection = useCallback((direction: NavigationDirection) => {
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
    }, [isSubmitted, segmentId, correctDirection, onDecision]);

    // Keyboard & Laptop Arrowpad controls
    useEffect(() => {
        if (isSubmitted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            const code = e.code;

            if (key === "ArrowUp" || key === "w" || key === "W" || code === "ArrowUp" || code === "KeyW" || code === "Numpad8") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("straight");
            } else if (key === "ArrowLeft" || key === "a" || key === "A" || code === "ArrowLeft" || code === "KeyA" || code === "Numpad4") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("left");
            } else if (key === "ArrowRight" || key === "d" || key === "D" || code === "ArrowRight" || code === "KeyD" || code === "Numpad6") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("right");
            } else if (key === "ArrowDown" || key === "s" || key === "S" || code === "ArrowDown" || code === "KeyS" || code === "Numpad2") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("back");
            }
        };

        window.addEventListener("keydown", handleKeyDown, { passive: false });
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSubmitted, handleChooseDirection]);

    // Touch Swipe Gestures
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isSubmitted) return;
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isSubmitted || !touchStartRef.current) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;
        touchStartRef.current = null;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const minSwipeDistance = 35;

        if (Math.max(absDx, absDy) < minSwipeDistance) return;

        if (absDy > absDx) {
            if (dy < 0) {
                handleChooseDirection("straight");
            } else {
                handleChooseDirection("back");
            }
        } else {
            if (dx < 0) {
                handleChooseDirection("left");
            } else {
                handleChooseDirection("right");
            }
        }
    };

    const getButtonClass = (direction: NavigationDirection) => {
        const isChosen = chosenDirection === direction;
        const isTarget = direction === correctDirection;

        if (!isSubmitted) {
            return "bg-slate-800/90 hover:bg-slate-700/90 hover:border-cyan-500/60 border-slate-700 text-slate-200 active:scale-95 shadow-md";
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
        <div className="max-w-xl mx-auto py-6 px-4 space-y-6 animate-fadeInUp select-none">
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
            <Card
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-4"
            >
                <div className="flex flex-col items-center justify-center space-y-3">
                    {/* Top: Straight */}
                    <div>
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("straight")}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                handleChooseDirection("straight");
                            }}
                            className={`min-w-[140px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm active:scale-95 touch-manipulation ${getButtonClass("straight")}`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl leading-none font-bold">↑</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                    ↑ / W
                                </span>
                            </div>
                            <span className="mt-0.5">Straight</span>
                        </button>
                    </div>

                    {/* Middle: Left, Compass Icon, Right */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Left */}
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("left")}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                handleChooseDirection("left");
                            }}
                            className={`min-w-[140px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm active:scale-95 touch-manipulation ${getButtonClass("left")}`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl leading-none font-bold">←</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                    ← / A
                                </span>
                            </div>
                            <span className="mt-0.5">Turn Left</span>
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
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                handleChooseDirection("right");
                            }}
                            className={`min-w-[140px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm active:scale-95 touch-manipulation ${getButtonClass("right")}`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl leading-none font-bold">→</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                    → / D
                                </span>
                            </div>
                            <span className="mt-0.5">Turn Right</span>
                        </button>
                    </div>

                    {/* Bottom: Back */}
                    <div>
                        <button
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleChooseDirection("back")}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                handleChooseDirection("back");
                            }}
                            className={`min-w-[140px] min-h-[64px] px-6 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md font-semibold text-sm active:scale-95 touch-manipulation ${getButtonClass("back")}`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl leading-none font-bold">↓</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                    ↓ / S
                                </span>
                            </div>
                            <span className="mt-0.5">Turn Back</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 px-2">
                    <span className="flex items-center gap-1">
                        <span>⌨️ Laptop Arrowpad (↑ / ← / → / ↓)</span>
                        <span className="text-slate-600">•</span>
                        <span>Touch Screen</span>
                    </span>
                    <span className="font-mono text-slate-500">Latency: ~1ms</span>
                </div>
            </Card>

            <div className="text-center text-xs text-slate-500">
                Decision latency is measured with high precision for cognitive executive processing.
            </div>
        </div>
    );
}
