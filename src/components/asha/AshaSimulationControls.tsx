import { useState } from 'react';
import { Database, Sparkles, Trash2 } from 'lucide-react';
import { useAsha } from '../../contexts/AshaContext';

interface AshaSimulationControlsProps {
    onClose?: () => void;
    onToast?: (message: string) => void;
}

export function AshaSimulationControls({ onClose, onToast }: AshaSimulationControlsProps) {
    const { isMockMode, seedMockCaseload, clearMockCaseload, loading } = useAsha();
    const [actionLoading, setActionLoading] = useState(false);

    const handleSeed = async () => {
        setActionLoading(true);
        try {
            await seedMockCaseload();
            onToast?.('🧪 Demo village caseload loaded (12 elders across Chandpur, Rampur & Sonapur).');
        } catch (e) {
            onToast?.('Failed to seed demo caseload.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClear = async () => {
        setActionLoading(true);
        try {
            await clearMockCaseload();
            onToast?.('🧹 Demo records cleared. Showing live village records.');
        } catch (e) {
            onToast?.('Failed to clear demo data.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="asha-sim-strip">
            <div className="asha-sim-left">
                <div className="asha-sim-status-pill">
                    <span className={`asha-sim-dot ${isMockMode ? 'mock' : 'live'}`} />
                    <span className="asha-sim-source-label">Data Mode:</span>
                    <span className={`asha-sim-mode-tag ${isMockMode ? 'mock' : 'live'}`}>
                        {isMockMode ? '🧪 Demo Village Caseload (12 Elders)' : '🟢 Live Frontline Cloud'}
                    </span>
                </div>
                <span className="asha-sim-desc">
                    {isMockMode
                        ? 'Longitudinal MoCA profiles, vitals & multi-session test histories active for demo testing.'
                        : 'Connected to real village roster. Switch to Demo Caseload to test triage cards & referral slips.'}
                </span>
            </div>

            <div className="asha-sim-actions">
                {!isMockMode ? (
                    <button
                        type="button"
                        className="asha-sim-btn asha-sim-btn-seed"
                        onClick={handleSeed}
                        disabled={actionLoading || loading}
                    >
                        <Sparkles size={14} />
                        <span>{actionLoading ? 'Loading...' : 'Load Demo Caseload'}</span>
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            className="asha-sim-btn asha-sim-btn-live"
                            onClick={handleClear}
                            disabled={actionLoading || loading}
                        >
                            <Database size={14} />
                            <span>Switch to Live</span>
                        </button>
                        <button
                            type="button"
                            className="asha-sim-btn asha-sim-btn-clear"
                            onClick={handleClear}
                            disabled={actionLoading || loading}
                            title="Purge all demo records while keeping real records safe"
                        >
                            <Trash2 size={14} />
                            <span>Clear Demo Data</span>
                        </button>
                    </>
                )}

                {onClose && (
                    <button
                        type="button"
                        className="asha-sim-close-btn"
                        onClick={onClose}
                        title="Hide simulation controls"
                        aria-label="Hide simulation controls"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
