"use strict";
/**
 * Set Admin Role Cloud Function
 * Uses Firebase Admin SDK to set Custom Claims on user tokens.
 * Only callable by existing admins.
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
exports.setAdminRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize admin SDK (should be done once in index.ts in production)
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.setAdminRole = functions.https.onCall(async (data, context) => {
    // Verify caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to set roles.');
    }
    // Verify caller is already an admin
    const callerToken = context.auth.token;
    if (callerToken.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can modify user roles.');
    }
    // Validate input
    const { targetUid, role } = data;
    if (!targetUid || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid and role are required.');
    }
    if (!['user', 'admin'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Role must be "user" or "admin".');
    }
    // Prevent self-demotion (admin removing own admin rights)
    if (targetUid === context.auth.uid && role !== 'admin') {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot remove your own admin privileges.');
    }
    try {
        // Set Custom Claims on the target user
        await admin.auth().setCustomUserClaims(targetUid, { role });
        // Log the action for audit trail
        await admin.firestore().collection('adminLogs').add({
            action: 'ROLE_CHANGE',
            performedBy: context.auth.uid,
            targetUid,
            newRole: role,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: `User ${targetUid} role set to ${role}` };
    }
    catch (error) {
        console.error('Error setting custom claims:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update user role.');
    }
});
//# sourceMappingURL=setAdminRole.js.map