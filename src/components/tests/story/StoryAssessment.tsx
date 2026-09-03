import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon, TutorialVideoPlaceholder } from "../../common";
import { useAuth } from "../../../contexts/AuthContext";
import { STORIES, LANGUAGE_NAMES, getRandomStory } from "../../../data/stories/storyData";
import type { Story, SupportedLanguage, ComprehensionResponse, StoryAssessmentResult } from "../../../types/storyTypes";
import { StoryPlayer } from "./StoryPlayer";
import { ComprehensionQuiz } from "./ComprehensionQuiz";
import { StoryRecorder } from "./StoryRecorder";
import { StoryResults } from "./StoryResults";
import { matchStoryUnits } from "./StoryMatchingService";
import { computeStoryScore } from "./StoryScoring";
import { useStoryResults } from "../../../hooks/useTestResults";
import "./StoryAssessment.css";

type Phase = 
    | "instructions" 
    | "language_select" 
    | "narration" 
    | "distractor" 
    | "comprehension" 
    | "recall" 
    | "processing" 
    | "results";

export function StoryAssessment() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { saveResult } = useStoryResults();

    const [phase, setPhase] = useState<Phase>("instructions");
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en-IN");
    const [story, setStory] = useState<Story>(STORIES[0]);
    const [comprehensionResponses, setComprehensionResponses] = useState<ComprehensionResponse[]>([]);
    const [assessmentResult, setAssessmentResult] = useState<StoryAssessmentResult | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Ref for the active stage card to support smooth auto-centering
    const activeStageRef = useRef<HTMLDivElement>(null);

    // Smoothly scroll and center the active stage card within the viewport
    const scrollToActiveStage = useCallback(() => {
        if (!activeStageRef.current) return;

        requestAnimationFrame(() => {
            if (!activeStageRef.current) return;
            const rect = activeStageRef.current.getBoundingClientRect();
            const topClearance = 80; // Safe clearance for mobile sticky header
            const isComfortablyVisible = 
                rect.top >= topClearance && 
                rect.bottom <= window.innerHeight + 40;

            if (!isComfortablyVisible) {
                activeStageRef.current.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center",
                    inline: "nearest"
                });
            }
        });
    }, []);

    // Trigger auto-scroll on phase change
    useEffect(() => {
        scrollToActiveStage();
    }, [phase, scrollToActiveStage]);

    // Handle Exit / Back Navigation
    const handleExitClick = () => {
        // If on initial instruction or already on results, navigate immediately without warning
        if (phase === "instructions" || phase === "language_select" || phase === "results") {
            navigate("/tests");
            return;
        }
        // If in-flight during active evaluation, confirm before losing session progress
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        navigate("/tests");
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    // 1. Language Selection
    const handleSelectLanguage = (lang: SupportedLanguage) => {
        if (!isAuthenticated) return;
        setSelectedLanguage(lang);
        const randomStory = getRandomStory();
        setStory(randomStory);
        setPhase("narration");
    };

    // 2. Narration Completed -> Go directly to Comprehension Quiz
    const handleNarrationComplete = () => {
        setPhase("comprehension");
    };

    // 4. Comprehension Quiz Completed
    const handleComprehensionComplete = (responses: ComprehensionResponse[]) => {
        setComprehensionResponses(responses);
        setPhase("recall");
    };

    // 5. Spoken Recall Completed
    const handleRecallComplete = (data: {
        transcript: string;
        verbatimTranscript: string;
        englishTranslation: string;
        durationMs: number;
        pauseCount: number;
        pauseDurationMs: number;
    }) => {
        setPhase("processing");

        // Run Story Matching Engine (evaluates spoken transcript and English translation)
        const matchResult = matchStoryUnits(
            data.transcript,
            data.englishTranslation,
            story.informationUnits
        );

        // Run Story Scoring Engine
        const { biomarkers, storyRecallScore } = computeStoryScore({
            story,
            recalledText: data.transcript,
            englishTranslation: data.englishTranslation,
            durationMs: data.durationMs,
            pauseCount: data.pauseCount,
            pauseDurationMs: data.pauseDurationMs,
            matchResult,
            comprehensionResponses
        });

        const finalResult: StoryAssessmentResult = {
            id: `story_res_${Date.now()}`,
            sessionId: `sess_${Date.now()}`,
            timestamp: new Date(),
            storyId: story.id,
            difficulty: story.difficulty,
            selectedLanguage,
            nativeTranscript: data.transcript,
            englishTranslation: data.englishTranslation,
            verbatimTranscript: data.verbatimTranscript,
            comprehensionResponses,
            matchResult,
            biomarkers,
            storyRecallScore
        };

        // Persist result
        saveResult(finalResult);
        setAssessmentResult(finalResult);
        setPhase("results");
    };

    const handleRetake = () => {
        setPhase("instructions");
        setAssessmentResult(null);
        setComprehensionResponses([]);
    };

    return (
        <PageWrapper>
            <div className="story-assessment-container container">
                {/* Top Navigation Bar: Back / Exit Control */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label="Back to Assessments"
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>Back to Assessments</span>
                    </button>

                    <div className="story-module-badge">
                        <span className="badge-dot" aria-hidden="true" />
                        <span>Cognitive Assessment</span>
                    </div>
                </div>

                {/* Primary Test Header (shown only on instructions intro) */}
                {phase === "instructions" && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">Story Narration Recall</h1>
                        <p className="story-subtitle">
                            Listen to a short narrated story and answer questions about what you remember.
                        </p>
                    </div>
                )}

                {/* Active Assessment Stage Container */}
                <div ref={activeStageRef} className="story-stage-viewport">
                    {/* Phase 1: Instructions Screen */}
                    {phase === "instructions" && (
                        <div className="instructions-with-tutorial-layout animate-fadeIn">
                            <Card className="instructions-card">
                                <div className="instructions-content">
                                    <div className="instructions-icon-wrapper" aria-hidden="true">
                                        <Icon name="story" size={28} />
                                    </div>
                                    <h2 className="instructions-card-title vyom-serif">How this assessment works</h2>
                                    
                                    <ol className="instructions-step-list">
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">1</div>
                                            <div className="step-content">
                                                <strong>Select Language:</strong>
                                                <span>Choose your preferred Indian narration language.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">2</div>
                                            <div className="step-content">
                                                <strong>Listen Carefully:</strong>
                                                <span>Hear a short narrative audio passage played <strong>once</strong>.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">3</div>
                                            <div className="step-content">
                                                <strong>Comprehension Questions:</strong>
                                                <span>Answer 4 quick multiple-choice questions about the story.</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">4</div>
                                            <div className="step-content">
                                                <strong>Spoken Recall:</strong>
                                                <span>Retell the story in your own words (30–60 seconds).</span>
                                            </div>
                                        </li>
                                    </ol>

                                    <div className="instructions-action-row">
                                        <Button
                                            variant="primary"
                                            className="story-primary-start-btn"
                                            onClick={() => setPhase("language_select")}
                                        >
                                            Start Test
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Tutorial Video Placeholder */}
                            <TutorialVideoPlaceholder />
                        </div>
                    )}

                    {/* Phase 2: Language Selection */}
                    {phase === "language_select" && (
                        <Card className="language-select-card animate-fadeIn">
                            <h2 className="select-card-title vyom-serif">Select Narration Language</h2>
                            <p className="select-desc">The story will be narrated in your chosen language.</p>
                            <div className="languages-grid">
                                {(Object.keys(LANGUAGE_NAMES) as SupportedLanguage[]).map(langKey => (
                                    <button
                                        key={langKey}
                                        className="lang-select-btn"
                                        onClick={() => handleSelectLanguage(langKey)}
                                    >
                                        <Icon name="language" size={20} />
                                        <span>{LANGUAGE_NAMES[langKey]}</span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Phase 3: Story Narration Player */}
                    {phase === "narration" && (
                        <StoryPlayer
                            storyText={story.englishReference}
                            languageCode={selectedLanguage}
                            onComplete={handleNarrationComplete}
                        />
                    )}

                    {/* Phase 4: Comprehension Quiz */}
                    {phase === "comprehension" && (
                        <ComprehensionQuiz
                            questions={story.comprehensionQuestions}
                            selectedLanguage={selectedLanguage}
                            onComplete={handleComprehensionComplete}
                        />
                    )}

                    {/* Phase 5: Spoken Story Recall */}
                    {phase === "recall" && (
                        <StoryRecorder
                            selectedLanguage={selectedLanguage}
                            onComplete={handleRecallComplete}
                        />
                    )}

                    {/* Phase 6: Processing */}
                    {phase === "processing" && (
                        <Card className="processing-card animate-fadeIn">
                            <div className="processing-body">
                                <div className="spinner" />
                                <h3 className="processing-title vyom-serif">Analyzing Narrative Biomarkers...</h3>
                                <p className="processing-desc">Transcribing recall, calculating Information Unit retention, and computing your Story Recall Profile.</p>
                            </div>
                        </Card>
                    )}

                    {/* Phase 7: Results Screen */}
                    {phase === "results" && assessmentResult && (
                        <StoryResults
                            result={assessmentResult}
                            onRetake={handleRetake}
                        />
                    )}
                </div>

                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="story-modal-backdrop animate-fadeIn" role="dialog" aria-modal="true">
                        <div className="story-exit-modal animate-scaleUp">
                            <div className="exit-modal-icon">⚠️</div>
                            <h3 className="exit-modal-title vyom-serif">Leave this assessment?</h3>
                            <p className="exit-modal-text">
                                Your current assessment progress will be lost if you leave now.
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    Continue Test
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    Leave Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
