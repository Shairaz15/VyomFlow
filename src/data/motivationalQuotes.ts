/**
 * Motivational Quotes Data & Utilities
 * 
 * Curated growth-mindset and perseverance quotes designed to encourage participants
 * when receiving lower cognitive assessment scores.
 * 
 * Strictly no emojis used.
 */

export interface MotivationalQuote {
    id: string;
    text: string;
    author: string;
    sourceOrTheme?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
    {
        id: "neuroplasticity-muscle",
        text: "The brain adapts and strengthens with every challenge. Cognitive fitness is a practice, not a fixed state.",
        author: "Neuroscience Principle",
        sourceOrTheme: "Neuroplasticity",
    },
    {
        id: "small-improvements",
        text: "Small daily steps over time lead to meaningful resilience and lasting progress.",
        author: "Robin Sharma",
        sourceOrTheme: "Growth Mindset",
    },
    {
        id: "courage-to-continue",
        text: "Success is not final, setbacks are not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        sourceOrTheme: "Perseverance",
    },
    {
        id: "rising-every-time",
        text: "The greatest strength lies not in never falling, but in rising every time we face a hurdle.",
        author: "Ralph Waldo Emerson",
        sourceOrTheme: "Resilience",
    },
    {
        id: "practice-not-perfection",
        text: "Progress is built on regular practice, not perfection. Every session trains your focus.",
        author: "Cognitive Health Axiom",
        sourceOrTheme: "Habit & Focus",
    },
    {
        id: "slow-and-steady",
        text: "It does not matter how slowly you go, as long as you do not stop.",
        author: "Confucius",
        sourceOrTheme: "Consistency",
    },
    {
        id: "get-back-up",
        text: "Do not measure progress by ease, but by how steadfastly you engage with each new attempt.",
        author: "Nelson Mandela",
        sourceOrTheme: "Determination",
    },
    {
        id: "series-of-small-things",
        text: "Great outcomes are achieved not by a single sprint, but by a series of steady efforts brought together.",
        author: "Vincent van Gogh",
        sourceOrTheme: "Patience",
    },
    {
        id: "lifelong-learning",
        text: "Your mind retains the capacity to learn, adapt, and reinforce neural pathways at every stage of life.",
        author: "Cognitive Wellness Research",
        sourceOrTheme: "Neuroplasticity",
    },
    {
        id: "mastery-journey",
        text: "Every expert was once a beginner. Consistency across time is the foundation of sharp cognition.",
        author: "Helen Hayes",
        sourceOrTheme: "Learning Curve",
    },
];

/**
 * Standardized helper to determine if a performance score meets the threshold for a low score.
 */
export function isLowScore(params: {
    category?: string | null;
    score?: number | null;
    starRating?: number | null;
}): boolean {
    const { category, score, starRating } = params;

    // Check performance category string
    if (category) {
        const normalized = category.toLowerCase().trim();
        if (
            normalized.includes("needs attention") ||
            normalized.includes("below average") ||
            normalized.includes("attention advised") ||
            normalized.includes("possible_risk") ||
            normalized.includes("high risk") ||
            normalized.includes("impaired") ||
            normalized.includes("slow") ||
            normalized.includes("delayed")
        ) {
            return true;
        }
    }

    // Check star rating (<= 2 stars out of 5)
    if (typeof starRating === "number" && starRating > 0 && starRating <= 2) {
        return true;
    }

    // Check numerical percentage or composite score (< 60%)
    if (typeof score === "number" && score < 60) {
        return true;
    }

    return false;
}

/**
 * Returns a motivational quote, selecting either randomly or deterministically by index/seed.
 */
export function getMotivationalQuote(seed?: number | string): MotivationalQuote {
    if (MOTIVATIONAL_QUOTES.length === 0) {
        return {
            id: "fallback",
            text: "Every session is a positive step toward cognitive awareness and growth.",
            author: "VyomFlow",
            sourceOrTheme: "Awareness",
        };
    }

    if (seed !== undefined) {
        let numericSeed = 0;
        if (typeof seed === "number") {
            numericSeed = Math.abs(Math.floor(seed));
        } else {
            for (let i = 0; i < seed.length; i++) {
                numericSeed = (numericSeed << 5) - numericSeed + seed.charCodeAt(i);
                numericSeed |= 0;
            }
            numericSeed = Math.abs(numericSeed);
        }
        return MOTIVATIONAL_QUOTES[numericSeed % MOTIVATIONAL_QUOTES.length];
    }

    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
}
