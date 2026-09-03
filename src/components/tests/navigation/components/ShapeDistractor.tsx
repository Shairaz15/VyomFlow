import { useState, useEffect } from "react";

interface ShapeDistractorProps {
    durationSeconds?: number; // Default 10s
    onComplete: (tappedTargets: number, totalTargets: number) => void;
}

interface ShapeItem {
    id: number;
    type: "circle" | "square" | "triangle";
    color: string;
    x: number; // percentage 10..85
    y: number; // percentage 10..75
    isTapped: boolean;
}

const SHAPE_TYPES = ["circle", "square", "triangle"] as const;
const SHAPE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export function ShapeDistractor({ durationSeconds = 10, onComplete }: ShapeDistractorProps) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [targetShape] = useState<"circle" | "square" | "triangle">(
        () => SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]
    );
    const [shapes, setShapes] = useState<ShapeItem[]>([]);
    const [tappedCount, setTappedCount] = useState(0);

    // Generate random shapes on mount
    useEffect(() => {
        const generated: ShapeItem[] = [];
        for (let i = 0; i < 15; i++) {
            generated.push({
                id: i,
                type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
                color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
                x: Math.floor(Math.random() * 75) + 10,
                y: Math.floor(Math.random() * 65) + 15,
                isTapped: false,
            });
        }
        setShapes(generated);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) {
            const totalTargets = shapes.filter((s) => s.type === targetShape).length;
            onComplete(tappedCount, totalTargets);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, shapes, targetShape, tappedCount, onComplete]);

    const handleShapeClick = (id: number) => {
        setShapes((prev) =>
            prev.map((s) => {
                if (s.id === id && !s.isTapped) {
                    if (s.type === targetShape) {
                        setTappedCount((c) => c + 1);
                    }
                    return { ...s, isTapped: true };
                }
                return s;
            })
        );
    };

    const getTargetShapeIcon = () => {
        switch (targetShape) {
            case "circle":
                return "🟡 Circles";
            case "square":
                return "🟦 Squares";
            case "triangle":
                return "🔺 Triangles";
        }
    };

    return (
        <div className="distractor-container">
            <div className="distractor-header">
                <h3>Interference Task</h3>
                <p className="distractor-instruction">
                    Quick! Tap all <strong className="target-badge">{getTargetShapeIcon()}</strong>!
                </p>

                <div className="distractor-timer-wrapper">
                    <div
                        className="distractor-timer-bar"
                        style={{ width: `${(timeLeft / durationSeconds) * 100}%` }}
                    />
                    <span className="timer-text">{timeLeft}s remaining</span>
                </div>
            </div>

            <div className="distractor-field">
                {shapes.map((shape) => {
                    if (shape.isTapped) return null;

                    return (
                        <button
                            key={shape.id}
                            type="button"
                            className={`shape-item shape-${shape.type}`}
                            style={{
                                left: `${shape.x}%`,
                                top: `${shape.y}%`,
                                backgroundColor: shape.color,
                            }}
                            onClick={() => handleShapeClick(shape.id)}
                            aria-label={`${shape.type}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
