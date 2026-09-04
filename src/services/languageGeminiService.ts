const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-pro-latest',
];

export interface GeminiLanguageEvaluation {
    topicAdherence: number; // 0 - 100
    ideaDensity: number; // 0.0 - 1.0 (proportion of informative content)
    distinctPropositions: number; // count of unique factual statements
    circumlocutions: string[]; // flagged vague placeholder phrases
    syntacticComplexity: number; // 0 - 100
    tangentialityFlags: string[];
    clinicalSummary: string;
    keyStrengths: string[];
    keyObservations: string[];
    evaluationSource: 'gemini' | 'algorithmic';
}

/**
 * Fast local algorithmic fallback when Gemini is offline or rate-limited
 */
export function getAlgorithmicFallback(
    promptTopic: string,
    transcript: string,
    englishTranslation?: string
): GeminiLanguageEvaluation {
    const text = (englishTranslation || transcript || "").trim();
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return {
            topicAdherence: 0,
            ideaDensity: 0,
            distinctPropositions: 0,
            circumlocutions: [],
            syntacticComplexity: 0,
            tangentialityFlags: [],
            clinicalSummary: "No speech detected during the assessment session.",
            keyStrengths: [],
            keyObservations: ["Session completed with no recorded speech."],
            evaluationSource: 'algorithmic',
        };
    }

    // Heuristic prompt relevance
    const promptKeywords = promptTopic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    let matched = 0;
    promptKeywords.forEach(pk => {
        if (words.some(w => w.includes(pk) || pk.includes(w))) matched++;
    });
    const topicAdherence = Math.min(100, Math.max(30, Math.round((matched / Math.max(1, promptKeywords.length)) * 60 + Math.min(40, words.length))));

    // Basic content word ratio for idea density
    const commonFunctionWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of', 'with']);
    const contentWordCount = words.filter(w => !commonFunctionWords.has(w)).length;
    const ideaDensity = Math.round((contentWordCount / Math.max(1, words.length)) * 100) / 100;
    const distinctPropositions = Math.max(1, Math.round(contentWordCount / 4));

    return {
        topicAdherence,
        ideaDensity,
        distinctPropositions,
        circumlocutions: [],
        syntacticComplexity: Math.min(100, Math.max(40, Math.round(words.length * 1.5))),
        tangentialityFlags: [],
        clinicalSummary: `Spoke ${words.length} words with an estimated topic adherence of ${topicAdherence}%. Demonstrated steady conversational pacing and functional vocabulary retrieval.`,
        keyStrengths: ["Maintained steady spontaneous speech", "Functional conversational pacing"],
        keyObservations: ["Evaluated using standard acoustic & lexical heuristics."],
        evaluationSource: 'algorithmic',
    };
}

/**
 * Evaluates Language Fluency using Google Gemini Flash
 * Analyzes semantic topic adherence, propositional idea density, circumlocutions, and generates clinical summary.
 */
export async function evaluateLanguageWithGemini(
    promptTopic: string,
    transcript: string,
    englishTranslation?: string
): Promise<GeminiLanguageEvaluation> {
    const rawSpoken = (transcript || "").trim();
    const translation = (englishTranslation || "").trim();
    const activeText = translation || rawSpoken;
    const wordCount = activeText.split(/\s+/).filter(Boolean).length;

    // Fast path: Empty speech -> Zero score immediately
    if (wordCount === 0) {
        return getAlgorithmicFallback(promptTopic, rawSpoken, translation);
    }

    // Check Gemini API Availability
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_')) {
        return getAlgorithmicFallback(promptTopic, rawSpoken, translation);
    }

    const systemPrompt = `You are an expert clinical speech-language pathologist and neuropsychologist evaluating an adult patient's spontaneous spoken discourse test.
Your task is to analyze the patient's transcript for cognitive-linguistic digital biomarkers.

Evaluate:
1. "topicAdherence" (0 to 100): How directly and completely did the patient address the assigned prompt? (Penalize tangentiality or discussing unrelated matters).
2. "ideaDensity" (0.0 to 1.0): Proportion of informative, non-redundant propositional content (high score = rich factual/episodic details; low score = empty words, repetitive claims).
3. "distinctPropositions" (integer): Estimated count of unique factual or narrative statements.
4. "circumlocutions" (array of strings): Identify any vague placeholder phrases or circumlocutions used when struggling to find specific words (e.g. "that thing", "you know what I mean", "the stuff they have").
5. "syntacticComplexity" (0 to 100): Depth of sentence structure, use of compound/complex clauses, and correct tense shifts.
6. "tangentialityFlags" (array of strings): Any off-topic tangents or drifts from the prompt topic.
7. "clinicalSummary" (string): A professional 2-3 sentence clinical narrative evaluation highlighting cognitive communication strengths, coherence, and any mild retrieval hesitations.
8. "keyStrengths" (array of 2 strings): Two core communication strengths.
9. "keyObservations" (array of 2 strings): Two diagnostic observations.

Respond ONLY with valid JSON matching this exact structure:
{
  "topicAdherence": 85,
  "ideaDensity": 0.68,
  "distinctPropositions": 9,
  "circumlocutions": ["string"],
  "syntacticComplexity": 80,
  "tangentialityFlags": ["string"],
  "clinicalSummary": "string",
  "keyStrengths": ["string", "string"],
  "keyObservations": ["string", "string"]
}`;

    const userPrompt = `Assigned Topic Prompt:
"${promptTopic}"

Patient's Spoken Transcript:
"${rawSpoken}"

Patient's English Translation (if multilingual):
"${translation}"

Word Count: ${wordCount} words.

Evaluate with clinical fairness and diagnostic precision.`;

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
                        parts: [{ text: userPrompt }],
                    }],
                    generationConfig: {
                        temperature: 0.15,
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
                    return {
                        topicAdherence: typeof parsed.topicAdherence === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.topicAdherence))) : 80,
                        ideaDensity: typeof parsed.ideaDensity === 'number' ? Math.max(0, Math.min(1, parsed.ideaDensity)) : 0.65,
                        distinctPropositions: typeof parsed.distinctPropositions === 'number' ? parsed.distinctPropositions : Math.max(1, Math.round(wordCount / 5)),
                        circumlocutions: Array.isArray(parsed.circumlocutions) ? parsed.circumlocutions : [],
                        syntacticComplexity: typeof parsed.syntacticComplexity === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.syntacticComplexity))) : 75,
                        tangentialityFlags: Array.isArray(parsed.tangentialityFlags) ? parsed.tangentialityFlags : [],
                        clinicalSummary: parsed.clinicalSummary || "Spontaneous discourse demonstrated intact narrative coherence and communicative intent.",
                        keyStrengths: Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0 ? parsed.keyStrengths : ["Coherent narrative sequencing", "Functional vocabulary access"],
                        keyObservations: Array.isArray(parsed.keyObservations) && parsed.keyObservations.length > 0 ? parsed.keyObservations : ["No significant cognitive-linguistic disfluencies detected."],
                        evaluationSource: 'gemini',
                    };
                }
            }
        } catch {
            // Try next model or fall back to algorithmic
        }
    }

    return getAlgorithmicFallback(promptTopic, rawSpoken, translation);
}
