/**
 * Log Admin Action Cloud Function
 * HTTP callable function to log admin actions to audit trail.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

interface LogActionData {
    action: string;
    targetUserId?: string;
    metadata?: Record<string, unknown>;
}

export const logAdminAction = functions.https.onCall(
    async (data: LogActionData, context) => {
        // Verify caller is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be authenticated to log actions.'
            );
        }

        // Verify caller is an admin
        const callerToken = context.auth.token;
        if (callerToken.role !== 'admin') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only admins can log admin actions.'
            );
        }

        const { action, targetUserId, metadata } = data;

        if (!action) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Action is required.'
            );
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
        } catch (error) {
            console.error('Error logging admin action:', error);
            throw new functions.https.HttpsError(
                'internal',
                'Failed to log admin action.'
            );
        }
    }
);
