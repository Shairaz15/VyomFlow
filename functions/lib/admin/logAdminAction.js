"use strict";
/**
 * Log Admin Action Cloud Function
 * HTTP callable function to log admin actions to audit trail.
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
exports.logAdminAction = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.logAdminAction = functions.https.onCall(async (data, context) => {
    // Verify caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to log actions.');
    }
    // Verify caller is an admin
    const callerToken = context.auth.token;
    if (callerToken.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can log admin actions.');
    }
    const { action, targetUserId, metadata } = data;
    if (!action) {
        throw new functions.https.HttpsError('invalid-argument', 'Action is required.');
    }
    try {
        await db.collection('adminLogs').add({
            action,
            performedBy: context.auth.uid,
            targetUserId: targetUserId || null,
            metadata: metadata || {},
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error logging admin action:', error);
        throw new functions.https.HttpsError('internal', 'Failed to log admin action.');
    }
});
//# sourceMappingURL=logAdminAction.js.map