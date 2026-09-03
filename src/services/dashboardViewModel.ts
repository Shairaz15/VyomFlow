/**
 * VyomFlow Dashboard V2 — ViewModel Layer
 * =========================================
 * Pure TypeScript module. No React dependencies.
 *
 * Defines the complete DashboardViewModel type and the
 * buildDashboardViewModel() function that transforms raw module results,
 * ML predictions, drift metrics, and clinical alerts into a single
 * ready-to-render data structure.
 *
 * Every dashboard-v2 component receives its slice of this ViewModel as props.
 */

import type { CognitiveModelPrediction } from './clinicalModelEngine';
import type { RawDashboardData, UserDemographics } from './dataMapper';
import type {
    LongitudinalEvaluation,
    DriftMetrics,
} from './statisticalDriftEngine';
import type { AlertOutput } from './clinicalAlertEngine';

// ─── Section 1: Hero Summary ───────────────────────────────────
export interface OverviewViewModel {
    cognitiveStatus: 'Stable' | 'Possible Risk' | 'Needs Attention';
    statusEmoji: '🟢' | '🟡' | '🟠' | '🔴';
    statusColor: 'green' | 'yellow' | 'orange' | 'red';
    confidence: number;           // 0-100
    lastAssessmentDate: string;   // Human-readable date string
    comparisonSummary: string;    // "No significant decline detected"
    recommendation: string;       // "Continue annual monitoring"
}

// ─── Section 2: AI Prediction ──────────────────────────────────
export interface AIPredictionViewModel {
    predictedStatus: 'Normal' | 'MCI' | 'Dementia';
    probabilities: { normal: number; mci: number; dementia: number };
    estimatedMoCA: number;        // 0.0 - 30.0
    mocaCI: number;               // ±X points
    riskScore: number;            // 0.0 - 1.0
    riskLevel: 'Low' | 'Moderate' | 'High';
    modelConfidence: number;      // 0-100
    batteryCoverage: number;      // 0.0 - 1.0
    completedModules: string[];
}

// ─── Section 3: Domain Scores ──────────────────────────────────
export interface DomainScoreViewModel {
    key: string;                  // 'memory' | 'language' | etc.
    name: string;                 // 'Memory'
    icon: string;                 // '🧠'
    score: number;                // 0-100
    previousScore: number | null;
    delta: number | null;         // +3, -5, 0
    trend: 'up' | 'down' | 'stable';
    label: string;                // 'Good' | 'Monitor' | 'Stable' | 'Improving'
}

// ─── Section 4: Module Trend Charts ────────────────────────────
export interface ModuleSessionPoint {
    sessionLabel: string;         // "Session 1"
    date: string;                 // "12/08/2026"
    timestamp: number;
    score: number | null;
    rawResult: any;               // Full result object for biomarker drill-down
}

export interface ModuleTrendViewModel {
    moduleKey: string;            // 'vmra' | 'story' | 'language' | 'pattern' | 'reaction' | 'navigation' | 'memory'
    moduleName: string;           // 'Visual Memory (VMRA)'
    chartColor: string;           // '#06b6d4'
    unit: string;                 // '/100' | 'ms' | '%'
    domain: [number | 'auto', number | 'auto']; // Y-axis domain
    sessions: ModuleSessionPoint[];
}

// ─── Section 5: Changes Since Previous Visit ────────────────────
export interface ChangesViewModel {
    improved: { domain: string; delta: number }[];
    declined: { domain: string; delta: number }[];
    stable: string[];
}

// ─── Section 6: Assessment Module Cards ─────────────────────────
export interface AssessmentModuleViewModel {
    key: string;
    name: string;
    icon: string;
    score: number | null;
    maxScore: number;
    isCompleted: boolean;
    sessionCount: number;
    lastCompletedDate: string | null;
    route: string;
}

// ─── Section 7: Explainability ──────────────────────────────────
export interface ExplainabilityViewModel {
    positive: { factor: string; description: string }[];
    negative: { factor: string; description: string }[];
}

// ─── Section 8: Longitudinal Summary ────────────────────────────
export interface LongitudinalViewModel {
    trajectory: string;           // 'Stable' | 'Possible Decline' | etc.
    trajectoryColor: string;      // '#4ade80' for Stable, '#fbbf24' for Possible, etc.
    summary: string;              // "No statistically significant decline detected"
    sessionCount: number;
    lastUpdated: string;
    advancedMetrics: {
        rci: number;
        theilSenSlope: number;
        zDrift: number;
        cv: number;
    } | null;
}

// ─── Section 9: Recommendation ──────────────────────────────────
export interface RecommendationViewModel {
    text: string;
    urgency: 'routine' | 'followup' | 'clinical';
    icon: string;
}

// ─── Section 10: Clinician Report ───────────────────────────────
export interface ModuleBiomarkerSummary {
    name: string;
    value: number;
    unit: string;
    status: 'normal' | 'watch' | 'concern';
}

export interface ClinicianReportViewModel {
    demographics: { age: number; gender: string; educationYears: number };
    prediction: CognitiveModelPrediction | null;
    allModuleResults: RawDashboardData;
    topBiomarkersPerModule: Record<string, ModuleBiomarkerSummary[]>;
    driftMetrics: DriftMetrics | null;
    sessionHistory: {
        date: string;
        moduleScores: Record<string, number | null>;
    }[];
}

// ─── Master ViewModel ───────────────────────────────────────────
export interface DashboardViewModel {
    overview: OverviewViewModel;
    aiPrediction: AIPredictionViewModel;
    domainScores: DomainScoreViewModel[];
    moduleTrends: ModuleTrendViewModel[];
    changes: ChangesViewModel;
    assessmentModules: AssessmentModuleViewModel[];
    explainability: ExplainabilityViewModel;
    longitudinal: LongitudinalViewModel;
    recommendation: RecommendationViewModel;
    clinicianReport: ClinicianReportViewModel;
    radarScores: {
        memory: number;
        language: number;
        executive: number;
        processingSpeed: number;
        spatialOrientation: number;
        attention: number;
    };
    hasData: boolean;
    isLoading: boolean;
    sessionCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & MAPS
// ═══════════════════════════════════════════════════════════════════

const DOMAIN_META: { key: string; name: string; icon: string }[] = [
    { key: 'memory', name: 'Memory', icon: '🧠' },
    { key: 'language', name: 'Language', icon: '🗣️' },
    { key: 'executive', name: 'Executive', icon: '🧩' },
    { key: 'processingSpeed', name: 'Processing Speed', icon: '⚡' },
    { key: 'spatialOrientation', name: 'Spatial', icon: '🗺️' },
    { key: 'attention', name: 'Attention', icon: '🎯' },
];

const MODULE_META: {
    key: string;
    name: string;
    icon: string;
    chartColor: string;
    unit: string;
    domain: [number | 'auto', number | 'auto'];
    route: string;
}[] = [
    { key: 'reaction', name: 'Reaction Time', icon: '⚡', chartColor: '#fbbf24', unit: 'ms', domain: ['auto', 'auto'], route: '/test/reaction' },
    { key: 'attention', name: 'Sustained Attention (SAVT)', icon: '🎯', chartColor: '#10b981', unit: '/100', domain: [0, 100], route: '/test/attention' },
    { key: 'vmra', name: 'Visual Memory (VMRA)', icon: '🧠', chartColor: '#f472b6', unit: '%', domain: [0, 100], route: '/test/vmra' },
    { key: 'story', name: 'Story Recall', icon: '📖', chartColor: '#60a5fa', unit: '/100', domain: [0, 100], route: '/test/story' },
    { key: 'language', name: 'Language & Speech', icon: '🗣️', chartColor: '#c084fc', unit: '/100', domain: [0, 100], route: '/test/language' },
    { key: 'pattern', name: 'Pattern Working Memory', icon: '🧩', chartColor: '#38bdf8', unit: '%', domain: [0, 100], route: '/tests/pattern' },
    { key: 'navigation', name: 'Immersive Navigation', icon: '🗺️', chartColor: '#06b6d4', unit: '/100', domain: [0, 100], route: '/test/navigation' },
];

/** Translates raw biomarker attributions into human-readable descriptions */
const BIOMARKER_TRANSLATIONS: Record<string, { positive: string; negative: string; domain: string }> = {
    vmra_recallAccuracy: { positive: 'Strong visual memory recall', negative: 'Reduced visual memory recall', domain: 'Memory' },
    vmra_delayedRecallAccuracy: { positive: 'Good delayed recall retention', negative: 'Reduced delayed recall', domain: 'Memory' },
    vmra_forgettingCurveSlope: { positive: 'Slow forgetting rate', negative: 'Rapid forgetting rate', domain: 'Memory' },
    vmra_intrusionErrors: { positive: 'Low intrusion errors', negative: 'Elevated intrusion errors', domain: 'Memory' },
    story_recallAccuracy: { positive: 'Strong story recall', negative: 'Reduced story recall', domain: 'Memory' },
    story_infoUnitsRecalled: { positive: 'Good detail retention', negative: 'Missed key story details', domain: 'Memory' },
    lang_cognitiveSpeechIndex: { positive: 'Stable speech fluency', negative: 'Reduced speech fluency', domain: 'Language' },
    lang_lexicalDiversity: { positive: 'Rich vocabulary usage', negative: 'Limited vocabulary usage', domain: 'Language' },
    lang_hesitationIndex: { positive: 'Fluent speech production', negative: 'Increased speech hesitations', domain: 'Language' },
    reaction_meanLatencyMs: { positive: 'Fast reaction time', negative: 'Slower reaction time', domain: 'Speed' },
    reaction_vigilanceDecrement: { positive: 'Sustained attention', negative: 'Declining attention over time', domain: 'Attention' },
    savt_compositeScore: { positive: 'High sustained attention', negative: 'Reduced sustained attention', domain: 'Attention' },
    savt_dPrime: { positive: 'High target sensitivity', negative: 'Reduced signal detection', domain: 'Attention' },
    pattern_maxLevelReached: { positive: 'Strong working memory span', negative: 'Reduced working memory span', domain: 'Executive' },
    pattern_memoryLoadTolerance: { positive: 'Good cognitive load tolerance', negative: 'Reduced cognitive load capacity', domain: 'Executive' },
    nav_navigationAccuracy: { positive: 'Accurate route memory', negative: 'Reduced route memory', domain: 'Spatial' },
    nav_landmarkRecognitionAccuracy: { positive: 'Good landmark recognition', negative: 'Reduced landmark recognition', domain: 'Spatial' },
    nav_spatialMemoryIndex: { positive: 'Strong spatial awareness', negative: 'Reduced spatial awareness', domain: 'Spatial' },
};

/** Top 5 biomarkers per module for the clinician report drill-down */
export const MODULE_KEY_BIOMARKERS: Record<string, { key: string; label: string; unit: string; extractor: (result: any) => number | null }[]> = {
    reaction: [
        { key: 'avgLatency', label: 'Average Latency', unit: 'ms', extractor: r => r?.aggregates?.avg != null ? Math.round(r.aggregates.avg) : null },
        { key: 'medianLatency', label: 'Median Latency', unit: 'ms', extractor: r => r?.aggregates?.median != null ? Math.round(r.aggregates.median) : null },
        { key: 'stdDev', label: 'Latency Std Dev', unit: 'ms', extractor: r => r?.aggregates?.std != null ? Math.round(r.aggregates.std) : null },
        { key: 'lapses', label: 'Attention Lapses', unit: 'count', extractor: r => r?.aggregates?.lapses ?? null },
        { key: 'premature', label: 'Premature Responses', unit: 'count', extractor: r => r?.aggregates?.premature ?? null },
    ],
    attention: [
        { key: 'compositeScore', label: 'Attention Composite', unit: '/100', extractor: r => r?.profile?.compositeScore ?? null },
        { key: 'dPrime', label: 'Sensitivity (d′)', unit: '', extractor: r => r?.features?.dPrime != null ? Math.round(r.features.dPrime * 100) / 100 : null },
        { key: 'hitRate', label: 'Hit Rate', unit: '%', extractor: r => r?.features?.hitRate != null ? Math.round(r.features.hitRate * 100) : null },
        { key: 'meanRt', label: 'Mean Response Time', unit: 'ms', extractor: r => r?.features?.meanResponseTimeMs != null ? Math.round(r.features.meanResponseTimeMs) : null },
        { key: 'commissionError', label: 'Commission Error Rate', unit: '%', extractor: r => r?.features?.commissionErrorRate != null ? Math.round(r.features.commissionErrorRate * 100) : null },
    ],
    vmra: [
        { key: 'recallAccuracy', label: 'Recall Accuracy', unit: '%', extractor: r => r?.features?.recallAccuracy != null ? Math.round(r.features.recallAccuracy * 100) : (r?.accuracy != null ? Math.round(r.accuracy * 100) : null) },
        { key: 'delayedRecall', label: 'Delayed Recall', unit: '%', extractor: r => r?.delayedRecall?.delayedFeatures?.recallAccuracy != null ? Math.round(r.delayedRecall.delayedFeatures.recallAccuracy * 100) : null },
        { key: 'firstTapLatency', label: 'First Tap Latency', unit: 'ms', extractor: r => r?.features?.firstTapLatencyMs ?? null },
        { key: 'intrusionErrors', label: 'Intrusion Errors', unit: 'count', extractor: r => r?.features?.intrusionErrors ?? null },
        { key: 'forgettingSlope', label: 'Forgetting Curve Slope', unit: '', extractor: r => r?.delayedRecall?.forgettingCurveSlope ?? null },
    ],
    story: [
        { key: 'recallAccuracy', label: 'Recall Accuracy', unit: '%', extractor: r => r?.storyRecallScore ?? (r?.biomarkers?.memory?.recallAccuracy != null ? Math.round(r.biomarkers.memory.recallAccuracy * 100) : null) },
        { key: 'infoUnits', label: 'Info Units Recalled', unit: '', extractor: r => r?.biomarkers?.memory?.infoUnitsRecalled ?? null },
        { key: 'mcqAccuracy', label: 'Comprehension MCQ', unit: '%', extractor: r => r?.biomarkers?.comprehension?.mcqAccuracy != null ? Math.round(r.biomarkers.comprehension.mcqAccuracy * 100) : null },
        { key: 'speechRate', label: 'Speech Rate', unit: 'WPM', extractor: r => r?.biomarkers?.speech?.speechRateWPM ?? null },
        { key: 'sequenceScore', label: 'Sequence Score', unit: '%', extractor: r => r?.biomarkers?.narrative?.storySequenceScore != null ? Math.round(r.biomarkers.narrative.storySequenceScore * 100) : null },
    ],
    language: [
        { key: 'csi', label: 'Cognitive Speech Index', unit: '/100', extractor: r => r?.derivedFeatures?.cognitiveSpeechIndex ?? null },
        { key: 'fluency', label: 'Fluency Index', unit: '/100', extractor: r => r?.derivedFeatures?.fluencyIndex ?? null },
        { key: 'lexicalDiv', label: 'Lexical Diversity', unit: '', extractor: r => r?.derivedFeatures?.lexicalDiversity ?? null },
        { key: 'wpm', label: 'Words Per Minute', unit: 'WPM', extractor: r => r?.derivedFeatures?.wpm ?? null },
        { key: 'hesitation', label: 'Hesitation Index', unit: '', extractor: r => r?.derivedFeatures?.hesitationIndex ?? null },
    ],
    pattern: [
        { key: 'maxLevel', label: 'Max Level Reached', unit: '', extractor: r => r?.metrics?.maxLevelReached ?? null },
        { key: 'accuracy', label: 'Accuracy', unit: '%', extractor: r => r?.metrics ? Math.round((r.metrics.correctRounds / Math.max(1, r.metrics.totalRounds)) * 100) : null },
        { key: 'avgLatency', label: 'Avg Response Time', unit: 'ms', extractor: r => r?.metrics?.averageResponseLatency ?? null },
        { key: 'learningRate', label: 'Learning Rate', unit: '', extractor: r => r?.features?.learningRate ?? null },
        { key: 'stability', label: 'Pattern Stability', unit: '/100', extractor: r => r?.features?.patternStabilityIndex ?? null },
    ],
    navigation: [
        { key: 'navScore', label: 'Navigation Score', unit: '/100', extractor: r => r?.navigationScore ?? (r?.biomarkers?.navigationAccuracy != null ? Math.round(r.biomarkers.navigationAccuracy * 100) : null) },
        { key: 'navAccuracy', label: 'Route Accuracy', unit: '%', extractor: r => r?.biomarkers?.navigationAccuracy != null ? Math.round(r.biomarkers.navigationAccuracy * 100) : null },
        { key: 'landmarkAcc', label: 'Landmark Recognition', unit: '%', extractor: r => r?.biomarkers?.landmarkRecognitionAccuracy != null ? Math.round(r.biomarkers.landmarkRecognitionAccuracy * 100) : null },
        { key: 'decisionLatency', label: 'Avg Decision Time', unit: 'ms', extractor: r => r?.biomarkers?.averageDecisionLatencyMs ?? null },
        { key: 'spatialMemory', label: 'Spatial Memory Index', unit: '%', extractor: r => r?.biomarkers?.chronologicalRecallScore != null ? Math.round(r.biomarkers.chronologicalRecallScore * 100) : null },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// SCORE EXTRACTION PER MODULE
// ═══════════════════════════════════════════════════════════════════

function extractModuleScore(moduleKey: string, result: any): number | null {
    if (!result) return null;
    switch (moduleKey) {
        case 'vmra':
            return result.features?.recallAccuracy != null
                ? Math.round(result.features.recallAccuracy * 100)
                : (result.accuracy != null ? Math.round(result.accuracy * 100) : null);
        case 'story':
            return result.storyRecallScore != null
                ? result.storyRecallScore
                : (result.biomarkers?.memory?.recallAccuracy != null ? Math.round(result.biomarkers.memory.recallAccuracy * 100) : null);
        case 'language':
            return result.derivedFeatures?.cognitiveSpeechIndex
                ?? result.derivedFeatures?.fluencyIndex
                ?? null;
        case 'pattern':
            return result.metrics?.maxLevelReached != null
                ? Math.min(Math.round(result.metrics.maxLevelReached * 10), 100)
                : null;
        case 'reaction':
            return result.aggregates?.avg != null
                ? Math.round(result.aggregates.avg)
                : null;
        case 'attention':
            return result.profile?.compositeScore != null
                ? Math.round(result.profile.compositeScore)
                : (result.features?.hitRate != null ? Math.round(result.features.hitRate * 100) : null);
        case 'navigation':
            return result.navigationScore != null
                ? Math.round(result.navigationScore)
                : (result.biomarkers?.navigationAccuracy != null ? Math.round(result.biomarkers.navigationAccuracy * 100) : null);
        case 'memory':
            return result.accuracy != null
                ? Math.round(result.accuracy * 100)
                : null;
        default:
            return null;
    }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE TREND BUILDER
// ═══════════════════════════════════════════════════════════════════

function buildModuleTrends(rawData: RawDashboardData): ModuleTrendViewModel[] {
    const moduleDataMap: Record<string, any[]> = {
        reaction: rawData.reaction || [],
        attention: rawData.attention || [],
        vmra: rawData.vmra || [],
        story: rawData.story || [],
        language: rawData.language || [],
        pattern: rawData.pattern || [],
        navigation: rawData.navigation || [],
        memory: rawData.memory || [],
    };

    return MODULE_META.map(meta => {
        const results = moduleDataMap[meta.key] || [];
        // Sort by timestamp ascending
        const sorted = [...results].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const sessions: ModuleSessionPoint[] = sorted.map((result, index) => {
            const ts = new Date(result.timestamp);
            return {
                sessionLabel: `Session ${index + 1}`,
                date: ts.toLocaleDateString('en-GB'),
                timestamp: ts.getTime(),
                score: extractModuleScore(meta.key, result),
                rawResult: result,
            };
        });

        return {
            moduleKey: meta.key,
            moduleName: meta.name,
            chartColor: meta.chartColor,
            unit: meta.unit,
            domain: meta.domain,
            sessions,
        };
    });
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function alertLevelToOverview(alertOutput: AlertOutput | null, confidence: number): OverviewViewModel {
    if (!alertOutput) {
        return {
            cognitiveStatus: 'Stable',
            statusEmoji: '🟢',
            statusColor: 'green',
            confidence: 0,
            lastAssessmentDate: 'N/A',
            comparisonSummary: 'No assessment data available.',
            recommendation: 'Complete your first cognitive assessment to get started.',
        };
    }

    let cognitiveStatus: OverviewViewModel['cognitiveStatus'] = 'Stable';
    let statusEmoji: OverviewViewModel['statusEmoji'] = '🟢';
    let statusColor: OverviewViewModel['statusColor'] = 'green';

    switch (alertOutput.alertLevel) {
        case 'EVALUATE':
            cognitiveStatus = 'Needs Attention';
            statusEmoji = '🔴';
            statusColor = 'red';
            break;
        case 'RE_ASSESS':
            cognitiveStatus = 'Possible Risk';
            statusEmoji = '🟠';
            statusColor = 'orange';
            break;
        case 'MONITOR':
            cognitiveStatus = 'Possible Risk';
            statusEmoji = '🟡';
            statusColor = 'yellow';
            break;
        case 'STABLE':
        default:
            cognitiveStatus = 'Stable';
            statusEmoji = '🟢';
            statusColor = 'green';
            break;
    }

    return {
        cognitiveStatus,
        statusEmoji,
        statusColor,
        confidence: Math.round(confidence),
        lastAssessmentDate: '', // Will be set by caller
        comparisonSummary: alertOutput.recommendationText.split('.')[0] + '.',
        recommendation: alertOutput.recommendationText,
    };
}

function buildDomainScores(
    prediction: CognitiveModelPrediction | null,
    previousPrediction: CognitiveModelPrediction | null
): DomainScoreViewModel[] {
    if (!prediction) return [];

    return DOMAIN_META.map(dm => {
        const score = (prediction.domainScores as any)[dm.key] ?? 0;
        const prevScore = previousPrediction
            ? ((previousPrediction.domainScores as any)[dm.key] ?? null)
            : null;
        const delta = prevScore != null ? Math.round(score - prevScore) : null;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (delta != null && delta > 2) trend = 'up';
        else if (delta != null && delta < -2) trend = 'down';

        let label = 'Stable';
        if (score >= 80) label = trend === 'up' ? 'Improving' : 'Good';
        else if (score >= 60) label = 'Stable';
        else label = 'Monitor';
        if (trend === 'down' && delta != null && delta < -5) label = 'Monitor';

        return {
            key: dm.key,
            name: dm.name,
            icon: dm.icon,
            score: Math.round(score),
            previousScore: prevScore != null ? Math.round(prevScore) : null,
            delta,
            trend,
            label,
        };
    });
}

function buildChanges(domainScores: DomainScoreViewModel[]): ChangesViewModel {
    const improved: { domain: string; delta: number }[] = [];
    const declined: { domain: string; delta: number }[] = [];
    const stable: string[] = [];

    for (const ds of domainScores) {
        if (ds.delta == null) continue;
        if (ds.delta > 2) improved.push({ domain: ds.name, delta: ds.delta });
        else if (ds.delta < -2) declined.push({ domain: ds.name, delta: ds.delta });
        else stable.push(ds.name);
    }

    return { improved, declined, stable };
}

function buildExplainability(prediction: CognitiveModelPrediction | null): ExplainabilityViewModel {
    if (!prediction || !prediction.topAttributions || prediction.topAttributions.length === 0) {
        return { positive: [], negative: [] };
    }

    const positive: { factor: string; description: string }[] = [];
    const negative: { factor: string; description: string }[] = [];

    for (const attr of prediction.topAttributions) {
        // Try to find a human-readable translation
        const featureKey = attr.featureName.replace(/\./g, '_');
        const translation = BIOMARKER_TRANSLATIONS[featureKey];

        if (translation) {
            if (attr.impact === 'protective') {
                positive.push({ factor: attr.domain, description: translation.positive });
            } else if (attr.impact === 'risk') {
                negative.push({ factor: attr.domain, description: translation.negative });
            }
        } else {
            // Use the attribution's own description
            if (attr.impact === 'protective') {
                positive.push({ factor: attr.domain, description: attr.description });
            } else if (attr.impact === 'risk') {
                negative.push({ factor: attr.domain, description: attr.description });
            }
        }
    }

    return {
        positive: positive.slice(0, 5),
        negative: negative.slice(0, 5),
    };
}

function buildAssessmentModules(rawData: RawDashboardData): AssessmentModuleViewModel[] {
    const moduleDataMap: Record<string, any[]> = {
        reaction: rawData.reaction || [],
        attention: rawData.attention || [],
        vmra: rawData.vmra || [],
        story: rawData.story || [],
        language: rawData.language || [],
        pattern: rawData.pattern || [],
        navigation: rawData.navigation || [],
        memory: rawData.memory || [],
    };

    return MODULE_META.map(meta => {
        const results = moduleDataMap[meta.key] || [];
        const isCompleted = results.length > 0;
        const latest = isCompleted ? results[results.length - 1] : null;
        const score = latest ? extractModuleScore(meta.key, latest) : null;
        const lastDate = latest
            ? new Date(latest.timestamp).toLocaleDateString('en-GB')
            : null;

        return {
            key: meta.key,
            name: meta.name,
            icon: meta.icon,
            score,
            maxScore: meta.key === 'reaction' ? 999 : 100,
            isCompleted,
            sessionCount: results.length,
            lastCompletedDate: lastDate,
            route: meta.route,
        };
    });
}

function buildLongitudinal(
    evaluation: LongitudinalEvaluation | null,
    driftMetrics: DriftMetrics | null,
    sessionCount: number
): LongitudinalViewModel {
    if (!evaluation || sessionCount < 1) {
        return {
            trajectory: 'Insufficient Data',
            trajectoryColor: '#94a3b8',
            summary: 'Complete at least one assessment to see trend analysis.',
            sessionCount,
            lastUpdated: 'N/A',
            advancedMetrics: null,
        };
    }

    const traj = evaluation.trajectory;
    let trajectoryColor = '#4ade80'; // green default
    switch (traj.tier) {
        case 'Rapid Decline': trajectoryColor = '#ef4444'; break;
        case 'Likely Decline': trajectoryColor = '#f97316'; break;
        case 'Possible Decline': trajectoryColor = '#fbbf24'; break;
        case 'Improving': trajectoryColor = '#60a5fa'; break;
        case 'Stable': default: trajectoryColor = '#4ade80'; break;
    }

    // Build advanced metrics from drift metrics if available
    let advancedMetrics: LongitudinalViewModel['advancedMetrics'] = null;
    if (driftMetrics) {
        const rciValues = Object.values(driftMetrics.rci);
        const betaValues = Object.values(driftMetrics.beta);
        const zDriftValues = Object.values(driftMetrics.zDrift);
        const cvValues = Object.values(driftMetrics.cv);

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        advancedMetrics = {
            rci: Math.round(avg(rciValues) * 100) / 100,
            theilSenSlope: Math.round(avg(betaValues) * 100) / 100,
            zDrift: Math.round(avg(zDriftValues) * 100) / 100,
            cv: Math.round(avg(cvValues) * 10) / 10,
        };
    } else {
        advancedMetrics = {
            rci: Math.round(traj.rci * 100) / 100,
            theilSenSlope: Math.round(traj.theilSenSlopePerMonth * 100) / 100,
            zDrift: Math.round(traj.zDrift * 100) / 100,
            cv: Math.round(traj.coefficientOfVariationPercent * 10) / 10,
        };
    }

    return {
        trajectory: traj.tier,
        trajectoryColor,
        summary: traj.clinicalInterpretation,
        sessionCount: evaluation.sessionCount,
        lastUpdated: evaluation.latestSessionDate.toLocaleDateString('en-GB'),
        advancedMetrics,
    };
}

function buildRecommendation(alertOutput: AlertOutput | null): RecommendationViewModel {
    if (!alertOutput) {
        return {
            text: 'Complete your first cognitive assessment to receive personalized recommendations.',
            urgency: 'routine',
            icon: '📋',
        };
    }

    let urgency: RecommendationViewModel['urgency'] = 'routine';
    let icon = '📋';
    if (alertOutput.alertLevel === 'EVALUATE') {
        urgency = 'clinical';
        icon = '🏥';
    } else if (alertOutput.alertLevel === 'RE_ASSESS') {
        urgency = 'followup';
        icon = '🔔';
    } else if (alertOutput.alertLevel === 'MONITOR') {
        urgency = 'followup';
        icon = '🔔';
    }

    return {
        text: alertOutput.recommendationText,
        urgency,
        icon,
    };
}

function buildTopBiomarkersPerModule(rawData: RawDashboardData): Record<string, ModuleBiomarkerSummary[]> {
    const result: Record<string, ModuleBiomarkerSummary[]> = {};
    const moduleDataMap: Record<string, any[]> = {
        reaction: rawData.reaction || [],
        attention: rawData.attention || [],
        vmra: rawData.vmra || [],
        story: rawData.story || [],
        language: rawData.language || [],
        pattern: rawData.pattern || [],
        navigation: rawData.navigation || [],
    };

    for (const [moduleKey, biomarkerDefs] of Object.entries(MODULE_KEY_BIOMARKERS)) {
        const results = moduleDataMap[moduleKey];
        if (!results || results.length === 0) continue;

        const latest = results[results.length - 1];
        const summaries: ModuleBiomarkerSummary[] = [];

        for (const def of biomarkerDefs) {
            const value = def.extractor(latest);
            if (value == null) continue;

            // Determine status based on heuristic thresholds
            let status: 'normal' | 'watch' | 'concern' = 'normal';
            if (def.unit === '%' || def.unit === '/100') {
                if (value < 50) status = 'concern';
                else if (value < 70) status = 'watch';
            } else if (def.unit === 'ms') {
                // For latency: higher is worse
                if (def.key.includes('Latency') || def.key.includes('latency') || def.key.includes('avg') || def.key.includes('meanRt')) {
                    if (value > 500) status = 'concern';
                    else if (value > 350) status = 'watch';
                }
            } else if (def.key === 'intrusionErrors' || def.key === 'lapses' || def.key === 'premature' || def.key === 'commissionError') {
                if (value > 3) status = 'concern';
                else if (value > 1) status = 'watch';
            }

            summaries.push({
                name: def.label,
                value: typeof value === 'number' ? Math.round(value * 100) / 100 : value,
                unit: def.unit,
                status,
            });
        }

        result[moduleKey] = summaries;
    }

    return result;
}

function buildSessionHistory(rawData: RawDashboardData): ClinicianReportViewModel['sessionHistory'] {
    // Group all module results by date
    const allDates = new Set<string>();
    const moduleDataMap: Record<string, any[]> = {
        reaction: rawData.reaction || [],
        attention: rawData.attention || [],
        vmra: rawData.vmra || [],
        story: rawData.story || [],
        language: rawData.language || [],
        pattern: rawData.pattern || [],
        navigation: rawData.navigation || [],
        memory: rawData.memory || [],
    };

    for (const [_modKey, results] of Object.entries(moduleDataMap)) {
        for (const r of results) {
            allDates.add(new Date(r.timestamp).toDateString());
        }
    }

    const sortedDates = Array.from(allDates).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return sortedDates.map(dateStr => {
        const moduleScores: Record<string, number | null> = {};

        for (const [modKey, results] of Object.entries(moduleDataMap)) {
            const match = results
                .filter((r: any) => new Date(r.timestamp).toDateString() === dateStr)
                .pop();
            moduleScores[modKey] = match ? extractModuleScore(modKey, match) : null;
        }

        return {
            date: new Date(dateStr).toLocaleDateString('en-GB'),
            moduleScores,
        };
    });
}

function findLatestTimestamp(rawData: RawDashboardData): string {
    let latest = 0;
    const allResults = [
        ...(rawData.reaction || []),
        ...(rawData.attention || []),
        ...(rawData.vmra || []),
        ...(rawData.story || []),
        ...(rawData.language || []),
        ...(rawData.pattern || []),
        ...(rawData.navigation || []),
        ...(rawData.memory || []),
    ];
    for (const r of allResults) {
        const ts = new Date(r.timestamp).getTime();
        if (ts > latest) latest = ts;
    }
    return latest > 0 ? new Date(latest).toLocaleDateString('en-GB') : 'N/A';
}

// ═══════════════════════════════════════════════════════════════════
// MAIN BUILD FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function buildDashboardViewModel(
    rawData: RawDashboardData,
    prediction: CognitiveModelPrediction | null,
    evaluation: LongitudinalEvaluation | null,
    alertOutput: AlertOutput | null,
    driftMetrics: DriftMetrics | null,
    demographics: UserDemographics | undefined,
    isLoading: boolean
): DashboardViewModel {
    const hasData = Boolean(
        (rawData.reaction?.length) ||
        (rawData.attention?.length) ||
        (rawData.memory?.length) ||
        (rawData.pattern?.length) ||
        (rawData.language?.length) ||
        (rawData.vmra?.length) ||
        (rawData.story?.length) ||
        (rawData.navigation?.length)
    );

    const sessionHistory = buildSessionHistory(rawData);
    const sessionCount = sessionHistory.length;

    // Overview (Section 1)
    const overview = alertLevelToOverview(
        alertOutput,
        alertOutput?.confidenceScore ?? 0
    );
    overview.lastAssessmentDate = findLatestTimestamp(rawData);

    // AI Prediction (Section 2)
    const aiPrediction: AIPredictionViewModel = prediction
        ? {
            predictedStatus: prediction.predictedDiagnosis,
            probabilities: { ...prediction.probabilities },
            estimatedMoCA: prediction.estimatedMoCA,
            mocaCI: prediction.mocaConfidenceInterval,
            riskScore: prediction.impairmentRiskScore,
            riskLevel: prediction.impairmentRiskScore > 0.6 ? 'High' :
                prediction.impairmentRiskScore > 0.3 ? 'Moderate' : 'Low',
            modelConfidence: prediction.modelConfidence,
            batteryCoverage: prediction.batteryCoverage,
            completedModules: prediction.completedModules,
        }
        : {
            predictedStatus: 'Normal',
            probabilities: { normal: 0, mci: 0, dementia: 0 },
            estimatedMoCA: 0,
            mocaCI: 0,
            riskScore: 0,
            riskLevel: 'Low',
            modelConfidence: 0,
            batteryCoverage: 0,
            completedModules: [],
        };

    // Domain Scores (Section 3)
    // Note: previousPrediction is null for now; future enhancement could track previous session
    const domainScores = buildDomainScores(prediction, null);

    // Module Trends (Section 4)
    const moduleTrends = buildModuleTrends(rawData);

    // Changes (Section 5)
    const changes = buildChanges(domainScores);

    // Assessment Modules (Section 6)
    const assessmentModules = buildAssessmentModules(rawData);

    // Explainability (Section 7)
    const explainability = buildExplainability(prediction);

    // Longitudinal (Section 8)
    const longitudinal = buildLongitudinal(evaluation, driftMetrics, sessionCount);

    // Recommendation (Section 9)
    const recommendation = buildRecommendation(alertOutput);

    // Clinician Report (Section 10)
    const clinicianReport: ClinicianReportViewModel = {
        demographics: {
            age: demographics?.age || 65,
            gender: demographics?.gender || 'Not specified',
            educationYears: demographics?.educationYears || 16,
        },
        prediction,
        allModuleResults: rawData,
        topBiomarkersPerModule: buildTopBiomarkersPerModule(rawData),
        driftMetrics,
        sessionHistory,
    };

    // Radar Scores
    const radarScores = prediction
        ? { ...prediction.domainScores }
        : {
            memory: 0,
            language: 0,
            executive: 0,
            processingSpeed: 0,
            spatialOrientation: 0,
            attention: 0,
        };

    return {
        overview,
        aiPrediction,
        domainScores,
        moduleTrends,
        changes,
        assessmentModules,
        explainability,
        longitudinal,
        recommendation,
        clinicianReport,
        radarScores,
        hasData,
        isLoading,
        sessionCount,
    };
}
