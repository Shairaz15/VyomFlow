import { useNavigate } from 'react-router-dom';
import { JOURNEY_NODES } from '../../hooks/useJourneyState';
import { Button } from '../common';
import { useLanguage } from '../../i18n/LanguageContext';
import './JourneyCompletion.css';

interface JourneyCompletionProps {
    onClose: () => void;
}

export function JourneyCompletion({ onClose }: JourneyCompletionProps) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="journey-complete-overlay animate-fadeIn">
            <div className="journey-complete-card animate-scaleUp">
                <div className="growth-bloom-header">
                    <div className="bloom-icons animate-pulse">
                        <span className="bloom-step">🌱</span>
                        <span className="bloom-arrow">→</span>
                        <span className="bloom-step">🌿</span>
                        <span className="bloom-arrow">→</span>
                        <span className="bloom-step bloom-active">🌸</span>
                    </div>
                    <h2 className="journey-complete-title">{t("journey.journeyCompleteTitle")}</h2>
                    <p className="journey-complete-subtitle">
                        {t("journey.journeyCompleteSubtitle")}
                    </p>
                </div>

                <div className="completed-nodes-grid">
                    {JOURNEY_NODES.map((node) => (
                        <div key={node.id} className="completed-node-item">
                            <span className="item-check">✓</span>
                            <span className="item-icon">{node.biome.icon}</span>
                            <span className="item-title">{node.title}</span>
                        </div>
                    ))}
                </div>

                <div className="growing-notice">
                    <p className="growing-text">{t("journey.journeyGrowing")}</p>
                    <p className="growing-subtext">
                        {t("journey.growingSubtext")}
                    </p>
                </div>

                <div className="journey-complete-actions">
                    <Button variant="primary" onClick={onClose} className="action-btn">
                        {t("journey.returnToMap")}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/dashboard')}
                        className="action-btn"
                    >
                        {t("journey.viewHistoryInsights")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
