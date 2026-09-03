/**
 * VMRA Image Catalog
 * 
 * 60+ culturally familiar Indian objects organized by category.
 * Each entry includes distractor pairings and similarity tiers.
 * 
 * NOTE: svgComponent keys map to inline SVG React components in vmraIcons.tsx.
 * All objects are pan-India familiar unless marked with a specific region.
 */

import type { ImageStimulus, ImageCategory, DistractorPair, SimilarityTier, VmraSessionConfig } from '../types/vmraTypes';

// ─── Full Image Catalog ───────────────────────────────────────────

export const IMAGE_CATALOG: ImageStimulus[] = [
    // ── FRUITS & VEGETABLES ──
    { id: 'mango', name: 'Mango', category: 'fruits', svgComponent: 'mango', region: 'pan-india', similarTo: ['banana', 'papaya', 'lemon'], similarityTier: 'medium', difficultyWeight: 3 },
    { id: 'banana', name: 'Banana', category: 'fruits', svgComponent: 'banana', region: 'pan-india', similarTo: ['mango', 'cucumber'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'coconut', name: 'Coconut', category: 'fruits', svgComponent: 'coconut', region: 'pan-india', similarTo: ['watermelon', 'pomegranate'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'watermelon', name: 'Watermelon', category: 'fruits', svgComponent: 'watermelon', region: 'pan-india', similarTo: ['coconut', 'pomegranate'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'pomegranate', name: 'Pomegranate', category: 'fruits', svgComponent: 'pomegranate', region: 'pan-india', similarTo: ['tomato', 'apple'], similarityTier: 'high', difficultyWeight: 7 },
    { id: 'lemon', name: 'Lemon', category: 'fruits', svgComponent: 'lemon', region: 'pan-india', similarTo: ['lime', 'mango'], similarityTier: 'high', difficultyWeight: 8 },
    { id: 'lime', name: 'Lime', category: 'fruits', svgComponent: 'lime', region: 'pan-india', similarTo: ['lemon'], similarityTier: 'high', difficultyWeight: 8 },
    { id: 'chili', name: 'Green Chili', category: 'fruits', svgComponent: 'chili', region: 'pan-india', similarTo: ['ladyfinger', 'cucumber'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'brinjal', name: 'Brinjal', category: 'fruits', svgComponent: 'brinjal', region: 'pan-india', similarTo: ['onion'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'onion', name: 'Onion', category: 'fruits', svgComponent: 'onion', region: 'pan-india', similarTo: ['tomato', 'brinjal'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'tomato', name: 'Tomato', category: 'fruits', svgComponent: 'tomato', region: 'pan-india', similarTo: ['pomegranate', 'apple', 'onion'], similarityTier: 'high', difficultyWeight: 7 },
    { id: 'papaya', name: 'Papaya', category: 'fruits', svgComponent: 'papaya', region: 'pan-india', similarTo: ['mango'], similarityTier: 'medium', difficultyWeight: 4 },

    // ── KITCHEN ITEMS ──
    { id: 'pressure-cooker', name: 'Pressure Cooker', category: 'kitchen', svgComponent: 'pressureCooker', region: 'pan-india', similarTo: ['steel-pot', 'tawa'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'steel-tumbler', name: 'Steel Tumbler', category: 'kitchen', svgComponent: 'steelTumbler', region: 'pan-india', similarTo: ['chai-cup', 'steel-glass'], similarityTier: 'high', difficultyWeight: 7 },
    { id: 'chai-cup', name: 'Chai Cup', category: 'kitchen', svgComponent: 'chaiCup', region: 'pan-india', similarTo: ['steel-tumbler', 'steel-glass'], similarityTier: 'high', difficultyWeight: 7 },
    { id: 'steel-glass', name: 'Steel Glass', category: 'kitchen', svgComponent: 'steelGlass', region: 'pan-india', similarTo: ['steel-tumbler', 'chai-cup'], similarityTier: 'high', difficultyWeight: 8 },
    { id: 'tawa', name: 'Tawa (Flat Pan)', category: 'kitchen', svgComponent: 'tawa', region: 'pan-india', similarTo: ['steel-plate', 'pressure-cooker'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'steel-plate', name: 'Steel Plate', category: 'kitchen', svgComponent: 'steelPlate', region: 'pan-india', similarTo: ['tawa'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'rolling-pin', name: 'Rolling Pin', category: 'kitchen', svgComponent: 'rollingPin', region: 'pan-india', similarTo: ['ladle'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'ladle', name: 'Ladle (Karchi)', category: 'kitchen', svgComponent: 'ladle', region: 'pan-india', similarTo: ['rolling-pin'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'matka', name: 'Water Pot', category: 'kitchen', svgComponent: 'matka', region: 'pan-india', similarTo: ['bucket'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'steel-pot', name: 'Steel Pot', category: 'kitchen', svgComponent: 'steelPot', region: 'pan-india', similarTo: ['pressure-cooker'], similarityTier: 'medium', difficultyWeight: 5 },

    // ── TRANSPORT ──
    { id: 'auto-rickshaw', name: 'Auto Rickshaw', category: 'transport', svgComponent: 'autoRickshaw', region: 'pan-india', similarTo: ['tempo', 'bus'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'bus', name: 'Bus', category: 'transport', svgComponent: 'bus', region: 'pan-india', similarTo: ['tempo', 'train'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'bicycle', name: 'Bicycle', category: 'transport', svgComponent: 'bicycle', region: 'pan-india', similarTo: ['motorcycle'], similarityTier: 'high', difficultyWeight: 6 },
    { id: 'motorcycle', name: 'Motorcycle', category: 'transport', svgComponent: 'motorcycle', region: 'pan-india', similarTo: ['bicycle'], similarityTier: 'high', difficultyWeight: 6 },
    { id: 'bullock-cart', name: 'Bullock Cart', category: 'transport', svgComponent: 'bullockCart', region: 'pan-india', similarTo: ['tractor'], similarityTier: 'low', difficultyWeight: 3 },
    { id: 'train', name: 'Train', category: 'transport', svgComponent: 'train', region: 'pan-india', similarTo: ['bus'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'tractor', name: 'Tractor', category: 'transport', svgComponent: 'tractor', region: 'pan-india', similarTo: ['bullock-cart', 'tempo'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'tempo', name: 'Tempo', category: 'transport', svgComponent: 'tempo', region: 'pan-india', similarTo: ['auto-rickshaw', 'bus'], similarityTier: 'medium', difficultyWeight: 5 },

    // ── ANIMALS ──
    { id: 'cow', name: 'Cow', category: 'animals', svgComponent: 'cow', region: 'pan-india', similarTo: ['buffalo', 'goat'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'buffalo', name: 'Buffalo', category: 'animals', svgComponent: 'buffalo', region: 'pan-india', similarTo: ['cow'], similarityTier: 'high', difficultyWeight: 7 },
    { id: 'dog', name: 'Dog', category: 'animals', svgComponent: 'dog', region: 'pan-india', similarTo: ['goat'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'goat', name: 'Goat', category: 'animals', svgComponent: 'goat', region: 'pan-india', similarTo: ['cow', 'dog'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'crow', name: 'Crow', category: 'animals', svgComponent: 'crow', region: 'pan-india', similarTo: ['parrot', 'peacock'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'parrot', name: 'Parrot', category: 'animals', svgComponent: 'parrot', region: 'pan-india', similarTo: ['crow', 'peacock'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'peacock', name: 'Peacock', category: 'animals', svgComponent: 'peacock', region: 'pan-india', similarTo: ['parrot', 'crow'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'elephant', name: 'Elephant', category: 'animals', svgComponent: 'elephant', region: 'pan-india', similarTo: ['buffalo'], similarityTier: 'low', difficultyWeight: 1 },

    // ── HOUSEHOLD ──
    { id: 'broom', name: 'Broom (Jhadoo)', category: 'household', svgComponent: 'broom', region: 'pan-india', similarTo: ['umbrella'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'ceiling-fan', name: 'Ceiling Fan', category: 'household', svgComponent: 'ceilingFan', region: 'pan-india', similarTo: ['umbrella'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'bucket', name: 'Bucket', category: 'household', svgComponent: 'bucket', region: 'pan-india', similarTo: ['matka'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'charpai', name: 'Cot (Charpai)', category: 'household', svgComponent: 'charpai', region: 'pan-india', similarTo: ['sewing-machine'], similarityTier: 'low', difficultyWeight: 1 },
    { id: 'lantern', name: 'Lantern', category: 'household', svgComponent: 'lantern', region: 'pan-india', similarTo: ['diya'], similarityTier: 'high', difficultyWeight: 6 },
    { id: 'sewing-machine', name: 'Sewing Machine', category: 'household', svgComponent: 'sewingMachine', region: 'pan-india', similarTo: ['charpai'], similarityTier: 'low', difficultyWeight: 1 },
    { id: 'umbrella', name: 'Umbrella', category: 'household', svgComponent: 'umbrella', region: 'pan-india', similarTo: ['broom', 'ceiling-fan'], similarityTier: 'low', difficultyWeight: 2 },

    // ── NATURE & OUTDOORS ──
    { id: 'banyan-tree', name: 'Banyan Tree', category: 'nature', svgComponent: 'banyanTree', region: 'pan-india', similarTo: ['coconut-tree'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'coconut-tree', name: 'Coconut Tree', category: 'nature', svgComponent: 'coconutTree', region: 'pan-india', similarTo: ['banyan-tree'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'lotus', name: 'Lotus', category: 'nature', svgComponent: 'lotus', region: 'pan-india', similarTo: ['sunflower'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'sunflower', name: 'Sunflower', category: 'nature', svgComponent: 'sunflower', region: 'pan-india', similarTo: ['lotus'], similarityTier: 'medium', difficultyWeight: 4 },
    { id: 'well', name: 'Well', category: 'nature', svgComponent: 'well', region: 'pan-india', similarTo: ['river'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'river', name: 'River', category: 'nature', svgComponent: 'river', region: 'pan-india', similarTo: ['well', 'field'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'field', name: 'Paddy Field', category: 'nature', svgComponent: 'field', region: 'pan-india', similarTo: ['river', 'hill'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'hill', name: 'Hill', category: 'nature', svgComponent: 'hill', region: 'pan-india', similarTo: ['field'], similarityTier: 'low', difficultyWeight: 1 },

    // ── CULTURAL / RELIGIOUS ──
    { id: 'temple-bell', name: 'Temple Bell', category: 'cultural', svgComponent: 'templeBell', region: 'pan-india', similarTo: ['drum', 'flute'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'diya', name: 'Diya (Lamp)', category: 'cultural', svgComponent: 'diya', region: 'pan-india', similarTo: ['lantern', 'incense'], similarityTier: 'high', difficultyWeight: 6 },
    { id: 'rangoli', name: 'Rangoli', category: 'cultural', svgComponent: 'rangoli', region: 'pan-india', similarTo: ['lotus'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'incense', name: 'Incense', category: 'cultural', svgComponent: 'incense', region: 'pan-india', similarTo: ['diya'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'flute', name: 'Flute', category: 'cultural', svgComponent: 'flute', region: 'pan-india', similarTo: ['drum'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'drum', name: 'Drum', category: 'cultural', svgComponent: 'drum', region: 'pan-india', similarTo: ['temple-bell', 'flute'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'prayer-beads', name: 'Prayer Beads', category: 'cultural', svgComponent: 'prayerBeads', region: 'pan-india', similarTo: ['garland'], similarityTier: 'high', difficultyWeight: 7 },
    { id: 'garland', name: 'Garland', category: 'cultural', svgComponent: 'garland', region: 'pan-india', similarTo: ['prayer-beads'], similarityTier: 'high', difficultyWeight: 7 },

    // ── TOOLS & WORK ──
    { id: 'sickle', name: 'Sickle', category: 'tools', svgComponent: 'sickle', region: 'pan-india', similarTo: ['hammer'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'hammer', name: 'Hammer', category: 'tools', svgComponent: 'hammer', region: 'pan-india', similarTo: ['sickle'], similarityTier: 'low', difficultyWeight: 2 },
    { id: 'plough', name: 'Plough', category: 'tools', svgComponent: 'plough', region: 'pan-india', similarTo: ['sickle'], similarityTier: 'low', difficultyWeight: 3 },
    { id: 'fishing-net', name: 'Fishing Net', category: 'tools', svgComponent: 'fishingNet', region: 'pan-india', similarTo: ['weaving-loom'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'weaving-loom', name: 'Weaving Loom', category: 'tools', svgComponent: 'weavingLoom', region: 'pan-india', similarTo: ['fishing-net', 'sewing-machine'], similarityTier: 'medium', difficultyWeight: 5 },
    { id: 'potters-wheel', name: 'Potter\'s Wheel', category: 'tools', svgComponent: 'pottersWheel', region: 'pan-india', similarTo: ['weaving-loom'], similarityTier: 'low', difficultyWeight: 3 },
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
    const eligible = IMAGE_CATALOG.filter(
        img => !previousTargetIds.includes(img.id) &&
            (img.region === region || img.region === 'pan-india')
    );

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
 * - Each distractor must be from the same category as at least one target
 * - Distractors must NOT be in the target set
 * - Similarity tier is controlled by the session difficulty
 * - Never repeat the exact same distractor set from previousDistractorIds
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

    // Prefer distractors matching the requested similarity tier
    const tieredCandidates = candidates.filter(img => img.similarityTier === similarity);

    // Use tiered first, then fall back to any candidate
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
        // Find which target this distractor is similar to
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
            encodingTimePerImage: 1500,
            fadeDuration: 400,
            retentionDuration: 5000,
            similarityLevel: 'low',
            gridColumns: 5,
            gridRows: 4,
        };
    } else if (sessionNumber <= 8) {
        return {
            targetCount: 10,
            distractorCount: 10,
            encodingTimePerImage: 1200,
            fadeDuration: 300,
            retentionDuration: 5000,
            similarityLevel: 'medium',
            gridColumns: 5,
            gridRows: 4,
        };
    } else if (sessionNumber <= 15) {
        return {
            targetCount: 11,
            distractorCount: 11,
            encodingTimePerImage: 1200,
            fadeDuration: 300,
            retentionDuration: 5000,
            similarityLevel: 'medium',
            gridColumns: 5,
            gridRows: 5,
        };
    } else {
        return {
            targetCount: 12,
            distractorCount: 12,
            encodingTimePerImage: 1000,
            fadeDuration: 250,
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
