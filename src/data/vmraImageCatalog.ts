/**
 * VMRA Image Catalog
 * 
 * High-definition illustrated objects culturally familiar in the Indian context.
 * Serves visual stimuli for the Visual Memory Recall Assessment (VMRA).
 */

import type { ImageStimulus, ImageCategory, DistractorPair, SimilarityTier, VmraSessionConfig } from '../types/vmraTypes';

// ─── 24 Handcrafted Illustrated Stimuli (Served from Supabase Storage) ───

export const VMRA_SUPABASE_URL = "https://pkkrxxjinpxctkoxltuy.supabase.co/storage/v1/object/public/navigation-assets/vmra";

export const IMAGE_CATALOG: ImageStimulus[] = [
    // ── KITCHEN & FOOD ──
    {
        id: 'samosa',
        name: 'Samosa Plate',
        category: 'kitchen',
        imageSrc: `/images/vmra/samosa.jpg`,
        svgComponent: 'samosa',
        region: 'pan-india',
        similarTo: ['dosa', 'frying-pan'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'dosa',
        name: 'Masala Dosa',
        category: 'kitchen',
        imageSrc: `/images/vmra/dosa.jpg`,
        svgComponent: 'dosa',
        region: 'south',
        similarTo: ['samosa', 'frying-pan'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'frying-pan',
        name: 'Frying Pan',
        category: 'kitchen',
        imageSrc: `/images/vmra/frying-pan.jpg`,
        svgComponent: 'fryingPan',
        region: 'pan-india',
        similarTo: ['tumbler', 'bucket'],
        similarityTier: 'low',
        difficultyWeight: 3,
    },
    {
        id: 'tumbler',
        name: 'Water Tumbler',
        category: 'kitchen',
        imageSrc: `/images/vmra/tumbler.jpg`,
        svgComponent: 'tumbler',
        region: 'pan-india',
        similarTo: ['bucket', 'frying-pan'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },

    // ── FRUITS ──
    {
        id: 'apple',
        name: 'Red Apple',
        category: 'fruits',
        imageSrc: `/images/vmra/apple.jpg`,
        svgComponent: 'apple',
        region: 'pan-india',
        similarTo: ['banana', 'coconut'],
        similarityTier: 'high',
        difficultyWeight: 5,
    },
    {
        id: 'banana',
        name: 'Banana',
        category: 'fruits',
        imageSrc: `/images/vmra/banana.jpg`,
        svgComponent: 'banana',
        region: 'pan-india',
        similarTo: ['apple', 'coconut'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'coconut',
        name: 'Coconut',
        category: 'fruits',
        imageSrc: `/images/vmra/coconut.jpg`,
        svgComponent: 'coconut',
        region: 'pan-india',
        similarTo: ['apple', 'banana'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },

    // ── TRANSPORT ──
    {
        id: 'auto-rickshaw',
        name: 'Auto Rickshaw',
        category: 'transport',
        imageSrc: `/images/vmra/auto-rickshaw.jpg`,
        svgComponent: 'autoRickshaw',
        region: 'pan-india',
        similarTo: ['bus', 'bicycle'],
        similarityTier: 'high',
        difficultyWeight: 6,
    },
    {
        id: 'bus',
        name: 'Red Bus',
        category: 'transport',
        imageSrc: `/images/vmra/bus.jpg`,
        svgComponent: 'bus',
        region: 'pan-india',
        similarTo: ['train', 'auto-rickshaw'],
        similarityTier: 'high',
        difficultyWeight: 6,
    },
    {
        id: 'train',
        name: 'Train',
        category: 'transport',
        imageSrc: `/images/vmra/train.jpg`,
        svgComponent: 'train',
        region: 'pan-india',
        similarTo: ['bus', 'auto-rickshaw'],
        similarityTier: 'medium',
        difficultyWeight: 5,
    },
    {
        id: 'bicycle',
        name: 'Bicycle',
        category: 'transport',
        imageSrc: `/images/vmra/bicycle.jpg`,
        svgComponent: 'bicycle',
        region: 'pan-india',
        similarTo: ['auto-rickshaw'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },

    // ── HOUSEHOLD & DAILY OBJECTS ──
    {
        id: 'notebook',
        name: 'Spiral Notebook',
        category: 'household',
        imageSrc: `/images/vmra/notebook.jpg`,
        svgComponent: 'notebook',
        region: 'pan-india',
        similarTo: ['pencil', 'school-bag'],
        similarityTier: 'high',
        difficultyWeight: 5,
    },
    {
        id: 'pencil',
        name: 'Pencil',
        category: 'household',
        imageSrc: `/images/vmra/pencil.jpg`,
        svgComponent: 'pencil',
        region: 'pan-india',
        similarTo: ['notebook'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'school-bag',
        name: 'School Bag',
        category: 'household',
        imageSrc: `/images/vmra/school-bag.jpg`,
        svgComponent: 'schoolBag',
        region: 'pan-india',
        similarTo: ['notebook', 'sandals'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'bucket',
        name: 'Blue Bucket',
        category: 'household',
        imageSrc: `/images/vmra/bucket.jpg`,
        svgComponent: 'bucket',
        region: 'pan-india',
        similarTo: ['tumbler', 'flower-pot'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'alarm-clock',
        name: 'Alarm Clock',
        category: 'household',
        imageSrc: `/images/vmra/alarm-clock.jpg`,
        svgComponent: 'alarmClock',
        region: 'pan-india',
        similarTo: ['eyeglasses'],
        similarityTier: 'low',
        difficultyWeight: 3,
    },
    {
        id: 'eyeglasses',
        name: 'Eyeglasses',
        category: 'household',
        imageSrc: `/images/vmra/eyeglasses.jpg`,
        svgComponent: 'eyeglasses',
        region: 'pan-india',
        similarTo: ['alarm-clock'],
        similarityTier: 'low',
        difficultyWeight: 2,
    },
    {
        id: 'sandals',
        name: 'Sandals',
        category: 'household',
        imageSrc: `/images/vmra/sandals.jpg`,
        svgComponent: 'sandals',
        region: 'pan-india',
        similarTo: ['kurta', 'school-bag'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'umbrella',
        name: 'Blue Umbrella',
        category: 'household',
        imageSrc: `/images/vmra/umbrella.jpg`,
        svgComponent: 'umbrella',
        region: 'pan-india',
        similarTo: ['flower-pot'],
        similarityTier: 'low',
        difficultyWeight: 3,
    },

    // ── CULTURAL & TRADITIONAL ──
    {
        id: 'kurta',
        name: 'Kurta',
        category: 'cultural',
        imageSrc: `/images/vmra/kurta.jpg`,
        svgComponent: 'kurta',
        region: 'pan-india',
        similarTo: ['sandals'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
    {
        id: 'diya',
        name: 'Diwali Diya Lamp',
        category: 'cultural',
        imageSrc: `/images/vmra/diya.jpg`,
        svgComponent: 'diya',
        region: 'pan-india',
        similarTo: ['dhol', 'alarm-clock'],
        similarityTier: 'medium',
        difficultyWeight: 5,
    },
    {
        id: 'dhol',
        name: 'Dhol Drum',
        category: 'cultural',
        imageSrc: `/images/vmra/dhol.jpg`,
        svgComponent: 'dhol',
        region: 'north',
        similarTo: ['elephant', 'diya'],
        similarityTier: 'low',
        difficultyWeight: 3,
    },

    // ── ANIMALS ──
    {
        id: 'elephant',
        name: 'Temple Elephant',
        category: 'animals',
        imageSrc: `/images/vmra/elephant.jpg`,
        svgComponent: 'elephant',
        region: 'pan-india',
        similarTo: ['dhol'],
        similarityTier: 'low',
        difficultyWeight: 2,
    },

    // ── NATURE ──
    {
        id: 'flower-pot',
        name: 'Potted Flower',
        category: 'nature',
        imageSrc: `/images/vmra/flower-pot.jpg`,
        svgComponent: 'flowerPot',
        region: 'pan-india',
        similarTo: ['bucket', 'umbrella'],
        similarityTier: 'medium',
        difficultyWeight: 4,
    },
];

// ─── Helper: Get images by category ───────────────────────────────

export function getImagesByCategory(category: ImageCategory): ImageStimulus[] {
    return IMAGE_CATALOG.filter(img => img.category === category);
}

// ─── Helper: Get images by region ─────────────────────────────────

export function getImagesByRegion(region: string): ImageStimulus[] {
    return IMAGE_CATALOG.filter(img => img.region === region || img.region === 'pan-india');
}

// ─── Session Image Selection ──────────────────────────────────────

/**
 * Select target images for a session.
 * Rules:
 * - Spread across at least 3 different categories
 * - No repeated sets across consecutive sessions (uses previousTargetIds)
 * - Balanced difficulty weights
 */
export function selectTargetImages(
    count: number,
    previousTargetIds: string[] = [],
    region: string = 'pan-india'
): ImageStimulus[] {
    let eligible = IMAGE_CATALOG.filter(
        img => !previousTargetIds.includes(img.id) &&
            (img.region === region || img.region === 'pan-india')
    );

    if (eligible.length < count) {
        eligible = [...IMAGE_CATALOG];
    }

    // Group by category
    const byCategory = new Map<ImageCategory, ImageStimulus[]>();
    for (const img of eligible) {
        if (!byCategory.has(img.category)) byCategory.set(img.category, []);
        byCategory.get(img.category)!.push(img);
    }

    const categories = Array.from(byCategory.keys());
    const selected: ImageStimulus[] = [];

    // Ensure at least 3 categories are represented
    const shuffledCategories = shuffleArray([...categories]);
    const minCategories = Math.min(3, shuffledCategories.length);

    // Pick one from each required category first
    for (let i = 0; i < minCategories && selected.length < count; i++) {
        const catImages = byCategory.get(shuffledCategories[i])!;
        const pick = catImages[Math.floor(Math.random() * catImages.length)];
        selected.push(pick);
    }

    // Fill remaining from any category
    const remaining = eligible.filter(img => !selected.includes(img));
    const shuffledRemaining = shuffleArray(remaining);
    for (const img of shuffledRemaining) {
        if (selected.length >= count) break;
        selected.push(img);
    }

    return shuffleArray(selected);
}

// ─── Distractor Selection ─────────────────────────────────────────

/**
 * Select distractors for a set of target images.
 * Rules:
 * - Each distractor must be from the same category as at least one target where possible
 * - Distractors must NOT be in the target set
 * - Always backfills to guarantee exact count
 */
export function selectDistractors(
    targets: ImageStimulus[],
    count: number,
    similarity: SimilarityTier,
    previousDistractorIds: string[] = []
): ImageStimulus[] {
    const targetIds = new Set(targets.map(t => t.id));
    const previousIds = new Set(previousDistractorIds);
    const targetCategories = new Set(targets.map(t => t.category));

    // Candidate pool: same categories, not a target, not previously used
    let candidates = IMAGE_CATALOG.filter(
        img => targetCategories.has(img.category) &&
            !targetIds.has(img.id) &&
            !previousIds.has(img.id)
    );

    // If not enough, allow any unused category
    if (candidates.length < count) {
        const remaining = IMAGE_CATALOG.filter(
            img => !targetIds.has(img.id) &&
                !previousIds.has(img.id) &&
                !candidates.some(c => c.id === img.id)
        );
        candidates = [...candidates, ...shuffleArray(remaining)];
    }

    // If still not enough (e.g. previousIds excluded too many), relax previousIds
    if (candidates.length < count) {
        const relaxed = IMAGE_CATALOG.filter(
            img => !targetIds.has(img.id) && !candidates.some(c => c.id === img.id)
        );
        candidates = [...candidates, ...shuffleArray(relaxed)];
    }

    // Prefer distractors matching the requested similarity tier
    const tieredCandidates = candidates.filter(img => img.similarityTier === similarity);

    const pool = tieredCandidates.length >= count
        ? shuffleArray(tieredCandidates)
        : shuffleArray(candidates);

    return pool.slice(0, count);
}

// ─── Build distractor pair list (for confusion matrix analysis) ───

export function buildDistractorPairs(
    targets: ImageStimulus[],
    distractors: ImageStimulus[]
): DistractorPair[] {
    const pairs: DistractorPair[] = [];

    for (const distractor of distractors) {
        const matchedTarget = targets.find(t => t.similarTo.includes(distractor.id));
        if (matchedTarget) {
            pairs.push({
                targetId: matchedTarget.id,
                distractorId: distractor.id,
                similarityTier: distractor.similarityTier,
            });
        }
    }

    return pairs;
}

// ─── Build shuffled grid ──────────────────────────────────────────

export function buildGrid(
    targets: ImageStimulus[],
    distractors: ImageStimulus[]
): ImageStimulus[] {
    return shuffleArray([...targets, ...distractors]);
}

// ─── Default Session Configuration ────────────────────────────────

export function getSessionConfig(sessionNumber: number): VmraSessionConfig {
    if (sessionNumber <= 3) {
        return {
            targetCount: 10,
            distractorCount: 10,
            encodingTimePerImage: 1400, // Snappier presentation (reduced from 2200ms)
            fadeDuration: 200,
            retentionDuration: 5000,
            similarityLevel: 'low',
            gridColumns: 5,
            gridRows: 4,
        };
    } else if (sessionNumber <= 8) {
        return {
            targetCount: 10,
            distractorCount: 10,
            encodingTimePerImage: 1250, // Snappier presentation (reduced from 2000ms)
            fadeDuration: 200,
            retentionDuration: 5000,
            similarityLevel: 'medium',
            gridColumns: 5,
            gridRows: 4,
        };
    } else if (sessionNumber <= 15) {
        return {
            targetCount: 11,
            distractorCount: 11,
            encodingTimePerImage: 1100, // Snappier presentation (reduced from 1200ms)
            fadeDuration: 200,
            retentionDuration: 5000,
            similarityLevel: 'medium',
            gridColumns: 5,
            gridRows: 5,
        };
    } else {
        return {
            targetCount: 12,
            distractorCount: 12,
            encodingTimePerImage: 900, // Fast presentation for advanced sessions (reduced from 1000ms)
            fadeDuration: 200,
            retentionDuration: 5000,
            similarityLevel: 'high',
            gridColumns: 5,
            gridRows: 5,
        };
    }
}

// ─── Utility ──────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
