import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon, TutorialVideoPlaceholder } from "../../common";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { STORIES, LANGUAGE_NAMES, getRandomStory } from "../../../data/stories/storyData";
import type { Story, SupportedLanguage, ComprehensionResponse, StoryAssessmentResult } from "../../../types/storyTypes";
import { StoryPlayer } from "./StoryPlayer";
import { ComprehensionQuiz } from "./ComprehensionQuiz";
import { StoryRecorder } from "./StoryRecorder";
import { StoryResults } from "./StoryResults";
import { matchStoryUnitsAsync } from "./StoryMatchingService";
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
    const { t } = useLanguage();
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

        // Give the browser a tick to layout the new phase content
        requestAnimationFrame(() => {
            activeStageRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        });
    }, []);

    // Trigger auto-scroll whenever the active phase transitions
    useEffect(() => {
        scrollToActiveStage();
    }, [phase, scrollToActiveStage]);

    // Handle Top Navigation Back / Exit Button
    const handleExitClick = () => {
        if (phase === "instructions" || phase === "results") {
            navigate("/tests");
            return;
        }
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        navigate("/tests");
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    // Phase Transitions
    const handleSelectLanguage = (lang: SupportedLanguage) => {
        if (!isAuthenticated) return;
        setSelectedLanguage(lang);
        const randomStory = getRandomStory();
        setStory(randomStory);
        setPhase("narration");
    };

    const handleNarrationComplete = () => {
        setPhase("comprehension");
    };

    const handleComprehensionComplete = (responses: ComprehensionResponse[]) => {
        setComprehensionResponses(responses);
        setPhase("recall");
    };

    const handleRecallComplete = async (data: {
        transcript: string;
        englishTranslation: string;
        verbatimTranscript: string;
        durationMs: number;
        pauseCount: number;
        pauseDurationMs: number;
        cognitivePauseCount?: number;
        syntacticPauseCount?: number;
    }) => {
        setPhase("processing");

        // Execute AI-assisted semantic matching and biomarker extraction
        const matchResult = await matchStoryUnitsAsync(data.transcript, data.englishTranslation, story);
        const { storyRecallScore, biomarkers } = computeStoryScore({
            story,
            recalledText: data.transcript,
            englishTranslation: data.englishTranslation,
            durationMs: data.durationMs,
            pauseCount: data.pauseCount,
            pauseDurationMs: data.pauseDurationMs,
            cognitivePauseCount: data.cognitivePauseCount,
            syntacticPauseCount: data.syntacticPauseCount,
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
                        aria-label={t("story.backToAssessments")}
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>{t("story.backToAssessments")}</span>
                    </button>
                </div>

                {/* Primary Test Header (shown only on instructions intro) */}
                {phase === "instructions" && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">{t("story.title")}</h1>
                        <p className="story-subtitle">
                            {t("story.subtitle")}
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
                                    <h2 className="instructions-card-title vyom-serif">{t("story.howItWorks")}</h2>
                                    
                                    <ol className="instructions-step-list">
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">1</div>
                                            <div className="step-content">
                                                <strong>{t("story.step1Title")}</strong>
                                                <span>{t("story.step1Desc")}</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">2</div>
                                            <div className="step-content">
                                                <strong>{t("story.step2Title")}</strong>
                                                <span>{t("story.step2Desc")}</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">3</div>
                                            <div className="step-content">
                                                <strong>{t("story.step3Title")}</strong>
                                                <span>{t("story.step3Desc")}</span>
                                            </div>
                                        </li>
                                        <li className="instruction-step-item">
                                            <div className="step-num-bubble">4</div>
                                            <div className="step-content">
                                                <strong>{t("story.step4Title")}</strong>
                                                <span>{t("story.step4Desc")}</span>
                                            </div>
                                        </li>
                                    </ol>

                                    <div className="instructions-action-row">
                                        <Button
                                            variant="primary"
                                            className="story-primary-start-btn"
                                            onClick={() => setPhase("language_select")}
                                        >
                                            {t("story.startTest")}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Multilingual Tutorial Video */}
                            <TutorialVideoPlaceholder module="story" />
                        </div>
                    )}

                    {/* Phase 2: Language Selection */}
                    {phase === "language_select" && (
                        <Card className="language-select-card animate-fadeIn">
                            <h2 className="select-card-title vyom-serif">{t("story.selectLanguage")}</h2>
                            <p className="select-desc">{t("story.selectLanguageDesc")}</p>
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
                            storyId={story.id}
                            storyText={story.content[selectedLanguage] || story.englishReference}
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
                                <h3 className="processing-title vyom-serif">{t("story.analyzingBiomarkers")}</h3>
                                <p className="processing-desc">{t("story.transcribingRecall")}</p>
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
                            <h3 className="exit-modal-title vyom-serif">{t("story.leaveAssessment")}</h3>
                            <p className="exit-modal-text">
                                {t("story.leaveWarning")}
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    {t("story.continueTest")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    {t("story.leaveTest")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
