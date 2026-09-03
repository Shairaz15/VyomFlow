import React, { useId } from 'react';
import './CognitiveRadarChart.css';

export interface CognitiveRadarDomainScores {
    memory: number;
    language: number;
    executive: number;
    processingSpeed: number;
    spatialOrientation: number;
    attention: number;
}

export interface CognitiveRadarChartProps {
    scores: CognitiveRadarDomainScores;
    normativeScores?: CognitiveRadarDomainScores;
    size?: number;
    showNormative?: boolean;
    interactive?: boolean;
}

const DOMAIN_LABELS: { key: keyof CognitiveRadarDomainScores; label: string; icon: string }[] = [
    { key: 'memory', label: 'Memory', icon: '🧠' },
    { key: 'language', label: 'Language', icon: '🗣️' },
    { key: 'processingSpeed', label: 'Speed', icon: '⚡' },
    { key: 'executive', label: 'Executive', icon: '🧩' },
    { key: 'spatialOrientation', label: 'Spatial', icon: '🗺️' },
    { key: 'attention', label: 'Attention', icon: '🎯' },
];

const DEFAULT_NORMATIVE: CognitiveRadarDomainScores = {
    memory: 85,
    language: 88,
    processingSpeed: 82,
    executive: 84,
    spatialOrientation: 86,
    attention: 85,
};

export const CognitiveRadarChart: React.FC<CognitiveRadarChartProps> = ({
    scores,
    normativeScores = DEFAULT_NORMATIVE,
    size = 320,
    showNormative = true,
}) => {
    const center = size / 2;
    const radius = size * 0.38;
    const numAxes = DOMAIN_LABELS.length;
    const angleStep = (Math.PI * 2) / numAxes;
    const chartId = useId().replace(/:/g, '');

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

    const patientPoints = getPolygonPath(scores);
    const normativePoints = getPolygonPath(normativeScores);

    // Reference grid levels (20, 40, 60, 80, 100)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

    return (
        <div className="cognitive-radar-container">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="cognitive-radar-svg"
            >
                <defs>
                    {/* Patient fill gradient */}
                    <linearGradient id={`radarPatientGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.30" />
                    </linearGradient>

                    {/* Normative fill gradient */}
                    <linearGradient id={`radarNormGrad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id={`radarGlow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Concentric Hexagons */}
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

                {/* Age-Matched Normative Envelope */}
                {showNormative && (
                    <polygon
                        points={normativePoints}
                        fill={`url(#radarNormGrad-${chartId})`}
                        className="radar-normative-polygon"
                    />
                )}

                {/* Patient Cognitive Envelope */}
                <polygon
                    points={patientPoints}
                    fill={`url(#radarPatientGrad-${chartId})`}
                    filter={`url(#radarGlow-${chartId})`}
                    className="radar-patient-polygon"
                />

                {/* Patient Vertex Nodes */}
                {DOMAIN_LABELS.map((d, i) => {
                    const angle = i * angleStep;
                    const val = Math.max(0, Math.min(100, scores[d.key] ?? 50));
                    const r = (val / 100) * radius;
                    const { x, y } = polarToCartesian(angle, r);
                    const isLow = val < 60;
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={isLow ? 5 : 4}
                            className={`radar-node ${isLow ? 'low-score' : 'normal-score'}`}
                        />
                    );
                })}

                {/* Axis Labels */}
                {DOMAIN_LABELS.map((d, i) => {
                    const angle = i * angleStep;
                    const labelR = radius + 26;
                    const { x, y } = polarToCartesian(angle, labelR);
                    const val = scores[d.key] ?? 50;

                    return (
                        <g key={i} className="radar-label-group">
                            <text
                                x={x}
                                y={y - 2}
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
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Radar Legend */}
            <div className="radar-legend">
                <div className="radar-legend-item patient">
                    <span className="legend-indicator patient-indicator"></span>
                    <span>Patient Profile</span>
                </div>
                {showNormative && (
                    <div className="radar-legend-item normative">
                        <span className="legend-indicator norm-indicator"></span>
                        <span>Age-Matched Normal (&gt;80)</span>
                    </div>
                )}
            </div>
        </div>
    );
};
