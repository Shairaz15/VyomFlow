import { useState } from "react";
import { Card, Button } from "../../../common";
import type { LandmarkRecallQuestion, LandmarkRecallResponse } from "../../../../types/navigationTypes";

interface LandmarkRecallProps {
    questions: LandmarkRecallQuestion[];
    onComplete: (responses: LandmarkRecallResponse[]) => void;
}

export function LandmarkRecall({ questions, onComplete }: LandmarkRecallProps) {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [responses, setResponses] = useState<LandmarkRecallResponse[]>([]);
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

    const currentQuestion = questions[currentIndex];

    const handleSelectOption = (option: string) => {
        setSelectedOption(option);
    };

    const handleNextQuestion = () => {
        if (!selectedOption || !currentQuestion) return;

        const responseTimeMs = Date.now() - questionStartTime;
        const isCorrect = selectedOption === currentQuestion.correctAnswer;

        const response: LandmarkRecallResponse = {
            questionId: currentQuestion.id,
            selectedAnswer: selectedOption,
            isCorrect,
            responseTimeMs,
        };

        const updatedResponses = [...responses, response];

        if (currentIndex < questions.length - 1) {
            setResponses(updatedResponses);
            setSelectedOption(null);
            setCurrentIndex((prev) => prev + 1);
            setQuestionStartTime(Date.now());
        } else {
            onComplete(updatedResponses);
        }
    };

    if (!currentQuestion) return null;

    return (
        <Card className="landmark-recall-card p-6 md:p-8 max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-3 py-1 rounded-full">
                    Spatial Memory Quiz ({currentIndex + 1} of {questions.length})
                </span>
                <span className="text-xs text-slate-500 font-mono">
                    Category: {currentQuestion.type}
                </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">
                {currentQuestion.questionText}
            </h3>

            <div className="options-grid space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    return (
                        <button
                            key={`opt_${idx}`}
                            type="button"
                            className={`w-full text-left p-4 rounded-xl font-medium border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                                isSelected
                                    ? "bg-cyan-600/20 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/10"
                                    : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                            }`}
                            onClick={() => handleSelectOption(option)}
                        >
                            <span>{option}</span>
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                        ? "border-cyan-400 bg-cyan-500 text-white"
                                        : "border-slate-600"
                                }`}
                            >
                                {isSelected && <span className="text-xs">✓</span>}
                            </div>
                        </button>
                    );
                })}
            </div>

            <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!selectedOption}
                onClick={handleNextQuestion}
            >
                {currentIndex < questions.length - 1 ? "Next Question →" : "Finish Assessment & See Results"}
            </Button>
        </Card>
    );
}
