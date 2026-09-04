import { Link } from 'react-router-dom';
import type { AIPredictionViewModel } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { Check, Zap, Target, Brain, BookOpen, MessageSquareQuote, Layers, Compass, Activity } from 'lucide-react';

interface Props {
    prediction: AIPredictionViewModel;
    isExpandedBattery?: boolean;
}

function getModuleIcon(key: string, size = 13) {
    switch (key) {
        case 'reaction':
            return <Zap size={size} />;
        case 'attention':
            return <Target size={size} />;
        case 'vmra':
        case 'memory':
            return <Brain size={size} />;
        case 'story':
            return <BookOpen size={size} />;
        case 'language':
            return <MessageSquareQuote size={size} />;
        case 'pattern':
            return <Layers size={size} />;
        case 'navigation':
            return <Compass size={size} />;
        default:
            return <Activity size={size} />;
    }
}

const ALL_7_MODULES = [
    { key: 'reaction', name: 'Reaction Time', match: ['Reaction Time', 'Reaction Time & SAVT'] },
    { key: 'vmra', name: 'Visual Memory', match: ['Visual Memory (VMRA)', 'Visual Memory'] },
    { key: 'pattern', name: 'Pattern Memory', match: ['Pattern Working Memory', 'Pattern Memory'] },
    { key: 'language', name: 'Language & Speech', match: ['Language & Speech'] },
    { key: 'story', name: 'Story Recall', match: ['Story Recall'] },
    { key: 'attention', name: 'Sustained Attention', match: ['Sustained Attention', 'Attention'] },
    { key: 'navigation', name: 'Video Navigation', match: ['Video Navigation'] },
];

const BASELINE_4_MODULES = ALL_7_MODULES.slice(0, 4);

export function AIPredictionCard({ prediction, isExpandedBattery }: Props) {
    const { t } = useLanguage();
    const isExpanded = isExpandedBattery ?? (
        prediction.predictedStatus === 'MCI' ||
        prediction.predictedStatus === 'Dementia' ||
        (prediction.completedModules?.length ?? 0) > 4
    );
    const activeTargetModules = isExpanded ? ALL_7_MODULES : BASELINE_4_MODULES;
    const requiredCount = activeTargetModules.length;

    const completedList = prediction.completedModules || [];
    const completedCount = activeTargetModules.filter(mod =>
        completedList.some(c => mod.match.some(m => c.toLowerCase().includes(m.toLowerCase())))
    ).length;
    const isFullBatteryCompleted = completedCount >= requiredCount;

    // ─── If full required battery is NOT yet completed ─────────────
    if (!isFullBatteryCompleted) {
        const remainingCount = Math.max(0, requiredCount - completedCount);
        const progressPercent = Math.round((completedCount / requiredCount) * 100);

        return (
            <div className="dv2-card dv2-animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 className="dv2-section-title" style={{ margin: 0 }}>AI Cognitive Assessment</h3>
                    <span className="dv2-ai-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)', fontSize: '0.8125rem', fontWeight: 700 }}>
                        ✦ {isExpanded ? '7-Module Diagnostic Battery Required' : '4-Module Baseline Battery'} ({completedCount}/{requiredCount})
                    </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--dv2-muted)', margin: '0 0 1.25rem', lineHeight: '1.55' }}>
                    {isExpanded
                        ? 'To provide a clinically validated diagnostic evaluation and Estimated MoCA score, the Multi-Task AI model requires all 7 digital biomarker assessments to be completed in a full session.'
                        : 'To provide a clinically validated screening evaluation and Estimated MoCA score, the Multi-Task AI model requires all 4 baseline biomarker assessments (Reaction Time, Visual Memory, Pattern Memory, Language & Speech) to be completed.'}
                </p>

                {/* Battery Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dv2-text)', marginBottom: '0.45rem' }}>
                        <span>Session Battery Progress</span>
                        <span>{completedCount} of {requiredCount} Completed ({progressPercent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '9px', background: 'rgba(51, 65, 85, 0.25)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #4ade80, #38bdf8)',
                                borderRadius: '999px',
                                transition: 'width 0.5s ease',
                            }}
                        />
                    </div>
                </div>

                {/* Modules Status Checklist */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                }}>
                    {activeTargetModules.map(mod => {
                        const isDone = completedList.some(c => mod.match.some(m => c.toLowerCase().includes(m.toLowerCase())));
                        return (
                            <div
                                key={mod.key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.5rem 0.65rem',
                                    borderRadius: '8px',
                                    background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.15)',
                                    border: isDone ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--dv2-card-border)',
                                    fontSize: '0.8125rem',
                                    color: isDone ? '#10b981' : 'var(--dv2-muted)',
                                    fontWeight: isDone ? 650 : 500,
                                }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {isDone ? <Check size={13} style={{ color: '#10b981' }} /> : getModuleIcon(mod.key, 13)}
                                </span>
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
                            padding: '0.6rem 1.15rem',
                            fontSize: '0.875rem',
                            fontWeight: 650,
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

    // ─── If Required Battery IS Completed ─────────────────────
    const probBars = [
        { label: 'Normal', value: prediction.probabilities.normal, color: '#4ade80' },
        { label: 'MCI', value: prediction.probabilities.mci, color: '#fbbf24' },
        { label: 'Dementia', value: prediction.probabilities.dementia, color: '#ef4444' },
    ];

    return (
        <div className="dv2-card dv2-animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="dv2-section-title" style={{ margin: 0 }}>AI Cognitive Assessment</h3>
                <span className="dv2-ai-badge">✦ AI Verified ({requiredCount}/{requiredCount} {isExpanded ? 'Diagnostic Battery' : 'Baseline Battery'})</span>
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
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dv2-muted)' }}>Estimated MoCA Score</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dv2-text)', marginTop: '0.15rem' }}>
                        {prediction.estimatedMoCA.toFixed(1)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--dv2-muted)' }}>/ 30</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--dv2-muted)', marginTop: '0.15rem' }}>95% CI: ±{prediction.mocaCI.toFixed(1)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)', marginTop: '2px' }}>
                        ({t("mixed.mocaExplanation")})
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dv2-muted)' }}>{t("mixed.riskLevel")}</div>
                    <div style={{ marginTop: '0.35rem' }}>
                        <span className={`dv2-status-badge ${prediction.riskLevel === 'Low' ? 'green' : prediction.riskLevel === 'Moderate' ? 'yellow' : 'red'}`} style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                            {prediction.riskLevel} ({Math.round(prediction.riskScore * 100)}%)
                        </span>
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dv2-muted)' }}>Model Confidence</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dv2-text)', marginTop: '0.15rem' }}>{Math.round(prediction.modelConfidence)}%</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--dv2-muted)' }}>Battery Coverage</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dv2-text)', marginTop: '0.15rem' }}>
                        {completedCount}/{requiredCount} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--dv2-muted)' }}>modules</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
