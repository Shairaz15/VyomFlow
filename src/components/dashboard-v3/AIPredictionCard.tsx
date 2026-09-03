import type { AIPredictionViewModel } from '../../services/dashboardViewModel';

interface Props {
    prediction: AIPredictionViewModel;
}

export function AIPredictionCard({ prediction }: Props) {
    const probBars = [
        { label: 'Normal', value: prediction.probabilities.normal, color: '#4ade80' },
        { label: 'MCI', value: prediction.probabilities.mci, color: '#fbbf24' },
        { label: 'Dementia', value: prediction.probabilities.dementia, color: '#ef4444' },
    ];

    return (
        <div className="dv2-card dv2-animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="dv2-section-title" style={{ margin: 0 }}>AI Cognitive Assessment</h3>
                <span className="dv2-ai-badge">✦ AI Estimated</span>
            </div>

            {/* Predicted Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    Predicted Status: {prediction.predictedStatus}
                </span>
                <span className={`dv2-status-badge ${prediction.predictedStatus === 'Normal' ? 'green' : prediction.predictedStatus === 'MCI' ? 'yellow' : 'red'}`} style={{ fontSize: '0.75rem' }}>
                    {Math.round(Math.max(prediction.probabilities.normal, prediction.probabilities.mci, prediction.probabilities.dementia) * 100)}%
                </span>
            </div>

            {/* Probability Bars */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--dv2-muted)', marginBottom: '0.625rem' }}>
                    Probability Distribution
                </div>
                {probBars.map(bar => (
                    <div className="dv2-prob-bar-container" key={bar.label}>
                        <span className="dv2-prob-label">{bar.label}</span>
                        <div className="dv2-prob-bar-track">
                            <div
                                className="dv2-prob-bar-fill"
                                style={{ width: `${Math.round(bar.value * 100)}%`, background: bar.color }}
                            />
                        </div>
                        <span className="dv2-prob-value">{Math.round(bar.value * 100)}%</span>
                    </div>
                ))}
            </div>

            {/* Key Metrics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--dv2-card-border)'
            }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)' }}>Estimated MoCA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {prediction.estimatedMoCA.toFixed(1)} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>/ 30</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--dv2-muted)' }}>95% CI: ±{prediction.mocaCI.toFixed(1)}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)' }}>Risk Score</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        <span className={`dv2-status-badge ${prediction.riskLevel === 'Low' ? 'green' : prediction.riskLevel === 'Moderate' ? 'yellow' : 'red'}`} style={{ fontSize: '0.75rem' }}>
                            {prediction.riskLevel} ({Math.round(prediction.riskScore * 100)}%)
                        </span>
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)' }}>Model Confidence</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Math.round(prediction.modelConfidence)}%</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)' }}>Battery Coverage</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {prediction.completedModules.length}/6 <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>modules</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
