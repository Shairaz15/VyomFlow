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
    fullSessionsCompleted?: number; // Number of times all 7 assessments were completed
    totalTestsCompleted?: number;
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
    domainName: string;
    accentColor: string;
    estimatedDuration: string;
    scoreQuality?: 'optimal' | 'good' | 'monitor' | 'alert';
    delta?: number | null;
}

// ─── Section 7: Explainability ──────────────────────────────────
export interface ExplainabilityFactor {
    factor: string;
    title: string;
    description: string;
    impactLevel: 'high' | 'moderate' | 'mild';
}

export interface ExplainabilityViewModel {
    positive: ExplainabilityFactor[];
    negative: ExplainabilityFactor[];
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
export interface CognitiveRadarDomainScores {
    memory: number;
    language: number;
    executive: number;
    processingSpeed: number;
    spatialOrientation: number;
    attention: number;
}

export interface RadarTimelinePoint {
    sessionId: string;
    date: string;
    timestamp: number;
    label: string;
    scores: CognitiveRadarDomainScores;
}

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
    radarScores: CognitiveRadarDomainScores;
    baselineRadarScores: CognitiveRadarDomainScores;
    radarTimeline: RadarTimelinePoint[];
    hasData: boolean;
    isLoading: boolean;
    sessionCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & MODULE METADATA
// ═══════════════════════════════════════════════════════════════════

const DOMAIN_META: { key: string; name: string; icon: string }[] = [
    { key: 'memory', name: 'Memory', icon: '🧠' },
    { key: 'language', name: 'Language', icon: '🗣️' },
    { key: 'executive', name: 'Executive', icon: '🧩' },
    { key: 'processingSpeed', name: 'Processing Speed', icon: '⚡' },
    { key: 'spatialOrientation', name: 'Spatial', icon: '🗺️' },
    { key: 'attention', name: 'Attention', icon: '🎯' },
];

export const MODULE_META: {
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

/** Translates raw biomarker attributions into clean, human-readable clinical descriptions */
const BIOMARKER_TRANSLATIONS: Record<string, { title: string; positive: string; negative: string; domain: string }> = {
    // Language & Speech
    lang_pausedurationavgms: { title: 'Speech Pause Duration', positive: 'Natural conversational pace with minimal pauses', negative: 'Elevated pause duration during spontaneous speech', domain: 'Language' },
    lang_semanticcoherence: { title: 'Semantic Coherence', positive: 'High narrative coherence and logical structure', negative: 'Reduced semantic coherence in speech flow', domain: 'Language' },
    lang_cognitivespeechindex: { title: 'Speech Fluency Index', positive: 'Stable speech fluency and articulation', negative: 'Reduced speech fluency index', domain: 'Language' },
    lang_lexicaldiversity: { title: 'Lexical Diversity', positive: 'Rich vocabulary and varied word choice', negative: 'Limited vocabulary usage during recall', domain: 'Language' },
    lang_hesitationindex: { title: 'Speech Hesitations', positive: 'Fluent speech production with few hesitations', negative: 'Increased speech hesitations and filler pauses', domain: 'Language' },
    lang_wordsperminute: { title: 'Speech Tempo', positive: 'Healthy articulation rate and verbal tempo', negative: 'Slower speech rate during verbal recall', domain: 'Language' },

    // Pattern Working Memory
    pattern_digitspanforward: { title: 'Forward Memory Span', positive: 'Strong sequential pattern retention', negative: 'Reduced forward sequence capacity', domain: 'Executive' },
    pattern_digitspanbackward: { title: 'Reverse Working Memory', positive: 'High mental flexibility in sequence manipulation', negative: 'Reduced reverse working memory manipulation', domain: 'Executive' },
    pattern_maxlevelreached: { title: 'Working Memory Span', positive: 'Strong working memory span and capacity', negative: 'Reduced working memory span under load', domain: 'Executive' },
    pattern_memoryloadtolerance: { title: 'Cognitive Load Tolerance', positive: 'High cognitive load tolerance', negative: 'Reduced cognitive load capacity', domain: 'Executive' },
    pattern_accuracy: { title: 'Pattern Recognition', positive: 'High pattern recognition precision', negative: 'Reduced pattern recognition accuracy', domain: 'Executive' },

    // Visual Memory (VMRA)
    vmra_recallaccuracy: { title: 'Visual Memory Recall', positive: 'Strong visual memory recall and recognition', negative: 'Reduced visual memory recall', domain: 'Memory' },
    vmra_delayedrecallaccuracy: { title: 'Delayed Retention', positive: 'Good delayed recall retention over time', negative: 'Reduced delayed recall retention', domain: 'Memory' },
    vmra_forgettingcurveslope: { title: 'Memory Decay Rate', positive: 'Stable retention with slow forgetting rate', negative: 'Accelerated forgetting rate over time', domain: 'Memory' },
    vmra_intrusionerrors: { title: 'Intrusion Errors', positive: 'Low intrusion errors and high accuracy', negative: 'Elevated false-positive intrusion errors', domain: 'Memory' },

    // Story Recall
    story_recallaccuracy: { title: 'Story Recall', positive: 'Accurate narrative recall and detail retention', negative: 'Reduced story recall accuracy', domain: 'Memory' },
    story_infounitsrecalled: { title: 'Narrative Detail Retention', positive: 'Good detail retention across key story units', negative: 'Missed key story detail units', domain: 'Memory' },

    // Reaction Time
    reaction_meanlatencyms: { title: 'Processing Speed', positive: 'Fast, consistent psychomotor reaction time', negative: 'Slower reaction time and response latency', domain: 'Speed' },
    reaction_vigilancedecrement: { title: 'Vigilance Consistency', positive: 'Sustained focus maintained across trials', negative: 'Declining attention vigilance over time', domain: 'Attention' },
    reaction_lapses: { title: 'Attention Lapses', positive: 'Zero attention lapses recorded', negative: 'Transient attention lapses observed', domain: 'Speed' },

    // Attention (SAVT)
    savt_compositescore: { title: 'Sustained Attention', positive: 'High sustained attention across full duration', negative: 'Reduced sustained attention composite', domain: 'Attention' },
    savt_dprime: { title: 'Target Sensitivity (d′)', positive: 'High target sensitivity and signal detection', negative: 'Reduced target sensitivity and signal detection', domain: 'Attention' },

    // Spatial Navigation
    nav_navigationaccuracy: { title: 'Route Memory', positive: 'Accurate route memory and spatial orientation', negative: 'Reduced route memory and orientation', domain: 'Spatial' },
    nav_landmarkrecognitionaccuracy: { title: 'Landmark Recognition', positive: 'Strong landmark identification and recall', negative: 'Reduced landmark recognition', domain: 'Spatial' },
    nav_spatialmemoryindex: { title: 'Spatial Memory', positive: 'Strong spatial awareness and heading accuracy', negative: 'Reduced spatial awareness during wayfinding', domain: 'Spatial' },
    nav_excesspathratio: { title: 'Navigation Efficiency', positive: 'Direct, efficient path to targets', negative: 'Excess route deviation during navigation', domain: 'Spatial' },
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
                ? Math.round(result.storyRecallScore)
                : (result.biomarkers?.memory?.recallAccuracy != null ? Math.round(result.biomarkers.memory.recallAccuracy * 100) : null);
        case 'language': {
            const rawLang = result.derivedFeatures?.cognitiveSpeechIndex
                ?? result.derivedFeatures?.fluencyIndex
                ?? null;
            return rawLang != null ? Math.round(rawLang) : null;
        }
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
// DEDUPLICATION HELPER
// ═══════════════════════════════════════════════════════════════════

export function deduplicateRawResults<T extends { id?: string; sessionId?: string; timestamp: Date | string | number }>(
    results: T[]
): T[] {
    if (!results || results.length <= 1) return results || [];
    const sorted = [...results].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const deduped: T[] = [];
    const seenIds = new Set<string>();

    for (const item of sorted) {
        const id = item.id || item.sessionId;
        if (id && seenIds.has(id)) continue;
        const itemTime = new Date(item.timestamp).getTime();
        const dupIdx = deduped.findIndex((existing) => {
            if (id && (existing.id === id || existing.sessionId === id)) return true;
            const exTime = new Date(existing.timestamp).getTime();
            return Math.abs(itemTime - exTime) < 30000;
        });
        if (dupIdx !== -1) {
            deduped[dupIdx] = item;
        } else {
            if (id) seenIds.add(id);
            deduped.push(item);
        }
    }
    return deduped;
}

// ═══════════════════════════════════════════════════════════════════
// MODULE TREND BUILDER
// ═══════════════════════════════════════════════════════════════════

function buildModuleTrends(rawData: RawDashboardData): ModuleTrendViewModel[] {
    const moduleDataMap: Record<string, any[]> = {
        reaction: deduplicateRawResults(rawData.reaction || []),
        attention: deduplicateRawResults(rawData.attention || []),
        vmra: deduplicateRawResults(rawData.vmra || []),
        story: deduplicateRawResults(rawData.story || []),
        language: deduplicateRawResults(rawData.language || []),
        pattern: deduplicateRawResults(rawData.pattern || []),
        navigation: deduplicateRawResults(rawData.navigation || []),
        memory: deduplicateRawResults(rawData.memory || []),
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
    let comparisonSummary = 'Performance is stable and aligned with your personal baseline.';
    let recommendation = 'Continue regular cognitive checkups and maintain healthy lifestyle habits.';

    switch (alertOutput.alertLevel) {
        case 'EVALUATE':
            cognitiveStatus = 'Needs Attention';
            statusEmoji = '🔴';
            statusColor = 'red';
            comparisonSummary = 'A noticeable shift was observed across specific cognitive tests compared to prior checkups.';
            recommendation = 'We recommend downloading your clinician report and discussing these findings with your physician.';
            break;
        case 'RE_ASSESS':
            cognitiveStatus = 'Possible Risk';
            statusEmoji = '🟠';
            statusColor = 'orange';
            comparisonSummary = 'Mild variation detected in specific cognitive domains compared to previous checkups.';
            recommendation = 'Re-assess in 3–4 weeks to monitor whether this reflects daily tiredness or a continuing pattern.';
            break;
        case 'MONITOR':
            cognitiveStatus = 'Possible Risk';
            statusEmoji = '🟡';
            statusColor = 'yellow';
            comparisonSummary = 'Slight variation noted in some tests; overall cognitive function remains solid.';
            recommendation = 'Maintain regular weekly assessments and review sleep and stress factors.';
            break;
        case 'STABLE':
        default:
            cognitiveStatus = 'Stable';
            statusEmoji = '🟢';
            statusColor = 'green';
            comparisonSummary = 'Your cognitive scores are steady with no significant changes from your baseline.';
            recommendation = 'Keep up regular cognitive monitoring, physical activity, and good rest.';
            break;
    }

    return {
        cognitiveStatus,
        statusEmoji,
        statusColor,
        confidence: Math.round(confidence),
        lastAssessmentDate: '', // Will be set by caller
        comparisonSummary,
        recommendation,
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

function cleanFeatureTitle(raw: string): string {
    if (!raw) return 'Cognitive Biomarker';
    // Remove module prefixes e.g. "lang.", "pattern ", "vmra_"
    let clean = raw.replace(/^(lang|pattern|vmra|story|nav|reaction|savt|memory)[\._\s:]+/i, '');
    // Remove debug numbers or trailing status e.g. ": 1269 (Decreased score)"
    clean = clean.replace(/:\s*\d+(\.\d+)?/g, '').replace(/\((decreased|increased|stable)[^\)]*\)/gi, '').trim();
    // Convert camelCase to Words
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    const lower = clean.toLowerCase();
    if (lower.includes('pause duration') || lower.includes('pauseduration')) return 'Speech Pause Duration';
    if (lower.includes('semantic coherence') || lower.includes('semanticcoherence')) return 'Semantic Coherence';
    if (lower.includes('digit span forward') || lower.includes('digitspanforward')) return 'Forward Memory Span';
    if (lower.includes('digit span backward') || lower.includes('digitspanbackward')) return 'Reverse Working Memory';
    if (lower.includes('max level') || lower.includes('maxlevel')) return 'Working Memory Span';
    if (lower.includes('words per minute') || lower.includes('wordsperminute')) return 'Speech Rate';
    if (lower.includes('hesitation index') || lower.includes('hesitationindex')) return 'Speech Hesitations';
    if (lower.includes('mean latency') || lower.includes('meanlatencyms')) return 'Processing Speed';
    if (lower.includes('vigilance') || lower.includes('vigilancedecrement')) return 'Vigilance Consistency';
    if (lower.includes('navigation accuracy') || lower.includes('navigationaccuracy')) return 'Route Memory';
    if (lower.includes('excess path') || lower.includes('excesspathratio')) return 'Navigation Efficiency';
    if (lower.includes('recall accuracy') || lower.includes('recallaccuracy')) return 'Memory Recall Accuracy';
    if (lower.includes('delayed recall') || lower.includes('delayedrecallaccuracy')) return 'Delayed Retention';

    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function cleanFeatureDescription(desc: string, impact: 'protective' | 'risk' | 'neutral' | string): string {
    if (!desc) {
        return impact === 'protective' ? 'Performance meets or exceeds expected normative range' : 'Metric indicates area for longitudinal monitoring';
    }
    // If it looks like raw debug text: "lang pauseDurationAvgMs: 1269 (Decreased score)"
    if (desc.includes(':') || desc.toLowerCase().includes('score') || desc.toLowerCase().includes('decreased') || desc.toLowerCase().includes('increased')) {
        const title = cleanFeatureTitle(desc);
        return impact === 'protective'
            ? `Optimal performance recorded in ${title.toLowerCase()}`
            : `Slight variance recorded in ${title.toLowerCase()}`;
    }
    return desc;
}

function buildExplainability(prediction: CognitiveModelPrediction | null): ExplainabilityViewModel {
    if (!prediction || !prediction.topAttributions || prediction.topAttributions.length === 0) {
        return { positive: [], negative: [] };
    }

    const positive: ExplainabilityFactor[] = [];
    const negative: ExplainabilityFactor[] = [];

    prediction.topAttributions.forEach((attr, idx) => {
        const normKey = attr.featureName.toLowerCase().replace(/[\s\.]+/g, '_');
        const translation = BIOMARKER_TRANSLATIONS[normKey] ||
            Object.entries(BIOMARKER_TRANSLATIONS).find(([k]) => normKey.includes(k) || k.includes(normKey))?.[1];

        const impactLevel: 'high' | 'moderate' | 'mild' = idx < 2 ? 'high' : (idx < 4 ? 'moderate' : 'mild');

        if (translation) {
            if (attr.impact === 'protective') {
                positive.push({
                    factor: translation.domain || attr.domain || 'Cognitive',
                    title: translation.title,
                    description: translation.positive,
                    impactLevel,
                });
            } else if (attr.impact === 'risk') {
                negative.push({
                    factor: translation.domain || attr.domain || 'Cognitive',
                    title: translation.title,
                    description: translation.negative,
                    impactLevel,
                });
            }
        } else {
            const title = cleanFeatureTitle(attr.featureName);
            const desc = cleanFeatureDescription(attr.description, attr.impact);
            if (attr.impact === 'protective') {
                positive.push({
                    factor: attr.domain || 'Cognitive',
                    title,
                    description: desc,
                    impactLevel,
                });
            } else if (attr.impact === 'risk') {
                negative.push({
                    factor: attr.domain || 'Cognitive',
                    title,
                    description: desc,
                    impactLevel,
                });
            }
        }
    });

    return {
        positive: positive.slice(0, 5),
        negative: negative.slice(0, 5),
    };
}

const MODULE_ENRICHMENT: Record<string, { domainName: string; duration: string }> = {
    reaction: { domainName: 'Processing Speed', duration: '~2 mins' },
    attention: { domainName: 'Attention & Vigilance', duration: '~3 mins' },
    vmra: { domainName: 'Visual Episodic Memory', duration: '~4 mins' },
    story: { domainName: 'Verbal Recall & Narrative', duration: '~4 mins' },
    language: { domainName: 'Acoustics & Fluency', duration: '~3 mins' },
    pattern: { domainName: 'Executive Function', duration: '~3 mins' },
    navigation: { domainName: 'Visuospatial Wayfinding', duration: '~5 mins' },
};

function buildAssessmentModules(rawData: RawDashboardData): AssessmentModuleViewModel[] {
    const moduleDataMap: Record<string, any[]> = {
        reaction: deduplicateRawResults(rawData.reaction || []),
        attention: deduplicateRawResults(rawData.attention || []),
        vmra: deduplicateRawResults(rawData.vmra || []),
        story: deduplicateRawResults(rawData.story || []),
        language: deduplicateRawResults(rawData.language || []),
        pattern: deduplicateRawResults(rawData.pattern || []),
        navigation: deduplicateRawResults(rawData.navigation || []),
        memory: deduplicateRawResults(rawData.memory || []),
    };

    return MODULE_META.map(meta => {
        const results = moduleDataMap[meta.key] || [];
        const isCompleted = results.length > 0;
        const latest = isCompleted ? results[results.length - 1] : null;
        const first = isCompleted ? results[0] : null;
        const score = latest ? extractModuleScore(meta.key, latest) : null;
        const firstScore = first ? extractModuleScore(meta.key, first) : null;
        const delta = (results.length > 1 && score != null && firstScore != null)
            ? (meta.key === 'reaction' ? firstScore - score : score - firstScore)
            : null;

        const lastDate = latest
            ? new Date(latest.timestamp).toLocaleDateString('en-GB')
            : null;

        const enrichment = MODULE_ENRICHMENT[meta.key] || {
            domainName: 'Cognitive Domain',
            duration: '~3 mins',
        };

        // Classify score quality
        let scoreQuality: AssessmentModuleViewModel['scoreQuality'] = undefined;
        if (score != null) {
            if (meta.key === 'reaction') {
                scoreQuality = score <= 280 ? 'optimal' : (score <= 400 ? 'good' : (score <= 550 ? 'monitor' : 'alert'));
            } else {
                scoreQuality = score >= 80 ? 'optimal' : (score >= 65 ? 'good' : (score >= 50 ? 'monitor' : 'alert'));
            }
        }

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
            domainName: enrichment.domainName,
            accentColor: meta.chartColor,
            estimatedDuration: enrichment.duration,
            scoreQuality,
            delta,
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
        reaction: deduplicateRawResults(rawData.reaction || []),
        attention: deduplicateRawResults(rawData.attention || []),
        vmra: deduplicateRawResults(rawData.vmra || []),
        story: deduplicateRawResults(rawData.story || []),
        language: deduplicateRawResults(rawData.language || []),
        pattern: deduplicateRawResults(rawData.pattern || []),
        navigation: deduplicateRawResults(rawData.navigation || []),
        memory: deduplicateRawResults(rawData.memory || []),
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
        ...deduplicateRawResults(rawData.reaction || []),
        ...deduplicateRawResults(rawData.attention || []),
        ...deduplicateRawResults(rawData.vmra || []),
        ...deduplicateRawResults(rawData.story || []),
        ...deduplicateRawResults(rawData.language || []),
        ...deduplicateRawResults(rawData.pattern || []),
        ...deduplicateRawResults(rawData.navigation || []),
        ...deduplicateRawResults(rawData.memory || []),
    ];
    for (const r of allResults) {
        const ts = new Date(r.timestamp).getTime();
        if (ts > latest) latest = ts;
    }
    return latest > 0 ? new Date(latest).toLocaleDateString('en-GB') : 'N/A';
}

function buildRadarTimeline(
    rawData: RawDashboardData,
    currentRadarScores: CognitiveRadarDomainScores
): RadarTimelinePoint[] {
    const allDates = new Set<string>();
    const dateToTimestampMap = new Map<string, number>();

    const moduleDataMap: Record<string, any[]> = {
        reaction: deduplicateRawResults(rawData.reaction || []),
        attention: deduplicateRawResults(rawData.attention || []),
        vmra: deduplicateRawResults(rawData.vmra || []),
        story: deduplicateRawResults(rawData.story || []),
        language: deduplicateRawResults(rawData.language || []),
        pattern: deduplicateRawResults(rawData.pattern || []),
        navigation: deduplicateRawResults(rawData.navigation || []),
        memory: deduplicateRawResults(rawData.memory || []),
    };

    for (const results of Object.values(moduleDataMap)) {
        for (const r of results) {
            const d = new Date(r.timestamp);
            const dateStr = d.toDateString();
            allDates.add(dateStr);
            if (!dateToTimestampMap.has(dateStr) || d.getTime() > dateToTimestampMap.get(dateStr)!) {
                dateToTimestampMap.set(dateStr, d.getTime());
            }
        }
    }

    const sortedDates = Array.from(allDates).sort(
        (a, b) => (dateToTimestampMap.get(a) || 0) - (dateToTimestampMap.get(b) || 0)
    );

    if (sortedDates.length === 0) {
        return [{
            sessionId: 'current',
            date: new Date().toLocaleDateString('en-GB'),
            timestamp: Date.now(),
            label: 'Current Assessment',
            scores: { ...currentRadarScores },
        }];
    }

    const timeline: RadarTimelinePoint[] = sortedDates.map((dateStr, idx) => {
        const isLatest = idx === sortedDates.length - 1;
        const ts = dateToTimestampMap.get(dateStr) || Date.now();
        const formattedDate = new Date(dateStr).toLocaleDateString('en-GB');
        const label = idx === 0 ? 'Baseline (First Visit)' : (isLatest ? 'Current (Latest)' : `Session ${idx + 1}`);

        // Extract raw scores for this date
        const getMatch = (mod: string) => moduleDataMap[mod].filter((r: any) => new Date(r.timestamp).toDateString() === dateStr).pop();

        const vmraMatch = getMatch('vmra');
        const storyMatch = getMatch('story');
        const langMatch = getMatch('language');
        const patMatch = getMatch('pattern');
        const rxMatch = getMatch('reaction');
        const navMatch = getMatch('navigation');
        const attMatch = getMatch('attention');
        const memMatch = getMatch('memory');

        // Derive scores for this session snapshot
        let memScore = 80;
        if (vmraMatch || storyMatch) {
            const vAcc = vmraMatch ? (((vmraMatch.features?.recallAccuracy ?? vmraMatch.accuracy ?? 0.8)) * 100) : 80;
            const sAcc = storyMatch ? (storyMatch.storyRecallScore ?? 80) : vAcc;
            memScore = Math.round((vAcc + sAcc) / 2);
        } else if (memMatch) {
            memScore = Math.round((memMatch.accuracy || 0.8) * 100);
        }

        let langScore = 85;
        if (langMatch) {
            langScore = Math.round(langMatch.derivedFeatures?.cognitiveSpeechIndex ?? langMatch.derivedFeatures?.fluencyIndex ?? 85);
        }

        let speedScore = 82;
        if (rxMatch) {
            const meanLat = rxMatch.aggregates?.avg ?? (Array.isArray(rxMatch) ? rxMatch[0]?.aggregates?.avg : 300);
            speedScore = Math.round(Math.max(10, Math.min(100, 100 - (meanLat - 200) / 7)));
        }

        let execScore = 84;
        if (patMatch) {
            const maxLvl = patMatch.metrics?.maxLevelReached ?? 8;
            execScore = Math.round(Math.min(100, maxLvl * 10));
        }

        let spatScore = 85;
        if (navMatch) {
            spatScore = Math.round(navMatch.navigationScore ?? (navMatch.biomarkers?.navigationAccuracy ? navMatch.biomarkers.navigationAccuracy * 100 : 85));
        }

        let attScore = Math.round((speedScore * 0.5 + execScore * 0.5));
        if (attMatch) {
            attScore = Math.round(attMatch.profile?.compositeScore ?? (attMatch.features?.hitRate ? attMatch.features.hitRate * 100 : attScore));
        }

        // If it's the latest and we have multi-task prediction scores, prefer them for exact alignment
        const sessionScores: CognitiveRadarDomainScores = (isLatest && Object.values(currentRadarScores).some(v => v > 0))
            ? { ...currentRadarScores }
            : {
                memory: Math.min(100, Math.max(0, memScore)),
                language: Math.min(100, Math.max(0, langScore)),
                executive: Math.min(100, Math.max(0, execScore)),
                processingSpeed: Math.min(100, Math.max(0, speedScore)),
                spatialOrientation: Math.min(100, Math.max(0, spatScore)),
                attention: Math.min(100, Math.max(0, attScore)),
            };

        return {
            sessionId: `session-${idx + 1}`,
            date: formattedDate,
            timestamp: ts,
            label,
            scores: sessionScores,
        };
    });

    return timeline;
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

    // Compute exact number of completed full sessions (all 7 assessments once = 1 session)
    const moduleCounts = [
        deduplicateRawResults(rawData.reaction || []).length,
        deduplicateRawResults(rawData.pattern || []).length,
        deduplicateRawResults(rawData.vmra || []).length,
        deduplicateRawResults(rawData.story || []).length,
        deduplicateRawResults(rawData.language || []).length,
        deduplicateRawResults(rawData.navigation || []).length,
        Math.max(
            deduplicateRawResults(rawData.attention || []).length,
            deduplicateRawResults(rawData.memory || []).length
        ),
    ];
    const fullBatterySessions = Math.min(...moduleCounts);
    overview.fullSessionsCompleted = Math.max(fullBatterySessions, sessionCount > 0 ? sessionCount : 0);
    overview.totalTestsCompleted = moduleCounts.reduce((a, b) => a + b, 0);

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
    const radarScores: CognitiveRadarDomainScores = prediction
        ? { ...prediction.domainScores }
        : {
            memory: 0,
            language: 0,
            executive: 0,
            processingSpeed: 0,
            spatialOrientation: 0,
            attention: 0,
        };

    const radarTimeline = buildRadarTimeline(rawData, radarScores);
    const baselineRadarScores: CognitiveRadarDomainScores = radarTimeline.length > 0
        ? { ...radarTimeline[0].scores }
        : { ...radarScores };

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
        baselineRadarScores,
        radarTimeline,
        hasData,
        isLoading,
        sessionCount,
    };
}
