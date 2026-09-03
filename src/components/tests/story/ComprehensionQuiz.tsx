import { useState, useRef, useEffect, useMemo } from "react";
import { Button, Card, Icon } from "../../common";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { ComprehensionQuestion, ComprehensionResponse, SupportedLanguage } from "../../../types/storyTypes";

interface ComprehensionQuizProps {
    questions: ComprehensionQuestion[];
    selectedLanguage?: SupportedLanguage;
    onComplete: (responses: ComprehensionResponse[]) => void;
}

export function ComprehensionQuiz({ questions, selectedLanguage = 'en-IN', onComplete }: ComprehensionQuizProps) {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const responsesRef = useRef<ComprehensionResponse[]>([]);
    const questionStartTimeRef = useRef<number>(Date.now());

    // Get active question and resolve language content
    const currentQuestion = questions[currentIndex];

    const questionDisplayData = useMemo(() => {
        if (!currentQuestion) return null;

        const langData = currentQuestion.languageContent?.[selectedLanguage];
        const questionText = langData?.questionText || currentQuestion.questionText;

        const baseOptions = langData?.options || currentQuestion.options;
        const shuffled = [...baseOptions].sort(() => Math.random() - 0.5);

        return {
            questionText,
            options: shuffled
        };
    }, [currentQuestion, selectedLanguage]);

    const shuffledOptions = questionDisplayData?.options || [];

    useEffect(() => {
        questionStartTimeRef.current = Date.now();
        setSelectedOption(null);
    }, [currentIndex]);

    const handleSelectOption = (optionId: string) => {
        setSelectedOption(optionId);
    };

    const handleNext = () => {
        if (!selectedOption || !currentQuestion) return;

        const responseTimeMs = Date.now() - questionStartTimeRef.current;
        const isCorrect = selectedOption === currentQuestion.correctOptionId;

        responsesRef.current.push({
            questionId: currentQuestion.id,
            selectedOptionId: selectedOption,
            isCorrect,
            responseTimeMs
        });

        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete(responsesRef.current);
        }
    };

    if (!currentQuestion) return null;

    return (
        <Card className="quiz-card animate-fadeIn">
            <div className="quiz-header">
                <span className="question-progress">
                    {t("story.questionProgress", { current: currentIndex + 1, total: questions.length })}
                </span>
                <h3>{t("story.listeningComprehension")}</h3>
            </div>

            <div className="question-box">
                <h4>{questionDisplayData?.questionText || currentQuestion.questionText}</h4>
            </div>

            <div className="options-grid">
                {shuffledOptions.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                        <button
                            key={opt.id}
                            className={`option-button ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectOption(opt.id)}
                        >
                            <span className="radio-dot" />
                            <span className="option-text">{opt.text}</span>
                        </button>
                    );
                })}
            </div>

            <div className="quiz-footer">
                <Button
                    variant="primary"
                    disabled={!selectedOption}
                    onClick={handleNext}
                >
                    {currentIndex + 1 === questions.length ? t("story.submitAnswers") : t("story.nextQuestion")}
                    <Icon name="chevron-right" size={16} />
                </Button>
            </div>
        </Card>
    );
}
