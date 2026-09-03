import type { DomainScoreViewModel } from '../../services/dashboardViewModel';

interface Props {
    domains: DomainScoreViewModel[];
}

export function DomainScoreCards({ domains }: Props) {
    if (domains.length === 0) return null;

    return (
        <div>
            <h3 className="dv2-section-title">6 Cognitive Domains</h3>
            <div className="dv2-grid-6">
                {domains.map(d => (
                    <div
                        key={d.key}
                        className={`dv2-card dv2-domain-card trend-${d.trend}`}
                    >
                        <div className="dv2-domain-icon">{d.icon}</div>
                        <div className="dv2-domain-name">{d.name}</div>
                        <div className="dv2-domain-score">{d.score}</div>
                        <div className={`dv2-domain-delta dv2-delta-${d.trend}`}>
                            {d.trend === 'up' && '↑'}
                            {d.trend === 'down' && '↓'}
                            {d.trend === 'stable' && '→'}
                            {d.delta != null && d.delta !== 0 && (
                                <span>{d.delta > 0 ? `+${d.delta}` : d.delta}</span>
                            )}
                        </div>
                        <div className={`dv2-domain-label dv2-delta-${d.trend}`}>
                            {d.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
