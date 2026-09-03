import { JOURNEY_NODES, type ActivityId } from '../../hooks/useJourneyState';
import { Button, Icon } from '../common';
import './ActivityCompletionScreen.css';

interface ActivityCompletionScreenProps {
    completedActivityId: ActivityId;
    onContinue: () => void;
}

export function ActivityCompletionScreen({
    completedActivityId,
    onContinue,
}: ActivityCompletionScreenProps) {
    const completedNode = JOURNEY_NODES.find((n) => n.id === completedActivityId);
    const nextNode = JOURNEY_NODES.find((n) => n.order === (completedNode ? completedNode.order + 1 : 1));

    return (
        <div className="completion-overlay animate-fadeIn">
            <div className="completion-modal-card animate-scaleUp">
                <div className="completion-icon-wrapper animate-bounce">
                    <span className="check-badge">✓</span>
                </div>

                <h2 className="completion-title">Stop complete</h2>
                <p className="completion-subtitle">
                    Nice work on <strong>{completedNode?.title || 'this activity'}</strong>. Your journey continues.
                </p>

                {nextNode ? (
                    <div className="next-activity-preview">
                        <span className="next-label">UP NEXT</span>
                        <div className="next-card">
                            <span className="next-icon">{nextNode.biome.icon}</span>
                            <div className="next-details">
                                <h3 className="next-title">{nextNode.title}</h3>
                                <p className="next-meta">
                                    <Icon name="clock" size={12} />
                                    {nextNode.duration} • {nextNode.canonicalTitle}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="all-completed-note">
                        🌟 You've finished all 7 activities in today's journey sequence!
                    </div>
                )}

                <div className="completion-actions">
                    <Button variant="primary" onClick={onContinue} className="w-full continue-btn">
                        Continue journey
                    </Button>
                </div>
            </div>
        </div>
    );
}
