"use strict";
/**
 * Update Metrics Cloud Function
 * Triggered on session writes to maintain precomputed aggregates.
 * Writes to adminAnalytics/globalMetrics for fast admin dashboard reads.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDailyMetrics = exports.updateMetrics = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.updateMetrics = functions.firestore
    .document('users/{userId}/sessions/{sessionId}')
    .onWrite(async (change, context) => {
    const metricsRef = db.doc('adminAnalytics/globalMetrics');
    try {
        await db.runTransaction(async (transaction) => {
            var _a, _b;
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
                if (!sessionData)
                    return;
                const newTotal = currentMetrics.totalSessions + 1;
                // Update running averages
                const newAvgMemory = ((currentMetrics.avgMemoryScore * currentMetrics.totalSessions) +
                    (((_a = sessionData.features) === null || _a === void 0 ? void 0 : _a.memoryAccuracy) || 0)) / newTotal;
                const newAvgReaction = ((currentMetrics.avgReactionTime * currentMetrics.totalSessions) +
                    (((_b = sessionData.features) === null || _b === void 0 ? void 0 : _b.reactionTimeAvg) || 0)) / newTotal;
                // Update risk distribution
                const risk = sessionData.risk || 'low';
                const newRiskDist = { ...currentMetrics.riskDistribution };
                if (risk in newRiskDist) {
                    newRiskDist[risk]++;
                }
                transaction.set(metricsRef, {
                    totalSessions: newTotal,
                    avgMemoryScore: newAvgMemory,
                    avgReactionTime: newAvgReaction,
                    riskDistribution: newRiskDist,
                    sessionsToday: admin.firestore.FieldValue.increment(1),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            else if (isDeletedSession) {
                // Decrement session count on delete
                transaction.update(metricsRef, {
                    totalSessions: admin.firestore.FieldValue.increment(-1),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        });
    }
    catch (error) {
        console.error('Error updating metrics:', error);
    }
});
/**
 * Scheduled function to reset daily counters at midnight UTC.
 */
exports.resetDailyMetrics = functions.pubsub
    .schedule('0 0 * * *') // Midnight UTC
    .onRun(async () => {
    try {
        await db.doc('adminAnalytics/globalMetrics').update({
            sessionsToday: 0,
        });
        console.log('Daily metrics reset successfully');
    }
    catch (error) {
        console.error('Error resetting daily metrics:', error);
    }
});
//# sourceMappingURL=updateMetrics.js.map