/**
 * Email Service using EmailJS
 * Free tier: 200 emails/month, no credit card required
 * Configured with resilient defaults for VyomFlow production & local dev.
 */

import emailjs from '@emailjs/browser';
import { logger } from '../utils/logger';

// Default configuration with production fallbacks so emails never fail due to missing build-time env vars
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'luBlcvWrH7GFbqI0y';
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_h2o446q';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_j0q8pf8';

// Assessment URL - configurable via env or fallback to origin
const ASSESSMENT_URL = import.meta.env.VITE_ASSESSMENT_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/tests` : 'https://biomed-rho.vercel.app/tests');

// Initialize EmailJS
if (PUBLIC_KEY) {
    try {
        emailjs.init(PUBLIC_KEY);
    } catch (e) {
        logger.warn('Failed to initialize EmailJS SDK:', e);
    }
}

export interface ReminderEmailParams {
    toName: string;
    toEmail: string;
    daysSinceLastAssessment: number;
}

/**
 * Validate email format
 */
function isValidEmail(email: string | undefined | null): email is string {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Send a weekly assessment reminder email branded for VyomFlow
 */
export async function sendWeeklyReminder(params: ReminderEmailParams): Promise<boolean> {
    if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
        logger.warn('EmailJS not configured. Set VITE_EMAILJS_* env variables.');
        return false;
    }

    // Validate email before sending
    if (!isValidEmail(params.toEmail)) {
        logger.warn('Invalid or missing email address, skipping reminder:', params.toEmail);
        return false;
    }

    const cleanEmail = params.toEmail.trim();
    const recipientName = params.toName?.trim() || 'User';

    // Comprehensive template parameters matching any EmailJS template variable names
    // and explicitly overriding any legacy "CogniTrack" defaults with "VyomFlow"
    const templateParams: Record<string, string | number> = {
        // Recipient aliases
        to_name: recipientName,
        name: recipientName,
        user_name: recipientName,
        to_email: cleanEmail,
        email: cleanEmail,
        user_email: cleanEmail,
        reply_to: cleanEmail,

        // VyomFlow Branding (overrides any template defaults)
        from_name: 'VyomFlow',
        app_name: 'VyomFlow',
        company_name: 'VyomFlow',
        project_name: 'VyomFlow',
        service_name: 'VyomFlow',
        platform_name: 'VyomFlow',
        subject: 'VyomFlow - Cognitive Assessment Reminder',
        title: 'VyomFlow Cognitive Health Reminder',

        // Content
        days_since: params.daysSinceLastAssessment,
        daysSinceLastAssessment: params.daysSinceLastAssessment,
        message: `It's been ${params.daysSinceLastAssessment} days since your last cognitive assessment. Regular tracking with VyomFlow helps identify cognitive trends early. Take a quick assessment today!`,
        assessment_link: ASSESSMENT_URL,
        action_url: ASSESSMENT_URL,
        link: ASSESSMENT_URL,
    };

    // Attempt 1: Try EmailJS Browser SDK
    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        logger.info('Reminder email sent via EmailJS SDK:', response.status);
        if (response.status === 200) {
            return true;
        }
    } catch (sdkError) {
        logger.warn('EmailJS SDK send failed, falling back to direct REST API:', sdkError);
    }

    // Attempt 2: Direct REST API fetch fallback
    try {
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: templateParams,
            }),
        });

        if (res.ok) {
            logger.info('Reminder email sent via direct EmailJS REST API');
            return true;
        } else {
            const errText = await res.text();
            logger.error('EmailJS direct REST call failed:', res.status, errText);
        }
    } catch (restError) {
        logger.error('EmailJS direct REST call failed with error:', restError);
    }

    return false;
}

/**
 * Check if email reminders are configured
 */
export function isEmailConfigured(): boolean {
    return Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);
}

/**
 * Storage keys for email preferences (with VyomFlow naming)
 */
const STORAGE_KEYS = {
    REMINDERS_ENABLED: 'vyomflow_email_reminders_enabled',
    LAST_REMINDER_SENT: 'vyomflow_last_reminder_sent',
    USER_EMAIL: 'vyomflow_user_email',
};

/**
 * Safely parse a date string, returning null if invalid
 */
function parseValidDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    } catch {
        return null;
    }
}

/**
 * Get email reminder preferences from localStorage, with legacy cognitrack_ fallback
 */
export function getEmailPreferences(): { enabled: boolean; email: string; lastSent: Date | null } {
    const rawEnabled = localStorage.getItem(STORAGE_KEYS.REMINDERS_ENABLED);
    const legacyEnabled = localStorage.getItem('cognitrack_email_reminders_enabled');
    const enabled = rawEnabled !== null ? rawEnabled === 'true' : (legacyEnabled !== null ? legacyEnabled === 'true' : true);

    const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || localStorage.getItem('cognitrack_user_email') || '';
    const lastSentStr = localStorage.getItem(STORAGE_KEYS.LAST_REMINDER_SENT) || localStorage.getItem('cognitrack_last_reminder_sent');
    const lastSent = parseValidDate(lastSentStr);

    return { enabled, email, lastSent };
}

/**
 * Save email reminder preferences to localStorage
 */
export function saveEmailPreferences(enabled: boolean, email: string): void {
    localStorage.setItem(STORAGE_KEYS.REMINDERS_ENABLED, String(enabled));
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    // Remove legacy keys
    try {
        localStorage.removeItem('cognitrack_email_reminders_enabled');
        localStorage.removeItem('cognitrack_user_email');
    } catch {}
}

/**
 * Record that a reminder was sent
 */
export function recordReminderSent(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_REMINDER_SENT, new Date().toISOString());
    try {
        localStorage.removeItem('cognitrack_last_reminder_sent');
    } catch {}
}

/**
 * Check if a reminder should be sent (more than 7 days since last assessment)
 */
export function shouldSendReminder(lastAssessmentDate: Date | null): boolean {
    if (!lastAssessmentDate) return false;

    const prefs = getEmailPreferences();
    if (!prefs.enabled || !prefs.email) return false;

    // Check if we already sent a reminder today
    if (prefs.lastSent) {
        const today = new Date().toDateString();
        if (prefs.lastSent.toDateString() === today) return false;
    }

    // Check if more than 7 days since last assessment
    const daysSince = Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
}

/**
 * Calculate days since last assessment
 */
export function getDaysSinceAssessment(lastAssessmentDate: Date | null): number {
    if (!lastAssessmentDate) return 0;
    return Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Validate email format (exported for use in other modules)
 */
export { isValidEmail };
