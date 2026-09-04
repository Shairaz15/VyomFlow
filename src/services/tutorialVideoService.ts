/**
 * ============================================================================
 * tutorialVideoService.ts
 * ============================================================================
 * Centralized service managing Supabase Storage CDN and PostgreSQL metadata
 * for VyomFlow's multilingual assessment tutorial videos.
 */

import { supabase } from "../lib/supabase";

export const SUPABASE_TUTORIALS_CDN_BASE =
    "https://pkkrxxjinpxctkoxltuy.supabase.co/storage/v1/object/public/tutorial-videos";

export interface TutorialVideoRecord {
    id?: string;
    module_key: string;
    language_code: string;
    language_label: string;
    filename: string;
    storage_path: string;
    public_url: string;
    file_size_bytes?: number;
}

// In-memory cache for fast lookups
const videoUrlCache = new Map<string, string>();

/**
 * Returns the direct Supabase Storage CDN URL for a tutorial video.
 */
export function getSupabaseTutorialVideoUrl(
    moduleFolder: string,
    prefix: string,
    suffix: string
): string {
    const key = `${moduleFolder}:${prefix}:${suffix}`;
    if (videoUrlCache.has(key)) {
        return videoUrlCache.get(key)!;
    }

    let filename = `${prefix}_${suffix}.mp4`;
    if (moduleFolder === "reaction" && suffix === "hindi") {
        filename = "reaction_tutorial_hindi_sarvam.mp4";
    }

    const url = `${SUPABASE_TUTORIALS_CDN_BASE}/${moduleFolder}/${filename}`;
    videoUrlCache.set(key, url);
    return url;
}

/**
 * Returns the bundled local fallback URL if offline or network failure.
 */
export function getLocalTutorialVideoUrl(
    moduleFolder: string,
    prefix: string,
    suffix: string
): string {
    let filename = `${prefix}_${suffix}.mp4`;
    if (moduleFolder === "reaction" && suffix === "hindi") {
        filename = "reaction_tutorial_hindi_sarvam.mp4";
    }
    return `/videos/tutorials/${moduleFolder}/${filename}`;
}

/**
 * Queries the Supabase `tutorial_videos` database table for all registered
 * tutorial video assets of a given assessment module.
 */
export async function fetchTutorialVideosForModule(
    moduleKey: string
): Promise<TutorialVideoRecord[]> {
    try {
        const { data, error } = await supabase
            .from("tutorial_videos")
            .select("*")
            .eq("module_key", moduleKey)
            .order("language_code");

        if (error) {
            console.warn(`[tutorialVideoService] Could not query tutorial_videos table:`, error.message);
            return [];
        }

        return (data as TutorialVideoRecord[]) || [];
    } catch (err) {
        console.warn(`[tutorialVideoService] Exception fetching tutorial videos:`, err);
        return [];
    }
}
