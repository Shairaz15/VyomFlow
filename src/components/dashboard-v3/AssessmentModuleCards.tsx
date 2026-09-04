import type { AssessmentModuleViewModel } from '../../services/dashboardViewModel';
import { Zap, Target, Brain, BookOpen, MessageSquareQuote, Layers, Compass, Activity } from 'lucide-react';

interface Props {
    modules: AssessmentModuleViewModel[];
    isExpandedBattery?: boolean;
}

function getModuleIcon(key: string, size = 18) {
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

export function AssessmentModuleCards({ modules, isExpandedBattery }: Props) {
    if (!modules || modules.length === 0) return null;

    const completedCount = modules.filter(m => m.isCompleted).length;
    const totalCount = modules.length;
    const isExpanded = isExpandedBattery ?? totalCount > 4;

    return (
        <div style={{ marginTop: '1.75rem' }}>
            {/* Minimalist Section Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <h3 className="dv2-section-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                        Assessment Modules
                    </h3>
                    <span className={`module-battery-badge ${isExpanded ? 'expanded' : 'baseline'}`}>
                        {isExpanded ? 'Diagnostic Battery (7)' : 'Core Baseline (4)'}
                    </span>
                </div>
                <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
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
                    const accentColor = mod.accentColor || 'var(--dv2-teal, #0ea5e9)';

                    return (
                        <div
                            key={mod.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                padding: '0.9rem 1.15rem',
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
                            {/* Left: Icon Badge, Name, and Domain Tag */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.85rem',
                                minWidth: '180px',
                                flex: '1 1 180px',
                            }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: `${accentColor}18`,
                                    border: `1.5px solid ${accentColor}35`,
                                    color: accentColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                }}>
                                    {getModuleIcon(mod.key, 18)}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 650,
                                        color: 'var(--dv2-text)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {mod.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.8125rem',
                                        fontWeight: 500,
                                        color: 'var(--dv2-muted)',
                                        marginTop: '0.12rem',
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
                                                fontSize: '1.0625rem',
                                                fontWeight: 800,
                                                fontFamily: 'monospace',
                                                color: 'var(--dv2-text)',
                                            }}>
                                                {mod.score}
                                                <span style={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 600,
                                                    color: 'var(--dv2-muted)',
                                                    marginLeft: '0.25rem',
                                                }}>
                                                    {mod.key === 'reaction' ? 'ms' : `/ ${mod.maxScore}`}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 500,
                                                color: 'var(--dv2-muted)',
                                                marginTop: '0.08rem',
                                            }}>
                                                {mod.sessionCount} sess • {mod.lastCompletedDate}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
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
                                            fontSize: '0.8125rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            padding: '0.4rem 0.85rem',
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
