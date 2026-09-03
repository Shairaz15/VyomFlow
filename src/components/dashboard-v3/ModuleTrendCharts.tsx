import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    type ModuleTrendViewModel,
    type ModuleSessionPoint,
    MODULE_KEY_BIOMARKERS,
} from '../../services/dashboardViewModel';

interface Props {
    trends: ModuleTrendViewModel[];
    onPointClick: (moduleKey: string, moduleName: string, session: ModuleSessionPoint) => void;
}

const UNLOCK_THRESHOLD_MS = 3000; // 3 seconds

const MODULE_ROUTES: Record<string, string> = {
    reaction: '/test/reaction',
    attention: '/test/attention',
    vmra: '/test/vmra',
    story: '/test/story',
    language: '/test/language',
    pattern: '/tests/pattern',
    navigation: '/test/navigation',
};

const MODULE_ICONS: Record<string, string> = {
    reaction: '⚡',
    attention: '🎯',
    vmra: '🧠',
    story: '📖',
    language: '🗣️',
    pattern: '🧩',
    navigation: '🗺️',
};

/**
 * Custom Rich Tooltip:
 * Shows a compact session summary and a 3-second hold countdown.
 * Only unlocks and reveals full deep biomarker telemetry AFTER holding hover for 3 seconds.
 */
function CustomBiomarkerTooltip({ active, payload, label, moduleKey, moduleName, unit }: any) {
    const [hoverMs, setHoverMs] = useState(0);

    useEffect(() => {
        if (!active) {
            setHoverMs(0);
            return;
        }

        const interval = 100; // 100ms smooth updates
        const timer = setInterval(() => {
            setHoverMs(prev => Math.min(prev + interval, UNLOCK_THRESHOLD_MS));
        }, interval);

        return () => clearInterval(timer);
    }, [active, label]);

    if (!active || !payload || !payload.length) return null;

    const dataPoint: ModuleSessionPoint = payload[0].payload;
    const rawResult = dataPoint.rawResult;
    const biomarkerDefs = MODULE_KEY_BIOMARKERS[moduleKey] || [];

    const isUnlocked = hoverMs >= UNLOCK_THRESHOLD_MS;
    const progressPercent = Math.min((hoverMs / UNLOCK_THRESHOLD_MS) * 100, 100);
    const secondsLeft = Math.max(0, ((UNLOCK_THRESHOLD_MS - hoverMs) / 1000)).toFixed(1);

    const extractedBiomarkers = (isUnlocked && rawResult)
        ? biomarkerDefs.map(def => {
            const val = def.extractor(rawResult);
            if (val == null) return null;

            let status: 'normal' | 'watch' | 'concern' = 'normal';
            if (def.unit === '%' || def.unit === '/100') {
                if (val < 50) status = 'concern';
                else if (val < 70) status = 'watch';
            } else if (def.unit === 'ms') {
                if (val > 500) status = 'concern';
                else if (val > 350) status = 'watch';
            } else if (def.key === 'intrusionErrors' || def.key === 'lapses' || def.key === 'premature') {
                if (val > 3) status = 'concern';
                else if (val > 1) status = 'watch';
            }

            return {
                name: def.label,
                value: typeof val === 'number' ? Math.round(val * 100) / 100 : val,
                unit: def.unit,
                status,
            };
        }).filter(Boolean)
        : [];

    return (
        <div style={{
            backgroundColor: '#0f172a',
            border: isUnlocked ? '1px solid #38bdf8' : '1px solid #334155',
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            color: '#f8fafc',
            boxShadow: isUnlocked
                ? '0 12px 30px -5px rgba(56, 189, 248, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            width: isUnlocked ? '340px' : '260px',
            maxWidth: '360px',
            fontSize: '0.8125rem',
            lineHeight: 1.4,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.25s ease',
            zIndex: 1000,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isUnlocked ? '#38bdf8' : '#e2e8f0' }}>
                        {moduleName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {dataPoint.sessionLabel} • {dataPoint.date}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f8fafc' }}>
                        {dataPoint.score}{unit}
                    </span>
                </div>
            </div>

            {/* 3-second Hover Countdown Bar */}
            <div style={{ marginBottom: isUnlocked ? '0.625rem' : '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: isUnlocked ? '#38bdf8' : '#94a3b8', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600 }}>
                        {isUnlocked ? '🔬 Deep Telemetry Unlocked' : `⏱️ Hold ${secondsLeft}s for Deep Biomarkers`}
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>
                        {isUnlocked ? '3.0s' : `${(hoverMs / 1000).toFixed(1)}s / 3.0s`}
                    </span>
                </div>
                <div style={{ height: '4px', width: '100%', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: isUnlocked ? 'linear-gradient(90deg, #38bdf8, #10b981)' : '#38bdf8',
                        transition: 'width 0.1s linear',
                    }} />
                </div>
            </div>

            {/* Deep Telemetry Section (Revealed strictly AFTER 3 seconds) */}
            {isUnlocked && (
                <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #1e293b', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.45rem' }}>
                        <span>Extracted Biomarkers</span>
                        <span style={{ color: '#38bdf8', fontSize: '0.625rem' }}>{extractedBiomarkers.length} METRICS</span>
                    </div>

                    {extractedBiomarkers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
                            {extractedBiomarkers.map((bm: any, idx: number) => {
                                const statusColor = bm.status === 'concern' ? '#ef4444' : bm.status === 'watch' ? '#fbbf24' : '#10b981';
                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.2rem 0', borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                                        <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                                            {bm.name}
                                        </span>
                                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
                                            {bm.value}{bm.unit ? ` ${bm.unit}` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            No granular sub-biomarkers recorded for this session.
                        </div>
                    )}
                </div>
            )}

            {/* Tip */}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.375rem', borderTop: '1px solid #1e293b', fontSize: '0.6875rem', color: '#64748b', textAlign: 'center' }}>
                💡 Click point to open full side drawer
            </div>
        </div>
    );
}

export function ModuleTrendCharts({ trends, onPointClick }: Props) {
    if (!trends || trends.length === 0) return null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="dv2-section-title" style={{ margin: 0 }}>
                    Assessment Module Trends (7/7 Modules)
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--dv2-muted)' }}>
                    {trends.filter(t => t.sessions.length > 0).length} of 7 modules active
                </span>
            </div>

            <div className="dv2-grid-2">
                {trends.map(trend => {
                    const hasData = trend.sessions.length > 0;
                    const route = MODULE_ROUTES[trend.moduleKey] || '/tests';
                    const icon = MODULE_ICONS[trend.moduleKey] || '📊';

                    return (
                        <div key={trend.moduleKey} className="dv2-card dv2-chart-card">
                            <div className="dv2-chart-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span
                                        className="dv2-chart-dot"
                                        style={{ background: trend.chartColor }}
                                    />
                                    <span>{icon} {trend.moduleName}</span>
                                </div>
                                {!hasData && (
                                    <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.1)', color: 'var(--dv2-muted)' }}>
                                        No Data Yet
                                    </span>
                                )}
                            </div>

                            {hasData ? (
                                <ResponsiveContainer width="100%" height={230}>
                                    <LineChart data={trend.sessions}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--dv2-card-border)"
                                        />
                                        <XAxis
                                            dataKey="sessionLabel"
                                            stroke="var(--dv2-muted)"
                                            fontSize={11}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={trend.domain}
                                            stroke="var(--dv2-muted)"
                                            fontSize={11}
                                            tickLine={false}
                                            width={40}
                                        />
                                        <Tooltip
                                            content={
                                                <CustomBiomarkerTooltip
                                                    moduleKey={trend.moduleKey}
                                                    moduleName={trend.moduleName}
                                                    unit={trend.unit}
                                                />
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke={trend.chartColor}
                                            strokeWidth={2.5}
                                            dot={{ fill: trend.chartColor, r: 5, cursor: 'pointer' }}
                                            activeDot={{
                                                r: 8,
                                                stroke: trend.chartColor,
                                                strokeWidth: 2,
                                                fill: '#0f172a',
                                                cursor: 'pointer',
                                                onClick: (_e: any, payload: any) => {
                                                    if (payload?.payload) {
                                                        onPointClick(
                                                            trend.moduleKey,
                                                            trend.moduleName,
                                                            payload.payload
                                                        );
                                                    }
                                                },
                                            }}
                                            connectNulls
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{
                                    height: '230px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(15, 23, 42, 0.3)',
                                    borderRadius: '8px',
                                    border: '1px dashed var(--dv2-card-border)',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ fontSize: '1.75rem' }}>{icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--dv2-text)' }}>
                                            No sessions recorded yet
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)', maxWidth: '240px', marginTop: '0.25rem' }}>
                                            Complete this assessment to establish baseline telemetry and view longitudinal trend curves.
                                        </div>
                                    </div>
                                    <a
                                        href={route}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: '8px',
                                            background: trend.chartColor,
                                            color: '#0f172a',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            marginTop: '0.25rem',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                            transition: 'transform 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        🧪 Start {trend.moduleName}
                                    </a>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
