/**
 * Test Results Storage Hook
 * Provides Firestore persistence for authenticated users.
 * Falls back to localStorage for unauthenticated "Demo Mode".
 */

import { useState, useEffect, useCallback } from "react";
import type { ReactionTestResult } from "../components/tests/reaction/reactionFeatures";
import type { PatternAssessmentResult } from "../types/patternTypes";
import type { LanguageAssessmentResult } from "../types/languageTypes";
import type { VmraAssessmentResult } from "../types/vmraTypes";
import type { SavtAssessmentResult } from "../types/savtTypes";
import type { StoryAssessmentResult } from "../types/storyTypes";
import type { ImmersiveNavigationResult } from "../types/navigationTypes";
import { logger } from "../utils/logger";
import {
    loadResultsFromFirestore,
    saveResultToFirestore,
    clearAllFirestoreResults,
    clearFirestoreResults,
    isUserAuthenticated,
} from "../services/firestoreService";
import { saveModuleResultToSupabase, deleteAllUserDataFromSupabase, getCurrentFirebaseUid } from "../services/supabaseService";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/** Maximum entries to keep in localStorage to prevent quota exhaustion */
const MAX_STORED_RESULTS = 365;

/** Safely parse JSON from localStorage, returning fallback on corruption */
function safeJsonParse<T>(value: string | null, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        logger.warn("Corrupted localStorage data, using fallback");
        return fallback;
    }
}

/** Get a stable ISO date key (YYYY-MM-DD) */
export function getDateKey(timestamp: Date | string): string {
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return d.toISOString().split("T")[0];
}

/**
 * Deduplicate results by id/sessionId or within a 30-second timestamp window.
 * Ensures that dual writes (local + cloud) or multiple clicks never produce double records.
 */
export function deduplicateModuleResults<T extends { id?: string; sessionId?: string; timestamp: Date | string | number }>(
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
        if (id && seenIds.has(id)) {
            continue;
        }

        const itemTime = new Date(item.timestamp).getTime();
        const duplicateIdx = deduped.findIndex((existing) => {
            if (id && (existing.id === id || existing.sessionId === id)) return true;
            const existingTime = new Date(existing.timestamp).getTime();
            return Math.abs(itemTime - existingTime) < 30000;
        });

        if (duplicateIdx !== -1) {
            deduped[duplicateIdx] = item;
        } else {
            if (id) seenIds.add(id);
            deduped.push(item);
        }
    }

    return deduped;
}

/** Trim an array to the most recent MAX_STORED_RESULTS entries after deduplicating */
function trimResults<T extends { id?: string; sessionId?: string; timestamp: Date | string | number }>(results: T[]): T[] {
    const deduped = deduplicateModuleResults(results);
    if (deduped.length > MAX_STORED_RESULTS) {
        return deduped.slice(deduped.length - MAX_STORED_RESULTS);
    }
    return deduped;
}

export const STORAGE_KEYS = {
    reactionResults: "vyomflow_reaction_results",
    memoryResults: "vyomflow_memory_results",
    patternResults: "vyomflow_pattern_results",
    languageResults: "vyomflow_language_results",
    vmraResults: "vyomflow_vmra_results",
    attentionResults: "vyomflow_attention_results",
    storyResults: "vyomflow_story_results",
    navigationResults: "vyomflow_navigation_results",
    lastSession: "vyomflow_last_session",
};

export function isAshaBeneficiarySessionActive(): boolean {
    try {
        const activeBen = localStorage.getItem('vyomflow_active_beneficiary');
        if (activeBen) {
            const parsed = JSON.parse(activeBen);
            return Boolean(parsed?.firebase_uid);
        }
    } catch {
        return false;
    }
    return false;
}

export function getScopedStorageKey(baseKey: string): string {
    try {
        const activeBen = localStorage.getItem('vyomflow_active_beneficiary');
        if (activeBen) {
            const parsed = JSON.parse(activeBen);
            if (parsed?.firebase_uid) {
                return `${baseKey}_${parsed.firebase_uid}`;
            }
        }
    } catch {
        // fallback
    }
    return baseKey;
}

function persistModuleResultSafely(
    moduleType: string,
    collectionName: any,
    baseStorageKey: string,
    result: any,
    updatedList: any[]
) {
    try {
        const effectiveKey = getScopedStorageKey(baseStorageKey);
        localStorage.setItem(effectiveKey, JSON.stringify(updatedList));

        if (isAshaBeneficiarySessionActive()) {
            // Write only to Supabase under the beneficiary UID to prevent worker Firestore pollution
            saveModuleResultToSupabase(moduleType, result).catch((e) =>
                logger.error(`Supabase save failed for ${moduleType}:`, e)
            );
        } else if (isUserAuthenticated()) {
            saveResultToFirestore(collectionName, result).catch((e) =>
                logger.error(`Firestore save failed for ${collectionName}:`, e)
            );
            saveModuleResultToSupabase(moduleType, result).catch((e) =>
                logger.error(`Supabase save failed for ${moduleType}:`, e)
            );
        }
    } catch (error) {
        logger.error(`Failed to persist ${moduleType} result:`, error);
    }
}

/**
 * Clears all test data from localStorage AND Firestore (if authenticated).
 */
export async function clearAllTestData(): Promise<void> {
    // Always clear localStorage
    localStorage.removeItem(STORAGE_KEYS.reactionResults);
    localStorage.removeItem(STORAGE_KEYS.memoryResults);
    localStorage.removeItem(STORAGE_KEYS.patternResults);
    localStorage.removeItem(STORAGE_KEYS.languageResults);
    localStorage.removeItem(STORAGE_KEYS.vmraResults);
    localStorage.removeItem(STORAGE_KEYS.attentionResults);
    localStorage.removeItem(STORAGE_KEYS.storyResults);
    localStorage.removeItem(STORAGE_KEYS.navigationResults);
    localStorage.removeItem(STORAGE_KEYS.lastSession);
    localStorage.removeItem("last_completed_journey_day");
    localStorage.removeItem("vyomflow_daily_streak");
    localStorage.removeItem("vyomflow_journey_streak");

    // Also clear Firestore if user is logged in
    if (isUserAuthenticated()) {
        try {
            await clearAllFirestoreResults();
            logger.info("Cleared all Firestore test data");
        } catch (error) {
            logger.error("Failed to clear Firestore data:", error);
        }
    }

    // Also clear all Supabase module and session records
    const uid = getCurrentFirebaseUid();
    if (uid) {
        try {
            await deleteAllUserDataFromSupabase(uid);
            logger.info("Cleared all Supabase test data");
        } catch (error) {
            logger.error("Failed to clear Supabase data:", error);
        }
    }

    try {
        localStorage.removeItem("vyomflow_protocol_session_started_at");
    } catch {
        // fallback
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("vyomflow_test_results_cleared"));
        window.dispatchEvent(new CustomEvent("vyomflow_protocol_session_reset"));
    }
}

// ... existing interfaces ...

/**
 * Hook for managing language assessment results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useLanguageResults() {
    const [results, setResults] = useState<LanguageAssessmentResult[]>(() =>
        safeJsonParse<LanguageAssessmentResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.languageResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.languageResults);
                const parsed = safeJsonParse<LanguageAssessmentResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<LanguageAssessmentResult>(
                    "language_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.languageResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.languageResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<LanguageAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.languageResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load language results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    // Load on mount + listen for auth state changes (Fix Issue 6)
    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    // Save a new result (Append only)
    const saveResult = useCallback((result: LanguageAssessmentResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            persistModuleResultSafely("language", "language_results", STORAGE_KEYS.languageResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): LanguageAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

export interface StoredResults {
    reactionResults: ReactionTestResult[];
}

export interface MemoryTestResult {
    timestamp: Date;
    totalWords: number;
    correctCount: number;
    accuracy: number; // 0-1
}

/**
 * Hook for managing reaction test results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useReactionResults() {
    const [results, setResults] = useState<ReactionTestResult[]>(() =>
        safeJsonParse<ReactionTestResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.reactionResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.reactionResults);
                const parsed = safeJsonParse<ReactionTestResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<ReactionTestResult>(
                    "reaction_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.reactionResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.reactionResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<ReactionTestResult[]>(
                    localStorage.getItem(STORAGE_KEYS.reactionResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load reaction results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    // Load on mount + listen for auth state changes (Fix Issue 6)
    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    // Save a new result (Append or update existing session)
    const saveResult = useCallback((result: ReactionTestResult) => {
        setResults((prev) => {
            const existingIndex = prev.findIndex(
                (r) => (r.sessionId && result.sessionId && r.sessionId === result.sessionId) ||
                       (new Date(r.timestamp).getTime() === new Date(result.timestamp).getTime())
            );

            let updated: ReactionTestResult[];

            if (existingIndex !== -1) {
                updated = [...prev];
                updated[existingIndex] = result;
            } else {
                updated = [...prev, result];
            }

            updated = trimResults(updated);
            persistModuleResultSafely("reaction", "reaction_results", STORAGE_KEYS.reactionResults, result, updated);
            return updated;
        });
    }, []);

    // Get the latest result
    const getLatestResult = useCallback((): ReactionTestResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    // Get all results sorted by date
    const getSortedResults = useCallback((): ReactionTestResult[] => {
        return [...results].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }, [results]);

    // Clear all results
    const clearResults = useCallback(() => {
        setResults([]);
        localStorage.removeItem(STORAGE_KEYS.reactionResults);
        // Also clear Firestore if authenticated (Fix Issue 5)
        if (isUserAuthenticated()) {
            clearFirestoreResults("reaction_results").catch((e) =>
                logger.error("Failed to clear Firestore reaction results", e)
            );
        }
    }, []);

    // Get baseline (average of first 2 sessions)
    const getBaseline = useCallback((): number | null => {
        if (results.length < 2) return null;
        const sorted = getSortedResults();
        const firstTwo = sorted.slice(0, 2);
        const avgSum = firstTwo.reduce((sum, r) => sum + r.aggregates.avg, 0);
        return avgSum / firstTwo.length;
    }, [results, getSortedResults]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
        getSortedResults,
        clearResults,
        getBaseline,
    };
}

/**
 * Hook for managing memory test results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useMemoryResults() {
    const [results, setResults] = useState<MemoryTestResult[]>(() =>
        safeJsonParse<MemoryTestResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.memoryResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.memoryResults);
                const parsed = safeJsonParse<MemoryTestResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<MemoryTestResult>(
                    "memory_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.memoryResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.memoryResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<MemoryTestResult[]>(
                    localStorage.getItem(STORAGE_KEYS.memoryResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load memory results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    // Load on mount + listen for auth state changes (Fix Issue 6)
    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    // Save a new result (Append or update existing session)
    const saveResult = useCallback((result: MemoryTestResult) => {
        setResults((prev) => {
            const existingIndex = prev.findIndex(
                (r) => new Date(r.timestamp).getTime() === new Date(result.timestamp).getTime()
            );

            let updated: MemoryTestResult[];

            if (existingIndex !== -1) {
                updated = [...prev];
                updated[existingIndex] = result;
            } else {
                updated = [...prev, result];
            }

            updated = trimResults(updated);
            persistModuleResultSafely("memory", "memory_results", STORAGE_KEYS.memoryResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): MemoryTestResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

/**
 * Hook for managing pattern recognition test results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function usePatternResults() {
    const [results, setResults] = useState<PatternAssessmentResult[]>(() =>
        safeJsonParse<PatternAssessmentResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.patternResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.patternResults);
                const parsed = safeJsonParse<PatternAssessmentResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<PatternAssessmentResult>(
                    "pattern_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.patternResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.patternResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<PatternAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.patternResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load pattern results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    // Load on mount + listen for auth state changes (Fix Issue 6)
    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    // Save a new result (Append only, no Best of Day replacement)
    const saveResult = useCallback((result: PatternAssessmentResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            persistModuleResultSafely("pattern", "pattern_results", STORAGE_KEYS.patternResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): PatternAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

/**
 * Hook for managing VMRA (Visual Memory Recall Assessment) results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useVmraResults() {
    const [results, setResults] = useState<VmraAssessmentResult[]>(() =>
        safeJsonParse<VmraAssessmentResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.vmraResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.vmraResults);
                const parsed = safeJsonParse<VmraAssessmentResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<VmraAssessmentResult>(
                    "vmra_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.vmraResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.vmraResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<VmraAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.vmraResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load VMRA results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    const saveResult = useCallback((result: VmraAssessmentResult) => {
        setResults((prev) => {
            const existingIndex = prev.findIndex(
                (r) => (r.sessionId && result.sessionId && r.sessionId === result.sessionId) ||
                       (new Date(r.timestamp).getTime() === new Date(result.timestamp).getTime())
            );

            let updated: VmraAssessmentResult[];

            if (existingIndex !== -1) {
                updated = [...prev];
                updated[existingIndex] = result;
            } else {
                updated = [...prev, result];
            }

            updated = trimResults(updated);
            persistModuleResultSafely("vmra", "vmra_results", STORAGE_KEYS.vmraResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): VmraAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    const getSessionCount = useCallback((): number => {
        return results.length;
    }, [results]);

    const getPreviousAccuracies = useCallback((): number[] => {
        return results.map(r => r.features.recallAccuracy);
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
        getSessionCount,
        getPreviousAccuracies,
    };
}

/**
 * Hook for managing SAVT Attention assessment results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useAttentionResults() {
    const [results, setResults] = useState<SavtAssessmentResult[]>(() =>
        safeJsonParse<SavtAssessmentResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.attentionResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.attentionResults);
                const parsed = safeJsonParse<SavtAssessmentResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<SavtAssessmentResult>(
                    "attention_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.attentionResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.attentionResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<SavtAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.attentionResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load attention results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    const saveResult = useCallback((result: SavtAssessmentResult) => {
        setResults((prev) => {
            const existingIndex = prev.findIndex(
                (r) => (r.sessionId && result.sessionId && r.sessionId === result.sessionId) ||
                       (new Date(r.timestamp).getTime() === new Date(result.timestamp).getTime())
            );

            let updated: SavtAssessmentResult[];

            if (existingIndex !== -1) {
                updated = [...prev];
                updated[existingIndex] = result;
            } else {
                updated = [...prev, result];
            }

            updated = trimResults(updated);
            persistModuleResultSafely("savt", "attention_results", STORAGE_KEYS.attentionResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): SavtAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

/**
 * Hook for managing Story Narration Recall Assessment results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useStoryResults() {
    const [results, setResults] = useState<StoryAssessmentResult[]>(() =>
        safeJsonParse<StoryAssessmentResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.storyResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.storyResults);
                const parsed = safeJsonParse<StoryAssessmentResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<StoryAssessmentResult>(
                    "story_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.storyResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.storyResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<StoryAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.storyResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load story results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    const saveResult = useCallback((result: StoryAssessmentResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            persistModuleResultSafely("story", "story_results", STORAGE_KEYS.storyResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): StoryAssessmentResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}

/**
 * Hook for managing Navigation Assessment results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useNavigationResults() {
    const [results, setResults] = useState<ImmersiveNavigationResult[]>(() =>
        safeJsonParse<ImmersiveNavigationResult[]>(
            localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.navigationResults)),
            []
        ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    );
    const [isLoading, setIsLoading] = useState(true);

    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isAshaBeneficiarySessionActive()) {
                const scopedKey = getScopedStorageKey(STORAGE_KEYS.navigationResults);
                const parsed = safeJsonParse<ImmersiveNavigationResult[]>(
                    localStorage.getItem(scopedKey),
                    []
                );
                if (mounted.current) {
                    setResults(parsed.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
                }
            } else if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<ImmersiveNavigationResult>(
                    "navigation_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults || []);
                    if (firestoreResults && firestoreResults.length > 0) {
                        localStorage.setItem(
                            STORAGE_KEYS.navigationResults,
                            JSON.stringify(trimResults(firestoreResults))
                        );
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.navigationResults);
                    }
                }
            } else {
                const parsed = safeJsonParse<ImmersiveNavigationResult[]>(
                    localStorage.getItem(STORAGE_KEYS.navigationResults),
                    []
                );
                if (mounted.current) {
                    const withDates = parsed.map((r) => ({
                        ...r,
                        timestamp: new Date(r.timestamp),
                    }));
                    setResults(withDates);
                }
            }
        } catch (error) {
            logger.error("Failed to load navigation results:", error);
        } finally {
            if (mounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const mounted = { current: true };
        loadResults(mounted);

        const handleClear = () => {
            if (mounted.current) setResults([]);
        };
        window.addEventListener("vyomflow_test_results_cleared", handleClear);

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
            window.removeEventListener("vyomflow_test_results_cleared", handleClear);
        };
    }, [loadResults]);

    const saveResult = useCallback((result: ImmersiveNavigationResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            persistModuleResultSafely("navigation", "navigation_results", STORAGE_KEYS.navigationResults, result, updated);
            return updated;
        });
    }, []);

    const getLatestResult = useCallback((): ImmersiveNavigationResult | null => {
        if (results.length === 0) return null;
        return results[results.length - 1];
    }, [results]);

    return {
        results,
        isLoading,
        saveResult,
        getLatestResult,
    };
}
