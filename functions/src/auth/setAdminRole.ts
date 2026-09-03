/**
 * Set Admin Role Cloud Function
 * Uses Firebase Admin SDK to set Custom Claims on user tokens.
 * Only callable by existing admins.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK (should be done once in index.ts in production)
if (!admin.apps.length) {
    admin.initializeApp();
}

interface SetAdminRoleData {
    targetUid: string;
    role: 'user' | 'admin';
}

export const setAdminRole = functions.https.onCall(
    async (data: SetAdminRoleData, context) => {
        // Verify caller is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be authenticated to set roles.'
            );
        }

        // Verify caller is already an admin
        const callerToken = context.auth.token;
        if (callerToken.role !== 'admin') {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only admins can modify user roles.'
            );
        }

        // Validate input
        const { targetUid, role } = data;
        if (!targetUid || !role) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'targetUid and role are required.'
            );
        }

        if (!['user', 'admin'].includes(role)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Role must be "user" or "admin".'
            );
        }

        // Prevent self-demotion (admin removing own admin rights)
        if (targetUid === context.auth.uid && role !== 'admin') {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'Cannot remove your own admin privileges.'
            );
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
        } catch (error) {
            console.error('Error setting custom claims:', error);
            throw new functions.https.HttpsError(
                'internal',
                'Failed to update user role.'
            );
        }
    }
);
