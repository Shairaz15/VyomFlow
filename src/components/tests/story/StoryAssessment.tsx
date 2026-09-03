import { useState } from "react";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon } from "../../common";
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
    const { saveResult } = useStoryResults();

    const [phase, setPhase] = useState<Phase>("instructions");
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en-IN");
    const [story, setStory] = useState<Story>(STORIES[0]);
    const [comprehensionResponses, setComprehensionResponses] = useState<ComprehensionResponse[]>([]);
    const [assessmentResult, setAssessmentResult] = useState<StoryAssessmentResult | null>(null);

    // 1. Language Selection
    const handleSelectLanguage = (lang: SupportedLanguage) => {
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
                {/* Header */}
                <div className="story-header animate-fadeInUp">
                    <h1>Story Narration Recall Assessment</h1>
                    <p className="text-secondary">
                        Evaluates episodic memory, auditory comprehension, delayed recall, and narrative organization.
                    </p>
                </div>

                {/* Phase 1: Instructions */}
                {phase === "instructions" && (
                    <Card className="instructions-card animate-fadeIn">
                        <div className="instructions-content">
                            <div className="instructions-icon">
                                <Icon name="story" size={48} animated />
                            </div>
                            <h3>Assessment Steps</h3>
                            <ul className="instructions-list">
                                <li><strong>1. Select Language:</strong> Choose your preferred narration language.</li>
                                <li><strong>2. Listen to Narration:</strong> Hear a short story narrated via Sarvam AI (Audio only, played <strong>ONCE</strong>).</li>
                                <li><strong>3. Comprehension Quiz:</strong> Answer 4 quick multiple-choice questions about the story.</li>
                                <li><strong>4. Spoken Recall:</strong> Retell the story in your own words (30–60 seconds).</li>
                            </ul>
                            <Button variant="primary" className="start-btn" onClick={() => setPhase("language_select")}>
                                Start Assessment
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Phase 2: Language Selection */}
                {phase === "language_select" && (
                    <Card className="language-select-card animate-fadeIn">
                        <h3>Select Narration Language</h3>
                        <p className="select-desc">The story will be narrated in your chosen Indian language.</p>
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

                {/* Phase 6: Spoken Story Recall */}
                {phase === "recall" && (
                    <StoryRecorder
                        onComplete={handleRecallComplete}
                    />
                )}

                {/* Phase 7: Processing */}
                {phase === "processing" && (
                    <Card className="processing-card animate-fadeIn">
                        <div className="processing-body">
                            <div className="spinner" />
                            <h3>Analyzing Narrative Biomarkers...</h3>
                            <p>Transcribing recall, calculating Information Unit alignment, and computing your Story Recall Profile.</p>
                        </div>
                    </Card>
                )}

                {/* Phase 8: Results Screen */}
                {phase === "results" && assessmentResult && (
                    <StoryResults
                        result={assessmentResult}
                        onRetake={handleRetake}
                    />
                )}
            </div>
        </PageWrapper>
    );
}
