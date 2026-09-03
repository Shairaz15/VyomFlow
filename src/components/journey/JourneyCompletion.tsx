import { useNavigate } from 'react-router-dom';
import { JOURNEY_NODES } from '../../hooks/useJourneyState';
import { Button } from '../common';
import './JourneyCompletion.css';

interface JourneyCompletionProps {
    onClose: () => void;
}

export function JourneyCompletion({ onClose }: JourneyCompletionProps) {
    const navigate = useNavigate();

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
                    <h2 className="journey-complete-title">🌳 Journey complete</h2>
                    <p className="journey-complete-subtitle">
                        You've completed today's journey sequence.
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
                    <p className="growing-text">Your journey is growing. 🌿</p>
                    <p className="growing-subtext">
                        Thank you for keeping up your cognitive tracking consistency.
                    </p>
                </div>

                <div className="journey-complete-actions">
                    <Button variant="primary" onClick={onClose} className="action-btn">
                        Return to Journey Map
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/dashboard')}
                        className="action-btn"
                    >
                        View History & Insights
                    </Button>
                </div>
            </div>
        </div>
    );
}
