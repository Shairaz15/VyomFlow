import type { InformationUnit, StoryMatchResult, UnitMatchDetail, Story } from "../../../types/storyTypes";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODELS = [
    'gemini-3.6-flash',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-pro-latest',
];

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

    if (tokensA.size === 0 && tokensB.size === 0) return 0.0;
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

    if (a.length === 0 || b.length === 0) return 0.0;
    if (a === b) return 1.0;

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
 * Calculates the length of the Longest Increasing Subsequence (LIS) in O(N log N)
 * Measures narrative timeline preservation without being overly punitive to single afterthoughts.
 */
export function calculateLISLength(arr: number[]): number {
    if (arr.length === 0) return 0;
    const tails: number[] = [];
    for (const x of arr) {
        let l = 0, r = tails.length;
        while (l < r) {
            const m = Math.floor((l + r) / 2);
            if (tails[m] < x) l = m + 1;
            else r = m;
        }
        if (l === tails.length) tails.push(x);
        else tails[l] = x;
    }
    return tails.length;
}

/**
 * Synchronous Information Unit Matching & Sequence Match Score
 * Implements Two-Tier Scoring (Gist 60% vs Verbatim 100%) and LIS Narrative Sequence
 */
export function matchStoryUnits(
    recalledText: string,
    englishTranslation: string | undefined,
    infoUnits: InformationUnit[]
): StoryMatchResult {
    const combinedText = `${recalledText} ${englishTranslation || ''}`.trim();
    const tokens = tokenize(combinedText);
    const tokenStr = tokens.join(' ');

    const infoUnitsMatched: string[] = [];
    const infoUnitsOmitted: string[] = [];
    const matchIndices: { unitId: string; index: number }[] = [];
    const unitDetails: Record<string, UnitMatchDetail> = {};

    const canonicalOrderMap = new Map<string, number>();
    infoUnits.forEach((u, i) => canonicalOrderMap.set(u.id, i));

    if (tokens.length > 0) {
        infoUnits.forEach(unit => {
            let matchedKwCount = 0;
            let firstIdx = tokenStr.length;

            unit.keywords.forEach(kw => {
                const cleanKw = kw.toLowerCase().trim();
                if (!cleanKw) return;

                const hasExact = tokens.includes(cleanKw);
                const hasSub = cleanKw.length >= 4 && tokens.some(t => t.length >= 4 && (t.includes(cleanKw) || cleanKw.includes(t)));

                if (hasExact || hasSub) {
                    matchedKwCount++;
                    const idx = tokenStr.indexOf(cleanKw);
                    if (idx !== -1 && idx < firstIdx) firstIdx = idx;
                }
            });

            // Two-Tier matching: If multiple keywords match, verbatim (1.0). If at least 1 keyword matches, gist (0.6).
            if (matchedKwCount > 0) {
                const isVerbatim = matchedKwCount >= Math.min(2, unit.keywords.length);
                const matchType: 'verbatim' | 'gist' = isVerbatim ? 'verbatim' : 'gist';
                const score = isVerbatim ? 1.0 : 0.6;

                infoUnitsMatched.push(unit.id);
                matchIndices.push({ unitId: unit.id, index: firstIdx });
                unitDetails[unit.id] = {
                    unitId: unit.id,
                    matchType,
                    score,
                };
            } else {
                infoUnitsOmitted.push(unit.id);
            }
        });
    } else {
        infoUnits.forEach(unit => infoUnitsOmitted.push(unit.id));
    }

    // Sequence Preservation via Longest Increasing Subsequence (LIS)
    const totalUnits = infoUnits.length;
    let sequenceMatchScore = 0.0;
    if (totalUnits > 0 && matchIndices.length > 0) {
        // Sort matched units by the order in which they were spoken
        const sortedBySpeech = [...matchIndices].sort((a, b) => a.index - b.index);
        const storyIndices = sortedBySpeech.map(m => canonicalOrderMap.get(m.unitId) ?? 0);

        const lisLen = calculateLISLength(storyIndices);
        const orderScore = lisLen / sortedBySpeech.length;
        const recallRatio = matchIndices.length / totalUnits;
        sequenceMatchScore = recallRatio * orderScore;
    }

    // Heuristic perseveration detection (repeated sentence fragments)
    let perseverationCount = 0;
    const sentences = combinedText.split(/[.?!।]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 10);
    const seenSentences = new Set<string>();
    sentences.forEach(s => {
        if (seenSentences.has(s)) perseverationCount++;
        else seenSentences.add(s);
    });

    const falseRecalls: string[] = [];
    const jaccard = tokens.length > 0 ? calculateJaccardSimilarity(recalledText, infoUnits.map(u => u.description).join(' ')) : 0.0;
    const levenshtein = tokens.length > 0 ? calculateLevenshteinSimilarity(recalledText, infoUnits.map(u => u.description).join(' ')) : 0.0;

    return {
        jaccardSimilarity: jaccard,
        levenshteinSimilarity: levenshtein,
        sequenceMatchScore,
        infoUnitsMatched,
        infoUnitsOmitted,
        falseRecalls,
        unitDetails,
        perseverationCount,
        evaluationSource: 'algorithmic'
    };
}

/**
 * Gemini-Powered Semantic Proposition Evaluator with Graceful Local Fallback
 * Analyzes conceptual gist, verbatim credit, timeline flow (LIS), confabulations/intrusions, and perseverations.
 */
export async function matchStoryUnitsAsync(
    recalledText: string,
    englishTranslation: string | undefined,
    story: Story
): Promise<StoryMatchResult> {
    const rawSpoken = (recalledText || "").trim();
    const translation = (englishTranslation || "").trim();
    const activeText = translation || rawSpoken;

    // Fast-path: Zero words spoken -> Instant 0% result without API overhead
    if (!activeText || tokenize(activeText).length === 0) {
        return matchStoryUnits(recalledText, englishTranslation, story.informationUnits);
    }

    // Check Gemini API Availability
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_')) {
        return matchStoryUnits(recalledText, englishTranslation, story.informationUnits);
    }

    const unitsListPrompt = story.informationUnits.map((u, idx) => 
        `ID: ${u.id} | Step: ${idx + 1} | Description: "${u.description}" | Keywords: [${u.keywords.join(', ')}] | Weight: ${u.weight}`
    ).join('\n');

    const systemPrompt = `You are a clinical neuropsychologist evaluating a patient's Story Recall test (Wechsler Memory Scale Logical Memory protocol).
Your task is to evaluate the patient's spoken recall against canonical Information Units.

For each unit:
- Determine if the patient recalled it:
  * "verbatim": specific facts/names/exact details recalled correctly (Score: 1.0)
  * "gist": the core conceptual plot point is remembered, even if paraphrased, using synonyms or different phrasing (Score: 0.6)
  * "missed": fact is completely omitted or contradicted (Score: 0.0)
- Extract any "intrusions" (confabulations): fabricated details or external statements not present in the original story.
- Detect "perseverations": facts or sentences repeated multiple times.

Respond ONLY with valid JSON in this exact structure:
{
  "unitMatches": [
    {
      "unitId": "string",
      "matchType": "verbatim" | "gist" | "missed",
      "score": 1.0 | 0.6 | 0.0,
      "evidence": "brief excerpt from patient transcript showing recall"
    }
  ],
  "intrusions": ["list of any made-up or outside details mentioned"],
  "perseverations": ["list of repeated assertions"]
}`;

    const userPrompt = `Original Story Reference (English):
"${story.englishReference}"

Canonical Information Units (in chronological order):
${unitsListPrompt}

Patient's Spoken Recall Transcript:
"${rawSpoken}"

Patient's English Translation (if multilingual):
"${translation}"

Evaluate the recall with clinical fairness.`;

    // Attempt cascading Gemini call with 7-second timeout
    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [{
                        role: 'user',
                        parts: [{ text: userPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        response_mime_type: "application/json",
                    },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawJson) {
                    const parsed = JSON.parse(rawJson);
                    const unitMatches = Array.isArray(parsed.unitMatches) ? parsed.unitMatches : [];
                    const intrusions = Array.isArray(parsed.intrusions) ? parsed.intrusions : [];
                    const perseverations = Array.isArray(parsed.perseverations) ? parsed.perseverations : [];

                    const infoUnitsMatched: string[] = [];
                    const infoUnitsOmitted: string[] = [];
                    const unitDetails: Record<string, UnitMatchDetail> = {};
                    const matchIndices: { unitId: string; index: number }[] = [];

                    const canonicalOrderMap = new Map<string, number>();
                    story.informationUnits.forEach((u, i) => canonicalOrderMap.set(u.id, i));

                    const lowerText = activeText.toLowerCase();

                    story.informationUnits.forEach(unit => {
                        const m = unitMatches.find((um: any) => um.unitId === unit.id);
                        if (m && (m.matchType === 'verbatim' || m.matchType === 'gist')) {
                            infoUnitsMatched.push(unit.id);
                            unitDetails[unit.id] = {
                                unitId: unit.id,
                                matchType: m.matchType,
                                score: m.score || (m.matchType === 'verbatim' ? 1.0 : 0.6),
                                evidence: m.evidence || '',
                            };

                            let idx = -1;
                            if (m.evidence) {
                                idx = lowerText.indexOf(m.evidence.toLowerCase().trim());
                            }
                            if (idx === -1) {
                                unit.keywords.forEach(kw => {
                                    const kwIdx = lowerText.indexOf(kw.toLowerCase().trim());
                                    if (kwIdx !== -1 && (idx === -1 || kwIdx < idx)) idx = kwIdx;
                                });
                            }
                            if (idx === -1) idx = lowerText.length;
                            matchIndices.push({ unitId: unit.id, index: idx });
                        } else {
                            infoUnitsOmitted.push(unit.id);
                        }
                    });

                    // Compute LIS sequence score from Gemini-matched units
                    const totalUnits = story.informationUnits.length;
                    let sequenceMatchScore = 0.0;
                    if (totalUnits > 0 && matchIndices.length > 0) {
                        const sortedBySpeech = [...matchIndices].sort((a, b) => a.index - b.index);
                        const storyIndices = sortedBySpeech.map(m => canonicalOrderMap.get(m.unitId) ?? 0);
                        const lisLen = calculateLISLength(storyIndices);
                        const orderScore = lisLen / sortedBySpeech.length;
                        const recallRatio = matchIndices.length / totalUnits;
                        sequenceMatchScore = recallRatio * orderScore;
                    }

                    const jaccard = calculateJaccardSimilarity(rawSpoken, story.informationUnits.map(u => u.description).join(' '));
                    const levenshtein = calculateLevenshteinSimilarity(rawSpoken, story.informationUnits.map(u => u.description).join(' '));

                    return {
                        jaccardSimilarity: jaccard,
                        levenshteinSimilarity: levenshtein,
                        sequenceMatchScore,
                        infoUnitsMatched,
                        infoUnitsOmitted,
                        falseRecalls: intrusions,
                        unitDetails,
                        perseverationCount: perseverations.length,
                        evaluationSource: 'gemini'
                    };
                }
            }
        } catch {
            // Try next model or fall back to local algorithmic matcher
        }
    }

    // Graceful fallback to algorithmic matcher
    return matchStoryUnits(recalledText, englishTranslation, story.informationUnits);
}
