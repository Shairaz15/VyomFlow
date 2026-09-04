import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useStoryResults,
    useVmraResults,
    useReactionResults,
    usePatternResults,
    useAttentionResults,
    useNavigationResults,
    useLanguageResults,
    STORAGE_KEYS,
} from './useTestResults';
import {
    fetchLiveModuleResultsFromSupabase,
    subscribeToLiveAssessmentUpdates,
    getCurrentFirebaseUid,
    seedMockTrajectoryToSupabase,
    clearMockDataFromSupabase,
    getActiveDataMode,
    setActiveDataMode,
    DATA_MODE_CHANGED_EVENT,
    type DashboardDataMode,
    type RawDashboardData,
} from '../services/supabaseService';
import { predictCognitiveProfile, type CognitiveModelPrediction } from '../services/clinicalModelEngine';

export type ActivityId = 'story' | 'memory' | 'reaction' | 'pattern' | 'attention' | 'navigation' | 'language';

export const BASELINE_ACTIVITY_IDS: ActivityId[] = ['reaction', 'memory', 'pattern', 'language'];
export const EXTENDED_ACTIVITY_IDS: ActivityId[] = ['story', 'attention', 'navigation'];

export const PROTOCOL_SESSION_KEY = "vyomflow_protocol_session_started_at";
export const PROTOCOL_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24-hour protocol window

export function getProtocolSessionStartTime(): number {
    try {
        const raw = localStorage.getItem(PROTOCOL_SESSION_KEY);
        if (raw) {
            const time = parseInt(raw, 10);
            if (!isNaN(time) && Date.now() - time < PROTOCOL_SESSION_MAX_AGE_MS) {
                return time;
            }
        }
    } catch {
        // fallback
    }
    const now = Date.now();
    try {
        localStorage.setItem(PROTOCOL_SESSION_KEY, now.toString());
    } catch {
        // fallback
    }
    return now;
}

export function resetProtocolSession(): void {
    try {
        localStorage.setItem(PROTOCOL_SESSION_KEY, Date.now().toString());
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("vyomflow_protocol_session_reset"));
        }
    } catch {
        // fallback
    }
}

export interface JourneyNodeInfo {
    id: ActivityId;
    order: number;
    title: string;
    canonicalTitle: string;
    route: string;
    duration: string;
    iconName: string;
    description: string;
    userPrompt: string;
    biome: {
        name: string;
        bgGradient: string;
        accentColor: string;
        themeClass: string;
        icon: string;
    };
    hasPractice: boolean;
}

export const JOURNEY_NODES: JourneyNodeInfo[] = [
    {
        id: 'reaction',
        order: 1,
        title: 'Reaction Time',
        canonicalTitle: 'Reaction Time',
        route: '/test/reaction',
        duration: '1.5 min',
        iconName: 'reaction',
        description: 'Tap as quickly as possible when the screen turns green.',
        userPrompt: 'Test your motor speed and vigilance.',
        biome: {
            name: 'Reaction Time',
            bgGradient: 'linear-gradient(135deg, #1f2d3d 0%, #4a3e1b 100%)',
            accentColor: '#D8B878',
            themeClass: 'biome-firefly',
            icon: '⚡',
        },
        hasPractice: false,
    },
    {
        id: 'memory',
        order: 2,
        title: 'Visual Memory',
        canonicalTitle: 'Visual Memory',
        route: '/test/vmra',
        duration: '2 min',
        iconName: 'memory',
        description: 'Remember a set of pictures and pick them out from a grid.',
        userPrompt: 'Can you remember these visual items?',
        biome: {
            name: 'Visual Memory',
            bgGradient: 'linear-gradient(135deg, #183B56 0%, #3d2d5a 100%)',
            accentColor: '#B08BAE',
            themeClass: 'biome-garden',
            icon: '🧠',
        },
        hasPractice: false,
    },
    {
        id: 'pattern',
        order: 3,
        title: 'Pattern Recognition',
        canonicalTitle: 'Pattern Recognition',
        route: '/tests/pattern',
        duration: '2 min',
        iconName: 'pattern',
        description: 'Watch tiles light up and repeat the sequence in order.',
        userPrompt: 'Look carefully and repeat the sequence.',
        biome: {
            name: 'Pattern Recognition',
            bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)',
            accentColor: '#38bdf8',
            themeClass: 'biome-pond',
            icon: '🧩',
        },
        hasPractice: false,
    },
    {
        id: 'language',
        order: 4,
        title: 'Language Fluency',
        canonicalTitle: 'Language Fluency',
        route: '/test/language',
        duration: '2 min',
        iconName: 'language',
        description: 'Speak freely about an image or topic in your own words.',
        userPrompt: 'Describe the scene in your own words.',
        biome: {
            name: 'Language Fluency',
            bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
            accentColor: '#c084fc',
            themeClass: 'biome-corner',
            icon: '🗣️',
        },
        hasPractice: false,
    },
    {
        id: 'story',
        order: 5,
        title: 'Story Narration Recall',
        canonicalTitle: 'Story Narration Recall',
        route: '/test/story',
        duration: '5 min',
        iconName: 'story',
        description: 'Listen to a short narrated story and retell it in your own words.',
        userPrompt: "Let's begin with a short story.",
        biome: {
            name: 'Story Narration Recall',
            bgGradient: 'linear-gradient(135deg, #183B56 0%, #2d5a3e 100%)',
            accentColor: '#8BAE9A',
            themeClass: 'biome-grove',
            icon: '📖',
        },
        hasPractice: false,
    },
    {
        id: 'attention',
        order: 6,
        title: 'Attention',
        canonicalTitle: 'Attention',
        route: '/test/attention',
        duration: '2 min',
        iconName: 'attention',
        description: 'Stay focused and tap only when you see or hear the target cue.',
        userPrompt: 'Stay focused and respond only when you see the target cue.',
        biome: {
            name: 'Attention',
            bgGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            accentColor: '#10b981',
            themeClass: 'biome-meadow',
            icon: '🎯',
        },
        hasPractice: false,
    },
    {
        id: 'navigation',
        order: 7,
        title: 'Immersive Navigation',
        canonicalTitle: 'Immersive Navigation',
        route: '/test/navigation',
        duration: '4 min',
        iconName: 'navigation',
        description: 'Watch a walking path and choose the right turns to find your way.',
        userPrompt: 'Observe the route and navigate your way back.',
        biome: {
            name: 'Immersive Navigation',
            bgGradient: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            accentColor: '#06b6d4',
            themeClass: 'biome-discovery',
            icon: '🧭',
        },
        hasPractice: false,
    },
];

export interface ActivityScoreInfo {
    score: number;
    label: string;
    trend: 'up' | 'down' | 'neutral';
    previousScore?: number;
}

export interface JourneyState {
    completedActivityIds: Set<ActivityId>;
    completedCount: number;
    totalCount: number;
    activeNodeId: ActivityId;
    isJourneyComplete: boolean;
    totalSessionsCompleted: number;
    growthLevel: {
        stage: string;
        icon: string;
        label: string;
        nextThreshold: number;
    };
    activityLastCompletedMap: Record<ActivityId, Date | null>;
    activityLatestScoreMap: Record<ActivityId, ActivityScoreInfo | null>;
    isLoading: boolean;
    isExpandedBattery: boolean;
    activeNodes: JourneyNodeInfo[];
    dataMode: DashboardDataMode;
    setDataMode: (mode: DashboardDataMode) => void;
    seedMockPreset: (preset: 'stable' | 'mci' | 'decline') => Promise<void>;
    clearMockData: () => Promise<void>;
}

export function useJourneyState(): JourneyState {
    const { results: storyResults, isLoading: storyLoading } = useStoryResults();
    const { results: vmraResults, isLoading: vmraLoading } = useVmraResults();
    const { results: reactionResults, isLoading: reactionLoading } = useReactionResults();
    const { results: patternResults, isLoading: patternLoading } = usePatternResults();
    const { results: attentionResults, isLoading: attentionLoading } = useAttentionResults();
    const { results: navigationResults, isLoading: navigationLoading } = useNavigationResults();
    const { results: languageResults, isLoading: languageLoading } = useLanguageResults();

    const [dataMode, setDataModeState] = useState<DashboardDataMode>(() => getActiveDataMode());
    const [supabaseData, setSupabaseData] = useState<RawDashboardData | null>(null);
    const [isSupabaseLoading, setIsSupabaseLoading] = useState(true);

    const [protocolSessionStart, setProtocolSessionStart] = useState<number>(() => getProtocolSessionStartTime());
    const [prediction, setPrediction] = useState<CognitiveModelPrediction | null>(null);

    const setDataMode = useCallback((mode: DashboardDataMode) => {
        setDataModeState(mode);
        setActiveDataMode(mode);
    }, []);

    // Listen for global data mode changes from other pages (e.g. Dashboard)
    // Also re-sync on visibilitychange so navigating back always picks up the persisted mode
    useEffect(() => {
        const handleModeChange = (e: any) => {
            const newMode = e?.detail || getActiveDataMode();
            setDataModeState(newMode);
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                const persisted = getActiveDataMode();
                setDataModeState(prev => {
                    if (prev !== persisted) {
                        return persisted;
                    }
                    return prev;
                });
            }
        };
        window.addEventListener(DATA_MODE_CHANGED_EVENT, handleModeChange);
        window.addEventListener('storage', handleModeChange);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener(DATA_MODE_CHANGED_EVENT, handleModeChange);
            window.removeEventListener('storage', handleModeChange);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const seedMockPreset = useCallback(async (preset: 'stable' | 'mci' | 'decline') => {
        const uid = getCurrentFirebaseUid();
        if (!uid) return;
        setIsSupabaseLoading(true);
        await seedMockTrajectoryToSupabase(uid, preset);
        setDataMode(`mock_${preset}` as DashboardDataMode);
        const data = await fetchLiveModuleResultsFromSupabase(uid, true);
        setSupabaseData(data);
        setIsSupabaseLoading(false);
    }, [setDataMode]);

    const clearMockData = useCallback(async () => {
        const uid = getCurrentFirebaseUid();
        if (!uid) return;
        setIsSupabaseLoading(true);
        await clearMockDataFromSupabase(uid);
        setDataMode('live');
        const data = await fetchLiveModuleResultsFromSupabase(uid, false);
        setSupabaseData(data);
        setIsSupabaseLoading(false);
    }, [setDataMode]);

    useEffect(() => {
        let mounted = true;
        const uid = getCurrentFirebaseUid();

        async function loadData() {
            if (!uid) {
                if (mounted) setIsSupabaseLoading(false);
                return;
            }
            try {
                const isMock = dataMode !== 'live';
                const data = await fetchLiveModuleResultsFromSupabase(uid, isMock);
                if (mounted) {
                    const totalMockCount = (data.reaction?.length || 0) + (data.vmra?.length || 0) + (data.pattern?.length || 0) + (data.language?.length || 0);
                    if (isMock && totalMockCount === 0) {
                        const trajectory = (dataMode.replace('mock_', '') || 'stable') as 'stable' | 'mci' | 'decline';
                        await seedMockTrajectoryToSupabase(uid, trajectory);
                        const fresh = await fetchLiveModuleResultsFromSupabase(uid, true);
                        if (mounted) setSupabaseData(fresh);
                    } else {
                        setSupabaseData(data);
                    }
                }
            } catch {
                // Ignore Supabase load failure
            } finally {
                if (mounted) setIsSupabaseLoading(false);
            }
        }

        const handleSessionReset = () => {
            setProtocolSessionStart(getProtocolSessionStartTime());
        };

        const handleCleared = () => {
            resetProtocolSession();
            setProtocolSessionStart(Date.now());
            setSupabaseData({
                reaction: [],
                memory: [],
                pattern: [],
                language: [],
                vmra: [],
                story: [],
                navigation: [],
                attention: [],
            });
        };

        window.addEventListener("vyomflow_protocol_session_reset", handleSessionReset);
        window.addEventListener("vyomflow_test_results_cleared", handleCleared);

        loadData();

        let unsubscribe = () => {};
        if (uid && dataMode === 'live') {
            unsubscribe = subscribeToLiveAssessmentUpdates(uid, () => {
                loadData();
            });
        }

        return () => {
            mounted = false;
            window.removeEventListener("vyomflow_protocol_session_reset", handleSessionReset);
            window.removeEventListener("vyomflow_test_results_cleared", handleCleared);
            unsubscribe();
        };
    }, [dataMode]);

    // Reactive ML cognitive prediction run for dynamic battery expansion
    useEffect(() => {
        let isCancelled = false;
        async function runPrediction() {
            const hasData = (
                reactionResults.length > 0 ||
                vmraResults.length > 0 ||
                patternResults.length > 0 ||
                languageResults.length > 0 ||
                storyResults.length > 0 ||
                attentionResults.length > 0 ||
                navigationResults.length > 0 ||
                (supabaseData && Object.values(supabaseData).some(arr => Array.isArray(arr) && arr.length > 0))
            );

            if (!hasData) {
                if (!isCancelled) setPrediction(null);
                return;
            }

            try {
                const raw: RawDashboardData = dataMode !== 'live'
                    ? (supabaseData || {
                        reaction: [], memory: [], vmra: [], pattern: [], language: [], story: [], navigation: [], attention: []
                    })
                    : {
                        reaction: [...(supabaseData?.reaction || []), ...reactionResults],
                        memory: [...(supabaseData?.memory || []), ...vmraResults],
                        vmra: [...(supabaseData?.vmra || []), ...vmraResults],
                        pattern: [...(supabaseData?.pattern || []), ...patternResults],
                        language: [...(supabaseData?.language || []), ...languageResults],
                        story: [...(supabaseData?.story || []), ...storyResults],
                        navigation: [...(supabaseData?.navigation || []), ...navigationResults],
                        attention: [...(supabaseData?.attention || []), ...attentionResults],
                    };
                const pred = await predictCognitiveProfile(raw);
                if (!isCancelled) {
                    setPrediction(pred);
                }
            } catch (err) {
                // Prediction fallback
            }
        }
        runPrediction();
        return () => { isCancelled = true; };
    }, [
        reactionResults,
        vmraResults,
        patternResults,
        languageResults,
        storyResults,
        attentionResults,
        navigationResults,
        supabaseData,
        dataMode,
    ]);

    const isLoading = (storyLoading || vmraLoading || reactionLoading || patternLoading || attentionLoading || navigationLoading || languageLoading) && isSupabaseLoading;

    return useMemo(() => {
        const getLatestTimestamp = (items: Array<{ timestamp?: Date | string }>): Date | null => {
            if (!items || items.length === 0) return null;
            let latest: Date | null = null;
            for (const item of items) {
                if (item.timestamp) {
                    const d = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
                    if (!isNaN(d.getTime())) {
                        if (!latest || d.getTime() > latest.getTime()) {
                            latest = d;
                        }
                    }
                }
            }
            return latest;
        };

        const extractNumericValue = (item: any, type: ActivityId): number => {
            if (!item) return 0;
            if (type === 'story') {
                const recallAcc = item.features?.recallAccuracy != null
                    ? item.features.recallAccuracy * 100
                    : (item.biomarkers?.memory?.recallAccuracy != null ? item.biomarkers.memory.recallAccuracy * 100 : undefined);
                return Number(
                    item.storyRecallScore ??
                    item.score ??
                    recallAcc ??
                    0
                );
            }
            if (type === 'memory') {
                let val = Number(
                    item.features?.recallAccuracy ??
                    item.accuracy ??
                    item.score ??
                    0
                );
                if (val <= 1 && val > 0) val = val * 100;
                return val;
            }
            if (type === 'reaction') {
                return Number(
                    item.aggregates?.median ||
                    item.aggregates?.avg ||
                    item.aggregates?.meanResponseTime ||
                    item.aggregates?.medianReactionTime ||
                    item.metrics?.avg ||
                    item.metrics?.median ||
                    item.metrics?.medianReactionTime ||
                    item.rawMetrics?.aggregates?.median ||
                    item.rawMetrics?.aggregates?.avg ||
                    item.rawMetrics?.median ||
                    item.rawMetrics?.avg ||
                    item.score ||
                    0
                );
            }
            if (type === 'pattern') {
                const correct = item.metrics?.correctRounds ?? item.rawMetrics?.correctRounds;
                const total = item.metrics?.totalRounds ?? item.rawMetrics?.totalRounds;
                if (correct != null && total != null && total > 0) {
                    return Math.round((correct / total) * 100);
                }
                if (item.accuracy != null) {
                    return item.accuracy <= 1 ? Math.round(item.accuracy * 100) : Math.round(item.accuracy);
                }
                if (typeof item.score === 'number' && item.score > 0) {
                    return item.score <= 10 ? Math.round(item.score * 10) : Math.round(item.score);
                }
                const maxLvl = item.metrics?.maxLevelReached ?? item.rawMetrics?.maxLevelReached;
                if (maxLvl != null && maxLvl > 0) {
                    return Math.min(100, Math.round(maxLvl * 10));
                }
                return 0;
            }
            if (type === 'attention') {
                return Number(
                    item.profile?.compositeScore ??
                    (item.features?.hitRate != null ? item.features.hitRate * 100 : (item.features?.dPrime != null ? Math.round(item.features.dPrime * 20) : (item.score ?? 0)))
                );
            }
            if (type === 'navigation') {
                return Number(
                    item.navigationScore ??
                    (item.biomarkers?.navigationAccuracy != null ? item.biomarkers.navigationAccuracy * 100 : (item.score ?? 0))
                );
            }
            if (type === 'language') {
                return Number(
                    item.derivedFeatures?.cognitiveSpeechIndex ??
                    item.derivedFeatures?.fluencyIndex ??
                    (item.features?.fluencyIndex != null ? item.features.fluencyIndex * 10 : (item.score ?? 0))
                );
            }
            return 0;
        };

        const getLatestScore = (items: Array<any>, type: ActivityId): ActivityScoreInfo | null => {
            if (!items || items.length === 0) return null;

            // Extract numeric values and timestamps
            const rawEntries: Array<{ val: number; timeMs: number; sessionId?: string }> = [];

            for (const item of items) {
                if (!item) continue;
                const timeMs = item.timestamp
                    ? (item.timestamp instanceof Date ? item.timestamp.getTime() : new Date(item.timestamp).getTime())
                    : 0;
                const numericVal = extractNumericValue(item, type);
                if (numericVal > 0) {
                    rawEntries.push({
                        val: numericVal,
                        timeMs: isNaN(timeMs) ? 0 : timeMs,
                        sessionId: item.sessionId || item.id,
                    });
                }
            }

            if (rawEntries.length === 0) return null;

            // Sort by time descending (newest first)
            rawEntries.sort((a, b) => b.timeMs - a.timeMs);

            // Deduplicate runs: items within 15 seconds of each other belong to the same test session/save
            const distinctRuns: Array<{ val: number; timeMs: number; sessionId?: string }> = [];
            for (const entry of rawEntries) {
                const isDuplicate = distinctRuns.some((existing) => {
                    if (existing.sessionId && entry.sessionId && existing.sessionId === entry.sessionId) return true;
                    if (existing.timeMs > 0 && entry.timeMs > 0 && Math.abs(existing.timeMs - entry.timeMs) < 15000) {
                        return true;
                    }
                    return false;
                });

                if (!isDuplicate) {
                    distinctRuns.push(entry);
                }
            }

            if (distinctRuns.length === 0) return null;

            const latest = distinctRuns[0];
            const currentScore = latest.val;

            // Find a distinct previous test run
            let previousScore: number | undefined = undefined;
            if (distinctRuns.length > 1) {
                for (let i = 1; i < distinctRuns.length; i++) {
                    const prevRun = distinctRuns[i];
                    if (prevRun.val > 0) {
                        previousScore = prevRun.val;
                        break;
                    }
                }
            }

            // Determine trend (good vs worse)
            let trend: 'up' | 'down' | 'neutral' = 'neutral';
            if (previousScore !== undefined && previousScore > 0) {
                if (type === 'reaction') {
                    // For reaction time: LOWER ms is faster (better)
                    if (currentScore < previousScore) {
                        trend = 'up'; // Improved (faster)
                    } else if (currentScore > previousScore) {
                        trend = 'down'; // Declined (slower)
                    } else {
                        trend = 'neutral';
                    }
                } else {
                    // For accuracy/recall/match: HIGHER is better
                    if (currentScore > previousScore) {
                        trend = 'up'; // Improved
                    } else if (currentScore < previousScore) {
                        trend = 'down'; // Declined
                    } else {
                        trend = 'neutral';
                    }
                }
            } else {
                trend = 'neutral';
            }

            let label = `${Math.round(currentScore)}% Score`;
            if (type === 'story') label = `${Math.round(currentScore)}% Recall`;
            else if (type === 'memory') label = `${Math.round(currentScore)}% Accuracy`;
            else if (type === 'reaction') label = `${Math.round(currentScore)} ms`;
            else if (type === 'pattern') label = `${Math.round(currentScore)}% Match`;
            else if (type === 'attention') label = `${Math.round(currentScore)}% Stability`;
            else if (type === 'navigation') label = `${Math.round(currentScore)}% Route`;
            else if (type === 'language') label = `${Math.round(currentScore)}% Fluency`;

            return {
                score: currentScore,
                label,
                trend,
                previousScore,
            };
        };

        const getLocalFallback = (key: string): any[] => {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };

        const localStory = getLocalFallback(STORAGE_KEYS.storyResults);
        const localVmra = [...getLocalFallback(STORAGE_KEYS.vmraResults), ...getLocalFallback(STORAGE_KEYS.memoryResults)];
        const localReaction = getLocalFallback(STORAGE_KEYS.reactionResults);
        const localPattern = getLocalFallback(STORAGE_KEYS.patternResults);
        const localAttention = getLocalFallback(STORAGE_KEYS.attentionResults);
        const localNavigation = getLocalFallback(STORAGE_KEYS.navigationResults);
        const localLanguage = getLocalFallback(STORAGE_KEYS.languageResults);

        const mergedStory = dataMode !== 'live' ? (supabaseData?.story || []) : [...localStory, ...storyResults, ...(supabaseData?.story || [])];
        const mergedVmra = dataMode !== 'live' ? (supabaseData?.vmra || []) : [...localVmra, ...vmraResults, ...(supabaseData?.vmra || [])];
        const mergedReaction = dataMode !== 'live' ? (supabaseData?.reaction || []) : [...localReaction, ...reactionResults, ...(supabaseData?.reaction || [])];
        const mergedPattern = dataMode !== 'live' ? (supabaseData?.pattern || []) : [...localPattern, ...patternResults, ...(supabaseData?.pattern || [])];
        const mergedAttention = dataMode !== 'live' ? (supabaseData?.attention || []) : [...localAttention, ...attentionResults, ...(supabaseData?.attention || [])];
        const mergedNavigation = dataMode !== 'live' ? (supabaseData?.navigation || []) : [...localNavigation, ...navigationResults, ...(supabaseData?.navigation || [])];
        const mergedLanguage = dataMode !== 'live' ? (supabaseData?.language || []) : [...localLanguage, ...languageResults, ...(supabaseData?.language || [])];

        const activityLastCompletedMap: Record<ActivityId, Date | null> = {
            story: getLatestTimestamp(mergedStory),
            memory: getLatestTimestamp(mergedVmra),
            reaction: getLatestTimestamp(mergedReaction),
            pattern: getLatestTimestamp(mergedPattern),
            attention: getLatestTimestamp(mergedAttention),
            navigation: getLatestTimestamp(mergedNavigation),
            language: getLatestTimestamp(mergedLanguage),
        };

        const activityLatestScoreMap: Record<ActivityId, ActivityScoreInfo | null> = {
            story: getLatestScore(mergedStory, 'story'),
            memory: getLatestScore(mergedVmra, 'memory'),
            reaction: getLatestScore(mergedReaction, 'reaction'),
            pattern: getLatestScore(mergedPattern, 'pattern'),
            attention: getLatestScore(mergedAttention, 'attention'),
            navigation: getLatestScore(mergedNavigation, 'navigation'),
            language: getLatestScore(mergedLanguage, 'language'),
        };

        const isActivityCompletedInProtocol = (items: Array<any>, type: ActivityId): boolean => {
            if (!items || items.length === 0) return false;

            return items.some((item) => {
                if (!item) return false;
                const numericScore = extractNumericValue(item, type);
                if (numericScore <= 0) return false;

                // In mock simulation mode, match mock_session_5 items (the current session)
                if (dataMode !== 'live' && item.sessionId === 'mock_session_5') {
                    return true;
                }

                if (item.timestamp) {
                    const d = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
                    const timeMs = d.getTime();
                    if (!isNaN(timeMs)) {
                        // Strict Protocol Isolation: only count as completed if performed in the active protocol session
                        if (timeMs >= (protocolSessionStart - 10000) && (Date.now() - timeMs) <= PROTOCOL_SESSION_MAX_AGE_MS) {
                            return true;
                        }
                    }
                }
                
                // Fallback: If score exists and was recorded in current session without timestamp
                if (!item.timestamp) {
                    return true;
                }
                return false;
            });
        };

        const completedActivityIds = new Set<ActivityId>();
        if (isActivityCompletedInProtocol(mergedStory, 'story')) completedActivityIds.add('story');
        if (isActivityCompletedInProtocol(mergedVmra, 'memory')) completedActivityIds.add('memory');
        if (isActivityCompletedInProtocol(mergedReaction, 'reaction')) completedActivityIds.add('reaction');
        if (isActivityCompletedInProtocol(mergedPattern, 'pattern')) completedActivityIds.add('pattern');
        if (isActivityCompletedInProtocol(mergedAttention, 'attention')) completedActivityIds.add('attention');
        if (isActivityCompletedInProtocol(mergedNavigation, 'navigation')) completedActivityIds.add('navigation');
        if (isActivityCompletedInProtocol(mergedLanguage, 'language')) completedActivityIds.add('language');

        // Dynamic 4-to-7 battery activation: only expand when patient evaluates to MCI or Dementia
        const isExpandedBattery = prediction?.predictedDiagnosis === 'MCI' || prediction?.predictedDiagnosis === 'Dementia';
        const activeNodes = isExpandedBattery
            ? JOURNEY_NODES
            : JOURNEY_NODES.filter((n) => BASELINE_ACTIVITY_IDS.includes(n.id));

        const activeCompletedIds = new Set<ActivityId>(
            Array.from(completedActivityIds).filter((id) => activeNodes.some((n) => n.id === id))
        );

        const completedCount = activeCompletedIds.size;
        const totalCount = activeNodes.length;
        const isJourneyComplete = completedCount >= totalCount && totalCount > 0;

        // Determine active node (first uncompleted node in active sequence, or first active node if all complete)
        let activeNodeId: ActivityId = activeNodes[0]?.id || 'reaction';
        for (const node of activeNodes) {
            if (!activeCompletedIds.has(node.id)) {
                activeNodeId = node.id;
                break;
            }
        }

        // Compute total unique check-in days across all test history for participation growth
        const uniqueDates = new Set<string>();
        [
            ...mergedStory,
            ...mergedVmra,
            ...mergedReaction,
            ...mergedPattern,
            ...mergedAttention,
            ...mergedNavigation,
            ...mergedLanguage,
        ].forEach((item) => {
            if (item.timestamp) {
                try {
                    const d = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
                    uniqueDates.add(d.toISOString().split('T')[0]);
                } catch {
                    // Ignore date parse errors
                }
            }
        });

        const totalSessionsCompleted = Math.max(uniqueDates.size, completedCount > 0 ? 1 : 0);

        // Determine participation growth stage based on consistency
        let growthLevel = { stage: 'Seed', icon: '🌱', label: 'Your journey is just beginning', nextThreshold: 3 };
        if (totalSessionsCompleted >= 30) {
            growthLevel = { stage: 'Flourishing Garden', icon: '🏡', label: 'Your garden is thriving with consistency', nextThreshold: 30 };
        } else if (totalSessionsCompleted >= 14) {
            growthLevel = { stage: 'Small Tree', icon: '🌳', label: 'Your journey is growing strong', nextThreshold: 30 };
        } else if (totalSessionsCompleted >= 7) {
            growthLevel = { stage: 'Flower', icon: '🌸', label: 'Your journey is blooming', nextThreshold: 14 };
        } else if (totalSessionsCompleted >= 3) {
            growthLevel = { stage: 'Sprout', icon: '🌿', label: 'Your journey is taking root', nextThreshold: 7 };
        }

        return {
            completedActivityIds: activeCompletedIds,
            completedCount,
            totalCount,
            activeNodeId,
            isJourneyComplete,
            totalSessionsCompleted,
            growthLevel,
            activityLastCompletedMap,
            activityLatestScoreMap,
            isLoading,
            isExpandedBattery,
            activeNodes,
            dataMode,
            setDataMode,
            seedMockPreset,
            clearMockData,
        };
    }, [
        storyResults,
        vmraResults,
        reactionResults,
        patternResults,
        attentionResults,
        navigationResults,
        languageResults,
        supabaseData,
        isLoading,
        prediction,
        dataMode,
        setDataMode,
        seedMockPreset,
        clearMockData,
    ]);
}
