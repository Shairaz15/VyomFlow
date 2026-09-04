import { useNavigate } from 'react-router-dom';
import { JOURNEY_NODES } from '../../hooks/useJourneyState';
import { SpecularButton } from '../common';
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
                    <SpecularButton
                        size="md"
                        radius={14}
                        tint="#4F7C78"
                        tintOpacity={0.96}
                        lineColor="#5EEAD4"
                        baseColor="#1e293b"
                        textColor="#FFFFFF"
                        intensity={1.25}
                        followMouse
                        autoAnimate
                        onClick={onClose}
                        className="action-btn"
                    >
                        {t("journey.returnToMap")}
                    </SpecularButton>
                    <SpecularButton
                        size="md"
                        radius={14}
                        tint="#1e293b"
                        tintOpacity={0.88}
                        lineColor="#38bdf8"
                        baseColor="#0f172a"
                        textColor="#FFFFFF"
                        intensity={1.1}
                        followMouse
                        onClick={() => navigate('/dashboard')}
                        className="action-btn"
                    >
                        {t("journey.viewHistoryInsights")} →
                    </SpecularButton>
                </div>
            </div>
        </div>
    );
}
