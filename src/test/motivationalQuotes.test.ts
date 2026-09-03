import { describe, it, expect } from "vitest";
import {
    MOTIVATIONAL_QUOTES,
    getMotivationalQuote,
    isLowScore,
} from "../data/motivationalQuotes";

describe("Motivational Quotes Module", () => {
    it("should contain curated quotes with non-empty text and author", () => {
        expect(MOTIVATIONAL_QUOTES.length).toBeGreaterThan(0);
        for (const q of MOTIVATIONAL_QUOTES) {
            expect(q.id).toBeTruthy();
            expect(q.text.length).toBeGreaterThan(10);
            expect(q.author.length).toBeGreaterThan(0);
        }
    });

    it("should contain STRICTLY ZERO emojis across all quotes and metadata", () => {
        // Emoji regex covering standard unicode emoji ranges
        const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

        for (const q of MOTIVATIONAL_QUOTES) {
            expect(emojiRegex.test(q.text)).toBe(false);
            expect(emojiRegex.test(q.author)).toBe(false);
            if (q.sourceOrTheme) {
                expect(emojiRegex.test(q.sourceOrTheme)).toBe(false);
            }
        }
    });

    it("should correctly identify low score threshold conditions", () => {
        // Categories that must trigger
        expect(isLowScore({ category: "Needs Attention" })).toBe(true);
        expect(isLowScore({ category: "Below Average" })).toBe(true);
        expect(isLowScore({ category: "Attention Advised" })).toBe(true);
        expect(isLowScore({ category: "possible_risk" })).toBe(true);

        // Star rating thresholds
        expect(isLowScore({ starRating: 1 })).toBe(true);
        expect(isLowScore({ starRating: 2 })).toBe(true);
        expect(isLowScore({ starRating: 3 })).toBe(false);
        expect(isLowScore({ starRating: 5 })).toBe(false);

        // Numerical score thresholds (< 60)
        expect(isLowScore({ score: 45 })).toBe(true);
        expect(isLowScore({ score: 59 })).toBe(true);
        expect(isLowScore({ score: 60 })).toBe(false);
        expect(isLowScore({ score: 85 })).toBe(false);

        // High performance categories that should NOT trigger
        expect(isLowScore({ category: "Exceptional", score: 95, starRating: 5 })).toBe(false);
        expect(isLowScore({ category: "Above Average", score: 80, starRating: 4 })).toBe(false);
        expect(isLowScore({ category: "Average", score: 70, starRating: 3 })).toBe(false);
    });

    it("should return consistent deterministic quotes when given a seed", () => {
        const quoteA = getMotivationalQuote("session-123");
        const quoteB = getMotivationalQuote("session-123");
        expect(quoteA.id).toBe(quoteB.id);
        expect(quoteA.text).toBe(quoteB.text);
    });
});
