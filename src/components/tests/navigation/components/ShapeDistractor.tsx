import { useState, useEffect, useRef } from "react";
import { Card } from "../../../common";

interface ShapeDistractorProps {
    onComplete: () => void;
}

interface ShapeItem {
    id: number;
    type: "circle" | "square" | "triangle";
    color: string;
    x: number; // percentage
    y: number; // percentage
    isTarget: boolean;
}

export function ShapeDistractor({ onComplete }: ShapeDistractorProps) {
    const [timeLeft, setTimeLeft] = useState<number>(10);
    const [score, setScore] = useState<number>(0);
    const [shapes, setShapes] = useState<ShapeItem[]>([]);
    const targetType = "circle";
    const completedRef = useRef(false);

    // Generate random shapes grid
    const generateShapes = () => {
        const items: ShapeItem[] = [];
        const types: ("circle" | "square" | "triangle")[] = ["circle", "square", "triangle"];
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

        for (let i = 0; i < 8; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            items.push({
                id: i,
                type,
                color: colors[Math.floor(Math.random() * colors.length)],
                x: 10 + (i % 4) * 22 + Math.random() * 5,
                y: 15 + Math.floor(i / 4) * 40 + Math.random() * 10,
                isTarget: type === targetType,
            });
        }
        setShapes(items);
    };

    useEffect(() => {
        generateShapes();
    }, []);

    // 10s Timer ticker
    useEffect(() => {
        if (timeLeft <= 0) {
            if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const handleShapeClick = (shape: ShapeItem) => {
        if (shape.isTarget) {
            setScore((prev) => prev + 1);
            setShapes((prev) => prev.filter((s) => s.id !== shape.id));
        }
    };

    return (
        <Card className="distractor-card p-6 md:p-8 text-center max-w-xl mx-auto border border-amber-500/30 bg-slate-900/90 shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between mb-4">
                <div className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold rounded-full text-xs uppercase tracking-wider">
                    Distractor Interference Task
                </div>
                <div className="text-xl font-mono font-bold text-amber-400">
                    ⏱️ {timeLeft}s
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Tap all CIRCLES!</h3>
            <p className="text-sm text-slate-400 mb-6">
                Interference task: Focus on tapping circles before time runs out.
            </p>

            <div className="shape-canvas relative w-full h-64 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden mb-4">
                {shapes.map((shape) => (
                    <button
                        key={shape.id}
                        type="button"
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-90 cursor-pointer"
                        style={{ left: `${shape.x}%`, top: `${shape.y}%` }}
                        onClick={() => handleShapeClick(shape)}
                        aria-label={`Tap ${shape.type}`}
                    >
                        {shape.type === "circle" && (
                            <div
                                className="w-12 h-12 rounded-full shadow-lg shadow-cyan-500/20 border-2 border-white/40"
                                style={{ backgroundColor: shape.color }}
                            />
                        )}
                        {shape.type === "square" && (
                            <div
                                className="w-12 h-12 rounded-lg shadow-lg border-2 border-white/40"
                                style={{ backgroundColor: shape.color }}
                            />
                        )}
                        {shape.type === "triangle" && (
                            <div
                                className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[40px]"
                                style={{ borderBottomColor: shape.color }}
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="text-xs text-slate-500 font-mono">
                Tapped: {score} Target Circles
            </div>
        </Card>
    );
}
