import type { ChangesViewModel } from '../../services/dashboardViewModel';

interface Props {
    changes: ChangesViewModel;
}

export function ChangesSinceLastVisit({ changes }: Props) {
    const hasAny = changes.improved.length > 0 || changes.declined.length > 0;

    return (
        <div className="dv2-card dv2-animate-in">
            <h3 className="dv2-section-title">Changes Since Previous Visit</h3>

            {!hasAny ? (
                <p style={{ color: 'var(--dv2-muted)', fontSize: '0.875rem' }}>
                    {changes.stable.length > 0
                        ? 'All domains are stable — no significant changes detected.'
                        : 'First assessment — no comparison available yet.'}
                </p>
            ) : (
                <div className="dv2-split">
                    {/* Improved */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16a34a', marginBottom: '0.5rem' }}>
                            Improved
                        </div>
                        {changes.improved.length === 0 ? (
                            <p style={{ color: 'var(--dv2-muted)', fontSize: '0.8125rem' }}>No improvements</p>
                        ) : (
                            changes.improved.map(item => (
                                <div key={item.domain} className="dv2-explain-item">
                                    <span className="dv2-explain-icon" style={{ color: '#16a34a' }}>✓</span>
                                    <span>{item.domain} <strong style={{ color: '#16a34a' }}>+{item.delta}</strong></span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Declined */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ea580c', marginBottom: '0.5rem' }}>
                            Declined
                        </div>
                        {changes.declined.length === 0 ? (
                            <p style={{ color: 'var(--dv2-muted)', fontSize: '0.8125rem' }}>No declines</p>
                        ) : (
                            changes.declined.map(item => (
                                <div key={item.domain} className="dv2-explain-item">
                                    <span className="dv2-explain-icon" style={{ color: '#ea580c' }}>↓</span>
                                    <span>{item.domain} <strong style={{ color: '#ea580c' }}>{item.delta}</strong></span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
