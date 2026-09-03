import { useState, useEffect, useRef } from "react";
import { Card, Icon } from "../../../common";
import type { DestinationAnswer } from "../../../../types/navigationTypes";

interface DestinationQuestionProps {
    question: string;
    options: string[];
    correctIndex: number;
    onAnswer: (answer: DestinationAnswer) => void;
}

export function DestinationQuestion({
    question,
    options,
    correctIndex,
    onAnswer,
}: DestinationQuestionProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const startTimeRef = useRef<number>(performance.now());

    useEffect(() => {
        startTimeRef.current = performance.now();
    }, []);

    const handleSelectOption = (index: number) => {
        if (isSubmitted) return;

        const responseTimeMs = Math.round(performance.now() - startTimeRef.current);
        const isCorrect = index === correctIndex;

        setSelectedIndex(index);
        setIsSubmitted(true);

        setTimeout(() => {
            onAnswer({
                selectedIndex: index,
                isCorrect,
                responseTimeMs,
            });
        }, 1500);
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fadeInUp">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon name="shield-check" size={14} />
                    <span>Phase 2: Destination Recall</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {question}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                    Select the final destination of the walking route you just observed.
                </p>
            </div>

            <Card className="p-6 shadow-2xl space-y-3">
                <div className="space-y-3">
                    {options.map((option, idx) => {
                        const isChosen = selectedIndex === idx;
                        const isTarget = idx === correctIndex;

                        let buttonStyle = "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200";

                        if (isSubmitted) {
                            if (isChosen && isTarget) {
                                buttonStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 animate-pulse";
                            } else if (isChosen && !isTarget) {
                                buttonStyle = "bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/50";
                            } else if (isTarget) {
                                buttonStyle = "bg-emerald-500/10 border-emerald-500/60 text-emerald-300";
                            } else {
                                buttonStyle = "bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-40";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                disabled={isSubmitted}
                                onClick={() => handleSelectOption(idx)}
                                className={`w-full min-h-[56px] p-4 text-left rounded-2xl border transition-all duration-200 flex items-center justify-between text-sm sm:text-base font-medium cursor-pointer disabled:cursor-not-allowed ${buttonStyle}`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs font-mono font-bold flex items-center justify-center text-slate-300">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{option}</span>
                                </span>
                                {isSubmitted && isChosen && (
                                    <span>
                                        {isTarget ? (
                                            <Icon name="check" size={20} className="text-emerald-400" />
                                        ) : (
                                            <span className="text-rose-400 font-bold">✕</span>
                                        )}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
