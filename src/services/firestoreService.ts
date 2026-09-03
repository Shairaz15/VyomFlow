/**
 * Firestore Service
 * Centralized read/write operations for test results in Firestore.
 * Data is stored at: users/{uid}/{collectionName}/{docId}
 */

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    setDoc,
    query,
    orderBy,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { logger } from "../utils/logger";

export type ResultCollectionName =
    | "reaction_results"
    | "memory_results"
    | "pattern_results"
    | "language_results"
    | "vmra_results";

/**
 * Check if the current user is authenticated.
 */
export function isUserAuthenticated(): boolean {
    return !!auth.currentUser;
}

/**
 * Get the current user's UID.
 */
function getCurrentUid(): string | null {
    return auth.currentUser?.uid ?? null;
}

/**
 * Load all results from a Firestore subcollection for the current user.
 * Returns results ordered by timestamp (ascending).
 */
export async function loadResultsFromFirestore<T>(
    collectionName: ResultCollectionName
): Promise<T[]> {
    const uid = getCurrentUid();
    if (!uid) return [];

    try {
        const colRef = collection(db, "users", uid, collectionName);
        const q = query(colRef, orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                // Convert Firestore Timestamp or ISO string back to Date
                timestamp: data.timestamp?.toDate
                    ? data.timestamp.toDate()
                    : new Date(data.timestamp),
            } as T;
        });
    } catch (error) {
        logger.error(`Failed to load ${collectionName} from Firestore:`, error);
        return [];
    }
}

/**
 * Save a single result to a Firestore subcollection for the current user.
 * Returns true if successful.
 */
export async function saveResultToFirestore(
    collectionName: ResultCollectionName,
    result: Record<string, any>
): Promise<boolean> {
    const uid = getCurrentUid();
    if (!uid) return false;

    try {
        const colRef = collection(db, "users", uid, collectionName);
        await addDoc(colRef, {
            ...result,
            // Ensure timestamp is stored as ISO string for consistency
            timestamp:
                result.timestamp instanceof Date
                    ? result.timestamp.toISOString()
                    : result.timestamp,
            syncedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        logger.error(`Failed to save to ${collectionName}:`, error);
        return false;
    }
}

/**
 * Upsert a result using a date-based document ID.
 * This ensures "best of day" logic is mirrored in Firestore —
 * only one document per date exists, preventing duplicate accumulation.
 */
export async function upsertResultToFirestore(
    collectionName: ResultCollectionName,
    result: Record<string, any>,
    dateKey: string
): Promise<boolean> {
    const uid = getCurrentUid();
    if (!uid) return false;

    try {
        const docRef = doc(db, "users", uid, collectionName, dateKey);
        await setDoc(docRef, {
            ...result,
            timestamp:
                result.timestamp instanceof Date
                    ? result.timestamp.toISOString()
                    : result.timestamp,
            syncedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        logger.error(`Failed to upsert to ${collectionName}:`, error);
        return false;
    }
}

/**
 * Delete all documents in a Firestore subcollection for the current user.
 */
export async function clearFirestoreResults(
    collectionName: ResultCollectionName
): Promise<void> {
    const uid = getCurrentUid();
    if (!uid) return;

    try {
        const colRef = collection(db, "users", uid, collectionName);
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        logger.info(`Cleared ${snapshot.size} docs from ${collectionName}`);
    } catch (error) {
        logger.error(`Failed to clear ${collectionName}:`, error);
    }
}

/**
 * Clear all test result collections in Firestore for the current user.
 */
export async function clearAllFirestoreResults(): Promise<void> {
    const collections: ResultCollectionName[] = [
        "reaction_results",
        "memory_results",
        "pattern_results",
        "language_results",
        "vmra_results",
    ];
    await Promise.all(collections.map((c) => clearFirestoreResults(c)));
}

/**
 * Load all 4 test result collections in parallel from Firestore.
 */
export async function loadAllResultsFromFirestore(): Promise<{
    reaction: any[];
    memory: any[];
    pattern: any[];
    language: any[];
}> {
    const [reaction, memory, pattern, language] = await Promise.all([
        loadResultsFromFirestore("reaction_results"),
        loadResultsFromFirestore("memory_results"),
        loadResultsFromFirestore("pattern_results"),
        loadResultsFromFirestore("language_results"),
    ]);
    return { reaction, memory, pattern, language };
}
