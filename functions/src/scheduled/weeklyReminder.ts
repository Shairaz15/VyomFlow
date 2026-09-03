/**
 * Weekly Reminder Cloud Function
 * Sends email reminders to users who haven't completed assessments.
 * Respects email preferences and enforces 7-day cooldown.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const weeklyReminder = functions.pubsub
    .schedule('0 10 * * 0') // Every Sunday at 10:00 AM UTC
    .timeZone('UTC')
    .onRun(async () => {
        if (!SENDGRID_API_KEY) {
            console.warn('SendGrid API key not configured. Skipping email reminders.');
            return null;
        }

        const now = Date.now();
        let sentCount = 0;
        let skippedCount = 0;

        try {
            // Get users who have email notifications enabled
            const usersSnapshot = await db
                .collection('users')
                .where('preferences.emailNotifications', '==', true)
                .get();

            const batch = db.batch();
            const emailPromises: Promise<void>[] = [];

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const lastReminderSent = userData.preferences?.lastReminderSent?.toDate();

                // Check 7-day cooldown
                if (lastReminderSent && (now - lastReminderSent.getTime()) < SEVEN_DAYS_MS) {
                    skippedCount++;
                    continue;
                }

                // Check if user has email
                const email = userData.email;
                if (!email) {
                    skippedCount++;
                    continue;
                }

                // Queue email send
                emailPromises.push(
                    sendReminderEmail(email, userData.displayName || 'there')
                        .then(() => {
                            // Update last reminder sent timestamp
                            batch.update(userDoc.ref, {
                                'preferences.lastReminderSent': admin.firestore.FieldValue.serverTimestamp(),
                            });
                            sentCount++;
                        })
                        .catch((error) => {
                            console.error(`Failed to send email to ${email}:`, error);
                            skippedCount++;
                        })
                );
            }

            await Promise.all(emailPromises);
            await batch.commit();

            // Log email send summary
            await db.collection('adminLogs').add({
                action: 'WEEKLY_REMINDER_BATCH',
                sentCount,
                skippedCount,
                totalUsers: usersSnapshot.size,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Weekly reminders: ${sentCount} sent, ${skippedCount} skipped`);
            return null;
        } catch (error) {
            console.error('Error in weekly reminder function:', error);
            throw error;
        }
    });

async function sendReminderEmail(to: string, name: string): Promise<void> {
    const msg = {
        to,
        from: 'noreply@vyomflow.app', // Update with your verified sender
        subject: '🧠 Weekly VyomFlow Reminder',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="color: #8b5cf6; margin-bottom: 20px;">Hi ${name}!</h1>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    It's time for your weekly cognitive assessment. Regular tracking helps us identify patterns
                    and keep you informed about your cognitive health.
                </p>
                <div style="margin: 30px 0;">
                    <a href="https://vyomflow.app/tests" 
                       style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
                              color: white; padding: 14px 28px; border-radius: 8px; 
                              text-decoration: none; font-weight: 600;">
                        Start Assessment
                    </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                    Takes only 5-10 minutes. Your brain will thank you! 🌟
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999;">
                    You're receiving this because you enabled weekly reminders.
                    <a href="https://vyomflow.app/settings" style="color: #8b5cf6;">Unsubscribe</a>
                </p>
            </div>
        `,
    };

    await sgMail.send(msg);
}
