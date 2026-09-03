import type { RecommendationViewModel } from '../../services/dashboardViewModel';

interface Props {
    recommendation: RecommendationViewModel;
    onOpenReport: () => void;
}

export function RecommendationCard({ recommendation, onOpenReport }: Props) {
    return (
        <div className={`dv2-card dv2-rec-card urgency-${recommendation.urgency}`}>
            <h3 className="dv2-section-title" style={{ margin: '0 0 0.5rem' }}>
                Next Clinical Steps
            </h3>

            <p style={{ margin: '0 0 1rem', fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--dv2-text)' }}>
                {recommendation.text}
            </p>

            <div className="dv2-rec-actions">
                <button className="dv2-rec-btn-primary" onClick={onOpenReport}>
                    Download Clinician Report
                </button>
                <a href="/tests" className="dv2-rec-btn-secondary">
                    Start Assessment
                </a>
            </div>
        </div>
    );
}
