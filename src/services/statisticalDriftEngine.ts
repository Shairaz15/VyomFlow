/**
 * VyomFlow Statistical Longitudinal Drift Engine
 * ===============================================
 * Deterministic Biostatistical Implementation adhering strictly to Section 6 of
 * VyomFlow_AI_Architecture.md.
 *
 * Implements:
 * 1. Reliable Change Index (RCI) with Module-Specific Test-Retest Reliability ($r_{xx}$)
 * 2. Theil-Sen Robust Trajectory Estimator ($\beta$) across multi-session intervals
 * 3. Intra-Individual Z-Score Deviation ($Z_{\text{drift}}$)
 * 4. Clinically Meaningful 5-Tier Trajectory Spectrum
 */

export interface ModuleReliabilityConfig {
    rxx: number; // Test-retest reliability coefficient
    typicalBaselineSD: number; // Normative baseline standard deviation
    name: string;
}

/**
 * Module-specific test-retest reliability parameters from literature and empirical cohorts
 * (VyomFlow_AI_Architecture.md Section 6.1)
 */
export const MODULE_RELIABILITIES: Record<string, ModuleReliabilityConfig> = {
    vmra: {
        rxx: 0.82,
        typicalBaselineSD: 12.5,
        name: 'Visual Memory Recall (VMRA)',
    },
    savt: {
        rxx: 0.88,
        typicalBaselineSD: 10.0,
        name: 'Sustained Attention & Vigilance (SAVT)',
    },
    language: {
        rxx: 0.78,
        typicalBaselineSD: 11.0,
        name: 'Language & Speech Fluency',
    },
    story: {
        rxx: 0.84,
        typicalBaselineSD: 12.0,
        name: 'Story Recall',
    },
    navigation: {
        rxx: 0.80,
        typicalBaselineSD: 13.0,
        name: 'Video Navigation & Spatial Memory',
    },
    pattern: {
        rxx: 0.82,
        typicalBaselineSD: 11.5,
        name: 'Visual Pattern Memory',
    },
    reaction: {
        rxx: 0.86,
        typicalBaselineSD: 10.5,
        name: 'Psychomotor Reaction Speed',
    },
    composite: {
        rxx: 0.88,
        typicalBaselineSD: 10.0,
        name: 'Overall Cognitive Composite',
    },
};

export const MODULE_RELIABILITY: Record<string, number> = {
    VMRA: 0.82,
    SAVT: 0.88,
    LANGUAGE: 0.78,
    STORY: 0.84,
    NAVIGATION: 0.80,
    DEFAULT: 0.80,
};

export type TrajectoryTier = 'Stable' | 'Possible Decline' | 'Likely Decline' | 'Rapid Decline' | 'Improving';

export type TrajectoryCategory =
    | 'STABLE'
    | 'POSSIBLE_DECLINE'
    | 'LIKELY_DECLINE'
    | 'RAPID_DECLINE'
    | 'IMPROVING'
    | 'INSUFFICIENT_DATA';

export interface RCIResult {
    rci: number;
    sem: number;
    sed: number;
    isStatisticallySignificant: boolean; // |RCI| >= 1.96 (p < 0.05)
    isMarkedChange: boolean;             // |RCI| >= 2.58 (p < 0.01)
    direction: 'improved' | 'declined' | 'stable';
    pValApprox: number;
}

export interface TrajectoryClassification {
    tier: TrajectoryTier;
    rci: number;
    theilSenSlopePerMonth: number;
    coefficientOfVariationPercent: number;
    zDrift: number;
    clinicalInterpretation: string;
    actionGuidance: string;
    isLongitudinalReliable: boolean;
}

export interface LongitudinalSessionPoint {
    timestamp: number; // Unix timestamp in milliseconds
    score: number;     // 0 to 100 standardized score
    domainScores?: Record<string, number>;
}

export type SessionPoint = LongitudinalSessionPoint;

export interface LongitudinalEvaluation {
    trajectory: TrajectoryClassification;
    sessionCount: number;
    firstSessionDate: Date;
    latestSessionDate: Date;
    elapsedMonths: number;
    domainDrifts: Record<string, { rci: number; slope: number; tier: TrajectoryTier }>;
    historicalScores: number[];
}

export interface SessionData {
    sessionId: string;
    timestamp: number; // Unix epoch ms
    moduleScores: Record<string, number>; // e.g. { VMRA: 85, SAVT: 90 }
}

export interface DriftMetrics {
    rci: Record<string, number>;
    beta: Record<string, number>; // Theil-Sen Slope
    zDrift: Record<string, number>;
    cv: Record<string, number>; // Coefficient of Variation
    overallTrajectory: TrajectoryCategory;
}

/**
 * Standard Error of Measurement (SEM):
 * SEM = s_baseline * sqrt(1 - r_xx)
 */
export function calculateSEM(sBaseline: number, rxx: number): number {
    const clampedRxx = Math.max(0, Math.min(0.999, rxx));
    return sBaseline * Math.sqrt(1 - clampedRxx);
}

/**
 * Standard Error of Difference (SED):
 * SED = sqrt(2 * SEM^2) = SEM * sqrt(2)
 */
export function calculateSED(sem: number): number {
    return sem * Math.SQRT2;
}

/**
 * Reliable Change Index (RCI):
 * RCI = (X_t - X_baseline) / SED
 */
export function calculateRCI(
    currentScore: number,
    baselineScore: number,
    baselineStdOrSed: number,
    rxx?: number
): number {
    if (rxx !== undefined) {
        // 4-parameter signature: calculateRCI(current, base, std, rxx)
        if (baselineStdOrSed <= 0) return 0;
        const sem = baselineStdOrSed * Math.sqrt(1 - rxx);
        const sed = Math.sqrt(2 * Math.pow(sem, 2));
        if (sed === 0) return 0;
        return (currentScore - baselineScore) / sed;
    }
    // 3-parameter signature: calculateRCI(current, base, sed)
    if (baselineStdOrSed <= 0) return 0;
    return (currentScore - baselineScore) / baselineStdOrSed;
}

/**
 * Calculates RCI for a specific module
 */
export function calculateModuleRCI(
    moduleKey: string,
    currentScore: number,
    baselineScore: number,
    customSD?: number
): RCIResult {
    const config = MODULE_RELIABILITIES[moduleKey.toLowerCase()] || MODULE_RELIABILITIES.composite;
    const sd = customSD && customSD > 0 ? customSD : config.typicalBaselineSD;

    const sem = calculateSEM(sd, config.rxx);
    const sed = calculateSED(sem);
    const rci = calculateRCI(currentScore, baselineScore, sed);

    const absRci = Math.abs(rci);
    const isStatisticallySignificant = absRci >= 1.96; // 95% CI (p < 0.05)
    const isMarkedChange = absRci >= 2.58;             // 99% CI (p < 0.01)

    let direction: 'improved' | 'declined' | 'stable' = 'stable';
    if (rci >= 1.0) direction = 'improved';
    else if (rci <= -1.0) direction = 'declined';

    // Approximate p-value from normal CDF
    const pValApprox = Math.min(1.0, Math.max(0.0001, 2 * (1 - normalCDF(absRci))));

    return {
        rci: Math.round(rci * 1000) / 1000,
        sem: Math.round(sem * 100) / 100,
        sed: Math.round(sed * 100) / 100,
        isStatisticallySignificant,
        isMarkedChange,
        direction,
        pValApprox: Math.round(pValApprox * 1000) / 1000,
    };
}

/**
 * Theil-Sen Robust Trajectory Estimator (beta):
 * Supports both array of points {timeMonths, score} and (scores, times) signature.
 */
export function calculateTheilSenSlope(
    pointsOrScores: Array<{ timeMonths: number; score: number }> | number[],
    times?: number[]
): number {
    let points: Array<{ timeMonths: number; score: number }> = [];

    if (Array.isArray(pointsOrScores) && pointsOrScores.length > 0 && typeof pointsOrScores[0] === 'number' && times) {
        points = (pointsOrScores as number[]).map((score, idx) => ({
            timeMonths: times[idx],
            score,
        }));
    } else {
        points = pointsOrScores as Array<{ timeMonths: number; score: number }>;
    }

    const n = points.length;
    if (n < 2) return 0;

    const pairwiseSlopes: number[] = [];

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const dt = points[j].timeMonths - points[i].timeMonths;
            if (Math.abs(dt) > 1e-4) {
                const slope = (points[j].score - points[i].score) / dt;
                pairwiseSlopes.push(slope);
            }
        }
    }

    if (pairwiseSlopes.length === 0) return 0;

    pairwiseSlopes.sort((a, b) => a - b);
    const mid = Math.floor(pairwiseSlopes.length / 2);

    if (pairwiseSlopes.length % 2 === 0) {
        return (pairwiseSlopes[mid - 1] + pairwiseSlopes[mid]) / 2;
    }
    return pairwiseSlopes[mid];
}

/**
 * Intra-Individual Z-Score Deviation (Z_drift):
 * Z_drift = (X_t - mu_baseline) / sigma_baseline
 */
export function calculateZDrift(
    currentScore: number,
    baselineMean: number,
    baselineStd: number
): number {
    const std = baselineStd > 0 ? baselineStd : 1.0;
    return (currentScore - baselineMean) / std;
}

/**
 * Calculates Coefficient of Variation (CV) as a percentage
 */
export function calculateCV(scores: number[]): number {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (mean === 0) return 0;

    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (scores.length - 1);
    const std = Math.sqrt(variance);
    return (std / mean) * 100;
}

/**
 * Normal Cumulative Distribution Function approximation (Abramowitz & Stegun)
 */
function normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
        d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
}

/**
 * Classifies multi-indicator longitudinal trajectory into the 5-tier spectrum
 * (VyomFlow_AI_Architecture.md Section 6.4)
 */
export function classifyTrajectory(
    rci: number,
    theilSenSlopeMonthly: number,
    cvPercent: number,
    domainRCIs: Record<string, number> = {}
): TrajectoryClassification {
    const domainRCIValues = Object.values(domainRCIs);
    const multiDomainSevereDrop = domainRCIValues.filter((r) => r <= -2.58).length >= 2;
    const singleDomainReliableDrop = domainRCIValues.some((r) => r <= -1.96);

    let tier: TrajectoryTier;
    let clinicalInterpretation: string;
    let actionGuidance: string;

    if (rci <= -2.58 || multiDomainSevereDrop || theilSenSlopeMonthly < -0.30) {
        tier = 'Rapid Decline';
        clinicalInterpretation = 'Marked multi-domain drop exceeding test-retest bounds at p < 0.01.';
        actionGuidance = 'Recommend expedited formal clinician evaluation with summary report.';
    } else if (rci <= -1.96 || singleDomainReliableDrop || theilSenSlopeMonthly < -0.15) {
        tier = 'Likely Decline';
        clinicalInterpretation = 'Statistically reliable cognitive decrease exceeding measurement error (p < 0.05).';
        actionGuidance = 'Recommend earlier follow-up re-assessment in 3–4 weeks.';
    } else if (rci <= -1.0 || theilSenSlopeMonthly < -0.05) {
        tier = 'Possible Decline';
        clinicalInterpretation = 'Subtle downward trend observed within physiological test-retest bounds.';
        actionGuidance = 'Continue monitoring with re-assessment in 6–8 weeks.';
    } else if (rci >= 1.96 || theilSenSlopeMonthly > 0.10) {
        tier = 'Improving';
        clinicalInterpretation = 'Statistically reliable gain indicating practice effect or transient state recovery.';
        actionGuidance = 'Maintain routine healthy lifestyle habits and regular annual check-ins.';
    } else {
        tier = 'Stable';
        clinicalInterpretation = 'Cognitive performance is consistent with personal baseline within expected bounds.';
        actionGuidance = 'Continue routine annual / semi-annual check-in schedule.';
    }

    const zDrift = Math.round((rci / Math.SQRT2) * 100) / 100;

    return {
        tier,
        rci: Math.round(rci * 100) / 100,
        theilSenSlopePerMonth: Math.round(theilSenSlopeMonthly * 100) / 100,
        coefficientOfVariationPercent: Math.round(cvPercent * 10) / 10,
        zDrift,
        clinicalInterpretation,
        actionGuidance,
        isLongitudinalReliable: Math.abs(rci) >= 1.96,
    };
}

/**
 * Evaluates full multi-session patient history
 */
export function evaluatePatientTrajectory(
    sessions: LongitudinalSessionPoint[]
): LongitudinalEvaluation {
    if (sessions.length === 0) {
        const defaultTier = classifyTrajectory(0, 0, 0);
        return {
            trajectory: defaultTier,
            sessionCount: 0,
            firstSessionDate: new Date(),
            latestSessionDate: new Date(),
            elapsedMonths: 0,
            domainDrifts: {},
            historicalScores: [],
        };
    }

    // Sort chronologically
    const sorted = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
    const baseline = sorted[0];
    const latest = sorted[sorted.length - 1];

    const firstDate = new Date(baseline.timestamp);
    const latestDate = new Date(latest.timestamp);
    const elapsedDays = Math.max(1, (latest.timestamp - baseline.timestamp) / (1000 * 60 * 60 * 24));
    const elapsedMonths = Math.max(0.1, elapsedDays / 30.0);

    const scores = sorted.map((s) => s.score);
    const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, val) => sum + Math.pow(val - meanScore, 2), 0) / Math.max(1, scores.length - 1);
    const sd = Math.sqrt(variance);
    const cvPercent = meanScore > 0 ? (sd / meanScore) * 100 : 0;

    // Theil-Sen Slope
    const pointsForSlope = sorted.map((s) => ({
        timeMonths: (s.timestamp - baseline.timestamp) / (1000 * 60 * 60 * 24 * 30.0),
        score: s.score,
    }));
    const theilSenSlope = calculateTheilSenSlope(pointsForSlope);

    // Composite RCI
    const compositeRciRes = calculateModuleRCI('composite', latest.score, baseline.score, sd > 0 ? sd : undefined);

    // Evaluate sub-domains if available
    const domainDrifts: Record<string, { rci: number; slope: number; tier: TrajectoryTier }> = {};
    const domainRCIMap: Record<string, number> = {};

    if (baseline.domainScores && latest.domainScores) {
        const domainKeys = Object.keys(latest.domainScores);
        for (const dom of domainKeys) {
            const baseVal = baseline.domainScores[dom] ?? 80;
            const currVal = latest.domainScores[dom] ?? 80;

            const domPoints = sorted
                .filter((s) => s.domainScores && s.domainScores[dom] !== undefined)
                .map((s) => ({
                    timeMonths: (s.timestamp - baseline.timestamp) / (1000 * 60 * 60 * 24 * 30.0),
                    score: s.domainScores![dom],
                }));

            const domSlope = calculateTheilSenSlope(domPoints);
            const domRci = calculateModuleRCI(dom, currVal, baseVal);
            const domClass = classifyTrajectory(domRci.rci, domSlope, cvPercent);

            domainDrifts[dom] = {
                rci: domRci.rci,
                slope: Math.round(domSlope * 100) / 100,
                tier: domClass.tier,
            };
            domainRCIMap[dom] = domRci.rci;
        }
    }

    const trajectory = classifyTrajectory(compositeRciRes.rci, theilSenSlope, cvPercent, domainRCIMap);

    return {
        trajectory,
        sessionCount: sorted.length,
        firstSessionDate: firstDate,
        latestSessionDate: latestDate,
        elapsedMonths: Math.round(elapsedMonths * 10) / 10,
        domainDrifts,
        historicalScores: scores,
    };
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

/**
 * Evaluates the full longitudinal drift across all modules (Module-centric input)
 */
export function evaluateLongitudinalDrift(sessions: SessionData[], normativeStd: number = 10): DriftMetrics {
    const result: DriftMetrics = {
        rci: {},
        beta: {},
        zDrift: {},
        cv: {},
        overallTrajectory: 'INSUFFICIENT_DATA',
    };

    if (sessions.length < 2) {
        return result;
    }

    const modules = new Set<string>();
    sessions.forEach((s) => Object.keys(s.moduleScores).forEach((m) => modules.add(m)));

    let worstTrajectoryLevel = 0;

    modules.forEach((mod) => {
        const dataPoints = sessions
            .filter((s) => s.moduleScores[mod] !== undefined)
            .map((s) => ({
                timeMonths: s.timestamp / MS_PER_MONTH,
                score: s.moduleScores[mod],
            }));

        if (dataPoints.length < 2) return;

        const scores = dataPoints.map((d) => d.score);
        const times = dataPoints.map((d) => d.timeMonths);

        const baselineScore = scores[0];
        const currentScore = scores[scores.length - 1];

        let baselineStd = normativeStd;
        let baselineMean = baselineScore;
        if (scores.length >= 3) {
            const histScores = scores.slice(0, scores.length - 1);
            baselineMean = histScores.reduce((a, b) => a + b, 0) / histScores.length;
            const variance =
                histScores.reduce((a, b) => a + Math.pow(b - baselineMean, 2), 0) /
                (histScores.length > 1 ? histScores.length - 1 : 1);
            baselineStd = Math.sqrt(variance) > 0 ? Math.sqrt(variance) : normativeStd;
        }

        const rxx = MODULE_RELIABILITY[mod] || MODULE_RELIABILITY.DEFAULT;

        const rci = calculateRCI(currentScore, baselineScore, baselineStd, rxx);
        const beta = calculateTheilSenSlope(scores, times);
        const zDrift = calculateZDrift(currentScore, baselineMean, baselineStd);
        const cv = calculateCV(scores);

        result.rci[mod] = rci;
        result.beta[mod] = beta;
        result.zDrift[mod] = zDrift;
        result.cv[mod] = cv;

        let level = 0;
        if (rci <= -2.58 && beta < -0.30) {
            level = 3; // Rapid Decline
        } else if (rci <= -1.96 && beta < -0.15) {
            level = 2; // Likely Decline
        } else if (rci <= -1.0 && rci > -1.96 && beta >= -0.15 && beta < -0.05) {
            level = 1; // Possible Decline
        } else if (rci >= 1.96 && beta > 0.10) {
            level = -1; // Improving
        } else {
            level = 0; // Stable
        }

        worstTrajectoryLevel = Math.max(worstTrajectoryLevel, level);
    });

    if (worstTrajectoryLevel === 3) result.overallTrajectory = 'RAPID_DECLINE';
    else if (worstTrajectoryLevel === 2) result.overallTrajectory = 'LIKELY_DECLINE';
    else if (worstTrajectoryLevel === 1) result.overallTrajectory = 'POSSIBLE_DECLINE';
    else if (worstTrajectoryLevel === -1) result.overallTrajectory = 'IMPROVING';
    else result.overallTrajectory = 'STABLE';

    return result;
}
