import type { OverviewViewModel } from '../../services/dashboardViewModel';

interface Props {
    overview: OverviewViewModel;
}

export function HeroSummary({ overview }: Props) {
    return (
        <div className="dv2-card dv2-animate-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{overview.statusEmoji}</span>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h2 className="dv2-serif" style={{ margin: 0, fontSize: '1.5rem' }}>
                            Overall Cognitive Status
                        </h2>
                        <span className={`dv2-status-badge ${overview.statusColor}`}>
                            {overview.cognitiveStatus}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="dv2-confidence-ring">
                            Confidence: {overview.confidence}%
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--dv2-muted)' }}>
                            Last Assessment: {overview.lastAssessmentDate}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--dv2-card-border)', paddingTop: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem' }}>
                    <strong>Compared to last visit:</strong> {overview.comparisonSummary}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--dv2-muted)', fontStyle: 'italic' }}>
                    {overview.recommendation}
                </p>
            </div>
        </div>
    );
}
