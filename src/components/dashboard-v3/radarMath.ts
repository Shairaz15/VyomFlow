/**
 * Radar Math & Spline Algorithms
 * ==============================
 * Pure mathematical utilities for rendering ultra-smooth 60fps radar visualizations,
 * closed Catmull-Rom / Cardinal cubic Bézier splines, and continuous domain vector lerp.
 */

import type { CognitiveRadarDomainScores } from '../../services/dashboardViewModel';

export interface Point2D {
    x: number;
    y: number;
}

/**
 * Converts polar coordinates (angle, radius) to 2D Cartesian (x, y).
 */
export function polarToCartesian(angle: number, r: number, center: number): Point2D {
    return {
        x: center + r * Math.sin(angle),
        y: center - r * Math.cos(angle),
    };
}

/**
 * Generates an SVG path for a closed Cardinal / Catmull-Rom cubic spline connecting an array of points.
 * Creates an organic, flowing biological envelope rather than rigid straight lines.
 */
export function getClosedCatmullRomSplinePath(points: Point2D[], tension: number = 0.5): string {
    const n = points.length;
    if (n < 3) return '';

    let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)} `;

    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        // Control point 1
        const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
        const cp1y = p1.y + (p2.y - p0.y) * tension / 3;

        // Control point 2
        const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
        const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

        d += `C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} `;
    }

    d += 'Z';
    return d;
}

/**
 * Linearly interpolates between two score vectors at parameter alpha in [0, 1].
 * Used by the 60fps requestAnimationFrame continuous tweening engine.
 */
export function interpolateDomainScores(
    a: CognitiveRadarDomainScores,
    b: CognitiveRadarDomainScores,
    alpha: number
): CognitiveRadarDomainScores {
    // Smoothstep easing for natural biological acceleration/deceleration
    const t = Math.max(0, Math.min(1, alpha));
    const smoothAlpha = t * t * (3 - 2 * t);

    const lerp = (v1: number, v2: number) => Math.round((v1 + (v2 - v1) * smoothAlpha) * 10) / 10;

    return {
        memory: lerp(a.memory, b.memory),
        language: lerp(a.language, b.language),
        executive: lerp(a.executive, b.executive),
        processingSpeed: lerp(a.processingSpeed, b.processingSpeed),
        spatialOrientation: lerp(a.spatialOrientation, b.spatialOrientation),
        attention: lerp(a.attention, b.attention),
    };
}
