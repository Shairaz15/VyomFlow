import { useState } from 'react';
import type { DashboardDataMode } from '../../hooks/useDashboardV3ViewModel';

interface Props {
    dataMode: DashboardDataMode;
    setDataMode: (mode: DashboardDataMode) => void;
    seedMockPreset: (preset: 'stable' | 'mci' | 'decline') => Promise<void>;
    clearMockData: () => Promise<void>;
    deleteAllData: () => Promise<void>;
    isSeeding: boolean;
    refreshLive: () => void;
    hasLiveRecords: boolean;
}

export function SimulationControls({
    dataMode,
    setDataMode,
    seedMockPreset,
    clearMockData,
    deleteAllData,
    isSeeding,
    refreshLive,
    hasLiveRecords,
}: Props) {
    const isLive = dataMode === 'live';
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletedMessage, setDeletedMessage] = useState<string | null>(null);

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            await deleteAllData();
            setShowDeleteModal(false);
            setDeletedMessage('All live and demo assessment data has been completely erased from Supabase and local cache.');
            setTimeout(() => setDeletedMessage(null), 5000);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--dv2-card-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            position: 'relative',
        }}>
            {/* Header & Status Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid rgba(51, 65, 85, 0.5)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isLive ? '#10b981' : '#38bdf8',
                        boxShadow: isLive ? '0 0 10px #10b981' : '0 0 10px #38bdf8',
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>
                        Supabase Data Source:
                    </span>
                    <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: isLive ? '#34d399' : '#38bdf8',
                        border: isLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    }}>
                        {isLive ? '🟢 Live Patient Cloud (Supabase)' : `🧪 Mock Dataset (${dataMode.replace('mock_', '').toUpperCase()})`}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={refreshLive}
                        disabled={isSeeding || isDeleting}
                        style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        🔄 Refresh
                    </button>
                    {!isLive && (
                        <button
                            onClick={clearMockData}
                            disabled={isSeeding || isDeleting}
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            🧹 Clear Mock Data
                        </button>
                    )}
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isSeeding || isDeleting}
                        style={{
                            background: 'rgba(225, 29, 72, 0.15)',
                            color: '#fb7185',
                            border: '1px solid rgba(225, 29, 72, 0.35)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span>🗑️</span> Delete All Data (Clean Slate)
                    </button>
                </div>
            </div>

            {/* Notification alert after deletion */}
            {deletedMessage && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <span>✅</span> {deletedMessage}
                </div>
            )}

            {/* Trajectory Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {/* 1. Live Data Button */}
                <button
                    onClick={() => setDataMode('live')}
                    disabled={isSeeding || isDeleting}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: isLive ? '1.5px solid #10b981' : '1px solid #334155',
                        color: '#f8fafc',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isLive ? '#34d399' : '#e2e8f0' }}>
                        <span>🟢</span> Live Cloud Mode
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {hasLiveRecords ? 'Real verified patient sessions' : 'No tests taken yet (Empty state)'}
                    </div>
                </button>

                {/* 2. Mock: Stable */}
                <button
                    onClick={() => seedMockPreset('stable')}
                    disabled={isSeeding || isDeleting}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: dataMode === 'mock_stable' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: dataMode === 'mock_stable' ? '1.5px solid #38bdf8' : '1px solid #334155',
                        color: '#f8fafc',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: dataMode === 'mock_stable' ? '#38bdf8' : '#e2e8f0' }}>
                        <span>🌟</span> Demo: Stable (Normal)
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        4 Baseline Modules • MoCA 28-29 • 3 Diagnostic Locked
                    </div>
                </button>

                {/* 3. Mock: MCI */}
                <button
                    onClick={() => seedMockPreset('mci')}
                    disabled={isSeeding || isDeleting}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: dataMode === 'mock_mci' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: dataMode === 'mock_mci' ? '1.5px solid #fbbf24' : '1px solid #334155',
                        color: '#f8fafc',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: dataMode === 'mock_mci' ? '#fbbf24' : '#e2e8f0' }}>
                        <span>⚠️</span> Demo: MCI (Decline)
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        All 7 Modules Unlocked • MoCA 26→21 • Memory Drift
                    </div>
                </button>

                {/* 4. Mock: Rapid Decline */}
                <button
                    onClick={() => seedMockPreset('decline')}
                    disabled={isSeeding || isDeleting}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: dataMode === 'mock_decline' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: dataMode === 'mock_decline' ? '1.5px solid #ef4444' : '1px solid #334155',
                        color: '#f8fafc',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: dataMode === 'mock_decline' ? '#f87171' : '#e2e8f0' }}>
                        <span>🚨</span> Demo: Rapid Decline
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        All 7 Modules Unlocked • MoCA 24→15 • Dementia Risk
                    </div>
                </button>
            </div>

            {isSeeding && (
                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#38bdf8' }}>
                    ⏳ Generating isolated 75-biomarker longitudinal dataset in Supabase...
                </div>
            )}

            {/* Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        maxWidth: '440px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            margin: '0 auto 1rem',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}>
                            🗑️
                        </div>

                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' }}>
                            Delete All Assessment Data?
                        </h3>

                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 1.25rem' }}>
                            This will permanently delete all your assessment results from <strong style={{ color: '#f8fafc' }}>Supabase cloud</strong> and your local browser cache, returning your account to a <strong style={{ color: '#34d399' }}>fresh clean slate</strong>.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                style={{
                                    padding: '0.55rem 1.1rem',
                                    borderRadius: '10px',
                                    background: 'rgba(30, 41, 59, 0.8)',
                                    color: '#cbd5e1',
                                    border: '1px solid #334155',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAll}
                                disabled={isDeleting}
                                style={{
                                    padding: '0.55rem 1.1rem',
                                    borderRadius: '10px',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                                }}
                            >
                                {isDeleting ? 'Erasing Cloud & Local Data...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

