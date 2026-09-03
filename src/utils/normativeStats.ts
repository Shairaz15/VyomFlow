
/**
 * Normative Data and Feedback Utility
 * Comparison ranges based on neuropsychological standards (approximate).
 */

type PerformanceCategory = 'Exceptional' | 'Above Average' | 'Average' | 'Below Average' | 'Needs Attention' | 'Fast';

interface FeedbackResult {
    category: PerformanceCategory;
    color: 'success' | 'primary' | 'warning' | 'danger' | 'neutral';
    message: string;
}

export const NORMATIVE_RANGES = {
    reaction: {
        youngMean: 245,
        oldMean: 330,
        // Lower is better (ms)
        thresholds: [
            { limit: 220, category: 'Exceptional', message: "Professional athlete speeds!" },
            { limit: 270, category: 'Above Average', message: "Sharper than most adults." },
            { limit: 330, category: 'Average', message: "Normal range for healthy adults." },
            { limit: 380, category: 'Below Average', message: "Slightly slower than typical." },
            { limit: 9999, category: 'Needs Attention', message: "Significantly delayed response." }
        ]
    },
    memory: {
        youngMean: 6.1,
        oldMean: 4.0,
        // Higher is better (count / 10)
        thresholds: [
            { limit: 8, category: 'Exceptional', message: "Outstanding short-term recall!" },
            { limit: 6, category: 'Above Average', message: "Better than average recall." },
            { limit: 4, category: 'Average', message: "Normal recall performance." },
            { limit: 2, category: 'Below Average', message: "Lower than typical range." },
            { limit: 0, category: 'Needs Attention', message: "Difficulty with short-term retention." }
        ]
    },
    pattern: {
        youngMean: 5.5,
        oldMean: 3.6,
        // Higher is better (Span Length)
        // Note: Level != Span exactly, but roughly Lvl 1=3, Lvl 3=4, Lvl 5=5, Lvl 7=6
        thresholds: [
            { limit: 6, category: 'Exceptional', message: "Superb visual working memory!" },
            { limit: 5, category: 'Above Average', message: "Strong pattern retention." },
            { limit: 3, category: 'Average', message: "Typical visual span capacity." },
            { limit: 2, category: 'Below Average', message: "Slightly reduced span." },
            { limit: 0, category: 'Needs Attention', message: "Difficulty retaining patterns." }
        ]
    },
    language: {
        // WPM (Higher is better within reason, >165 is fast)
        wpm: [
            { limit: 160, category: 'Fast', message: "Rapid speech rate." },
            { limit: 130, category: 'Average', message: "Normal conversational pace." },
            { limit: 100, category: 'Below Average', message: "Slower than typical speech." },
            { limit: 0, category: 'Needs Attention', message: "Very slow speech rate." }
        ],
        // Hesitation (Lower is better)
        hesitation: [
            { limit: 0.02, category: 'Exceptional', message: "Highly fluent speech." },
            { limit: 0.04, category: 'Average', message: "Normal hesitation frequency." },
            { limit: 0.07, category: 'Below Average', message: "Frequent pauses detected." },
            { limit: 1.0, category: 'Needs Attention', message: "Disrupted fluency." }
        ]
    },
    attention: {
        // d-prime based (Higher is better)
        youngMean: 3.2,
        oldMean: 2.1,
        thresholds: [
            { limit: 3.5, category: 'Exceptional', message: "Outstanding stimulus discrimination!" },
            { limit: 2.5, category: 'Above Average', message: "Strong attention and inhibition." },
            { limit: 1.5, category: 'Average', message: "Normal attention performance." },
            { limit: 0.8, category: 'Below Average', message: "Reduced ability to detect targets." },
            { limit: 0, category: 'Needs Attention', message: "Significant attention difficulties." }
        ]
    }
};

export function getReactionFeedback(ms: number): FeedbackResult {
    const ranges = NORMATIVE_RANGES.reaction.thresholds;
    for (const range of ranges) {
        if (ms <= range.limit) {
            return {
                category: range.category as PerformanceCategory,
                color: getCategoryColor(range.category as PerformanceCategory),
                message: range.message
            };
        }
    }
    return { category: 'Average', color: 'neutral', message: "Within normal limits." };
}

export function getMemoryFeedback(score: number): FeedbackResult {
    const ranges = NORMATIVE_RANGES.memory.thresholds;
    // Descending check for "higher is better" logic
    if (score >= ranges[0].limit) return formatResult(ranges[0]);
    if (score >= ranges[1].limit) return formatResult(ranges[1]);
    if (score >= ranges[2].limit) return formatResult(ranges[2]);
    if (score >= ranges[3].limit) return formatResult(ranges[3]);
    return formatResult(ranges[4]);
}

export function getPatternFeedback(spanOrLevel: number): FeedbackResult {
    // Map Level to Span roughly if needed, assume input is Span or close enough
    const ranges = NORMATIVE_RANGES.pattern.thresholds;
    if (spanOrLevel >= ranges[0].limit) return formatResult(ranges[0]);
    if (spanOrLevel >= ranges[1].limit) return formatResult(ranges[1]);
    if (spanOrLevel >= ranges[2].limit) return formatResult(ranges[2]);
    if (spanOrLevel >= ranges[3].limit) return formatResult(ranges[3]);
    return formatResult(ranges[4]);
}

export function getLanguageFeedback(wpm: number, hesitation: number): FeedbackResult {
    // Composite view or just WPM? User asked generically.
    // Let's prioritize Fluency (Hesitation) as it's a stronger marker

    // Check Hesitation first
    const hesRanges = NORMATIVE_RANGES.language.hesitation;
    let hesResult;
    for (const range of hesRanges) {
        if (hesitation <= range.limit) {
            hesResult = range;
            break;
        }
    }

    if (!hesResult) hesResult = hesRanges[hesRanges.length - 1];

    if (hesResult.category === 'Needs Attention' || hesResult.category === 'Below Average') {
        return {
            category: hesResult.category as PerformanceCategory,
            color: getCategoryColor(hesResult.category as PerformanceCategory),
            message: `Fluency: ${hesResult.message}`
        };
    }

    // If fluency is okay, check speed
    // WPM Logic: 
    // >160 Fast
    // >130 Avg
    // >100 Below 
    // <100 Needs Attention
    // Array: 160, 130, 100, 0
    let wpmCategory = 'Average';
    if (wpm >= 160) wpmCategory = 'Fast';
    else if (wpm >= 130) wpmCategory = 'Average';
    else if (wpm >= 100) wpmCategory = 'Below Average';
    else wpmCategory = 'Needs Attention';

    if (wpmCategory === 'Needs Attention') {
        return { category: 'Needs Attention', color: 'warning', message: "Speech rate is very slow." };
    }

    // Default to Hesitation result if both good
    return {
        category: hesResult.category as PerformanceCategory,
        color: getCategoryColor(hesResult.category as PerformanceCategory),
        message: hesResult.message
    };
}

export function getAttentionFeedback(dPrime: number): FeedbackResult {
    const ranges = NORMATIVE_RANGES.attention.thresholds;
    // Descending check: higher d-prime is better
    if (dPrime >= ranges[0].limit) return formatResult(ranges[0]);
    if (dPrime >= ranges[1].limit) return formatResult(ranges[1]);
    if (dPrime >= ranges[2].limit) return formatResult(ranges[2]);
    if (dPrime >= ranges[3].limit) return formatResult(ranges[3]);
    return formatResult(ranges[4]);
}

function formatResult(range: any): FeedbackResult {
    return {
        category: range.category,
        color: getCategoryColor(range.category),
        message: range.message
    };
}

function getCategoryColor(cat: PerformanceCategory): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' {
    switch (cat) {
        case 'Exceptional': return 'success';
        case 'Above Average': return 'primary';
        case 'Average': return 'neutral';
        case 'Fast': return 'neutral';
        case 'Below Average': return 'warning';
        case 'Needs Attention': return 'danger';
        default: return 'neutral';
    }
}
