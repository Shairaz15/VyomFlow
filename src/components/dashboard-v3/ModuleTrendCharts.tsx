import { useState, useEffect, useRef } from 'react';
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

import { Zap, Target, Brain, BookOpen, MessageSquareQuote, Layers, Compass, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

function getTrendIcon(key: string, size = 15) {
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

/**
 * Custom Rich Tooltip:
 * Shows a compact session summary and a 3-second hold countdown.
 * Only unlocks and reveals full deep biomarker telemetry AFTER holding hover for 3 seconds.
 */
function CustomBiomarkerTooltip({ active, payload, label, moduleKey, moduleName, unit }: any) {
    const [hoverMs, setHoverMs] = useState(0);
    const [manualUnlocked, setManualUnlocked] = useState(false);

    useEffect(() => {
        if (!active) {
            setHoverMs(0);
            setManualUnlocked(false);
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

    const isUnlocked = manualUnlocked || hoverMs >= UNLOCK_THRESHOLD_MS;
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
            backgroundColor: 'var(--dv2-card-bg)',
            border: isUnlocked ? '1px solid #38bdf8' : '1px solid var(--dv2-card-border)',
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            color: 'var(--dv2-text)',
            boxShadow: isUnlocked
                ? '0 12px 30px -5px rgba(56, 189, 248, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                : 'var(--dv2-card-shadow)',
            width: isUnlocked ? 'min(340px, calc(100vw - 48px))' : 'min(260px, calc(100vw - 48px))',
            maxWidth: 'calc(100vw - 32px)',
            fontSize: '0.8125rem',
            lineHeight: 1.4,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.25s ease',
            zIndex: 1000,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--dv2-card-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isUnlocked ? '#38bdf8' : 'var(--dv2-text)' }}>
                        {moduleName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)' }}>
                        {dataPoint.sessionLabel} • {dataPoint.date}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--dv2-text)' }}>
                        {typeof dataPoint.score === 'number' ? Math.round(dataPoint.score) : dataPoint.score} {unit}
                    </span>
                </div>
            </div>

            {/* 3-second Hover Countdown Bar / Touch Unlock */}
            <div style={{ marginBottom: isUnlocked ? '0.625rem' : '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: isUnlocked ? '#38bdf8' : '#94a3b8', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600 }}>
                        {isUnlocked ? '🔬 Deep Telemetry Unlocked' : `⏱️ Hold ${secondsLeft}s for Deep Biomarkers`}
                    </span>
                    {!isUnlocked && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setManualUnlocked(true);
                            }}
                            style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '4px',
                                padding: '0.1rem 0.35rem',
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Tap to Unlock
                        </button>
                    )}
                </div>
                <div style={{ height: '4px', width: '100%', background: 'var(--dv2-card-border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: isUnlocked ? '100%' : `${progressPercent}%`,
                        background: isUnlocked ? 'linear-gradient(90deg, #38bdf8, #10b981)' : '#38bdf8',
                        transition: 'width 0.1s linear',
                    }} />
                </div>
            </div>

            {/* Deep Telemetry Section (Revealed strictly AFTER 3 seconds) */}
            {isUnlocked && (
                <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid var(--dv2-card-border)', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dv2-muted)', marginBottom: '0.45rem' }}>
                        <span>Extracted Biomarkers</span>
                        <span style={{ color: '#06b6d4', fontSize: '0.625rem' }}>{extractedBiomarkers.length} METRICS</span>
                    </div>

                    {extractedBiomarkers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
                            {extractedBiomarkers.map((bm: any, idx: number) => {
                                const statusColor = bm.status === 'concern' ? '#ef4444' : bm.status === 'watch' ? '#fbbf24' : '#10b981';
                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.25rem 0', borderBottom: '1px solid var(--dv2-card-border)' }}>
                                        <span style={{ color: 'var(--dv2-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                                            {bm.name}
                                        </span>
                                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--dv2-text)' }}>
                                            {bm.value}{bm.unit ? ` ${bm.unit}` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)' }}>
                            No granular sub-biomarkers recorded for this session.
                        </div>
                    )}
                </div>
            )}

            {/* Tip */}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.375rem', borderTop: '1px solid var(--dv2-card-border)', fontSize: '0.6875rem', color: 'var(--dv2-muted)', textAlign: 'center' }}>
                💡 Click point to open full side drawer
            </div>
        </div>
    );
}

function getCleanModuleName(moduleKey: string, originalName: string): string {
    switch (moduleKey) {
        case 'reaction': return 'Reaction Time';
        case 'savt': return 'Attention';
        case 'vmra': return 'Visual Memory';
        case 'story': return 'Story Recall';
        case 'language': return 'Language';
        case 'pattern': return 'Working Memory';
        case 'navigation': return 'Navigation';
        default: return originalName.replace(/\s*\([^)]*\)/g, '').trim();
    }
}

export function ModuleTrendCharts({ trends, onPointClick }: Props) {
    if (!trends || trends.length === 0) return null;

    const [selectedModuleKey, setSelectedModuleKey] = useState<string>(() => {
        const withData = trends.find(t => t.sessions.length > 0);
        return withData?.moduleKey || trends[0]?.moduleKey || 'reaction';
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollButtons = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 4);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    };

    useEffect(() => {
        checkScrollButtons();
        const handleResize = () => checkScrollButtons();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [trends]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = direction === 'left' ? -180 : 180;
        scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        setTimeout(checkScrollButtons, 260);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!scrollRef.current) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            scrollRef.current.scrollLeft += e.deltaY;
            checkScrollButtons();
        }
    };

    const activeTrend = trends.find(t => t.moduleKey === selectedModuleKey) || trends[0];

    const renderTrendCard = (trend: ModuleTrendViewModel) => {
        const hasData = trend.sessions.length > 0;
        const route = MODULE_ROUTES[trend.moduleKey] || '/tests';

        return (
            <div key={trend.moduleKey} className="dv2-card dv2-chart-card" style={{ padding: '1.25rem 1.15rem 0.85rem 1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: `${trend.chartColor}18`,
                            color: trend.chartColor,
                        }}>
                            {getTrendIcon(trend.moduleKey, 15)}
                        </span>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--dv2-text)', letterSpacing: '-0.01em' }}>
                            {trend.moduleName}
                        </span>
                    </div>
                    {!hasData ? (
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(148, 163, 184, 0.12)',
                            color: 'var(--dv2-muted)'
                        }}>
                            No Data Yet
                        </span>
                    ) : (
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--dv2-muted)',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--dv2-card-border)',
                        }}>
                            {trend.sessions.length} {trend.sessions.length === 1 ? 'session' : 'sessions'}
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
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                domain={trend.domain}
                                stroke="var(--dv2-muted)"
                                fontSize={12}
                                tickLine={false}
                                width={42}
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
                                    fill: 'var(--dv2-card-bg)',
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
                        background: 'transparent',
                        borderRadius: '8px',
                        border: '1px dashed var(--dv2-card-border)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: trend.chartColor, opacity: 0.85 }}>
                            {getTrendIcon(trend.moduleKey, 28)}
                        </div>
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
                                padding: '0.35rem 0.85rem',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: 'var(--dv2-teal)',
                                border: '1px solid var(--dv2-teal)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                marginTop: '0.25rem',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--dv2-teal)';
                                e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--dv2-teal)';
                            }}
                        >
                            Start Assessment ➔
                        </a>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dv2-trends-unified-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        letterSpacing: '-0.015em',
                        color: 'var(--dv2-text)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                    }}>
                        Longitudinal Assessment Trends
                    </h3>
                    <p style={{
                        margin: '0.15rem 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--dv2-muted)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                    }}>
                        Select a biomarker module to inspect trajectory curves
                    </p>
                </div>
                <span className="dv2-trends-active-indicator">
                    {trends.filter(t => t.sessions.length > 0).length}/7 Active
                </span>
            </div>

            {/* Render Single Active Chart with smooth fade transition (Moved UP) */}
            <div key={activeTrend.moduleKey} className="dv2-animate-fade">
                {renderTrendCard(activeTrend)}
            </div>

            {/* Horizontal Module Switcher Row with Left/Right Chevrons & Wheel Support (Moved DOWN) */}
            <div className="dv2-trends-slider-container" style={{
                marginTop: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem',
                position: 'relative',
            }}>
                <button
                    type="button"
                    onClick={() => handleScroll('left')}
                    disabled={!canScrollLeft}
                    title="Scroll left"
                    aria-label="Scroll options left"
                    style={{
                        width: '26px',
                        height: '32px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: canScrollLeft ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: canScrollLeft ? 'var(--dv2-text)' : 'var(--dv2-muted)',
                        opacity: canScrollLeft ? 1 : 0.25,
                        cursor: canScrollLeft ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                    }}
                >
                    <ChevronLeft size={16} />
                </button>

                <div
                    ref={scrollRef}
                    onScroll={checkScrollButtons}
                    onWheel={handleWheel}
                    className="dv2-trends-chips-scroll"
                    style={{
                        flex: 1,
                        display: 'flex',
                        gap: '0.25rem',
                        overflowX: 'auto',
                        padding: '0.05rem 0.1rem',
                        scrollBehavior: 'smooth',
                    }}
                >
                    {trends.map(t => {
                        const isSelected = t.moduleKey === activeTrend.moduleKey;
                        const hasData = t.sessions.length > 0;
                        const cleanName = getCleanModuleName(t.moduleKey, t.moduleName);
                        return (
                            <button
                                key={t.moduleKey}
                                type="button"
                                onClick={() => setSelectedModuleKey(t.moduleKey)}
                                className={`dv2-trends-pill ${isSelected ? 'active' : ''}`}
                                style={{
                                    borderColor: isSelected ? t.chartColor : 'transparent',
                                    background: isSelected
                                        ? `linear-gradient(135deg, ${t.chartColor}22, ${t.chartColor}0a)`
                                        : 'transparent',
                                    color: isSelected ? 'var(--dv2-text)' : 'var(--dv2-muted)',
                                    boxShadow: isSelected ? `0 2px 6px ${t.chartColor}18` : 'none',
                                }}
                            >
                                <span
                                    className="dv2-trends-pill-icon"
                                    style={{
                                        color: t.chartColor,
                                        opacity: isSelected ? 1 : 0.75,
                                    }}
                                >
                                    {getTrendIcon(t.moduleKey, 14)}
                                </span>
                                <span className="dv2-trends-pill-name">{cleanName}</span>
                                {hasData && (
                                    <span
                                        className="dv2-trends-pill-count"
                                        style={{
                                            background: isSelected ? `${t.chartColor}28` : 'rgba(148, 163, 184, 0.12)',
                                            color: isSelected ? t.chartColor : 'var(--dv2-muted)',
                                        }}
                                    >
                                        {t.sessions.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => handleScroll('right')}
                    disabled={!canScrollRight}
                    title="Scroll right"
                    aria-label="Scroll options right"
                    style={{
                        width: '26px',
                        height: '32px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: canScrollRight ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: canScrollRight ? 'var(--dv2-text)' : 'var(--dv2-muted)',
                        opacity: canScrollRight ? 1 : 0.25,
                        cursor: canScrollRight ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                    }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
