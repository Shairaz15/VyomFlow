import React, { useId, useState } from 'react';
import type { CognitiveRadarDomainScores } from '../../services/dashboardViewModel';
import './CognitiveRadarChart.css';

export type { CognitiveRadarDomainScores };

export interface CognitiveRadarChartProps {
    scores: CognitiveRadarDomainScores;
    baselineScores?: CognitiveRadarDomainScores;
    normativeScores?: CognitiveRadarDomainScores;
    size?: number;
    showCurrent?: boolean;
    showBaseline?: boolean;
    showNormative?: boolean;
    activeSessionLabel?: string;
}

export const DOMAIN_LABELS: { key: keyof CognitiveRadarDomainScores; label: string; icon: string }[] = [
    { key: 'memory', label: 'Memory', icon: '🧠' },
    { key: 'language', label: 'Language', icon: '🗣️' },
    { key: 'processingSpeed', label: 'Speed', icon: '⚡' },
    { key: 'executive', label: 'Executive', icon: '🧩' },
    { key: 'spatialOrientation', label: 'Spatial', icon: '🗺️' },
    { key: 'attention', label: 'Attention', icon: '🎯' },
];

export const DEFAULT_NORMATIVE: CognitiveRadarDomainScores = {
    memory: 85,
    language: 88,
    processingSpeed: 82,
    executive: 84,
    spatialOrientation: 86,
    attention: 85,
};

export const CognitiveRadarChart: React.FC<CognitiveRadarChartProps> = ({
    scores,
    baselineScores,
    normativeScores = DEFAULT_NORMATIVE,
    size = 340,
    showCurrent = true,
    showBaseline = true,
    showNormative = true,
    activeSessionLabel,
}) => {
    const center = size / 2;
    const radius = size * 0.37;
    const numAxes = DOMAIN_LABELS.length;
    const angleStep = (Math.PI * 2) / numAxes;
    const chartId = useId().replace(/:/g, '');

    const [hoveredDomain, setHoveredDomain] = useState<keyof CognitiveRadarDomainScores | null>(null);

    // Convert polar coordinates to Cartesian
    const polarToCartesian = (angle: number, r: number) => {
        const x = center + r * Math.sin(angle);
        const y = center - r * Math.cos(angle);
        return { x, y };
    };

    // Generate polygon points from scores
    const getPolygonPath = (scoreObj: CognitiveRadarDomainScores) => {
        return DOMAIN_LABELS.map((d, i) => {
            const angle = i * angleStep;
            const val = Math.max(0, Math.min(100, scoreObj[d.key] ?? 50));
            const r = (val / 100) * radius;
            const { x, y } = polarToCartesian(angle, r);
            return `${x},${y}`;
        }).join(' ');
    };

    const currentPoints = getPolygonPath(scores);
    const baselinePoints = baselineScores ? getPolygonPath(baselineScores) : null;
    const normativePoints = getPolygonPath(normativeScores);

    // Reference grid levels (20, 40, 60, 80, 100)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

    const activeMeta = hoveredDomain
        ? DOMAIN_LABELS.find(d => d.key === hoveredDomain)
        : null;

    const activeCurrentVal = hoveredDomain ? (scores[hoveredDomain] ?? 0) : null;
    const activeBaseVal = hoveredDomain && baselineScores ? (baselineScores[hoveredDomain] ?? 0) : null;
    const activeNormVal = hoveredDomain ? (normativeScores[hoveredDomain] ?? 0) : null;
    const activeDelta = (activeCurrentVal != null && activeBaseVal != null)
        ? activeCurrentVal - activeBaseVal
        : null;

    return (
        <div className="cognitive-radar-container">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="cognitive-radar-svg"
            >
                <defs>
                    {/* Current Patient Fill Gradient */}
                    <linearGradient id={`radarPatientGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.30" />
                    </linearGradient>

                    {/* Baseline Fill Gradient */}
                    <linearGradient id={`radarBaselineGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="0.10" />
                    </linearGradient>

                    {/* Normative Fill Gradient */}
                    <linearGradient id={`radarNormGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
                    </linearGradient>

                    {/* Glow Filter */}
                    <filter id={`radarGlow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Concentric Hexagonal Grid */}
                {gridLevels.map((lvl, idx) => {
                    const r = lvl * radius;
                    const hexPoints = DOMAIN_LABELS.map((_, i) => {
                        const { x, y } = polarToCartesian(i * angleStep, r);
                        return `${x},${y}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={idx}
                            points={hexPoints}
                            className={`radar-grid-polygon ${lvl === 1.0 ? 'outer-ring' : ''}`}
                        />
                    );
                })}

                {/* Radial Spoke Lines */}
                {DOMAIN_LABELS.map((_, i) => {
                    const { x, y } = polarToCartesian(i * angleStep, radius);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            className="radar-spoke"
                        />
                    );
                })}

                {/* Layer 1: Age-Matched Normative Reference Envelope */}
                {showNormative && (
                    <polygon
                        points={normativePoints}
                        fill={`url(#radarNormGrad-${chartId})`}
                        className="radar-normative-polygon"
                    />
                )}

                {/* Layer 2: Baseline (First Visit) Envelope */}
                {showBaseline && baselinePoints && (
                    <polygon
                        points={baselinePoints}
                        fill={`url(#radarBaselineGrad-${chartId})`}
                        className="radar-baseline-polygon"
                    />
                )}

                {/* Layer 3: Active / Scrubbed Patient Cognitive Envelope */}
                {showCurrent && (
                    <polygon
                        points={currentPoints}
                        fill={`url(#radarPatientGrad-${chartId})`}
                        filter={`url(#radarGlow-${chartId})`}
                        className="radar-patient-polygon"
                    />
                )}

                {/* Baseline Vertex Nodes */}
                {showBaseline && baselineScores && DOMAIN_LABELS.map((d, i) => {
                    const angle = i * angleStep;
                    const val = Math.max(0, Math.min(100, baselineScores[d.key] ?? 50));
                    const r = (val / 100) * radius;
                    const { x, y } = polarToCartesian(angle, r);
                    return (
                        <circle
                            key={`base-${i}`}
                            cx={x}
                            cy={y}
                            r={3}
                            className="radar-node-baseline"
                        />
                    );
                })}

                {/* Current Vertex Nodes & Hit Targets */}
                {showCurrent && DOMAIN_LABELS.map((d, i) => {
                    const angle = i * angleStep;
                    const val = Math.max(0, Math.min(100, scores[d.key] ?? 50));
                    const r = (val / 100) * radius;
                    const { x, y } = polarToCartesian(angle, r);
                    const isLow = val < 60;
                    const isHovered = hoveredDomain === d.key;

                    return (
                        <g key={`cur-${i}`} className="radar-node-group">
                            {/* Hitbox */}
                            <circle
                                cx={x}
                                cy={y}
                                r={14}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredDomain(d.key)}
                                onMouseLeave={() => setHoveredDomain(null)}
                            />
                            <circle
                                cx={x}
                                cy={y}
                                r={isHovered ? 7 : (isLow ? 5 : 4)}
                                className={`radar-node ${isLow ? 'low-score' : 'normal-score'} ${isHovered ? 'node-hovered' : ''}`}
                            />
                        </g>
                    );
                })}

                {/* Axis Labels & Interactive Buttons */}
                {DOMAIN_LABELS.map((d, i) => {
                    const angle = i * angleStep;
                    const labelR = radius + 28;
                    const { x, y } = polarToCartesian(angle, labelR);
                    const val = scores[d.key] ?? 50;
                    const baseVal = baselineScores ? baselineScores[d.key] : null;
                    const isHovered = hoveredDomain === d.key;

                    return (
                        <g
                            key={i}
                            className={`radar-label-group ${isHovered ? 'label-highlight' : ''}`}
                            onMouseEnter={() => setHoveredDomain(d.key)}
                            onMouseLeave={() => setHoveredDomain(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <text
                                x={x}
                                y={y - 3}
                                textAnchor="middle"
                                className="radar-axis-label"
                            >
                                {d.icon} {d.label}
                            </text>
                            <text
                                x={x}
                                y={y + 11}
                                textAnchor="middle"
                                className={`radar-axis-score ${val < 60 ? 'score-warning' : 'score-ok'}`}
                            >
                                {val}/100
                                {baseVal != null && baseVal !== val && (
                                    <tspan className="radar-axis-delta">
                                        {' '}({val - baseVal > 0 ? `+${val - baseVal}` : val - baseVal})
                                    </tspan>
                                )}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Vertex Hover Tooltip Badge */}
            {activeMeta && activeCurrentVal != null && (
                <div className="radar-hover-tooltip">
                    <div className="tooltip-header">
                        <span>{activeMeta.icon} {activeMeta.label}</span>
                        <span className="tooltip-score">{activeCurrentVal}/100</span>
                    </div>
                    <div className="tooltip-details">
                        {activeBaseVal != null && (
                            <span className="tooltip-row">
                                Baseline: <strong>{activeBaseVal}</strong>
                                {activeDelta != null && (
                                    <span className={`tooltip-delta ${activeDelta >= 0 ? 'pos' : 'neg'}`}>
                                        ({activeDelta >= 0 ? `+${activeDelta}` : activeDelta} pts)
                                    </span>
                                )}
                            </span>
                        )}
                        {activeNormVal != null && (
                            <span className="tooltip-row norm">
                                Age Normal: <strong>{activeNormVal}</strong>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
