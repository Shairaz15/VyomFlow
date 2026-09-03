import type { ExplainabilityViewModel } from '../../services/dashboardViewModel';

interface Props {
    explainability: ExplainabilityViewModel;
}

export function ExplainabilitySection({ explainability }: Props) {
    const hasFactors = explainability.positive.length > 0 || explainability.negative.length > 0;

    return (
        <div className="dv2-card dv2-animate-in">
            <h3 className="dv2-section-title">What's Contributing to Your Results</h3>

            {!hasFactors ? (
                <p style={{ color: 'var(--dv2-muted)', fontSize: '0.875rem' }}>
                    Complete more assessments for detailed insights into the factors influencing your cognitive profile.
                </p>
            ) : (
                <div className="dv2-split">
                    {/* Positive Factors */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16a34a', marginBottom: '0.625rem' }}>
                            Positive Factors
                        </div>
                        {explainability.positive.map((item, i) => (
                            <div key={i} className="dv2-explain-item">
                                <span className="dv2-explain-icon" style={{ color: '#16a34a' }}>✓</span>
                                <span>{item.description}</span>
                            </div>
                        ))}
                    </div>

                    {/* Areas to Watch */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ea580c', marginBottom: '0.625rem' }}>
                            Areas to Watch
                        </div>
                        {explainability.negative.map((item, i) => (
                            <div key={i} className="dv2-explain-item">
                                <span className="dv2-explain-icon" style={{ color: '#ea580c' }}>↓</span>
                                <span>{item.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
