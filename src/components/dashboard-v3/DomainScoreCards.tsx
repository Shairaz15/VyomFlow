import type { DomainScoreViewModel } from '../../services/dashboardViewModel';
import { Brain, MessageSquareQuote, Layers, Zap, Compass, Target, Activity } from 'lucide-react';

interface Props {
    domains: DomainScoreViewModel[];
}

const DOMAIN_COLORS: Record<string, string> = {
    memory: '#f43f5e',
    language: '#a855f7',
    executive: '#38bdf8',
    processingSpeed: '#f59e0b',
    spatialOrientation: '#14b8a6',
    attention: '#10b981',
};

function getDomainIcon(key: string, size = 28) {
    switch (key) {
        case 'memory':
            return <Brain size={size} />;
        case 'language':
            return <MessageSquareQuote size={size} />;
        case 'executive':
            return <Layers size={size} />;
        case 'processingSpeed':
            return <Zap size={size} />;
        case 'spatialOrientation':
            return <Compass size={size} />;
        case 'attention':
            return <Target size={size} />;
        default:
            return <Activity size={size} />;
    }
}

export function DomainScoreCards({ domains }: Props) {
    if (domains.length === 0) return null;

    return (
        <div>
            <h3 className="dv2-section-title" style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}>
                6 Cognitive Domains
            </h3>
            <div className="dv2-grid-6">
                {domains.map(d => {
                    const iconColor = DOMAIN_COLORS[d.key] || 'var(--dv2-teal)';
                    return (
                        <div
                            key={d.key}
                            className={`dv2-card dv2-domain-card trend-${d.trend}`}
                        >
                            <div className="dv2-domain-icon" style={{ color: iconColor }}>
                                {getDomainIcon(d.key, 28)}
                            </div>
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
                    );
                })}
            </div>
        </div>
    );
}
