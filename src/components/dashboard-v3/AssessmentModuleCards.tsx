import type { AssessmentModuleViewModel } from '../../services/dashboardViewModel';

interface Props {
    modules: AssessmentModuleViewModel[];
}

export function AssessmentModuleCards({ modules }: Props) {
    return (
        <div>
            <h3 className="dv2-section-title">Assessment Modules</h3>
            <div className="dv2-grid-2">
                {modules.map(mod => (
                    <div key={mod.key} className="dv2-card dv2-module-card">
                        <div className="dv2-module-icon">{mod.icon}</div>
                        <div className="dv2-module-info">
                            <div className="dv2-module-name">{mod.name}</div>
                            {mod.isCompleted ? (
                                <>
                                    <div className="dv2-module-score">
                                        {mod.score != null ? `${mod.score}${mod.key === 'reaction' ? ' ms' : ' / ' + mod.maxScore}` : '—'}
                                    </div>
                                    <div className="dv2-module-status">
                                        ✓ {mod.sessionCount} session{mod.sessionCount !== 1 ? 's' : ''} • Last: {mod.lastCompletedDate}
                                    </div>
                                </>
                            ) : (
                                <div className="dv2-module-score" style={{ color: 'var(--dv2-muted)' }}>
                                    Not yet taken
                                </div>
                            )}
                        </div>
                        <div className="dv2-module-action">
                            <a href={mod.route}>
                                {mod.isCompleted ? 'Retake' : 'Start'}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
