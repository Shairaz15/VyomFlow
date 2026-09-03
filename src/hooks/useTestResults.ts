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
import { logger } from "../utils/logger";
import {
    loadResultsFromFirestore,
    saveResultToFirestore,
    upsertResultToFirestore,
    clearAllFirestoreResults,
    clearFirestoreResults,
    isUserAuthenticated,
} from "../services/firestoreService";
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

/** Get a stable ISO date key (YYYY-MM-DD) for "best of day" comparisons */
function getDateKey(timestamp: Date | string): string {
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return d.toISOString().split("T")[0];
}

/** Trim an array to the most recent MAX_STORED_RESULTS entries */
function trimResults<T>(results: T[]): T[] {
    if (results.length > MAX_STORED_RESULTS) {
        return results.slice(results.length - MAX_STORED_RESULTS);
    }
    return results;
}

export const STORAGE_KEYS = {
    reactionResults: "vyomflow_reaction_results",
    memoryResults: "vyomflow_memory_results",
    patternResults: "vyomflow_pattern_results",
    languageResults: "vyomflow_language_results",
    vmraResults: "vyomflow_vmra_results",
    lastSession: "vyomflow_last_session",
};

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
    localStorage.removeItem(STORAGE_KEYS.lastSession);

    // Also clear Firestore if user is logged in
    if (isUserAuthenticated()) {
        try {
            await clearAllFirestoreResults();
            logger.info("Cleared all Firestore test data");
        } catch (error) {
            logger.error("Failed to clear Firestore data:", error);
        }
    }
}

// ... existing interfaces ...

/**
 * Hook for managing language assessment results.
 * Firestore-first for authenticated users, localStorage fallback for demo mode.
 */
export function useLanguageResults() {
    const [results, setResults] = useState<LanguageAssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<LanguageAssessmentResult>(
                    "language_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults);
                    localStorage.setItem(
                        STORAGE_KEYS.languageResults,
                        JSON.stringify(trimResults(firestoreResults))
                    );
                }
            } else {
                const parsed = safeJsonParse<LanguageAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.languageResults),
                    []
                );
                if (mounted.current && parsed.length > 0) {
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

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, [loadResults]);

    // Save a new result (Append only)
    const saveResult = useCallback((result: LanguageAssessmentResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            try {
                localStorage.setItem(STORAGE_KEYS.languageResults, JSON.stringify(updated));
                if (isUserAuthenticated()) {
                    saveResultToFirestore("language_results", result).catch((e) =>
                        logger.error("Firestore save failed", e)
                    );
                }
            } catch (error) {
                logger.error("Failed to save language result:", error);
            }
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
    const [results, setResults] = useState<ReactionTestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<ReactionTestResult>(
                    "reaction_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults);
                    localStorage.setItem(
                        STORAGE_KEYS.reactionResults,
                        JSON.stringify(trimResults(firestoreResults))
                    );
                }
            } else {
                const parsed = safeJsonParse<ReactionTestResult[]>(
                    localStorage.getItem(STORAGE_KEYS.reactionResults),
                    []
                );
                if (mounted.current && parsed.length > 0) {
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

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, [loadResults]);

    // Save a new result (Best of Day logic)
    const saveResult = useCallback((result: ReactionTestResult) => {
        setResults((prev) => {
            const today = getDateKey(result.timestamp);
            const existingIndex = prev.findIndex(
                (r) => getDateKey(r.timestamp) === today
            );

            let updated: ReactionTestResult[];

            if (existingIndex !== -1) {
                if (result.aggregates.avg < prev[existingIndex].aggregates.avg) {
                    updated = [...prev];
                    updated[existingIndex] = result;
                } else {
                    return prev;
                }
            } else {
                updated = [...prev, result];
            }

            updated = trimResults(updated);

            try {
                localStorage.setItem(STORAGE_KEYS.reactionResults, JSON.stringify(updated));
                if (isUserAuthenticated()) {
                    // Upsert with date key so Firestore mirrors best-of-day logic
                    upsertResultToFirestore("reaction_results", result, today).catch((e) =>
                        logger.error("Firestore upsert failed", e)
                    );
                }
            } catch (error) {
                logger.error("Failed to save reaction result:", error);
            }
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
    const [results, setResults] = useState<MemoryTestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<MemoryTestResult>(
                    "memory_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults);
                    localStorage.setItem(
                        STORAGE_KEYS.memoryResults,
                        JSON.stringify(trimResults(firestoreResults))
                    );
                }
            } else {
                const parsed = safeJsonParse<MemoryTestResult[]>(
                    localStorage.getItem(STORAGE_KEYS.memoryResults),
                    []
                );
                if (mounted.current && parsed.length > 0) {
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

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, [loadResults]);

    // Save a new result (Best of Day logic)
    const saveResult = useCallback((result: MemoryTestResult) => {
        setResults((prev) => {
            const today = getDateKey(result.timestamp);
            const existingIndex = prev.findIndex(
                (r) => getDateKey(r.timestamp) === today
            );

            let updated: MemoryTestResult[];

            if (existingIndex !== -1) {
                if (result.accuracy > prev[existingIndex].accuracy) {
                    updated = [...prev];
                    updated[existingIndex] = result;
                } else {
                    return prev;
                }
            } else {
                updated = [...prev, result];
            }

            updated = trimResults(updated);

            try {
                localStorage.setItem(STORAGE_KEYS.memoryResults, JSON.stringify(updated));
                if (isUserAuthenticated()) {
                    upsertResultToFirestore("memory_results", result, today).catch((e) =>
                        logger.error("Firestore upsert failed", e)
                    );
                }
            } catch (error) {
                logger.error("Failed to save memory result:", error);
            }
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
    const [results, setResults] = useState<PatternAssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load results (called on mount and when auth state changes)
    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<PatternAssessmentResult>(
                    "pattern_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults);
                    localStorage.setItem(
                        STORAGE_KEYS.patternResults,
                        JSON.stringify(trimResults(firestoreResults))
                    );
                }
            } else {
                const parsed = safeJsonParse<PatternAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.patternResults),
                    []
                );
                if (mounted.current && parsed.length > 0) {
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

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, [loadResults]);

    // Save a new result (Append only, no Best of Day replacement)
    const saveResult = useCallback((result: PatternAssessmentResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            try {
                localStorage.setItem(STORAGE_KEYS.patternResults, JSON.stringify(updated));
                if (isUserAuthenticated()) {
                    saveResultToFirestore("pattern_results", result).catch((e) =>
                        logger.error("Firestore save failed", e)
                    );
                }
            } catch (error) {
                logger.error("Failed to save pattern result:", error);
            }
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
    const [results, setResults] = useState<VmraAssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadResults = useCallback(async (mounted: { current: boolean }) => {
        try {
            if (isUserAuthenticated()) {
                const firestoreResults = await loadResultsFromFirestore<VmraAssessmentResult>(
                    "vmra_results"
                );
                if (mounted.current) {
                    setResults(firestoreResults);
                    localStorage.setItem(
                        STORAGE_KEYS.vmraResults,
                        JSON.stringify(trimResults(firestoreResults))
                    );
                }
            } else {
                const parsed = safeJsonParse<VmraAssessmentResult[]>(
                    localStorage.getItem(STORAGE_KEYS.vmraResults),
                    []
                );
                if (mounted.current && parsed.length > 0) {
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

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (mounted.current) {
                setIsLoading(true);
                loadResults(mounted);
            }
        });

        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, [loadResults]);

    const saveResult = useCallback((result: VmraAssessmentResult) => {
        setResults((prev) => {
            const updated = trimResults([...prev, result]);
            try {
                localStorage.setItem(STORAGE_KEYS.vmraResults, JSON.stringify(updated));
                if (isUserAuthenticated()) {
                    saveResultToFirestore("vmra_results", result).catch((e) =>
                        logger.error("Firestore save failed", e)
                    );
                }
            } catch (error) {
                logger.error("Failed to save VMRA result:", error);
            }
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
