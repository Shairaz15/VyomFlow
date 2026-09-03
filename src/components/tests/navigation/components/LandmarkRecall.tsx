import { useState, useRef, useEffect } from "react";
import type { LandmarkRecallQuestion, LandmarkRecallResponse } from "../../../../types/navigationTypes";
import { Button, Card } from "../../../common";

interface LandmarkRecallProps {
    questions: LandmarkRecallQuestion[];
    onComplete: (responses: LandmarkRecallResponse[]) => void;
}

export function LandmarkRecall({ questions, onComplete }: LandmarkRecallProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [responses, setResponses] = useState<LandmarkRecallResponse[]>([]);
    
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        startTimeRef.current = Date.now();
    }, [currentIndex]);

    if (!questions || questions.length === 0) {
        return null;
    }

    const currentQuestion = questions[currentIndex];

    const handleSelect = (option: string) => {
        setSelectedOption(option);
    };

    const handleNext = () => {
        if (!selectedOption) return;

        const responseTimeMs = Date.now() - startTimeRef.current;
        const isCorrect = selectedOption === currentQuestion.correctAnswer;

        const newResponse: LandmarkRecallResponse = {
            questionId: currentQuestion.id,
            selectedAnswer: selectedOption,
            isCorrect,
            responseTimeMs,
        };

        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);

        if (currentIndex < questions.length - 1) {
            setSelectedOption(null);
            setCurrentIndex((prev) => prev + 1);
        } else {
            onComplete(updatedResponses);
        }
    };

    return (
        <Card className="landmark-recall-card">
            <div className="quiz-header">
                <span className="quiz-tag">Spatial Memory Check</span>
                <span className="quiz-step">
                    Question {currentIndex + 1} of {questions.length}
                </span>
            </div>

            <h3 className="quiz-question">{currentQuestion.questionText}</h3>

            <div className="quiz-options-list">
                {currentQuestion.options.map((option, idx) => (
                    <button
                        key={`option_${idx}`}
                        type="button"
                        className={`quiz-option-btn ${selectedOption === option ? "selected" : ""}`}
                        onClick={() => handleSelect(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <div className="quiz-footer">
                <Button
                    variant="primary"
                    disabled={!selectedOption}
                    onClick={handleNext}
                >
                    {currentIndex < questions.length - 1 ? "Next Question →" : "Finish Quiz →"}
                </Button>
            </div>
        </Card>
    );
}
