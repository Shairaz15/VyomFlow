import type { ExplainabilityViewModel } from '../../services/dashboardViewModel';

interface Props {
    explainability: ExplainabilityViewModel;
}

export function ExplainabilitySection({ explainability }: Props) {
    const hasPositive = explainability.positive && explainability.positive.length > 0;
    const hasNegative = explainability.negative && explainability.negative.length > 0;
    const hasAny = hasPositive || hasNegative;

    if (!hasAny) return null;

    return (
        <div className="dv2-card dv2-animate-in" style={{ padding: '1.25rem 1.5rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <h3 className="dv2-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                    Contributing Biomarker Factors
                </h3>
                <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--dv2-muted)',
                    margin: '0.25rem 0 0',
                }}>
                    Key digital telemetry driving the multi-task clinical AI model's risk assessment.
                </p>
            </div>

            {/* 2-Column Minimal Split */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.25rem',
            }}>
                {/* Positive / Protective Factors Column */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--dv2-card-border)',
                        paddingBottom: '0.4rem',
                    }}>
                        <span style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#10b981',
                            }} />
                            Protective Strengths
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--dv2-muted)' }}>
                            {explainability.positive.length} factors
                        </span>
                    </div>

                    {hasPositive ? (
                        explainability.positive.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    background: 'rgba(16, 185, 129, 0.04)',
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                }}>
                                    <span style={{
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--dv2-text)',
                                    }}>
                                        {item.title}
                                    </span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.03em',
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                    }}>
                                        {item.factor}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--dv2-muted)',
                                    lineHeight: 1.35,
                                }}>
                                    {item.description}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px dashed var(--dv2-card-border)',
                            fontSize: '0.75rem',
                            color: 'var(--dv2-muted)',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '80px',
                        }}>
                            All evaluated features currently categorized for longitudinal observation.
                        </div>
                    )}
                </div>

                {/* Areas to Watch / Risk Factors Column */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--dv2-card-border)',
                        paddingBottom: '0.4rem',
                    }}>
                        <span style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#f97316',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#f97316',
                            }} />
                            Areas for Clinical Monitoring
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--dv2-muted)' }}>
                            {explainability.negative.length} factors
                        </span>
                    </div>

                    {hasNegative ? (
                        explainability.negative.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    background: 'rgba(249, 115, 22, 0.04)',
                                    border: '1px solid rgba(249, 115, 22, 0.15)',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                }}>
                                    <span style={{
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: 'var(--dv2-text)',
                                    }}>
                                        {item.title}
                                    </span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.03em',
                                        color: '#f97316',
                                        background: 'rgba(249, 115, 22, 0.12)',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                    }}>
                                        {item.factor}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--dv2-muted)',
                                    lineHeight: 1.35,
                                }}>
                                    {item.description}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px dashed var(--dv2-card-border)',
                            fontSize: '0.75rem',
                            color: 'var(--dv2-muted)',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '80px',
                        }}>
                            No active clinical risk flags detected across current assessments.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ExplainabilitySection;
