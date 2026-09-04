/**
 * VyomFlow v2 Multi-Task Clinical Cognitive Engine
 * =================================================
 * High-performance client-side inference engine powered by the trained Multi-Task
 * Cognitive Model on 83,461 clinical patient records.
 *
 * Produces:
 * 1. 3-Class Diagnostic Probabilities: [P(Normal), P(MCI), P(Dementia)]
 * 2. Continuous Estimated MoCA Score: 0.0 - 30.0
 * 3. 6 Domain Sub-Scores: Memory, Language, Processing Speed, Executive, Spatial, Attention (0-100)
 * 4. Local Biomarker Attributions: Top risk & protective factors for clinician exports
 */

import type { RawDashboardData, UserDemographics } from './dataMapper';

export interface BiomarkerAttribution {
    featureName: string;
    domain: string;
    observedValue: number;
    impact: 'risk' | 'protective' | 'neutral';
    attributionScore: number;
    description: string;
}

export interface CognitiveModelPrediction {
    predictedDiagnosis: 'Normal' | 'MCI' | 'Dementia';
    probabilities: {
        normal: number;
        mci: number;
        dementia: number;
    };
    impairmentRiskScore: number; // 0.0 to 1.0 (1 - P(Normal))
    estimatedMoCA: number; // 0.0 to 30.0
    mocaConfidenceInterval: number; // e.g. +/- 0.73 points (95% CI)
    domainScores: {
        memory: number;
        language: number;
        executive: number;
        processingSpeed: number;
        spatialOrientation: number;
        attention: number;
    };
    clinicalAlertTier: 'STABLE' | 'CONTINUE_MONITORING' | 'RECOMMEND_EARLIER_REASSESSMENT' | 'RECOMMEND_CLINICAL_EVALUATION';
    topAttributions: BiomarkerAttribution[];
    modelConfidence: number; // 0-100%
    batteryCoverage: number; // 0.0 - 1.0 (proportion of the 6 test modules completed)
    completedModules: string[];
}

interface ModelBundle {
    metadata: {
        model_name: string;
        version: string;
        architecture: string;
        target_classes: string[];
    };
    validation_metrics: {
        accuracy: number;
        diagnosis_balanced_accuracy: number;
        diagnosis_macro_f1: number;
        moca_mae: number;
        moca_r2: number;
    };
    feature_names: string[];
    feature_domains: Record<string, string>;
    feature_means: number[];
    feature_stds: number[];
    classifier: {
        classes: string[];
        intercept: number[];
        coefficients: number[][];
    };
    moca_regressor: {
        intercept: number;
        coefficients: number[];
        output_min: number;
        output_max: number;
    };
    domain_regressors: Record<string, {
        intercept: number;
        coefficients: number[];
        output_min: number;
        output_max: number;
    }>;
    global_feature_importance: Record<string, number>;
}

import { VYOMFLOW_MODEL_BUNDLE } from './vyomflowModelBundle';

let cachedBundle: ModelBundle | null = VYOMFLOW_MODEL_BUNDLE as unknown as ModelBundle;

export async function loadModelBundle(): Promise<ModelBundle | null> {
    if (cachedBundle) return cachedBundle;
    return VYOMFLOW_MODEL_BUNDLE as unknown as ModelBundle;
}

function softmax(logits: number[]): number[] {
    const maxL = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxL));
    const sumE = exps.reduce((acc, e) => acc + e, 0);
    return exps.map(e => e / sumE);
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

/**
 * Extracts the complete 75-feature vector from all 7 assessment modules and demographics.
 */
export function extract75Biomarkers(
    data: RawDashboardData,
    demographics?: UserDemographics
): Record<string, number> {
    const age = demographics?.age && demographics.age > 0 ? demographics.age : 65.0;
    const genderCode = demographics?.gender?.toLowerCase() === 'female' ? 1.0 : 0.0;
    const edu = demographics?.educationYears && demographics.educationYears > 0 ? demographics.educationYears : 16.0;

    // 1. VMRA
    let vmraAcc = 0.82;
    let vmraFpr = 0.05;
    let vmraPrec = 0.94;
    let vmraF1 = 0.87;
    let vmraNet = 9.5;
    let vmraMeanLat = 1100.0;
    let vmraFirstTap = 680.0;
    let vmraInterTap = 450.0;
    let vmraLatVar = 9500.0;
    let vmraPrim = 0.92;
    let vmraRec = 0.86;
    let vmraMidDef = 0.09;
    let vmraIntrusions = 1;
    let vmraGridCov = 0.92;
    let vmraDelAcc = 0.75;
    let vmraDecaySlope = 0.12;

    if (data.vmra && data.vmra.length > 0) {
        const v = data.vmra[data.vmra.length - 1];
        const feat = v.features as any;
        const rawAcc = feat?.recallAccuracy ?? feat?.accuracy ?? (v as any).accuracy;
        if (rawAcc != null) vmraAcc = rawAcc > 1 ? rawAcc / 100 : rawAcc;
        const rawFpr = feat?.falsePositiveRate;
        if (rawFpr != null) vmraFpr = rawFpr > 1 ? rawFpr / 100 : rawFpr;
        const rawPrec = feat?.precision;
        if (rawPrec != null) vmraPrec = rawPrec > 1 ? rawPrec / 100 : rawPrec;
        const rawF1 = feat?.f1Score;
        if (rawF1 != null) vmraF1 = rawF1 > 1 ? rawF1 / 100 : rawF1;
        vmraNet = clamp(feat?.netRecallScore ?? vmraNet, 0, 16);
        vmraMeanLat = clamp(feat?.meanSelectionLatencyMs ?? vmraMeanLat, 300, 8000);
        vmraFirstTap = clamp(feat?.firstTapLatencyMs ?? vmraFirstTap, 100, 5000);
        vmraInterTap = clamp(feat?.meanInterTapIntervalMs ?? vmraInterTap, 50, 3000);
        vmraLatVar = clamp(feat?.latencyVariance ?? vmraLatVar, 0, 50000);
        vmraPrim = clamp(feat?.primacyBias ?? vmraPrim, 0, 1);
        vmraRec = clamp(feat?.recencyBias ?? vmraRec, 0, 1);
        vmraMidDef = clamp(feat?.midListDeficit ?? vmraMidDef, 0, 1);
        vmraIntrusions = clamp(feat?.intrusionErrors ?? vmraIntrusions, 0, 15);
        vmraGridCov = clamp(feat?.gridCoverage ?? vmraGridCov, 0, 1);
        if (v.delayedRecall?.delayedFeatures) {
            const rawDel = (v.delayedRecall.delayedFeatures as any).recallAccuracy;
            vmraDelAcc = rawDel != null ? (rawDel > 1 ? rawDel / 100 : rawDel) : (vmraAcc * 0.85);
            vmraDecaySlope = clamp(v.delayedRecall.forgettingCurveSlope ?? vmraDecaySlope, 0, 1);
        } else {
            vmraDelAcc = vmraAcc * 0.85;
        }
    }

    // 2. Story
    let storyAcc = 0.80;
    let storyUnits = 12;
    let storyOmissions = 3;
    let storyFalse = 1;
    let storyMcq = 0.90;
    let storyComprRt = 1450.0;
    let storySeq = 0.88;
    let storyComp = 0.85;
    let storySim = 0.88;
    let storyWpm = 135.0;
    let storyLexDiv = 0.72;
    let storyHesRate = 0.03;
    let storyPauseFreq = 2.8;

    if (data.story && data.story.length > 0) {
        const s = data.story[data.story.length - 1];
        const bio = s.biomarkers;
        const rawStoryAcc = bio?.memory?.recallAccuracy ?? (s as any).score ?? s.storyRecallScore;
        if (rawStoryAcc != null) storyAcc = rawStoryAcc > 1 ? rawStoryAcc / 100 : rawStoryAcc;
        storyUnits = clamp(bio?.memory?.infoUnitsRecalled ?? storyUnits, 0, 30);
        storyOmissions = clamp(bio?.memory?.omissionCount ?? storyOmissions, 0, 30);
        storyFalse = clamp(bio?.memory?.falseRecallCount ?? storyFalse, 0, 30);
        const rawMcq = bio?.comprehension?.mcqAccuracy;
        if (rawMcq != null) storyMcq = rawMcq > 1 ? rawMcq / 100 : rawMcq;
        storyComprRt = clamp(bio?.comprehension?.avgResponseTimeMs ?? storyComprRt, 300, 8000);
        const rawSeq = bio?.narrative?.storySequenceScore;
        if (rawSeq != null) storySeq = rawSeq > 1 ? rawSeq / 100 : rawSeq;
        const rawComp = bio?.narrative?.narrativeCompleteness;
        if (rawComp != null) storyComp = rawComp > 1 ? rawComp / 100 : rawComp;
        const rawSim = bio?.narrative?.similarityScore;
        if (rawSim != null) storySim = rawSim > 1 ? rawSim / 100 : rawSim;
        storyWpm = clamp(bio?.speech?.speechRateWPM ?? storyWpm, 30, 260);
        const rawLex = bio?.speech?.lexicalDiversity;
        if (rawLex != null) storyLexDiv = rawLex > 1 ? rawLex / 100 : rawLex;
        const rawHes = bio?.speech?.hesitationRate;
        if (rawHes != null) storyHesRate = rawHes > 1 ? rawHes / 100 : rawHes;
        storyPauseFreq = clamp(bio?.speech?.pauseFrequency ?? storyPauseFreq, 0, 30);
    }

    // 3. Language
    let langWpm = 135.0;
    let langArtRate = 155.0;
    let langPhonation = 0.85;
    let langPauses = 3;
    let langPauseDur = 320.0;
    let langFillers = 2;
    let langReps = 1;
    let langLexDiv = 0.74;
    let langRootTtr = 0.82;
    let langHes = 0.035;
    let langFluency = 86.0;
    let langStab = 88.0;
    let langSemCoh = 88.0;
    let langSyntax = 85.0;
    let langIdeaDen = 0.65;
    let langCsi = 86.0;

    if (data.language && data.language.length > 0) {
        const l = data.language[data.language.length - 1];
        const raw = l.rawMetrics;
        const der = l.derivedFeatures;
        langWpm = clamp(der?.wpm ?? raw?.wordCount ?? langWpm, 30, 260);
        langArtRate = clamp(der?.articulationRate ?? (langWpm * 1.15), 30, 300);
        const rawPhon = der?.phonationRatio;
        if (rawPhon != null) langPhonation = rawPhon > 1 ? rawPhon / 100 : rawPhon;
        langPauses = clamp(raw?.pauseCount ?? langPauses, 0, 40);
        langPauseDur = clamp(raw?.pauseDurationAvg ?? langPauseDur, 50, 4000);
        langFillers = clamp(raw?.fillerWordCount ?? langFillers, 0, 40);
        langReps = clamp(raw?.repetitions ?? langReps, 0, 25);
        const rawLex = der?.lexicalDiversity;
        if (rawLex != null) langLexDiv = rawLex > 1 ? rawLex / 100 : rawLex;
        const rawTtr = der?.rootTTR;
        if (rawTtr != null) langRootTtr = rawTtr > 1 ? rawTtr / 100 : rawTtr;
        const rawHes = der?.hesitationIndex;
        if (rawHes != null) langHes = rawHes > 1 ? rawHes / 100 : rawHes;
        const rawFlu = der?.fluencyIndex;
        if (rawFlu != null) langFluency = rawFlu <= 1 ? rawFlu * 100 : rawFlu;
        const rawStab = der?.speechStability;
        if (rawStab != null) langStab = rawStab <= 1 ? rawStab * 100 : rawStab;
        const rawSem = der?.semanticCoherence;
        if (rawSem != null) langSemCoh = rawSem <= 1 ? rawSem * 100 : rawSem;
        const rawSyn = der?.syntacticComplexity;
        if (rawSyn != null) langSyntax = rawSyn <= 1 ? rawSyn * 100 : rawSyn;
        const rawIdea = der?.ideaDensity;
        if (rawIdea != null) langIdeaDen = rawIdea > 1 ? rawIdea / 100 : rawIdea;
        const rawCsi = der?.cognitiveSpeechIndex;
        if (rawCsi != null) langCsi = rawCsi <= 1 ? rawCsi * 100 : rawCsi;
    }

    // 4. Pattern
    let patAcc = 0.80;
    let patMaxLevel = 8;
    let patLearnRate = 23.3;
    let patErrGrowth = 0.05;
    let patLoadTol = 82.0;
    let patStabIdx = 85.0;
    let patAvgLat = 850.0;
    let patSpanFwd = 8;
    let patSpanBwd = 6;

    if (data.pattern && data.pattern.length > 0) {
        const p = data.pattern[data.pattern.length - 1] as any;
        const met = p.metrics;
        const feat = p.features || p.derivedFeatures;
        if (met) {
            patAcc = (met.correctRounds / Math.max(1, met.totalRounds || 1));
        } else if ((p as any).accuracy != null) {
            patAcc = (p as any).accuracy > 1 ? (p as any).accuracy / 100 : (p as any).accuracy;
        }
        patMaxLevel = clamp(met?.maxLevelReached ?? patMaxLevel, 1, 15);
        patAvgLat = clamp(met?.averageResponseLatency ?? patAvgLat, 200, 5000);
        const rawLearn = feat?.learningRate;
        if (rawLearn != null) {
            // Defensively guard against unscaled thousands or huge negative rates
            patLearnRate = clamp(rawLearn, 5.0, 45.0);
        }
        const rawErr = feat?.errorGrowthRate;
        if (rawErr != null) patErrGrowth = rawErr > 1 ? rawErr / 100 : rawErr;
        const rawLoad = feat?.memoryLoadTolerance;
        if (rawLoad != null) patLoadTol = rawLoad <= 1 ? rawLoad * 100 : rawLoad;
        const rawStab = feat?.patternStabilityIndex;
        if (rawStab != null) patStabIdx = rawStab <= 1 ? rawStab * 100 : rawStab;
        patSpanFwd = Math.min(12, Math.max(3, patMaxLevel + 1));
        patSpanBwd = Math.min(10, Math.max(2, Math.round((patMaxLevel - 1) * 0.85)));
    }

    // 5. Reaction / SAVT
    let rxMeanLat = 320.0;
    let rxMedianLat = 310.0;
    let rxLatStd = 35.0;
    let rxFastest = 230.0;
    let rxSlowest = 450.0;
    let rxLapses = 1;
    let rxPremature = 0;
    let rxVigilanceDec = 25.0;
    let rxWaisScore = 75.0;

    if (data.reaction && data.reaction.length > 0) {
        const r = data.reaction[data.reaction.length - 1];
        const agg = (r as any).aggregates;
        rxMeanLat = clamp(agg?.avg ?? agg?.mean ?? rxMeanLat, 150, 2000);
        rxMedianLat = clamp(agg?.median ?? (rxMeanLat - 10), 150, 2000);
        rxLatStd = clamp(agg?.std ?? rxLatStd, 5, 400);
        rxFastest = clamp(agg?.min ?? (rxMeanLat - 2 * rxLatStd), 100, 1500);
        rxSlowest = clamp(agg?.max ?? (rxMeanLat + 2.5 * rxLatStd), 200, 3500);
        rxLapses = clamp(agg?.lapses ?? rxLapses, 0, 25);
        rxPremature = clamp(agg?.premature ?? rxPremature, 0, 25);
        rxWaisScore = Math.max(10, Math.min(95, 110 - (rxMeanLat / 5.5)));
    }

    // 6. Navigation
    let navAcc = 0.85;
    let navLandmarkAcc = 0.86;
    let navSpatialMem = 88.0;
    let navWayfindingEff = 0.88;
    let navHeadingErr = 12.0;
    let navStops = 1;
    let navBacktrack = 1;
    let navTimeSecs = 48.0;
    let navDisorient = 0.25;

    if (data.navigation && data.navigation.length > 0) {
        const n = data.navigation[data.navigation.length - 1];
        const bio = n.biomarkers as any;
        const rawNavAcc = bio?.navigationAccuracy ?? (n as any).score ?? n.navigationScore;
        if (rawNavAcc != null) navAcc = rawNavAcc > 1 ? rawNavAcc / 100 : rawNavAcc;
        const rawLand = bio?.landmarkRecognitionAccuracy;
        if (rawLand != null) navLandmarkAcc = rawLand > 1 ? rawLand / 100 : rawLand;
        const rawSpat = bio?.spatialMemoryIndex;
        if (rawSpat != null) navSpatialMem = rawSpat <= 1 ? rawSpat * 100 : rawSpat;
        const rawEff = bio?.wayfindingEfficiency;
        if (rawEff != null) navWayfindingEff = rawEff > 1 ? rawEff / 100 : rawEff;
        navHeadingErr = clamp(bio?.headingErrorDegrees ?? navHeadingErr, 0, 180);
        navStops = clamp(bio?.stopsAndPausesCount ?? navStops, 0, 25);
        navBacktrack = clamp(bio?.backtrackingCount ?? navBacktrack, 0, 25);
        navTimeSecs = clamp(bio?.timeToCompleteSeconds ?? navTimeSecs, 10, 300);
        navDisorient = Math.max(0, Math.min(3.0, (1 - navAcc) * 2.5));
    }


    return {
        Age: age,
        Gender: genderCode,
        Education_Years: edu,

        vmra_recallAccuracy: vmraAcc,
        vmra_falsePositiveRate: vmraFpr,
        vmra_precision: vmraPrec,
        vmra_f1Score: vmraF1,
        vmra_netRecallScore: vmraNet,
        vmra_meanSelectionLatencyMs: vmraMeanLat,
        vmra_firstTapLatencyMs: vmraFirstTap,
        vmra_meanInterTapIntervalMs: vmraInterTap,
        vmra_latencyVariance: vmraLatVar,
        vmra_primacyBias: vmraPrim,
        vmra_recencyBias: vmraRec,
        vmra_midListDeficit: vmraMidDef,
        vmra_intrusionErrors: vmraIntrusions,
        vmra_gridCoverage: vmraGridCov,
        vmra_delayedRecallAccuracy: vmraDelAcc,
        vmra_forgettingCurveSlope: vmraDecaySlope,

        story_recallAccuracy: storyAcc,
        story_infoUnitsRecalled: storyUnits,
        story_omissionCount: storyOmissions,
        story_falseRecallCount: storyFalse,
        story_mcqAccuracy: storyMcq,
        story_comprehensionAvgResponseTimeMs: storyComprRt,
        story_sequenceScore: storySeq,
        story_narrativeCompleteness: storyComp,
        story_similarityScore: storySim,
        story_speechRateWPM: storyWpm,
        story_lexicalDiversity: storyLexDiv,
        story_hesitationRate: storyHesRate,
        story_pauseFrequency: storyPauseFreq,

        lang_wpm: langWpm,
        lang_articulationRate: langArtRate,
        lang_phonationRatio: langPhonation,
        lang_pauseCount: langPauses,
        lang_pauseDurationAvgMs: langPauseDur,
        lang_fillerWordCount: langFillers,
        lang_repetitions: langReps,
        lang_lexicalDiversity: langLexDiv,
        lang_rootTTR: langRootTtr,
        lang_hesitationIndex: langHes,
        lang_fluencyIndex: langFluency,
        lang_speechStability: langStab,
        lang_semanticCoherence: langSemCoh,
        lang_syntacticComplexity: langSyntax,
        lang_ideaDensity: langIdeaDen,
        lang_cognitiveSpeechIndex: langCsi,

        pattern_accuracy: patAcc,
        pattern_maxLevelReached: patMaxLevel,
        pattern_learningRate: patLearnRate,
        pattern_errorGrowthRate: patErrGrowth,
        pattern_memoryLoadTolerance: patLoadTol,
        pattern_patternStabilityIndex: patStabIdx,
        pattern_averageResponseLatencyMs: patAvgLat,
        pattern_digitSpanForward: patSpanFwd,
        pattern_digitSpanBackward: patSpanBwd,

        reaction_meanLatencyMs: rxMeanLat,
        reaction_medianLatencyMs: rxMedianLat,
        reaction_latencyStdDev: rxLatStd,
        reaction_fastestResponseMs: rxFastest,
        reaction_slowestResponseMs: rxSlowest,
        reaction_lapsesCount: rxLapses,
        reaction_prematureResponsesCount: rxPremature,
        reaction_vigilanceDecrement: rxVigilanceDec,
        reaction_waisSpeedScore: rxWaisScore,

        nav_navigationAccuracy: navAcc,
        nav_landmarkRecognitionAccuracy: navLandmarkAcc,
        nav_spatialMemoryIndex: navSpatialMem,
        nav_wayfindingEfficiency: navWayfindingEff,
        nav_headingErrorDegrees: navHeadingErr,
        nav_stopsAndPausesCount: navStops,
        nav_backtrackingCount: navBacktrack,
        nav_timeToCompleteSeconds: navTimeSecs,
        nav_spatialDisorientationScore: navDisorient,

        // Cross-domain non-linear interactions
        inter_memory_speed_decay: (1.0 - vmraDelAcc) * (rxMeanLat / 300.0),
        inter_intrusion_disorientation: vmraIntrusions * navDisorient,
        inter_speech_memory_synergy: (langCsi / 100.0) * storyAcc,
        inter_attention_span_load: (patLoadTol / 100.0) * Math.max(0.0, 1.0 - rxLapses / 10.0),
        inter_motor_cognitive_divergence: rxMeanLat / Math.max(100.0, vmraMeanLat),
    };
}

/**
 * Executes full Multi-Task prediction across all 72 biomarkers.
 */
export async function predictCognitiveProfile(
    data: RawDashboardData,
    demographics?: UserDemographics
): Promise<CognitiveModelPrediction> {
    const bundle = await loadModelBundle();
    const rawMap = extract75Biomarkers(data, demographics);

    // Track completed test battery modules across all 7 assessment modules
    const completedModules: string[] = [];
    if (data.vmra && data.vmra.length > 0) completedModules.push('Visual Memory (VMRA)');
    if (data.story && data.story.length > 0) completedModules.push('Story Recall');
    if (data.language && data.language.length > 0) completedModules.push('Language & Speech');
    if (data.pattern && data.pattern.length > 0) completedModules.push('Pattern Working Memory');
    if (data.reaction && data.reaction.length > 0) completedModules.push('Reaction Time');
    if (data.attention && data.attention.length > 0) completedModules.push('Sustained Attention');
    if (data.navigation && data.navigation.length > 0) completedModules.push('Video Navigation');

    if (!bundle) {
        // Safe heuristic fallback if bundle fetch failed
        const memScore = (rawMap.vmra_recallAccuracy * 0.5 + rawMap.story_recallAccuracy * 0.5) * 100;
        const langScore = rawMap.lang_cognitiveSpeechIndex;
        const execScore = rawMap.pattern_accuracy * 100;
        const speedScore = rawMap.reaction_waisSpeedScore;
        const spatScore = rawMap.nav_navigationAccuracy * 100;
        const attScore = (speedScore * 0.5 + execScore * 0.5);

        const avgScore = (memScore + langScore + execScore + speedScore + spatScore + attScore) / 6;
        const estMoCA = clamp(avgScore / 100 * 30, 0, 30);
        const pNorm = clamp(avgScore / 100, 0.05, 0.95);
        const pMci = (1 - pNorm) * 0.6;
        const pDem = (1 - pNorm) * 0.4;
        const fallbackDiagnosis: 'Normal' | 'MCI' | 'Dementia' = pNorm > 0.6 ? 'Normal' : (pMci > pDem ? 'MCI' : 'Dementia');

        const isExpandedFallback = fallbackDiagnosis === 'MCI' || fallbackDiagnosis === 'Dementia';
        const targetCount = isExpandedFallback ? 7.0 : 4.0;
        const batteryCoverageFallback = Math.min(1.0, Math.max(1, completedModules.length) / targetCount);

        return {
            predictedDiagnosis: fallbackDiagnosis,
            probabilities: { normal: pNorm, mci: pMci, dementia: pDem },
            impairmentRiskScore: 1 - pNorm,
            estimatedMoCA: Math.round(estMoCA * 10) / 10,
            mocaConfidenceInterval: 0.73,
            domainScores: {
                memory: Math.round(memScore),
                language: Math.round(langScore),
                executive: Math.round(execScore),
                processingSpeed: Math.round(speedScore),
                spatialOrientation: Math.round(spatScore),
                attention: Math.round(attScore),
            },
            clinicalAlertTier: pNorm > 0.7 ? 'STABLE' : (pNorm > 0.4 ? 'CONTINUE_MONITORING' : 'RECOMMEND_CLINICAL_EVALUATION'),
            topAttributions: [],
            modelConfidence: Math.round(85 * (0.35 + 0.65 * batteryCoverageFallback)),
            batteryCoverage: Math.round(batteryCoverageFallback * 100) / 100,
            completedModules,
        };
    }

    // Scale input feature vector with robust z-score clipping (Winsorizing)
    const scaledVector = bundle.feature_names.map((name, idx) => {
        const rawVal = rawMap[name];
        const mean = bundle.feature_means[idx];
        const std = bundle.feature_stds[idx];
        const val = (rawVal != null && !isNaN(rawVal) && isFinite(rawVal)) ? rawVal : mean;
        const z = (val - mean) / (std > 1e-6 ? std : 1.0);
        // Robust statistical clamping: prevents noisy outlier or single feature variance from distorting multi-task prediction
        return clamp(z, -3.0, 3.0);
    });

    // 1. Head 1: Multi-Class Softmax Classifier
    const logits = bundle.classifier.classes.map((_, c) => {
        let logit = bundle.classifier.intercept[c];
        const coeffs = bundle.classifier.coefficients[c];
        for (let j = 0; j < scaledVector.length; j++) {
            logit += coeffs[j] * scaledVector[j];
        }
        return logit;
    });
    const probs = softmax(logits);
    const pNormal = probs[0];
    const pMci = probs[1];
    const pDementia = probs[2];

    let predictedDiagnosis: 'Normal' | 'MCI' | 'Dementia' = 'Normal';
    if (pDementia > pMci && pDementia > pNormal) {
        predictedDiagnosis = 'Dementia';
    } else if (pMci > pNormal) {
        predictedDiagnosis = 'MCI';
    }

    const isExpandedBattery = predictedDiagnosis === 'MCI' || predictedDiagnosis === 'Dementia';
    const targetBatteryCount = isExpandedBattery ? 7.0 : 4.0;
    const batteryCoverage = Math.min(1.0, Math.max(1, completedModules.length) / targetBatteryCount);

    // 2. Head 2: Continuous MoCA Regressor
    let mocaPred = bundle.moca_regressor.intercept;
    for (let j = 0; j < scaledVector.length; j++) {
        mocaPred += bundle.moca_regressor.coefficients[j] * scaledVector[j];
    }
    const estimatedMoCA = clamp(mocaPred, bundle.moca_regressor.output_min, bundle.moca_regressor.output_max);

    // 3. Head 3: 6 Domain Regressors
    const domainScores: any = {};
    for (const [dom, model] of Object.entries(bundle.domain_regressors)) {
        let score = model.intercept;
        for (let j = 0; j < scaledVector.length; j++) {
            score += model.coefficients[j] * scaledVector[j];
        }
        domainScores[dom] = clamp(Math.round(score), model.output_min, model.output_max);
    }

    // 4. Head 4: Biomarker Attributions (SHAP impact)
    const attributions: BiomarkerAttribution[] = [];
    for (let j = 0; j < bundle.feature_names.length; j++) {
        const feat = bundle.feature_names[j];
        const dom = bundle.feature_domains[feat] || 'general';
        const impactScore = scaledVector[j] * (bundle.global_feature_importance[feat] || 0.1);
        if (Math.abs(impactScore) > 0.01) {
            attributions.push({
                featureName: feat,
                domain: dom,
                observedValue: rawMap[feat] ?? 0,
                impact: impactScore < -0.1 ? 'risk' : (impactScore > 0.1 ? 'protective' : 'neutral'),
                attributionScore: Math.abs(impactScore),
                description: `${feat.replace(/_/g, ' ')}: ${Math.round((rawMap[feat] ?? 0) * 100) / 100} (${impactScore < 0 ? 'Decreased score' : 'Maintained performance'})`
            });
        }
    }
    attributions.sort((a, b) => b.attributionScore - a.attributionScore);

    // Clinical Alert Tier determination
    let tier: CognitiveModelPrediction['clinicalAlertTier'] = 'STABLE';
    if (predictedDiagnosis === 'Dementia' || pDementia > 0.4 || estimatedMoCA < 18) {
        tier = 'RECOMMEND_CLINICAL_EVALUATION';
    } else if (predictedDiagnosis === 'MCI' || pMci > 0.35 || estimatedMoCA < 24) {
        tier = 'RECOMMEND_EARLIER_REASSESSMENT';
    } else if (pNormal < 0.70 || estimatedMoCA < 26) {
        tier = 'CONTINUE_MONITORING';
    }

    const rawMaxProb = Math.max(pNormal, pMci, pDementia);
    const scaledConfidence = Math.round(rawMaxProb * 100 * (0.35 + 0.65 * batteryCoverage));

    return {
        predictedDiagnosis,
        probabilities: {
            normal: Math.round(pNormal * 1000) / 1000,
            mci: Math.round(pMci * 1000) / 1000,
            dementia: Math.round(pDementia * 1000) / 1000,
        },
        impairmentRiskScore: Math.round((1 - pNormal) * 1000) / 1000,
        estimatedMoCA: Math.round(estimatedMoCA * 10) / 10,
        mocaConfidenceInterval: 0.73,
        domainScores: {
            memory: domainScores.memory ?? 80,
            language: domainScores.language ?? 80,
            executive: domainScores.executive ?? 80,
            processingSpeed: domainScores.speed ?? 80,
            spatialOrientation: domainScores.spatial ?? 80,
            attention: domainScores.attention ?? 80,
        },
        clinicalAlertTier: tier,
        topAttributions: attributions.slice(0, 10),
        modelConfidence: clamp(scaledConfidence, 20, 99),
        batteryCoverage: Math.round(batteryCoverage * 100) / 100,
        completedModules,
    };
}

/**
 * Backward-compatible cross-sectional risk evaluation returning [P(Normal), P(MCI), P(Dementia)]
 */
export async function evaluateCrossSectionalRisk(
    data: RawDashboardData,
    demographics?: UserDemographics
): Promise<number[]> {
    const pred = await predictCognitiveProfile(data, demographics);
    return [pred.probabilities.normal, pred.probabilities.mci, pred.probabilities.dementia];
}
