/**
 * useDashboardV3ViewModel — Supabase-First Live & Mock Data Hook
 * ===============================================================
 * Orchestrates:
 * 1. Live Supabase Querying for all 7 module results & assessment sessions
 * 2. Real-time WebSocket subscriptions via Supabase Realtime
 * 3. Multi-Trajectory Mock Dataset Suite in Supabase (Stable, MCI, Rapid Decline)
 * 4. ML prediction via predictCognitiveProfile()
 * 5. Longitudinal drift via evaluatePatientTrajectory() + evaluateLongitudinalDrift()
 * 6. Clinical alert via generateClinicalAlert()
 * 7. buildDashboardViewModel() to produce the final ViewModel
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
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
    clearAllTestData,
} from './useTestResults';
import { predictCognitiveProfile, type CognitiveModelPrediction } from '../services/clinicalModelEngine';
import { evaluatePatientTrajectory, evaluateLongitudinalDrift, type LongitudinalEvaluation, type DriftMetrics } from '../services/statisticalDriftEngine';
import { generateClinicalAlert, type AlertOutput } from '../services/clinicalAlertEngine';
import { mapToSessionData, type RawDashboardData, type UserDemographics } from '../services/dataMapper';
import {
    fetchLiveModuleResultsFromSupabase,
    subscribeToLiveAssessmentUpdates,
    seedMockTrajectoryToSupabase,
    clearMockDataFromSupabase,
    deleteAllUserDataFromSupabase,
    getCurrentFirebaseUid,
} from '../services/supabaseService';
import { buildDashboardViewModel, type DashboardViewModel } from '../services/dashboardViewModel';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logger } from '../utils/logger';

export type DashboardDataMode = 'live' | 'mock_stable' | 'mock_mci' | 'mock_decline';

export interface DashboardV3HookReturn extends DashboardViewModel {
    dataMode: DashboardDataMode;
    setDataMode: (mode: DashboardDataMode) => void;
    seedMockPreset: (preset: 'stable' | 'mci' | 'decline') => Promise<void>;
    clearMockData: () => Promise<void>;
    deleteAllData: () => Promise<void>;
    isSeeding: boolean;
    refreshLive: () => void;
}

export function useDashboardV3ViewModel(): DashboardV3HookReturn {
    // ─── 1. Client Hooks (Local cache fallback) ───────────────────
    const { results: reactionResults, isLoading: l1 } = useReactionResults();
    const { results: memoryResults, isLoading: l2 } = useMemoryResults();
    const { results: patternResults, isLoading: l3 } = usePatternResults();
    const { results: languageResults, isLoading: l4 } = useLanguageResults();
    const { results: vmraResults, isLoading: l5 } = useVmraResults();
    const { results: storyResults, isLoading: l6 } = useStoryResults();
    const { results: navigationResults, isLoading: l7 } = useNavigationResults();
    const { results: attentionResults, isLoading: l8 } = useAttentionResults();

    const isHooksLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

    // ─── 2. State ────────────────────────────────────────────────
    const [dataMode, setDataMode] = useState<DashboardDataMode>('live');
    const [supabaseRawData, setSupabaseRawData] = useState<RawDashboardData | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [prediction, setPrediction] = useState<CognitiveModelPrediction | null>(null);
    const [evaluation, setEvaluation] = useState<LongitudinalEvaluation | null>(null);
    const [alertOutput, setAlertOutput] = useState<AlertOutput | null>(null);
    const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshLive = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // ─── 3. Fetch from Supabase based on Mode & Auth State ────────
    useEffect(() => {
        let mounted = true;
        let unsubscribeRealtime = () => {};

        async function loadSupabaseData(targetUid: string | null) {
            if (!targetUid) {
                if (mounted) {
                    setSupabaseRawData(null);
                    setIsLoading(false);
                }
                return;
            }

            const isMock = dataMode !== 'live';
            setIsLoading(true);
            const data = await fetchLiveModuleResultsFromSupabase(targetUid, isMock);

            if (mounted) {
                // If in mock mode but no mock records exist, auto-seed the selected trajectory
                const totalMockCount = (data.reaction?.length || 0) + (data.vmra?.length || 0) + (data.story?.length || 0);
                if (isMock && totalMockCount === 0) {
                    const trajectory = dataMode.replace('mock_', '') as 'stable' | 'mci' | 'decline';
                    setIsSeeding(true);
                    await seedMockTrajectoryToSupabase(targetUid, trajectory);
                    const freshData = await fetchLiveModuleResultsFromSupabase(targetUid, true);
                    setIsSeeding(false);
                    if (mounted) setSupabaseRawData(freshData);
                } else {
                    setSupabaseRawData(data);
                }
                setIsLoading(false);
            }
        }

        const initialUid = auth.currentUser?.uid || getCurrentFirebaseUid();
        loadSupabaseData(initialUid);

        if (dataMode === 'live' && initialUid) {
            unsubscribeRealtime = subscribeToLiveAssessmentUpdates(initialUid, () => {
                loadSupabaseData(initialUid);
            });
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (mounted) {
                const uid = user?.uid || null;
                loadSupabaseData(uid);
                if (dataMode === 'live' && uid) {
                    unsubscribeRealtime();
                    unsubscribeRealtime = subscribeToLiveAssessmentUpdates(uid, () => {
                        loadSupabaseData(uid);
                    });
                }
            }
        });

        return () => {
            mounted = false;
            unsubscribeAuth();
            unsubscribeRealtime();
        };
    }, [dataMode, refreshTrigger]);

    // ─── 4. Mock Seeding Helpers ─────────────────────────────────
    const seedMockPreset = useCallback(async (preset: 'stable' | 'mci' | 'decline') => {
        const uid = auth.currentUser?.uid || getCurrentFirebaseUid();
        if (!uid) return;
        setIsSeeding(true);
        await seedMockTrajectoryToSupabase(uid, preset);
        setDataMode(`mock_${preset}` as DashboardDataMode);
        const data = await fetchLiveModuleResultsFromSupabase(uid, true);
        setSupabaseRawData(data);
        setIsSeeding(false);
    }, []);

    const clearMockData = useCallback(async () => {
        const uid = auth.currentUser?.uid || getCurrentFirebaseUid();
        if (!uid) return;
        setIsSeeding(true);
        await clearMockDataFromSupabase(uid);
        setDataMode('live');
        const data = await fetchLiveModuleResultsFromSupabase(uid, false);
        setSupabaseRawData(data);
        setIsSeeding(false);
    }, []);

    const deleteAllData = useCallback(async () => {
        const uid = auth.currentUser?.uid || getCurrentFirebaseUid();
        setIsSeeding(true);
        if (uid) {
            await deleteAllUserDataFromSupabase(uid);
        }
        await clearAllTestData();
        try {
            sessionStorage.clear();
        } catch {
            // Ignore
        }
        setDataMode('live');
        setSupabaseRawData({
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [],
            navigation: [],
            attention: [],
        });
        setPrediction(null);
        setEvaluation(null);
        setAlertOutput(null);
        setDriftMetrics(null);
        setIsSeeding(false);
        setRefreshTrigger(prev => prev + 1);
    }, []);



    // ─── 5. Resolve Effective Raw Data ───────────────────────────
    const effectiveRawData: RawDashboardData = useMemo(() => {
        if (dataMode !== 'live') {
            return supabaseRawData || {
                reaction: [],
                memory: [],
                pattern: [],
                language: [],
                vmra: [],
                story: [],
                navigation: [],
                attention: [],
            };
        }

        // Live mode: When Supabase data has loaded (even if empty after clean slate), use it as definitive source
        const sb = supabaseRawData;
        if (sb !== null) {
            return {
                reaction: deduplicateModuleResults(sb.reaction || []),
                memory: deduplicateModuleResults(sb.memory || []),
                pattern: deduplicateModuleResults(sb.pattern || []),
                language: deduplicateModuleResults(sb.language || []),
                vmra: deduplicateModuleResults(sb.vmra || []),
                story: deduplicateModuleResults(sb.story || []),
                navigation: deduplicateModuleResults(sb.navigation || []),
                attention: deduplicateModuleResults(sb.attention || []),
            };
        }

        // Unauthenticated or offline fallback to local hook results
        return {
            reaction: deduplicateModuleResults(reactionResults),
            memory: deduplicateModuleResults(memoryResults),
            pattern: deduplicateModuleResults(patternResults),
            language: deduplicateModuleResults(languageResults),
            vmra: deduplicateModuleResults(vmraResults),
            story: deduplicateModuleResults(storyResults),
            navigation: deduplicateModuleResults(navigationResults),
            attention: deduplicateModuleResults(attentionResults),
        };
    }, [dataMode, supabaseRawData, reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults, navigationResults, attentionResults]);

    // Check if user has taken any actual tests or mock dataset is active
    const hasUserData = useMemo(() => {
        return (
            (effectiveRawData.reaction?.length || 0) > 0 ||
            (effectiveRawData.memory?.length || 0) > 0 ||
            (effectiveRawData.pattern?.length || 0) > 0 ||
            (effectiveRawData.language?.length || 0) > 0 ||
            (effectiveRawData.vmra?.length || 0) > 0 ||
            (effectiveRawData.story?.length || 0) > 0 ||
            (effectiveRawData.navigation?.length || 0) > 0 ||
            (effectiveRawData.attention?.length || 0) > 0
        );
    }, [effectiveRawData]);

    // ─── 6. Demographics ─────────────────────────────────────────
    const demographics = useMemo((): UserDemographics | undefined => {
        try {
            const saved = localStorage.getItem('vyomflow_user_profile');
            return saved ? JSON.parse(saved) : undefined;
        } catch {
            return undefined;
        }
    }, []);

    // ─── 7. Run ML Inference + Drift Engine ──────────────────────
    useEffect(() => {
        let mounted = true;

        async function compute() {
            if (!hasUserData) {
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
                // Run multi-task clinical engine across all 75 biomarkers
                const pred = await predictCognitiveProfile(effectiveRawData, demographics);

                // Map raw data to session format for drift engine
                const sessions = mapToSessionData(effectiveRawData);

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

                if (mounted) {
                    setPrediction(pred);
                    setEvaluation(eval_);
                    setAlertOutput(alert);
                    setDriftMetrics(drift);
                    setIsLoading(false);
                }
            } catch (err) {
                logger.error('Error computing dashboard V3 data:', err);
                if (mounted) setIsLoading(false);
            }
        }

        compute();

        return () => {
            mounted = false;
        };
    }, [effectiveRawData, demographics, hasUserData, dataMode]);

    // ─── 8. Build Master ViewModel ───────────────────────────────
    const baseViewModel = useMemo(() => {
        return buildDashboardViewModel(
            effectiveRawData,
            prediction,
            evaluation,
            alertOutput,
            driftMetrics,
            demographics,
            isLoading || isHooksLoading || isSeeding
        );
    }, [effectiveRawData, demographics, prediction, evaluation, alertOutput, driftMetrics, isLoading, isHooksLoading, isSeeding]);

    return {
        ...baseViewModel,
        dataMode,
        setDataMode,
        seedMockPreset,
        clearMockData,
        deleteAllData,
        isSeeding,
        refreshLive,
    };
}

