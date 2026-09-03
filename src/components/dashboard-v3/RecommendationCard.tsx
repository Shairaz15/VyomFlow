import type { RecommendationViewModel } from '../../services/dashboardViewModel';

interface Props {
    recommendation: RecommendationViewModel;
    onOpenReport: () => void;
}

export function RecommendationCard({ recommendation, onOpenReport }: Props) {
    return (
        <div className={`dv2-card dv2-rec-card urgency-${recommendation.urgency}`}>
            <h3 className="dv2-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {recommendation.icon} Next Steps
            </h3>

            <p style={{ margin: '0 0 0', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                {recommendation.text}
            </p>

            <div className="dv2-rec-actions">
                <button className="dv2-rec-btn-primary" onClick={onOpenReport}>
                    📋 Download Clinician Report
                </button>
                <a href="/tests" className="dv2-rec-btn-secondary">
                    🧪 Take Assessment
                </a>
            </div>
        </div>
    );
}
