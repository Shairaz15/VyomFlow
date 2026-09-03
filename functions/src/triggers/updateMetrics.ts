/**
 * Update Metrics Cloud Function
 * Triggered on session writes to maintain precomputed aggregates.
 * Writes to adminAnalytics/globalMetrics for fast admin dashboard reads.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export const updateMetrics = functions.firestore
    .document('users/{userId}/sessions/{sessionId}')
    .onWrite(async (change, context) => {
        const metricsRef = db.doc('adminAnalytics/globalMetrics');

        try {
            await db.runTransaction(async (transaction) => {
                const metricsDoc = await transaction.get(metricsRef);
                const currentMetrics = metricsDoc.data() || {
                    totalUsers: 0,
                    totalSessions: 0,
                    avgMemoryScore: 0,
                    avgReactionTime: 0,
                    riskDistribution: { low: 0, medium: 0, high: 0 },
                    sessionsToday: 0,
                    lastUpdated: null,
                };

                const isNewSession = !change.before.exists && change.after.exists;
                const isDeletedSession = change.before.exists && !change.after.exists;

                if (isNewSession) {
                    const sessionData = change.after.data();
                    if (!sessionData) return;

                    const newTotal = currentMetrics.totalSessions + 1;

                    // Update running averages
                    const newAvgMemory = (
                        (currentMetrics.avgMemoryScore * currentMetrics.totalSessions) +
                        (sessionData.features?.memoryAccuracy || 0)
                    ) / newTotal;

                    const newAvgReaction = (
                        (currentMetrics.avgReactionTime * currentMetrics.totalSessions) +
                        (sessionData.features?.reactionTimeAvg || 0)
                    ) / newTotal;

                    // Update risk distribution
                    const risk = sessionData.risk || 'low';
                    const newRiskDist = { ...currentMetrics.riskDistribution };
                    if (risk in newRiskDist) {
                        newRiskDist[risk as keyof typeof newRiskDist]++;
                    }

                    transaction.set(metricsRef, {
                        totalSessions: newTotal,
                        avgMemoryScore: newAvgMemory,
                        avgReactionTime: newAvgReaction,
                        riskDistribution: newRiskDist,
                        sessionsToday: admin.firestore.FieldValue.increment(1),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });

                } else if (isDeletedSession) {
                    // Decrement session count on delete
                    transaction.update(metricsRef, {
                        totalSessions: admin.firestore.FieldValue.increment(-1),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            });
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
    });

/**
 * Scheduled function to reset daily counters at midnight UTC.
 */
export const resetDailyMetrics = functions.pubsub
    .schedule('0 0 * * *') // Midnight UTC
    .onRun(async () => {
        try {
            await db.doc('adminAnalytics/globalMetrics').update({
                sessionsToday: 0,
            });
            console.log('Daily metrics reset successfully');
        } catch (error) {
            console.error('Error resetting daily metrics:', error);
        }
    });
