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
 * Generate rich, responsive HTML email layout incorporating:
 * - [Rec #1] High-Contrast Thumb-Friendly Primary CTA Button
 * - [Rec #2] Personalized Cognitive Snapshot Metric Card
 */
export function generateReminderEmailHtml(recipientName: string, daysSince: number, assessmentUrl: string): string {
    return `
<div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
  <!-- Brand Header -->
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VyomFlow</h1>
    <p style="color: #bae6fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Cognitive Wellness & Biomarker Intelligence</p>
  </div>

  <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
    <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 10px 0; font-weight: 600;">Hello ${recipientName},</h2>
    <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
      It has been <strong>${daysSince} days</strong> since your last cognitive assessment. Consistent weekly check-ins help identify subtle reaction, memory, and executive focus trends early.
    </p>

    <!-- [RECOMMENDATION 2] Personalized Cognitive Snapshot Metric Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0284c7; margin-bottom: 10px;">
        📊 Assessment Status Overview
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Last Completed:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${daysSince} days ago</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Time Commitment:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #059669; text-align: right;">⏱️ ~3 Minutes</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Included Modules:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">Memory • Speed • Fluency</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Supported Languages:</td>
          <td style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0284c7; text-align: right;">11 Indic Languages</td>
        </tr>
      </table>
    </div>

    <!-- [RECOMMENDATION 1] High-Contrast Thumb-Friendly Primary CTA Button -->
    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${assessmentUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); text-align: center;">
        Start 3-Minute Assessment →
      </a>
      <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
        No preparation needed • Works seamlessly on mobile & desktop
      </div>
    </div>
  </div>

  <!-- Trust & Privacy Footer -->
  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 4px 0;">🔒 <strong>Privacy Assurance:</strong> Raw audio is ephemeral and never permanently stored.</p>
    <p style="margin: 0;">VyomFlow is a non-diagnostic wellness tool for cognitive trend awareness.</p>
  </div>
</div>
`.trim();
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
    const emailHtml = generateReminderEmailHtml(recipientName, params.daysSinceLastAssessment, ASSESSMENT_URL);

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

        // [Recommendation 1] High-Contrast Thumb-Friendly Primary CTA Button fields
        cta_text: 'Start 3-Minute Assessment →',
        cta_url: ASSESSMENT_URL,
        cta_button: `<a href="${ASSESSMENT_URL}" style="display:inline-block;background:#0284c7;color:#fff;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none;">Start 3-Minute Assessment →</a>`,
        assessment_link: ASSESSMENT_URL,
        action_url: ASSESSMENT_URL,
        link: ASSESSMENT_URL,

        // [Recommendation 2] Personalized Cognitive Snapshot Metric Card fields
        days_since: params.daysSinceLastAssessment,
        daysSinceLastAssessment: params.daysSinceLastAssessment,
        time_estimate: '~3 Minutes',
        modules_included: 'Memory • Reaction Speed • Language Fluency',
        status_card: `Last Completed: ${params.daysSinceLastAssessment} days ago | Time Required: ~3 mins | Modules: Memory, Reaction Speed, Language Fluency`,

        // Plain Text Message
        message: `Hello ${recipientName},\n\nIt's been ${params.daysSinceLastAssessment} days since your last cognitive assessment.\n\n📊 Assessment Snapshot:\n• Last Completed: ${params.daysSinceLastAssessment} days ago\n• Time Required: ~3 Minutes\n• Modules: Memory, Reaction Speed, Language Fluency\n\nStart your 3-minute assessment here:\n${ASSESSMENT_URL}\n\nVyomFlow Cognitive Wellness Team`,

        // Rich HTML Body fields for HTML-enabled EmailJS templates
        message_html: emailHtml,
        html_body: emailHtml,
        content: emailHtml,
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
