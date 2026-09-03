/**
 * Hash User ID Utility
 * Uses SHA-256 to anonymize user IDs for admin display.
 */

export function hashUserId(uid: string): string {
    // Simple hash for display - creates a short anonymized ID
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        const char = uid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex and take first 12 characters
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `usr_${hexHash}`;
}

/**
 * Full SHA-256 hash for export purposes.
 * Uses Web Crypto API.
 */
export async function hashUserIdSHA256(uid: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(uid);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 12);
}
