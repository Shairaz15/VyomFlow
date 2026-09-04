import { Button, Card, Icon, TutorialVideoPlaceholder } from "../../../common";
import { useLanguage } from "../../../../i18n/LanguageContext";

interface InstructionsPhaseProps {
    onStart: () => void;
}

export function InstructionsPhase({ onStart }: InstructionsPhaseProps) {
    const { t } = useLanguage();

    const steps = [
        {
            num: "1",
            title: t("navigation.step1Title"),
            description: t("navigation.step1Desc"),
        },
        {
            num: "2",
            title: t("navigation.step2Title"),
            description: t("navigation.step2Desc"),
        },
        {
            num: "3",
            title: t("navigation.step3Title"),
            description: t("navigation.step3Desc"),
        },
        {
            num: "4",
            title: t("navigation.step4Title"),
            description: t("navigation.step4Desc"),
        },
    ];

    return (
        <div className="instructions-with-tutorial-layout animate-fadeIn">
            <Card className="instructions-card nav-intro-card">
                <div className="instructions-content">
                    <div className="instructions-icon-wrapper" aria-hidden="true">
                        <Icon name="navigation" size={28} />
                    </div>
                    <h2 className="instructions-card-title vyom-serif">{t("navigation.howItWorks")}</h2>

                    <ol className="instructions-step-list">
                        {steps.map((step) => (
                            <li key={step.num} className="instruction-step-item">
                                <div className="step-num-bubble">{step.num}</div>
                                <div className="step-content">
                                    <strong>{step.title}</strong>
                                    <span> {step.description}</span>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className="instructions-action-row">
                        <Button
                            variant="primary"
                            className="story-primary-start-btn"
                            onClick={onStart}
                        >
                            {t("navigation.startAssessment")}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Multilingual Tutorial Video */}
            <TutorialVideoPlaceholder module="navigation" />
        </div>
    );
}
