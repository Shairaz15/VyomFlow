import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    CognitiveRadarChart,
    DOMAIN_LABELS,
    DEFAULT_NORMATIVE,
    type CognitiveRadarDomainScores,
    type RadarGeometryMode,
} from './CognitiveRadarChart';
import { interpolateDomainScores } from './radarMath';
import type { RadarTimelinePoint } from '../../services/dashboardViewModel';

export interface CognitiveRadarSectionProps {
    scores: CognitiveRadarDomainScores;
    baselineScores?: CognitiveRadarDomainScores;
    timeline?: RadarTimelinePoint[];
    normativeScores?: CognitiveRadarDomainScores;
}

export function CognitiveRadarSection({
    scores,
    baselineScores,
    timeline = [],
    normativeScores = DEFAULT_NORMATIVE,
}: CognitiveRadarSectionProps) {
    const hasScores = Object.values(scores).some(v => v > 0);
    if (!hasScores && timeline.length === 0) return null;

    // Layer Visibility States
    const [showCurrent, setShowCurrent] = useState(true);
    const [showBaseline, setShowBaseline] = useState(true);
    const [showNormative, setShowNormative] = useState(true);
    const [geometryMode, setGeometryMode] = useState<RadarGeometryMode>('organic');

    // 60 FPS Continuous Timeline & Playhead State
    const totalSessions = timeline.length > 0 ? timeline.length : 1;
    const [playhead, setPlayhead] = useState<number>(totalSessions - 1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);

    // Keep playhead in bounds if timeline updates
    useEffect(() => {
        if (playhead >= totalSessions) {
            setPlayhead(Math.max(0, totalSessions - 1));
        }
    }, [totalSessions, playhead]);

    // Effective baseline scores (first session in timeline or passed baseline)
    const effectiveBaseline: CognitiveRadarDomainScores = baselineScores || (
        timeline.length > 0 ? timeline[0].scores : scores
    );

    // 60 FPS requestAnimationFrame Continuous Interpolation Engine
    const animFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);

    const animateStep = useCallback((timestamp: number) => {
        if (lastTimestampRef.current == null) {
            lastTimestampRef.current = timestamp;
        }

        const dtSeconds = (timestamp - lastTimestampRef.current) / 1000;
        lastTimestampRef.current = timestamp;

        if (totalSessions > 1) {
            const sessionDurationSec = playbackSpeed === 1 ? 1.4 : 0.75;
            const stepDelta = dtSeconds / sessionDurationSec;

            setPlayhead(prev => {
                const next = prev + stepDelta;
                if (next >= totalSessions - 1) {
                    return 0; // Seamless loop
                }
                return next;
            });
        }

        animFrameRef.current = requestAnimationFrame(animateStep);
    }, [totalSessions, playbackSpeed]);

    useEffect(() => {
        if (isPlaying && totalSessions > 1) {
            lastTimestampRef.current = null;
            animFrameRef.current = requestAnimationFrame(animateStep);
        } else {
            if (animFrameRef.current != null) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
            lastTimestampRef.current = null;
        }

        return () => {
            if (animFrameRef.current != null) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
        };
    }, [isPlaying, animateStep, totalSessions]);

    // Compute smooth interpolated display scores
    const displayScores: CognitiveRadarDomainScores = useMemo(() => {
        if (timeline.length === 0) return scores;
        if (timeline.length === 1) return timeline[0].scores;

        const idxFloor = Math.floor(playhead);
        const idxCeil = Math.min(totalSessions - 1, idxFloor + 1);
        const alpha = playhead - idxFloor;

        const scoreA = timeline[idxFloor]?.scores || scores;
        const scoreB = timeline[idxCeil]?.scores || scoreA;

        return interpolateDomainScores(scoreA, scoreB, alpha);
    }, [playhead, timeline, totalSessions, scores]);

    // Ghost trail scores
    const ghostScores: CognitiveRadarDomainScores | undefined = useMemo(() => {
        if (!isPlaying || timeline.length <= 1) return undefined;
        const prevIdx = Math.max(0, Math.floor(playhead) - 1);
        return timeline[prevIdx]?.scores;
    }, [isPlaying, playhead, timeline]);

    // Active session metadata
    const activeDiscreteIndex = Math.round(playhead);
    const activeTimelinePoint = timeline.length > 0 ? timeline[activeDiscreteIndex] : null;
    const isLatest = activeDiscreteIndex === totalSessions - 1;

    const handleTogglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPlaying(false);
        setPlayhead(parseFloat(e.target.value));
    };

    const handleJumpToLatest = () => {
        setIsPlaying(false);
        setPlayhead(totalSessions - 1);
    };

    return (
        <div className="dv2-card dv2-animate-in" style={{ position: 'relative' }}>
            {/* Header: Title & Geometry Mode Switcher & Layer Toggles */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.75rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <h3 className="dv2-section-title" style={{ margin: 0, fontSize: '1.125rem' }}>
                        6-Domain Cognitive Envelope
                    </h3>

                    {/* Geometry Mode Toggle Switcher */}
                    <div style={{
                        display: 'inline-flex',
                        background: 'transparent',
                        padding: '2px',
                        borderRadius: '6px',
                        border: '1px solid var(--dv2-card-border)',
                    }}>
                        <button
                            onClick={() => setGeometryMode('organic')}
                            style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: 'none',
                                background: geometryMode === 'organic' ? 'rgba(79, 124, 120, 0.2)' : 'transparent',
                                color: geometryMode === 'organic' ? 'var(--dv2-teal)' : 'var(--dv2-muted)',
                                transition: 'all 0.15s ease',
                            }}
                            title="Organic Biological Spline Envelope"
                        >
                            ✿ Organic
                        </button>
                        <button
                            onClick={() => setGeometryMode('hexagon')}
                            style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: 'none',
                                background: geometryMode === 'hexagon' ? 'rgba(79, 124, 120, 0.2)' : 'transparent',
                                color: geometryMode === 'hexagon' ? 'var(--dv2-teal)' : 'var(--dv2-muted)',
                                transition: 'all 0.15s ease',
                            }}
                            title="Geometric Hexagonal Polygon"
                        >
                            ⬡ Hexagon
                        </button>
                    </div>
                </div>

                {/* Minimal Segmented Layer Toggles */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    background: 'transparent',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid var(--dv2-card-border)',
                }}>
                    {/* Current Envelope Toggle */}
                    <button
                        onClick={() => setShowCurrent(!showCurrent)}
                        style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: showCurrent ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                            color: showCurrent ? '#06b6d4' : 'var(--dv2-muted)',
                            border: 'none',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#06b6d4',
                            boxShadow: showCurrent ? '0 0 6px #06b6d4' : 'none',
                        }} />
                        Profile
                    </button>

                    {/* Baseline Toggle */}
                    {totalSessions > 1 && (
                        <button
                            onClick={() => setShowBaseline(!showBaseline)}
                            style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: showBaseline ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                color: showBaseline ? '#d97706' : 'var(--dv2-muted)',
                                border: 'none',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '1.5px',
                                background: '#f59e0b',
                            }} />
                            Baseline
                        </button>
                    )}

                    {/* Normative Toggle */}
                    <button
                        onClick={() => setShowNormative(!showNormative)}
                        style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: showNormative ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: showNormative ? '#10b981' : 'var(--dv2-muted)',
                            border: 'none',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '1.5px',
                            background: '#10b981',
                        }} />
                        Normal (&gt;80)
                    </button>
                </div>
            </div>

            {/* Radar Visualizer */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
                <CognitiveRadarChart
                    scores={displayScores}
                    baselineScores={effectiveBaseline}
                    normativeScores={normativeScores}
                    ghostScores={ghostScores}
                    size={350}
                    geometryMode={geometryMode}
                    showCurrent={showCurrent}
                    showBaseline={showBaseline && totalSessions > 1}
                    showNormative={showNormative}
                    showVolumetricDiff={true}
                    activeSessionLabel={activeTimelinePoint?.label}
                />
            </div>

            {/* Minimalist Modern 60fps Time-Lapse Scrubber Pill */}
            {totalSessions > 1 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.625rem',
                    background: 'var(--dv2-card-bg)',
                    border: '1px solid var(--dv2-card-border)',
                    borderRadius: '24px',
                    padding: '0.4rem 0.85rem',
                    margin: '0.5rem auto 1rem',
                    maxWidth: '540px',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: 'var(--dv2-card-shadow)',
                }}>
                    {/* Compact Circular Play/Pause Button */}
                    <button
                        onClick={handleTogglePlay}
                        title={isPlaying ? 'Pause Playback' : 'Play 60fps Morphing Timeline'}
                        style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 124, 120, 0.18)',
                            color: isPlaying ? '#ef4444' : 'var(--dv2-teal)',
                            border: isPlaying ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--dv2-teal)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            flexShrink: 0,
                            padding: 0,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    {/* Slim Continuous Timeline Slider */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: '0 0.25rem' }}>
                        <input
                            type="range"
                            min="0"
                            max={totalSessions - 1}
                            step="0.01"
                            value={playhead}
                            onChange={handleSliderChange}
                            style={{
                                width: '100%',
                                height: '4px',
                                accentColor: '#4F7C78',
                                cursor: 'pointer',
                            }}
                        />
                    </div>

                    {/* Session Indicator Pill */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexShrink: 0,
                    }}>
                        <span style={{
                            fontSize: '0.725rem',
                            fontFamily: 'monospace',
                            color: 'var(--dv2-muted)',
                            letterSpacing: '-0.02em',
                        }}>
                            {activeDiscreteIndex === 0 ? 'Baseline' : (isLatest ? 'Latest' : `Sess ${activeDiscreteIndex + 1}`)}
                            {' '}• <span style={{ color: 'var(--dv2-text)' }}>{activeTimelinePoint?.date || 'N/A'}</span>
                        </span>

                        {/* Speed Toggle */}
                        <button
                            onClick={() => setPlaybackSpeed(prev => prev === 1 ? 2 : 1)}
                            style={{
                                background: 'transparent',
                                color: 'var(--dv2-muted)',
                                border: 'none',
                                padding: '0.1rem 0.3rem',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderRadius: '4px',
                            }}
                            title="Toggle Playback Speed"
                        >
                            {playbackSpeed}x
                        </button>

                        {/* Quick Jump to Latest */}
                        {!isLatest && (
                            <button
                                onClick={handleJumpToLatest}
                                title="Jump to Latest Session"
                                style={{
                                    background: 'transparent',
                                    color: 'var(--dv2-teal)',
                                    border: 'none',
                                    padding: '0.1rem 0.25rem',
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                ➔
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Domain Delta Comparative Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.5rem',
                marginTop: totalSessions > 1 ? '0' : '0.5rem',
            }}>
                {DOMAIN_LABELS.map(d => {
                    const currentVal = Math.round(displayScores[d.key] ?? 50);
                    const baseVal = effectiveBaseline ? Math.round(effectiveBaseline[d.key] ?? currentVal) : currentVal;
                    const delta = currentVal - baseVal;
                    const isPositive = delta > 0;

                    return (
                        <div
                            key={d.key}
                            style={{
                                background: 'var(--dv2-card-bg)',
                                border: '1px solid var(--dv2-card-border)',
                                borderRadius: '8px',
                                padding: '0.5rem 0.65rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.15rem',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.725rem',
                                color: 'var(--dv2-muted)',
                            }}>
                                <span>{d.icon} {d.label}</span>
                                {totalSessions > 1 && delta !== 0 && (
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        fontWeight: 700,
                                        color: isPositive ? '#10b981' : '#ef4444',
                                    }}>
                                        {isPositive ? `+${delta}` : delta}
                                    </span>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.25rem',
                                marginTop: '0.1rem',
                            }}>
                                <span style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    color: currentVal < 60 ? '#ef4444' : 'var(--dv2-text)',
                                }}>
                                    {currentVal}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--dv2-muted)' }}>/100</span>
                                {totalSessions > 1 && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--dv2-muted)', marginLeft: 'auto' }}>
                                        Base: <strong style={{ color: 'var(--dv2-text)' }}>{baseVal}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CognitiveRadarSection;
