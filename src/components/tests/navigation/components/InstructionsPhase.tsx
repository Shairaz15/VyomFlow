import { Button, Card, Icon, TutorialVideoPlaceholder } from "../../../common";

interface InstructionsPhaseProps {
    onStart: () => void;
}

export function InstructionsPhase({ onStart }: InstructionsPhaseProps) {
    const steps = [
        {
            num: "1",
            title: "Route Observation",
            description: "Watch a first-person route video from Point A to Point B. Note turns, pathways, and visual landmarks.",
        },
        {
            num: "2",
            title: "Destination Recall",
            description: "Confirm your final destination with a quick multiple-choice recall question.",
        },
        {
            num: "3",
            title: "Reverse Navigation",
            description: "Navigate back from Point B to Point A. At each intersection, use arrow keys (↑, ←, →, ↓) or tap to turn.",
        },
        {
            num: "4",
            title: "Landmark Chronology",
            description: "Identify the landmarks seen along the route and arrange them in the sequence they appeared.",
        },
    ];

    return (
        <div className="instructions-with-tutorial-layout animate-fadeIn">
            <Card className="instructions-card nav-intro-card">
                <div className="instructions-content">
                    <div className="instructions-icon-wrapper" aria-hidden="true">
                        <Icon name="navigation" size={28} />
                    </div>
                    <h2 className="instructions-card-title vyom-serif">How this assessment works</h2>

                    <ol className="instructions-step-list">
                        {steps.map((step) => (
                            <li key={step.num} className="instruction-step-item">
                                <div className="step-num-bubble">{step.num}</div>
                                <div className="step-content">
                                    <strong>{step.title}:</strong>
                                    <span>{step.description}</span>
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
                            Start Assessment
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Tutorial Video Placeholder */}
            <TutorialVideoPlaceholder />
        </div>
    );
}
