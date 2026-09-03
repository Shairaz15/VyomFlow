import { useState, useEffect, useRef } from 'react';
import {
    CognitiveRadarChart,
    DOMAIN_LABELS,
    DEFAULT_NORMATIVE,
    type CognitiveRadarDomainScores,
} from './CognitiveRadarChart';
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

    // Time-Lapse Playback & Scrubber State
    const totalSessions = timeline.length > 0 ? timeline.length : 1;
    const [selectedIdx, setSelectedIdx] = useState<number>(totalSessions - 1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);

    // Keep selected index in bounds if timeline updates
    useEffect(() => {
        if (selectedIdx >= totalSessions) {
            setSelectedIdx(Math.max(0, totalSessions - 1));
        }
    }, [totalSessions, selectedIdx]);

    // Active session scores being inspected
    const activeTimelinePoint = timeline.length > 0 ? timeline[selectedIdx] : null;
    const activeScores: CognitiveRadarDomainScores = activeTimelinePoint
        ? activeTimelinePoint.scores
        : scores;

    // Effective baseline scores (first session in timeline or passed baseline)
    const effectiveBaseline: CognitiveRadarDomainScores = baselineScores || (
        timeline.length > 0 ? timeline[0].scores : scores
    );

    const isLatest = selectedIdx === totalSessions - 1;
    const isBaseline = selectedIdx === 0;

    // Playback loop interval
    const playTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isPlaying || totalSessions <= 1) {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            return;
        }

        const intervalMs = playbackSpeed === 1 ? 1400 : 750;

        playTimerRef.current = setInterval(() => {
            setSelectedIdx(prev => {
                if (prev >= totalSessions - 1) {
                    return 0; // Loop back to start
                }
                return prev + 1;
            });
        }, intervalMs);

        return () => {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
        };
    }, [isPlaying, totalSessions, playbackSpeed]);

    const handleTogglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    const handleStepBack = () => {
        setIsPlaying(false);
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleStepForward = () => {
        setIsPlaying(false);
        setSelectedIdx(prev => Math.min(totalSessions - 1, prev + 1));
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPlaying(false);
        setSelectedIdx(parseInt(e.target.value, 10));
    };

    const handleJumpToLatest = () => {
        setIsPlaying(false);
        setSelectedIdx(totalSessions - 1);
    };

    return (
        <div className="dv2-card dv2-animate-in" style={{ padding: '1.5rem', position: 'relative' }}>
            {/* Header & Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
            }}>
                <div>
                    <h3 className="dv2-section-title" style={{ margin: 0 }}>
                        6-Domain Cognitive Envelope & Trajectory
                    </h3>
                    <p style={{
                        fontSize: '0.8125rem',
                        color: 'var(--dv2-muted)',
                        margin: '0.25rem 0 0',
                    }}>
                        Multi-layer comparative overlay across baseline, longitudinal sessions, and age-matched normative benchmarks.
                    </p>
                </div>

                {/* Layer Toggle Pills */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                }}>
                    {/* Current Envelope Toggle */}
                    <button
                        onClick={() => setShowCurrent(!showCurrent)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: showCurrent ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                            color: showCurrent ? '#38bdf8' : '#64748b',
                            border: showCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#06b6d4',
                            boxShadow: showCurrent ? '0 0 6px #06b6d4' : 'none',
                        }} />
                        {isLatest ? 'Current Profile' : 'Scrubbed Profile'}
                    </button>

                    {/* Baseline Toggle */}
                    <button
                        onClick={() => setShowBaseline(!showBaseline)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: showBaseline ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                            color: showBaseline ? '#fbbf24' : '#64748b',
                            border: showBaseline ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: '#f59e0b',
                            border: '1px dashed #d97706',
                        }} />
                        Baseline (First Visit)
                    </button>

                    {/* Normative Toggle */}
                    <button
                        onClick={() => setShowNormative(!showNormative)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: showNormative ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                            color: showNormative ? '#34d399' : '#64748b',
                            border: showNormative ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            background: '#10b981',
                            border: '1px dashed #10b981',
                        }} />
                        Age-Matched Normal (&gt;80)
                    </button>
                </div>
            </div>

            {/* Time-Lapse Playback & Scrubber Controls (when multiple sessions exist) */}
            {totalSessions > 1 && (
                <div style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Step Back */}
                            <button
                                onClick={handleStepBack}
                                disabled={selectedIdx === 0}
                                title="Previous Session"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: selectedIdx === 0 ? '#475569' : '#e2e8f0',
                                    border: 'none',
                                    borderRadius: '6px',
                                    width: '30px',
                                    height: '30px',
                                    cursor: selectedIdx === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                }}
                            >
                                ⏮
                            </button>

                            {/* Play / Pause */}
                            <button
                                onClick={handleTogglePlay}
                                style={{
                                    background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                                    color: isPlaying ? '#f87171' : '#38bdf8',
                                    border: isPlaying ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                                    borderRadius: '6px',
                                    padding: '0.3rem 0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                }}
                            >
                                {isPlaying ? '⏸ Pause' : '▶ Play Time-Lapse'}
                            </button>

                            {/* Step Forward */}
                            <button
                                onClick={handleStepForward}
                                disabled={selectedIdx === totalSessions - 1}
                                title="Next Session"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: selectedIdx === totalSessions - 1 ? '#475569' : '#e2e8f0',
                                    border: 'none',
                                    borderRadius: '6px',
                                    width: '30px',
                                    height: '30px',
                                    cursor: selectedIdx === totalSessions - 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                }}
                            >
                                ⏭
                            </button>

                            {/* Speed Switcher */}
                            <button
                                onClick={() => setPlaybackSpeed(prev => prev === 1 ? 2 : 1)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '6px',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {playbackSpeed}x Speed
                            </button>
                        </div>

                        {/* Active Session Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#e2e8f0',
                                background: isLatest ? 'rgba(6, 182, 212, 0.15)' : (isBaseline ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)'),
                                border: isLatest ? '1px solid rgba(6, 182, 212, 0.3)' : (isBaseline ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'),
                                padding: '0.25rem 0.65rem',
                                borderRadius: '6px',
                            }}>
                                📅 {activeTimelinePoint ? activeTimelinePoint.label : `Session ${selectedIdx + 1}`} ({activeTimelinePoint?.date || 'N/A'})
                            </span>

                            {!isLatest && (
                                <button
                                    onClick={handleJumpToLatest}
                                    style={{
                                        background: 'transparent',
                                        color: '#38bdf8',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        borderRadius: '6px',
                                        padding: '0.2rem 0.5rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Jump to Latest ➔
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Timeline Slider Track */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <input
                            type="range"
                            min="0"
                            max={totalSessions - 1}
                            step="1"
                            value={selectedIdx}
                            onChange={handleSliderChange}
                            style={{
                                width: '100%',
                                accentColor: '#06b6d4',
                                cursor: 'pointer',
                                height: '6px',
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.6875rem',
                            color: '#64748b',
                            padding: '0 2px',
                        }}>
                            <span>Baseline ({timeline[0]?.date})</span>
                            {timeline.length > 2 && (
                                <span>{Math.round(timeline.length / 2)} sessions</span>
                            )}
                            <span>Latest ({timeline[timeline.length - 1]?.date})</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Radar Visualizer */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                <CognitiveRadarChart
                    scores={activeScores}
                    baselineScores={effectiveBaseline}
                    normativeScores={normativeScores}
                    size={350}
                    showCurrent={showCurrent}
                    showBaseline={showBaseline && totalSessions > 1}
                    showNormative={showNormative}
                    activeSessionLabel={activeTimelinePoint?.label}
                />
            </div>

            {/* Domain Delta Comparative Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.625rem',
                marginTop: '1.25rem',
            }}>
                {DOMAIN_LABELS.map(d => {
                    const currentVal = activeScores[d.key] ?? 50;
                    const baseVal = effectiveBaseline ? effectiveBaseline[d.key] : currentVal;
                    const delta = currentVal - baseVal;
                    const isPositive = delta > 0;
                    const isNegative = delta < 0;

                    return (
                        <div
                            key={d.key}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '10px',
                                padding: '0.65rem 0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                                color: 'var(--dv2-muted)',
                            }}>
                                <span>{d.icon} {d.label}</span>
                                {totalSessions > 1 && delta !== 0 && (
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        fontWeight: 700,
                                        color: isPositive ? '#34d399' : '#f87171',
                                    }}>
                                        {isPositive ? `+${delta}` : delta}
                                    </span>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.35rem',
                                marginTop: '0.15rem',
                            }}>
                                <span style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    color: currentVal < 60 ? '#f87171' : 'var(--dv2-text)',
                                }}>
                                    {currentVal}
                                </span>
                                <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>/100</span>
                            </div>

                            {totalSessions > 1 && (
                                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                                    Base: <strong style={{ color: '#cbd5e1' }}>{baseVal}</strong>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CognitiveRadarSection;
