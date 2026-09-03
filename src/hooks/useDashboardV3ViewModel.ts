/**
 * useDashboardV3ViewModel — Single React hook for all dashboard V3 data
 * ====================================================================
 * Orchestrates:
 * 1. All useXxxResults() hooks (Firestore/localStorage test data)
 * 2. Demographics from localStorage profile
 * 3. ML prediction via predictCognitiveProfile()
 * 4. Longitudinal drift via evaluatePatientTrajectory() + evaluateLongitudinalDrift()
 * 5. Clinical alert via generateClinicalAlert()
 * 6. buildDashboardViewModel() to produce the final ViewModel
 * 7. Unbiased simulated dataset fallback when storage has no data yet
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
} from './useTestResults';
import { generateSimulatedData, getMockBaseline } from '../utils/simulateUserData';
import { predictCognitiveProfile, type CognitiveModelPrediction } from '../services/clinicalModelEngine';
import { evaluatePatientTrajectory, evaluateLongitudinalDrift, type LongitudinalEvaluation, type DriftMetrics } from '../services/statisticalDriftEngine';
import { generateClinicalAlert, type AlertOutput } from '../services/clinicalAlertEngine';
import { mapToSessionData, type RawDashboardData, type UserDemographics } from '../services/dataMapper';
import { saveSessionBiomarkersToSupabase } from '../services/supabaseService';
import { buildDashboardViewModel, type DashboardViewModel } from '../services/dashboardViewModel';
import { logger } from '../utils/logger';

export function useDashboardV3ViewModel(): DashboardViewModel {
    // ─── 1. Call all result hooks ─────────────────────────────────
    const { results: reactionResults, isLoading: l1 } = useReactionResults();
    const { results: memoryResults, isLoading: l2 } = useMemoryResults();
    const { results: patternResults, isLoading: l3 } = usePatternResults();
    const { results: languageResults, isLoading: l4 } = useLanguageResults();
    const { results: vmraResults, isLoading: l5 } = useVmraResults();
    const { results: storyResults, isLoading: l6 } = useStoryResults();
    const { results: navigationResults, isLoading: l7 } = useNavigationResults();
    const { results: attentionResults, isLoading: l8 } = useAttentionResults();

    const isHooksLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

    // ─── 2. ML prediction & computation state ────────────────────
    const [prediction, setPrediction] = useState<CognitiveModelPrediction | null>(null);
    const [evaluation, setEvaluation] = useState<LongitudinalEvaluation | null>(null);
    const [alertOutput, setAlertOutput] = useState<AlertOutput | null>(null);
    const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ─── 3. Check if user has taken any actual tests ─────────────
    const hasUserData = useMemo(() => {
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

    // ─── 4. Aggregate raw data (with unbiased simulated fallback) ─
    const rawData: RawDashboardData = useMemo(() => {
        if (!hasUserData) {
            // Unbiased normative dataset fallback
            const fallback = generateSimulatedData(getMockBaseline(), 'stable');
            return {
                reaction: fallback.reaction || [],
                memory: fallback.memory || [],
                pattern: fallback.pattern || [],
                language: fallback.language || [],
                vmra: fallback.vmra || [],
                story: fallback.story || [],
                navigation: fallback.navigation || [],
                attention: fallback.attention || [],
            };
        }
        return {
            reaction: reactionResults,
            memory: memoryResults,
            pattern: patternResults,
            language: languageResults,
            vmra: vmraResults,
            story: storyResults,
            navigation: navigationResults,
            attention: attentionResults,
        };
    }, [hasUserData, reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults, navigationResults, attentionResults]);

    // ─── 5. Read demographics from localStorage ──────────────────
    const demographics = useMemo((): UserDemographics | undefined => {
        try {
            const saved = localStorage.getItem('vyomflow_user_profile');
            return saved ? JSON.parse(saved) : undefined;
        } catch {
            return undefined;
        }
    }, []);

    // ─── 6. Run ML inference + drift + alert ─────────────────────
    useEffect(() => {
        let mounted = true;

        async function compute() {
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

                const eval_ = sessions.length >= 1 ? evaluatePatientTrajectory(sessionPoints) : null;

                // Clinical alert
                const impairmentRisk = pred.impairmentRiskScore;
                const trajectoryCategory = drift
                    ? drift.overallTrajectory
                    : (pred.predictedDiagnosis === 'Dementia' ? 'RAPID_DECLINE' : pred.predictedDiagnosis === 'MCI' ? 'POSSIBLE_DECLINE' : 'STABLE' as const);

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

                // Auto-persist full 75+ Biomarkers Session to Supabase in background
                saveSessionBiomarkersToSupabase(rawData, demographics, pred, eval_, drift).catch(e => {
                    logger.error('Background Supabase session biomarker sync error:', e);
                });

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
    }, [rawData, demographics]);

    // ─── 7. Build full ViewModel ─────────────────────────────────
    return useMemo(() => {
        return buildDashboardViewModel(
            rawData,
            prediction,
            evaluation,
            alertOutput,
            driftMetrics,
            demographics,
            isLoading || isHooksLoading
        );
    }, [rawData, prediction, evaluation, alertOutput, driftMetrics, demographics, isLoading, isHooksLoading]);
}
