import { Link } from 'react-router-dom';
import type { AIPredictionViewModel } from '../../services/dashboardViewModel';

interface Props {
    prediction: AIPredictionViewModel;
}

const ALL_7_MODULES = [
    { key: 'vmra', name: 'Visual Memory', icon: '🧠', match: ['Visual Memory (VMRA)', 'Visual Memory'] },
    { key: 'story', name: 'Story Recall', icon: '📖', match: ['Story Recall'] },
    { key: 'language', name: 'Language & Speech', icon: '🗣️', match: ['Language & Speech'] },
    { key: 'pattern', name: 'Pattern Memory', icon: '🧩', match: ['Pattern Working Memory', 'Pattern Memory'] },
    { key: 'reaction', name: 'Reaction Time', icon: '⚡', match: ['Reaction Time', 'Reaction Time & SAVT'] },
    { key: 'attention', name: 'Sustained Attention', icon: '🎯', match: ['Sustained Attention', 'Attention'] },
    { key: 'navigation', name: 'Video Navigation', icon: '🗺️', match: ['Video Navigation'] },
];

export function AIPredictionCard({ prediction }: Props) {
    const completedList = prediction.completedModules || [];
    const completedCount = completedList.length;
    const isFullBatteryCompleted = completedCount >= 7;

    // ─── If full 7-module battery is NOT yet completed ─────────────
    if (!isFullBatteryCompleted) {
        const remainingCount = Math.max(0, 7 - completedCount);
        const progressPercent = Math.round((completedCount / 7) * 100);

        return (
            <div className="dv2-card dv2-animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 className="dv2-section-title" style={{ margin: 0 }}>AI Cognitive Assessment</h3>
                    <span className="dv2-ai-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        ✦ 7-Module Battery Required ({completedCount}/7)
                    </span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--dv2-muted)', margin: '0 0 1.25rem', lineHeight: '1.5' }}>
                    To provide a clinically validated diagnostic evaluation and Estimated MoCA score, the Multi-Task AI model requires all <strong>7 digital biomarker assessments</strong> to be completed in a full session.
                </p>

                {/* Battery Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                        <span>Session Battery Progress</span>
                        <span>{completedCount} of 7 Completed ({progressPercent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(51, 65, 85, 0.5)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                                borderRadius: '999px',
                                transition: 'width 0.4s ease',
                            }}
                        />
                    </div>
                </div>

                {/* 7 Modules Status Checklist */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                }}>
                    {ALL_7_MODULES.map(mod => {
                        const isDone = completedList.some(c => mod.match.some(m => c.toLowerCase().includes(m.toLowerCase())));
                        return (
                            <div
                                key={mod.key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.45rem 0.6rem',
                                    borderRadius: '8px',
                                    background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                                    border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(51, 65, 85, 0.4)',
                                    fontSize: '0.75rem',
                                    color: isDone ? '#34d399' : '#94a3b8',
                                    fontWeight: isDone ? 600 : 400,
                                }}
                            >
                                <span>{isDone ? '✓' : mod.icon}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {mod.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <Link
                        to="/tests"
                        className="dv2-cta-btn"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8125rem',
                            textDecoration: 'none',
                        }}
                    >
                        <span>Take Remaining Assessments ({remainingCount} Left)</span>
                        <span>➔</span>
                    </Link>
                </div>
            </div>
        );
    }

    // ─── If Full 7-Module Battery IS Completed ─────────────────────
    const probBars = [
        { label: 'Normal', value: prediction.probabilities.normal, color: '#4ade80' },
        { label: 'MCI', value: prediction.probabilities.mci, color: '#fbbf24' },
        { label: 'Dementia', value: prediction.probabilities.dementia, color: '#ef4444' },
    ];

    return (
        <div className="dv2-card dv2-animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="dv2-section-title" style={{ margin: 0 }}>AI Cognitive Assessment</h3>
                <span className="dv2-ai-badge">✦ AI Verified (7/7 Battery)</span>
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
                        {prediction.completedModules.length}/7 <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>modules</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

