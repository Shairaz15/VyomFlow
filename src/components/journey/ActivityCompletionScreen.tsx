import { JOURNEY_NODES, type ActivityId } from '../../hooks/useJourneyState';
import { Button, Icon } from '../common';
import { useLanguage } from '../../i18n/LanguageContext';
import './ActivityCompletionScreen.css';

interface ActivityCompletionScreenProps {
    completedActivityId: ActivityId;
    onContinue: () => void;
}

export function ActivityCompletionScreen({
    completedActivityId,
    onContinue,
}: ActivityCompletionScreenProps) {
    const { t } = useLanguage();
    const completedNode = JOURNEY_NODES.find((n) => n.id === completedActivityId);
    const nextNode = JOURNEY_NODES.find((n) => n.order === (completedNode ? completedNode.order + 1 : 1));

    return (
        <div className="completion-overlay animate-fadeIn">
            <div className="completion-modal-card animate-scaleUp">
                <div className="completion-icon-wrapper animate-bounce">
                    <span className="check-badge">✓</span>
                </div>

                <h2 className="completion-title">{t("journey.stopComplete")}</h2>
                <p className="completion-subtitle">
                    {t("journey.niceWork", { title: completedNode?.title || 'this activity' })}
                </p>

                {nextNode ? (
                    <div className="next-activity-preview">
                        <span className="next-label">{t("journey.upNext")}</span>
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
                        {t("journey.allActivitiesFinished")}
                    </div>
                )}

                <div className="completion-actions">
                    <Button variant="primary" onClick={onContinue} className="w-full continue-btn">
                        {t("journey.continueJourney")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
