import type { DashboardDataMode } from '../../hooks/useDashboardV3ViewModel';

interface Props {
    dataMode: DashboardDataMode;
    setDataMode: (mode: DashboardDataMode) => void;
    seedMockPreset: (preset: 'stable' | 'mci' | 'decline') => Promise<void>;
    clearMockData: () => Promise<void>;
    isSeeding: boolean;
    refreshLive: () => void;
    hasLiveRecords: boolean;
}

export function SimulationControls({
    dataMode,
    setDataMode,
    seedMockPreset,
    clearMockData,
    isSeeding,
    refreshLive,
    hasLiveRecords,
}: Props) {
    const isLive = dataMode === 'live';

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--dv2-card-border)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
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

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={refreshLive}
                        disabled={isSeeding}
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
                            disabled={isSeeding}
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
                </div>
            </div>

            {/* Trajectory Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {/* 1. Live Data Button */}
                <button
                    onClick={() => setDataMode('live')}
                    disabled={isSeeding}
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
                    disabled={isSeeding}
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
                        5 sessions • MoCA 28-29 • Optimal bounds
                    </div>
                </button>

                {/* 3. Mock: MCI */}
                <button
                    onClick={() => seedMockPreset('mci')}
                    disabled={isSeeding}
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
                        5 sessions • MoCA 26→21 • Memory drift
                    </div>
                </button>

                {/* 4. Mock: Rapid Decline */}
                <button
                    onClick={() => seedMockPreset('decline')}
                    disabled={isSeeding}
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
                        5 sessions • MoCA 24→15 • Clinical alert
                    </div>
                </button>
            </div>

            {isSeeding && (
                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#38bdf8' }}>
                    ⏳ Generating isolated 75-biomarker longitudinal dataset in Supabase...
                </div>
            )}
        </div>
    );
}
