import type { AssessmentModuleViewModel } from '../../services/dashboardViewModel';

interface Props {
    modules: AssessmentModuleViewModel[];
}

export function AssessmentModuleCards({ modules }: Props) {
    if (!modules || modules.length === 0) return null;

    const completedCount = modules.filter(m => m.isCompleted).length;
    const totalCount = modules.length;

    return (
        <div style={{ marginTop: '1.75rem' }}>
            {/* Minimalist Section Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
            }}>
                <h3 className="dv2-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                    Assessment Modules
                </h3>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--dv2-muted)',
                    fontFamily: 'monospace',
                }}>
                    {completedCount} / {totalCount} completed
                </span>
            </div>

            {/* Seamless List Container using standard dv2-card */}
            <div className="dv2-card dv2-animate-in" style={{ padding: '0.25rem 0', overflow: 'hidden' }}>
                {modules.map((mod, idx) => {
                    const isLast = idx === modules.length - 1;

                    return (
                        <div
                            key={mod.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                padding: '0.85rem 1rem',
                                borderBottom: isLast ? 'none' : '1px solid var(--dv2-card-border)',
                                transition: 'background 0.15s ease',
                                gap: '0.75rem',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {/* Left: Icon, Name, and Domain Tag */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                minWidth: '180px',
                                flex: '1 1 180px',
                            }}>
                                <span style={{
                                    fontSize: '1.25rem',
                                    lineHeight: 1,
                                    opacity: mod.isCompleted ? 1 : 0.5,
                                    flexShrink: 0,
                                }}>
                                    {mod.icon}
                                </span>

                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'var(--dv2-text)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {mod.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.6875rem',
                                        color: 'var(--dv2-muted)',
                                        marginTop: '0.1rem',
                                    }}>
                                        {mod.domainName} • {mod.estimatedDuration}
                                    </div>
                                </div>
                            </div>

                            {/* Middle & Right: Score, Status & Action Button Container */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '0.85rem',
                                flexShrink: 0,
                                marginLeft: 'auto',
                            }}>
                                {/* Score & Status */}
                                <div style={{
                                    textAlign: 'right',
                                }}>
                                    {mod.isCompleted ? (
                                        <>
                                            <div style={{
                                                fontSize: '0.9375rem',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: 'var(--dv2-text)',
                                            }}>
                                                {mod.score}
                                                <span style={{
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 400,
                                                    color: 'var(--dv2-muted)',
                                                    marginLeft: '0.25rem',
                                                }}>
                                                    {mod.key === 'reaction' ? 'ms' : `/ ${mod.maxScore}`}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.6875rem',
                                                color: 'var(--dv2-muted)',
                                                marginTop: '0.05rem',
                                            }}>
                                                {mod.sessionCount} sess • {mod.lastCompletedDate}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--dv2-muted)',
                                        }}>
                                            Not taken
                                        </div>
                                    )}
                                </div>

                            {/* Right: Action Button matched with dashboard theme */}
                            <div style={{ flexShrink: 0 }}>
                                <a
                                    href={mod.route}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '8px',
                                        transition: 'all 0.15s ease',
                                        background: mod.isCompleted ? 'transparent' : 'rgba(79, 124, 120, 0.15)',
                                        color: mod.isCompleted ? 'var(--dv2-muted)' : 'var(--dv2-teal)',
                                        border: `1px solid ${mod.isCompleted ? 'var(--dv2-card-border)' : 'var(--dv2-teal)'}`,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--dv2-teal)';
                                        e.currentTarget.style.color = '#ffffff';
                                        e.currentTarget.style.borderColor = 'var(--dv2-teal)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = mod.isCompleted ? 'transparent' : 'rgba(79, 124, 120, 0.15)';
                                        e.currentTarget.style.color = mod.isCompleted ? 'var(--dv2-muted)' : 'var(--dv2-teal)';
                                        e.currentTarget.style.borderColor = mod.isCompleted ? 'var(--dv2-card-border)' : 'var(--dv2-teal)';
                                    }}
                                >
                                    {mod.isCompleted ? 'Retake' : 'Start'}
                                </a>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
}

export default AssessmentModuleCards;
