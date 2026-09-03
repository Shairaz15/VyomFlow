import React, { useId, useState } from 'react';
import type { CognitiveRadarDomainScores } from '../../services/dashboardViewModel';
import {
    polarToCartesian,
    getClosedCatmullRomSplinePath,
    type Point2D,
} from './radarMath';
import './CognitiveRadarChart.css';

export type { CognitiveRadarDomainScores };

export type RadarGeometryMode = 'hexagon' | 'organic';

export interface CognitiveRadarChartProps {
    scores: CognitiveRadarDomainScores;
    baselineScores?: CognitiveRadarDomainScores;
    normativeScores?: CognitiveRadarDomainScores;
    ghostScores?: CognitiveRadarDomainScores;
    size?: number;
    geometryMode?: RadarGeometryMode;
    showCurrent?: boolean;
    showBaseline?: boolean;
    showNormative?: boolean;
    showVolumetricDiff?: boolean;
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

// Lower normative bound for shaded 10th-90th percentile corridor
export const DEFAULT_NORMATIVE_LOWER: CognitiveRadarDomainScores = {
    memory: 72,
    language: 75,
    processingSpeed: 70,
    executive: 72,
    spatialOrientation: 74,
    attention: 72,
};

export const CognitiveRadarChart: React.FC<CognitiveRadarChartProps> = ({
    scores,
    baselineScores,
    normativeScores = DEFAULT_NORMATIVE,
    ghostScores,
    size = 350,
    geometryMode = 'organic',
    showCurrent = true,
    showBaseline = true,
    showNormative = true,
    showVolumetricDiff = true,
    activeSessionLabel,
}) => {
    const center = size / 2;
    const radius = size * 0.33;
    const numAxes = DOMAIN_LABELS.length;
    const angleStep = (Math.PI * 2) / numAxes;
    const chartId = useId().replace(/:/g, '');

    const [hoveredDomain, setHoveredDomain] = useState<keyof CognitiveRadarDomainScores | null>(null);

    // Compute coordinate points for any score object
    const getCartesianPoints = (scoreObj: CognitiveRadarDomainScores): Point2D[] => {
        return DOMAIN_LABELS.map((d, i) => {
            const angle = i * angleStep;
            const val = Math.max(0, Math.min(100, scoreObj[d.key] ?? 50));
            const r = (val / 100) * radius;
            return polarToCartesian(angle, r, center);
        });
    };

    // Formats points array into polyline string for geometric mode
    const pointsToString = (pts: Point2D[]) => pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

    const currentPoints = getCartesianPoints(scores);
    const baselinePoints = baselineScores ? getCartesianPoints(baselineScores) : null;
    const normUpperPoints = getCartesianPoints(normativeScores);
    const ghostPoints = ghostScores ? getCartesianPoints(ghostScores) : null;

    // Build paths depending on geometry mode (Organic spline vs Geometric polygon)
    const isOrganic = geometryMode === 'organic';

    const currentPath = isOrganic
        ? getClosedCatmullRomSplinePath(currentPoints, 0.55)
        : null;

    const baselinePath = (isOrganic && baselinePoints)
        ? getClosedCatmullRomSplinePath(baselinePoints, 0.55)
        : null;

    const normUpperPath = isOrganic
        ? getClosedCatmullRomSplinePath(normUpperPoints, 0.55)
        : null;

    const ghostPath = (isOrganic && ghostPoints)
        ? getClosedCatmullRomSplinePath(ghostPoints, 0.55)
        : null;

    // Concentric grid levels
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

    // Hover details
    const activeMeta = hoveredDomain
        ? DOMAIN_LABELS.find(d => d.key === hoveredDomain)
        : null;

    const activeCurrentVal = hoveredDomain ? scores[hoveredDomain] : null;
    const activeBaseVal = hoveredDomain && baselineScores ? baselineScores[hoveredDomain] : null;
    const activeNormVal = hoveredDomain ? normativeScores[hoveredDomain] : null;
    const activeDelta = (activeCurrentVal != null && activeBaseVal != null)
        ? activeCurrentVal - activeBaseVal
        : null;

    return (
        <div className="cognitive-radar-container">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                aria-label={`Cognitive Radar Chart${activeSessionLabel ? ` - ${activeSessionLabel}` : ''}`}
                className="cognitive-radar-svg"
            >
                <defs>
                    {/* Ambient Radial Backlight Diffusion */}
                    <radialGradient id={`radarBacklight-${chartId}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
                        <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.10" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                    </radialGradient>

                    {/* Patient Fill Gradient */}
                    <linearGradient id={`radarPatientGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.50" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.28" />
                    </linearGradient>

                    {/* Baseline Fill Gradient */}
                    <linearGradient id={`radarBaselineGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="0.08" />
                    </linearGradient>

                    {/* Center Hub Orb Gradient */}
                    <radialGradient id={`radarHubGrad-${chartId}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                        <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
                    </radialGradient>

                    {/* Luminous Neon Filter */}
                    <filter id={`radarNeonGlow-${chartId}`} x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ambient Center Glow */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius * 1.05}
                    fill={`url(#radarBacklight-${chartId})`}
                    pointerEvents="none"
                />

                {/* Concentric Grid Rings */}
                {gridLevels.map((lvl, idx) => {
                    const r = lvl * radius;
                    const hexPoints = DOMAIN_LABELS.map((_, i) => {
                        const { x, y } = polarToCartesian(i * angleStep, r, center);
                        return `${x.toFixed(2)},${y.toFixed(2)}`;
                    }).join(' ');

                    return (
                        <polygon
                            key={idx}
                            points={hexPoints}
                            className={`radar-grid-polygon ${lvl === 1.0 ? 'outer-ring' : ''}`}
                        />
                    );
                })}

                {/* Radial Spokes */}
                {DOMAIN_LABELS.map((d, i) => {
                    const { x, y } = polarToCartesian(i * angleStep, radius, center);
                    const isSpokeHovered = hoveredDomain === d.key;

                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            className={`radar-spoke ${isSpokeHovered ? 'radar-spoke-highlight' : ''}`}
                        />
                    );
                })}

                {/* Layer 1: Normative 10th-90th Percentile Corridor Band */}
                {showNormative && (
                    <g className="radar-normative-layer">
                        {isOrganic ? (
                            <path
                                d={normUpperPath || ''}
                                className="radar-normative-line"
                            />
                        ) : (
                            <polygon
                                points={pointsToString(normUpperPoints)}
                                className="radar-normative-line"
                            />
                        )}
                    </g>
                )}

                {/* Layer 2: Baseline Envelope (Amber) */}
                {showBaseline && baselinePoints && (
                    <g className="radar-baseline-layer">
                        {isOrganic ? (
                            <path
                                d={baselinePath || ''}
                                fill={`url(#radarBaselineGrad-${chartId})`}
                                className="radar-baseline-polygon"
                            />
                        ) : (
                            <polygon
                                points={pointsToString(baselinePoints)}
                                fill={`url(#radarBaselineGrad-${chartId})`}
                                className="radar-baseline-polygon"
                            />
                        )}
                    </g>
                )}

                {/* Layer 3: Ghost Trail (Smooth Motion Feedback) */}
                {ghostPoints && (
                    <g className="radar-ghost-layer" pointerEvents="none">
                        {isOrganic ? (
                            <path
                                d={ghostPath || ''}
                                className="radar-ghost-polygon"
                            />
                        ) : (
                            <polygon
                                points={pointsToString(ghostPoints)}
                                className="radar-ghost-polygon"
                            />
                        )}
                    </g>
                )}

                {/* Layer 4: Volumetric Loss/Contraction Zones (< Baseline) */}
                {showVolumetricDiff && showBaseline && baselinePoints && (
                    <g className="radar-volumetric-diff-layer" pointerEvents="none">
                        {DOMAIN_LABELS.map((d, i) => {
                            const curVal = scores[d.key] ?? 50;
                            const baseVal = baselineScores ? baselineScores[d.key] ?? 50 : curVal;
                            if (curVal >= baseVal) return null; // Only highlight deficit contractions

                            const nextIdx = (i + 1) % numAxes;
                            const nextKey = DOMAIN_LABELS[nextIdx].key;
                            const nextCurVal = scores[nextKey] ?? 50;
                            const nextBaseVal = baselineScores ? baselineScores[nextKey] ?? 50 : nextCurVal;

                            const pCur1 = polarToCartesian(i * angleStep, (curVal / 100) * radius, center);
                            const pBase1 = polarToCartesian(i * angleStep, (baseVal / 100) * radius, center);
                            const pBase2 = polarToCartesian(nextIdx * angleStep, (nextBaseVal / 100) * radius, center);
                            const pCur2 = polarToCartesian(nextIdx * angleStep, (nextCurVal / 100) * radius, center);

                            const diffPoly = `${pCur1.x},${pCur1.y} ${pBase1.x},${pBase1.y} ${pBase2.x},${pBase2.y} ${pCur2.x},${pCur2.y}`;

                            return (
                                <polygon
                                    key={`diff-${i}`}
                                    points={diffPoly}
                                    className="radar-volumetric-deficit"
                                />
                            );
                        })}
                    </g>
                )}

                {/* Layer 5: Active Patient Envelope */}
                {showCurrent && (
                    <g className="radar-current-layer">
                        {isOrganic ? (
                            <path
                                d={currentPath || ''}
                                fill={`url(#radarPatientGrad-${chartId})`}
                                filter={`url(#radarNeonGlow-${chartId})`}
                                className="radar-patient-path-organic"
                            />
                        ) : (
                            <polygon
                                points={pointsToString(currentPoints)}
                                fill={`url(#radarPatientGrad-${chartId})`}
                                filter={`url(#radarNeonGlow-${chartId})`}
                                className="radar-patient-polygon"
                            />
                        )}
                    </g>
                )}

                {/* Center Hub Glowing Orb */}
                <circle
                    cx={center}
                    cy={center}
                    r={5}
                    fill={`url(#radarHubGrad-${chartId})`}
                    className="radar-center-hub"
                />

                {/* Baseline Vertex Nodes */}
                {showBaseline && baselinePoints && baselinePoints.map((pt, i) => (
                    <circle
                        key={`base-node-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={2.5}
                        className="radar-node-baseline"
                    />
                ))}

                {/* Active Vertex Nodes with Deficit Pulse Rings & Floating Value Pins */}
                {showCurrent && currentPoints.map((pt, i) => {
                    const d = DOMAIN_LABELS[i];
                    const val = scores[d.key] ?? 50;
                    const isDeficit = val < 60;
                    const isHovered = hoveredDomain === d.key;

                    return (
                        <g key={`cur-node-${i}`} className="radar-node-group">
                            {/* Deficit Warning Pulse Ripple */}
                            {isDeficit && (
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={6}
                                    className="radar-pulse-ring"
                                />
                            )}

                            {/* Large Transparent Hitbox for Hover */}
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={16}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredDomain(d.key)}
                                onMouseLeave={() => setHoveredDomain(null)}
                            />

                            {/* Crisp Vertex Pin */}
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 7 : (isDeficit ? 5.5 : 4)}
                                className={`radar-node ${isDeficit ? 'low-score' : 'normal-score'} ${isHovered ? 'node-hovered' : ''}`}
                            />
                        </g>
                    );
                })}

                {/* Axis Labels & Interactive Headers */}
                {DOMAIN_LABELS.map((d, i) => {
                    const angle = i * angleStep;
                    const labelR = radius + 24;
                    const { x, y } = polarToCartesian(angle, labelR, center);
                    const val = Math.round(scores[d.key] ?? 50);
                    const baseVal = baselineScores ? Math.round(baselineScores[d.key] ?? 50) : null;
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
                                    <tspan className={`radar-axis-delta ${val >= baseVal ? 'pos' : 'neg'}`}>
                                        {' '}({val >= baseVal ? `+${val - baseVal}` : val - baseVal})
                                    </tspan>
                                )}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Vertex Hover Tooltip */}
            {activeMeta && activeCurrentVal != null && (
                <div className="radar-hover-tooltip">
                    <div className="tooltip-header">
                        <span>{activeMeta.icon} {activeMeta.label}</span>
                        <span className="tooltip-score">{Math.round(activeCurrentVal)}/100</span>
                    </div>
                    <div className="tooltip-details">
                        {activeBaseVal != null && (
                            <span className="tooltip-row">
                                Baseline: <strong>{Math.round(activeBaseVal)}</strong>
                                {activeDelta != null && (
                                    <span className={`tooltip-delta ${activeDelta >= 0 ? 'pos' : 'neg'}`}>
                                        ({activeDelta >= 0 ? `+${Math.round(activeDelta)}` : Math.round(activeDelta)} pts)
                                    </span>
                                )}
                            </span>
                        )}
                        {activeNormVal != null && (
                            <span className="tooltip-row norm">
                                Normative Cohort: <strong>{Math.round(activeNormVal)}</strong>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
