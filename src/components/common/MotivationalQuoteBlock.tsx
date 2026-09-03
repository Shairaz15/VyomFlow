import { useMemo } from "react";
import {
    getMotivationalQuote,
    isLowScore,
    type MotivationalQuote,
} from "../../data/motivationalQuotes";
import { useLanguage } from "../../i18n/LanguageContext";
import "./MotivationalQuoteBlock.css";

export interface MotivationalQuoteBlockProps {
    /** Optional test score (0-100 or raw) */
    score?: number | null;
    /** Optional performance category string (e.g. 'Below Average', 'Needs Attention') */
    category?: string | null;
    /** Optional star rating (1-5) */
    starRating?: number | null;
    /** Optional explicit quote to display */
    quote?: MotivationalQuote;
    /** If true, renders unconditionally regardless of score threshold */
    forceShow?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Optional custom supportive message */
    subtext?: string;
}

export function MotivationalQuoteBlock({
    score,
    category,
    starRating,
    quote,
    forceShow = false,
    className = "",
    subtext,
}: MotivationalQuoteBlockProps) {
    const { t } = useLanguage();

    const shouldDisplay = useMemo(() => {
        if (forceShow) return true;
        return isLowScore({ category, score, starRating });
    }, [forceShow, category, score, starRating]);

    const activeQuote = useMemo(() => {
        if (quote) return quote;
        const seed = score ?? (category ? category.length : undefined);
        return getMotivationalQuote(seed);
    }, [quote, score, category]);

    if (!shouldDisplay) {
        return null;
    }

    return (
        <aside
            className={`motivational-quote-block ${className}`}
            role="note"
            aria-label="Encouragement note"
        >
            <div className="quote-block-header">
                <div className="quote-icon-badge" aria-hidden="true">
                    <svg
                        className="quote-svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 7 4 10 7 10z" />
                        <path d="M15 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 7 4 10 7 10z" />
                    </svg>
                </div>
                <span className="quote-tag">{t("motivation.tag") || "Words of Encouragement"}</span>
            </div>

            <blockquote className="quote-text">
                &ldquo;{activeQuote.text}&rdquo;
            </blockquote>

            <div className="quote-footer">
                <cite className="quote-author">&mdash; {activeQuote.author}</cite>
                <p className="quote-subtext">
                    {subtext || t("motivation.subtext") || "Cognitive scores fluctuate daily. Regular practice fosters neuroplasticity and long-term resilience."}
                </p>
            </div>
        </aside>
    );
}
