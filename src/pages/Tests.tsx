import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Icon, GoogleSignInButton } from "../components/common";
import type { IconName } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { PageWrapper } from "../components/layout";
import "./Tests.css";

type TestType = "memory" | "reaction" | "pattern" | "language" | "attention" | "story" | "navigation";

interface TestInfo {
    id: TestType;
    title: string;
    description: string;
    iconName: IconName;
    duration: string;
}

export function Tests() {
    const navigate = useNavigate();
    const [selectedTest, setSelectedTest] = useState<TestType | null>(null);
    const { isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();

    const TESTS: TestInfo[] = [
        {
            id: "story",
            title: "Story Narration Recall",
            description: "Listen to a narrated story in your language and retell it to assess episodic memory, listening comprehension, and narrative flow.",
            iconName: "story",
            duration: "5 min",
        },
        {
            id: "memory",
            title: t('tests.visualMemory'),
            description: t('tests.visualMemoryDesc'),
            iconName: "memory",
            duration: t('landing.duration', { min: '2' }),
        },
        {
            id: "reaction",
            title: t('tests.reactionTime'),
            description: t('tests.reactionTimeDesc'),
            iconName: "reaction",
            duration: t('landing.duration', { min: '1' }),
        },
        {
            id: "pattern",
            title: t('tests.patternRecognition'),
            description: t('tests.patternRecognitionDesc'),
            iconName: "pattern",
            duration: t('landing.duration', { min: '2' }),
        },
        {
            id: "language",
            title: t('tests.languageTask'),
            description: t('tests.languageTaskDesc'),
            iconName: "language",
            duration: t('landing.duration', { min: '2' }),
        },
        {
            id: "attention",
            title: t('tests.sustainedAttention'),
            description: t('tests.sustainedAttentionDesc'),
            iconName: "attention",
            duration: t('landing.duration', { min: '3' }),
        },
        {
            id: "navigation",
            title: "3D Spatial Navigation Assessment",
            description: "Navigate through 3D fictional neighborhood environments using MapLibre vector maps to evaluate visuospatial memory, executive planning, decision latency, and landmark recall.",
            iconName: "navigation",
            duration: "4 min",
        },
    ];

    const handleStartTest = (testId: TestType) => {
        if (testId === "pattern") {
            navigate(`/tests/pattern`);
        } else if (testId === "attention") {
            navigate(`/test/attention`);
        } else {
            navigate(`/test/${testId}`);
        }
    };

    return (
        <PageWrapper>
            <div className="tests container">
                <div className="tests-header animate-fadeInUp">
                    <h1>{t('tests.title')}</h1>
                    <p className="text-secondary">
                        {t('tests.subtitle')}
                    </p>
                </div>

                {/* Google Sign-In Section */}
                <div className="tests-signin-card glass-card animate-fadeIn">
                    <div className="tests-signin-header">
                        <Icon name="privacy" size={20} />
                        <h3>{isAuthenticated ? t('tests.signedIn') : t('tests.saveProgress')}</h3>
                    </div>
                    {loading ? (
                        <p className="tests-signin-text">{t('tests.loading')}</p>
                    ) : isAuthenticated ? (
                        <p className="tests-signin-text">
                            {t('tests.progressSaved')}
                        </p>
                    ) : (
                        <>
                            <p className="tests-signin-text">
                                {t('tests.signInPrompt')}
                            </p>
                            <GoogleSignInButton />
                        </>
                    )}
                </div>

                <div className="tests-grid">
                    {TESTS.map((test, index) => (
                        <Card
                            key={test.id}
                            floating
                            className={`test-card animate-fadeInUp delay-${(index + 1) * 100} ${selectedTest === test.id ? "selected" : ""}`}
                            onClick={() => setSelectedTest(test.id)}
                            ariaLabel={`${test.title} test - ${test.description}. Duration: ${test.duration}`}
                        >
                            <div className="test-icon-wrapper">
                                <Icon name={test.iconName} size={36} animated />
                            </div>
                            <h3 className="test-title">{test.title}</h3>
                            <p className="test-description">{test.description}</p>
                            <div className="test-meta">
                                <span className="test-duration">
                                    <Icon name="clock" size={14} />
                                    {test.duration}
                                </span>
                            </div>
                            <Button
                                variant="secondary"
                                className="test-start-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartTest(test.id);
                                }}
                                aria-label={`${t('tests.startTest')} ${test.title}`}
                            >
                                {t('tests.startTest')}
                            </Button>
                        </Card>
                    ))}
                </div>

                <div className="tests-info glass-card animate-fadeIn delay-500">
                    <div className="tests-info-header">
                        <Icon name="info" size={20} />
                        <h3>{t('tests.guidelinesTitle')}</h3>
                    </div>
                    <ul>
                        <li>{t('tests.guideline1')}</li>
                        <li>{t('tests.guideline2')}</li>
                        <li>{t('tests.guideline3')}</li>
                        <li>{t('tests.guideline4')}</li>
                    </ul>
                </div>
            </div>
        </PageWrapper>
    );
}
