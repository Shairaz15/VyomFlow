import { MODULE_KEY_BIOMARKERS } from '../../services/dashboardViewModel';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    moduleName: string;
    moduleKey: string;
    sessionDate: string;
    rawResult: any;
}

export function BiomarkerDrawer({ isOpen, onClose, moduleName, moduleKey, sessionDate, rawResult }: Props) {
    const biomarkerDefs = MODULE_KEY_BIOMARKERS[moduleKey] || [];

    const biomarkers = rawResult
        ? biomarkerDefs
            .map(def => {
                const value = def.extractor(rawResult);
                if (value == null) return null;

                let status: 'normal' | 'watch' | 'concern' = 'normal';
                if (def.unit === '%' || def.unit === '/100') {
                    if (value < 50) status = 'concern';
                    else if (value < 70) status = 'watch';
                } else if (def.unit === 'ms') {
                    if (value > 500) status = 'concern';
                    else if (value > 350) status = 'watch';
                } else if (def.key === 'intrusionErrors' || def.key === 'lapses' || def.key === 'premature') {
                    if (value > 3) status = 'concern';
                    else if (value > 1) status = 'watch';
                }

                return {
                    name: def.label,
                    value: Math.round(value * 100) / 100,
                    unit: def.unit,
                    status,
                };
            })
            .filter(Boolean)
        : [];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`dv2-drawer-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`dv2-drawer ${isOpen ? 'open' : ''}`}>
                <div className="dv2-drawer-header">
                    <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem' }}>{moduleName}</h3>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--dv2-muted)' }}>
                            Session: {sessionDate}
                        </span>
                    </div>
                    <button className="dv2-drawer-close" onClick={onClose}>✕</button>
                </div>

                {biomarkers.length === 0 ? (
                    <p style={{ color: 'var(--dv2-muted)', fontSize: '0.875rem' }}>
                        No biomarker data available for this session.
                    </p>
                ) : (
                    <>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dv2-muted)', marginBottom: '0.75rem' }}>
                            Top {biomarkers.length} Biomarkers
                        </div>
                        {biomarkers.map((bm: any, i: number) => (
                            <div key={i} className="dv2-biomarker-row">
                                <div>
                                    <div className="dv2-biomarker-name">{bm.name}</div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--dv2-muted)', textTransform: 'capitalize' }}>
                                        {bm.status}
                                    </div>
                                </div>
                                <div className="dv2-biomarker-value">
                                    <span>{bm.value}{bm.unit ? ` ${bm.unit}` : ''}</span>
                                    <span className={`dv2-biomarker-dot ${bm.status}`} />
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </>
    );
}
