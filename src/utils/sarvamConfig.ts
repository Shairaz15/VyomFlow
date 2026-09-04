/**
 * Sarvam AI Configuration Utility
 * Ensures a valid, working Sarvam API key is always used,
 * filtering out any revoked/stale keys (such as old deployment environment variables).
 */

export const DEFAULT_SARVAM_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

export function getSarvamApiKey(): string {
    const envKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (!envKey || typeof envKey !== 'string') {
        return DEFAULT_SARVAM_KEY;
    }
    const cleanKey = envKey.trim();
    // Guard against known revoked / dead keys from prior deployments
    if (cleanKey.startsWith('sk_bl9') || cleanKey.length < 20) {
        return DEFAULT_SARVAM_KEY;
    }
    return cleanKey;
}

export const SARVAM_API_KEY = getSarvamApiKey();
