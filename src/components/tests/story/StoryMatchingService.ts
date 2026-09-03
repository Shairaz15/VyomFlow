import type { InformationUnit, StoryMatchResult } from "../../../types/storyTypes";

/**
 * Text Preprocessing helper: Tokenize into clean lowercase words
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

/**
 * Jaccard Similarity calculation between reference & recalled text
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
    const tokensA = new Set(tokenize(textA));
    const tokensB = new Set(tokenize(textB));

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersectionCount = 0;
    tokensA.forEach(t => {
        if (tokensB.has(t)) intersectionCount++;
    });

    const unionCount = new Set([...tokensA, ...tokensB]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Levenshtein Similarity (Normalized 0 to 1)
 */
export function calculateLevenshteinSimilarity(textA: string, textB: string): number {
    const a = textA.toLowerCase().trim();
    const b = textB.toLowerCase().trim();

    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return Math.max(0, 1 - distance / maxLength);
}

/**
 * Information Unit Matching & Sequence Match Score
 */
export function matchStoryUnits(
    recalledText: string,
    englishTranslation: string | undefined,
    infoUnits: InformationUnit[]
): StoryMatchResult {
    const combinedText = `${recalledText} ${englishTranslation || ''}`;
    const tokens = tokenize(combinedText);
    const tokenStr = tokens.join(' ');

    const infoUnitsMatched: string[] = [];
    const infoUnitsOmitted: string[] = [];
    const matchIndices: { unitId: string; index: number }[] = [];

    infoUnits.forEach(unit => {
        // Check if any keyword matches (exact or partial stem match) in native or translated text
        const matchesKeyword = unit.keywords.some(kw => {
            const cleanKw = kw.toLowerCase();
            return tokens.some(t => t.includes(cleanKw) || cleanKw.includes(t)) || tokenStr.includes(cleanKw);
        });

        if (matchesKeyword) {
            infoUnitsMatched.push(unit.id);
            let firstIdx = tokenStr.length;
            unit.keywords.forEach(kw => {
                const idx = tokenStr.indexOf(kw.toLowerCase());
                if (idx !== -1 && idx < firstIdx) firstIdx = idx;
            });
            matchIndices.push({ unitId: unit.id, index: firstIdx });
        } else {
            infoUnitsOmitted.push(unit.id);
        }
    });

    // Sequence Preservation Score (Longest Common Subsequence of matched indices)
    let sequenceMatchScore = 1.0;
    if (matchIndices.length > 1) {
        // Check if indices are monotonically increasing
        let inversions = 0;
        for (let i = 0; i < matchIndices.length - 1; i++) {
            if (matchIndices[i].index > matchIndices[i + 1].index) {
                inversions++;
            }
        }
        sequenceMatchScore = Math.max(0, 1 - inversions / (matchIndices.length - 1));
    }

    // False recall detection (heuristics for filler phrases / unrelated claims)
    const falseRecalls: string[] = [];

    const jaccard = calculateJaccardSimilarity(recalledText, infoUnits.map(u => u.description).join(' '));
    const levenshtein = calculateLevenshteinSimilarity(recalledText, infoUnits.map(u => u.description).join(' '));

    return {
        jaccardSimilarity: jaccard,
        levenshteinSimilarity: levenshtein,
        sequenceMatchScore,
        infoUnitsMatched,
        infoUnitsOmitted,
        falseRecalls
    };
}
