import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JourneyNodeInfo } from '../../hooks/useJourneyState';
import { Button, Icon } from '../common';
import { useLanguage } from '../../i18n/LanguageContext';
import './ActivityIntroModal.css';

interface ActivityIntroModalProps {
    node: JourneyNodeInfo | null;
    isCompleted: boolean;
    onClose: () => void;
}

export function ActivityIntroModal({ node, isCompleted, onClose }: ActivityIntroModalProps) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isPracticeMode, setIsPracticeMode] = useState(false);

    if (!node) return null;

    const handleStartAssessment = () => {
        onClose();
        navigate(node.route);
    };

    const handleStartPractice = () => {
        setIsPracticeMode(true);
    };

    return (
        <div className="activity-modal-overlay animate-fadeIn" onClick={onClose}>
            <div
                className="activity-modal-card animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-activity-title"
            >
                {/* Modal Header with Biome Background */}
                <div
                    className="modal-header-biome"
                    style={{ background: node.biome.bgGradient }}
                >
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close activity details"
                    >
                        ✕
                    </button>
                    <div className="modal-biome-icon-wrapper">{node.biome.icon}</div>
                    <span className="modal-biome-name">{node.biome.name}</span>
                    <h2 id="modal-activity-title" className="modal-activity-title">
                        {node.title}
                    </h2>
                    <p className="modal-canonical-title">{node.canonicalTitle}</p>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {/* Duration Badge */}
                    <div className="modal-duration-tag">
                        <Icon name="clock" size={16} />
                        <span>{t("journey.estimatedDuration", { duration: node.duration })}</span>
                    </div>

                    {/* User-facing prompt */}
                    <blockquote className="modal-user-prompt">
                        "{node.userPrompt}"
                    </blockquote>

                    {/* Description */}
                    <p className="modal-description">{node.description}</p>

                    {/* Completion tag if completed */}
                    {isCompleted && (
                        <div className="modal-completed-notice">
                            <span className="notice-icon">✓</span>
                            <span>{t("journey.completedToday")}</span>
                        </div>
                    )}

                    {/* Practice Mode Information if selected */}
                    {isPracticeMode ? (
                        <div className="modal-practice-box animate-fadeIn">
                            <div className="practice-box-header">
                                <Icon name="info" size={18} />
                                <h4>{t("journey.practiceActive")}</h4>
                            </div>
                            <p>
                                Practice — not part of today's assessment. Practice trials let you get comfortable with the task controls. Results will not be recorded in your cognitive history.
                            </p>
                            <div className="modal-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsPracticeMode(false)}
                                >
                                    {t("journey.cancelPractice")}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleStartAssessment}
                                >
                                    {t("journey.startPractice")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Standard Action Buttons */
                        <div className="modal-actions">
                            {node.hasPractice && (
                                <Button
                                    variant="secondary"
                                    onClick={handleStartPractice}
                                    className="practice-btn"
                                >
                                    <Icon name="play" size={16} />
                                    {t("journey.startPractice")}
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleStartAssessment}
                                className="start-btn"
                            >
                                {isCompleted ? t("navigation.retakeTest") : t("journey.startActivity")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
