/**
 * useDashboardViewModel — Single React hook for all dashboard V2 data
 * ====================================================================
 * Orchestrates:
 * 1. All 7 useXxxResults() hooks (Firestore/localStorage data)
 * 2. Demographics from localStorage profile
 * 3. ML prediction via predictCognitiveProfile()
 * 4. Longitudinal drift via evaluatePatientTrajectory() + evaluateLongitudinalDrift()
 * 5. Clinical alert via generateClinicalAlert()
 * 6. buildDashboardViewModel() to produce the final ViewModel
 *
 * Every dashboard-v2 component consumes a slice of the returned ViewModel.
 */

import { useMemo, useEffect, useState } from 'react';
import {
    useReactionResults,
    useMemoryResults,
    usePatternResults,
    useLanguageResults,
    useVmraResults,
    useStoryResults,
    useNavigationResults,
    useAttentionResults,
    deduplicateModuleResults,
} from './useTestResults';
import { predictCognitiveProfile, type CognitiveModelPrediction } from '../services/clinicalModelEngine';
import { evaluatePatientTrajectory, evaluateLongitudinalDrift, type LongitudinalEvaluation, type DriftMetrics } from '../services/statisticalDriftEngine';
import { generateClinicalAlert, type AlertOutput } from '../services/clinicalAlertEngine';
import { mapToSessionData, type RawDashboardData, type UserDemographics } from '../services/dataMapper';
import { buildDashboardViewModel, type DashboardViewModel } from '../services/dashboardViewModel';
import { logger } from '../utils/logger';

export function useDashboardViewModel(): DashboardViewModel {
    // ─── 1. Call all result hooks ─────────────────────────────────
    const { results: reactionResults } = useReactionResults();
    const { results: memoryResults } = useMemoryResults();
    const { results: patternResults } = usePatternResults();
    const { results: languageResults } = useLanguageResults();
    const { results: vmraResults } = useVmraResults();
    const { results: storyResults } = useStoryResults();
    const { results: navigationResults } = useNavigationResults();
    const { results: attentionResults } = useAttentionResults();

    // ─── 2. ML prediction & computation state ────────────────────
    const [prediction, setPrediction] = useState<CognitiveModelPrediction | null>(null);
    const [evaluation, setEvaluation] = useState<LongitudinalEvaluation | null>(null);
    const [alertOutput, setAlertOutput] = useState<AlertOutput | null>(null);
    const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ─── 3. Aggregate raw data (deduplicated) ────────────────────
    const rawData: RawDashboardData = useMemo(() => ({
        reaction: deduplicateModuleResults(reactionResults),
        memory: deduplicateModuleResults(memoryResults),
        pattern: deduplicateModuleResults(patternResults),
        language: deduplicateModuleResults(languageResults),
        vmra: deduplicateModuleResults(vmraResults),
        story: deduplicateModuleResults(storyResults),
        navigation: deduplicateModuleResults(navigationResults),
        attention: deduplicateModuleResults(attentionResults),
    }), [reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults, navigationResults, attentionResults]);

    // ─── 4. Read demographics from localStorage ──────────────────
    const demographics = useMemo((): UserDemographics | undefined => {
        try {
            const saved = localStorage.getItem('vyomflow_user_profile');
            return saved ? JSON.parse(saved) : undefined;
        } catch {
            return undefined;
        }
    }, []);

    // ─── 5. Determine if there is any user data ──────────────────
    const hasData = useMemo(() => {
        return (
            reactionResults.length > 0 ||
            memoryResults.length > 0 ||
            patternResults.length > 0 ||
            languageResults.length > 0 ||
            vmraResults.length > 0 ||
            storyResults.length > 0 ||
            navigationResults.length > 0 ||
            attentionResults.length > 0
        );
    }, [reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults, navigationResults, attentionResults]);

    // ─── 6. Run ML inference + drift + alert ─────────────────────
    useEffect(() => {
        let mounted = true;

        async function compute() {
            if (!hasData) {
                if (mounted) {
                    setPrediction(null);
                    setEvaluation(null);
                    setAlertOutput(null);
                    setDriftMetrics(null);
                    setIsLoading(false);
                }
                return;
            }

            try {
                // Run multi-task clinical engine across all biomarkers
                const pred = await predictCognitiveProfile(rawData, demographics);

                // Map raw data to session format for drift engine
                const sessions = mapToSessionData(rawData);

                // Longitudinal drift (requires >= 2 sessions)
                let drift: DriftMetrics | null = null;
                if (sessions.length >= 2) {
                    drift = evaluateLongitudinalDrift(sessions, 10);
                }

                // Build session points for trajectory evaluation
                const sessionPoints = sessions.map((session) => {
                    const moduleScoreValues = Object.values(session.moduleScores);
                    const compositeScore = moduleScoreValues.length > 0
                        ? Math.round(moduleScoreValues.reduce((a, b) => a + b, 0) / moduleScoreValues.length)
                        : 80;

                    return {
                        timestamp: session.timestamp,
                        score: compositeScore,
                        domainScores: session.moduleScores,
                    };
                });

                const eval_ = evaluatePatientTrajectory(sessionPoints);

                // Clinical alert
                const impairmentRisk = pred.impairmentRiskScore;
                const trajectoryCategory = drift
                    ? drift.overallTrajectory
                    : 'STABLE' as const;

                const alert = generateClinicalAlert(
                    trajectoryCategory,
                    impairmentRisk,
                    {
                        density: 100,
                        completeness: 100,
                        oodDistance: 100,
                        uncertainty: 100,
                        history: sessions.length >= 3 ? 100 : (sessions.length === 2 ? 60 : 30),
                    }
                );

                if (mounted) {
                    setPrediction(pred);
                    setEvaluation(eval_);
                    setAlertOutput(alert);
                    setDriftMetrics(drift);
                    setIsLoading(false);
                }
            } catch (err) {
                logger.error('Dashboard ViewModel computation error:', err);
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        setIsLoading(true);
        compute();
        return () => { mounted = false; };
    }, [rawData, demographics, hasData]);

    // ─── 7. Build full ViewModel ─────────────────────────────────
    return useMemo(() => {
        return buildDashboardViewModel(
            rawData,
            prediction,
            evaluation,
            alertOutput,
            driftMetrics,
            demographics,
            isLoading
        );
    }, [rawData, prediction, evaluation, alertOutput, driftMetrics, demographics, isLoading]);
}
