/**
 * ==========================================================================
 * ReactionTutorialPlayer.tsx
 * ==========================================================================
 * Multilingual interactive video tutorial player for the Reaction Time test.
 * Features:
 * - 11 authentic localized audio video tracks (Hindi, English, Kannada, Tamil,
 *   Telugu, Malayalam, Marathi, Bengali, Gujarati, Urdu, Nepali).
 * - Auto-detects and synchronizes with the active application language.
 * - Interactive in-player language switcher dropdown.
 * - Glassmorphic design conforming to VyomFlow dark & light modes.
 */

import React, { useState, useEffect, useRef } from "react";
import { Globe, Volume2 } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import {
    getSupabaseTutorialVideoUrl,
    getLocalTutorialVideoUrl,
} from "../../../services/tutorialVideoService";
import "./ReactionTutorialPlayer.css";

export interface TutorialLanguageOption {
    code: string;
    name: string;
    nativeName: string;
    suffix: string;
    videoUrl: string;
}

export const REACTION_TUTORIAL_LANGUAGES: TutorialLanguageOption[] = [
    {
        code: "hi",
        name: "Hindi",
        nativeName: "हिन्दी",
        suffix: "hindi",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "hindi"),
    },
    {
        code: "en",
        name: "English (Indian)",
        nativeName: "English",
        suffix: "english_indian",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "english_indian"),
    },
    {
        code: "kn",
        name: "Kannada",
        nativeName: "ಕನ್ನಡ",
        suffix: "kannada",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "kannada"),
    },
    {
        code: "ta",
        name: "Tamil",
        nativeName: "தமிழ்",
        suffix: "tamil",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "tamil"),
    },
    {
        code: "te",
        name: "Telugu",
        nativeName: "తెలుగు",
        suffix: "telugu",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "telugu"),
    },
    {
        code: "ml",
        name: "Malayalam",
        nativeName: "മലയാളം",
        suffix: "malayalam",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "malayalam"),
    },
    {
        code: "mr",
        name: "Marathi",
        nativeName: "मराठी",
        suffix: "marathi",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "marathi"),
    },
    {
        code: "bn",
        name: "Bengali",
        nativeName: "বাংলা",
        suffix: "bengali",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "bengali"),
    },
    {
        code: "gu",
        name: "Gujarati",
        nativeName: "ગુજરાતી",
        suffix: "gujarati",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "gujarati"),
    },
    {
        code: "ur",
        name: "Urdu",
        nativeName: "اردو",
        suffix: "urdu",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "urdu"),
    },
    {
        code: "ne",
        name: "Nepali",
        nativeName: "नेपाली",
        suffix: "nepali",
        videoUrl: getSupabaseTutorialVideoUrl("reaction", "reaction_tutorial", "nepali"),
    },
];

interface ReactionTutorialPlayerProps {
    className?: string;
}

export const ReactionTutorialPlayer: React.FC<ReactionTutorialPlayerProps> = ({
    className = "",
}) => {
    const { locale, t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    // Clean title without raw translation key
    const rawTitle = t("tutorialVideo");
    const titleText = rawTitle && rawTitle !== "tutorialVideo" ? rawTitle : "Tutorial Video";

    // Find best match for current app locale, default to English
    const getInitialLanguageCode = (currentLocale: string): string => {
        const match = REACTION_TUTORIAL_LANGUAGES.find(
            (lang) => lang.code === currentLocale
        );
        return match ? match.code : "en";
    };

    const [selectedLangCode, setSelectedLangCode] = useState<string>(() =>
        getInitialLanguageCode(locale)
    );

    // Sync if user switches app language from header/settings
    useEffect(() => {
        const matched = REACTION_TUTORIAL_LANGUAGES.find((lang) => lang.code === locale);
        if (matched) {
            setSelectedLangCode(matched.code);
        }
    }, [locale]);

    const activeLanguage =
        REACTION_TUTORIAL_LANGUAGES.find((lang) => lang.code === selectedLangCode) ||
        REACTION_TUTORIAL_LANGUAGES[1]; // fallback to English

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setSelectedLangCode(newCode);

        // When switching language, maintain current play position if possible
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const wasPlaying = !videoRef.current.paused;
            videoRef.current.src =
                REACTION_TUTORIAL_LANGUAGES.find((l) => l.code === newCode)?.videoUrl ||
                activeLanguage.videoUrl;
            videoRef.current.currentTime = currentTime;
            if (wasPlaying) {
                videoRef.current.play().catch(() => {});
            }
        }
    };

    return (
        <div className={`reaction-tutorial-container ${className}`}>
            <div className="reaction-tutorial-card">
                {/* Header: Clean Title & Constrained Language Selector */}
                <div className="reaction-tutorial-header">
                    <h3 className="reaction-tutorial-title vyom-serif">
                        {titleText}
                    </h3>

                    <div
                        className="reaction-tutorial-lang-picker"
                        title="Select tutorial video language"
                    >
                        <Globe size={14} className="reaction-tutorial-globe-icon" aria-hidden="true" />
                        <select
                            id="reaction-tutorial-language-select"
                            className="reaction-tutorial-select"
                            value={selectedLangCode}
                            onChange={handleLanguageChange}
                            aria-label="Select tutorial video language"
                        >
                            {REACTION_TUTORIAL_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.nativeName} ({lang.name})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Video Stage */}
                <div className="reaction-tutorial-video-wrapper">
                    <video
                        ref={videoRef}
                        className="reaction-tutorial-video-element"
                        src={activeLanguage.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                            const target = e.currentTarget;
                            const localFallback = getLocalTutorialVideoUrl("reaction", "reaction_tutorial", activeLanguage.suffix);
                            const resolvedLocal = window.location.origin + localFallback;
                            if (target.src !== resolvedLocal && target.src !== localFallback) {
                                console.warn(`[ReactionTutorial] Supabase CDN fallback -> ${localFallback}`);
                                target.src = localFallback;
                                target.load();
                            }
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        title={`Reaction Test Tutorial in ${activeLanguage.name}`}
                    >
                        Your browser does not support the video tag.
                    </video>

                    {/* Audio Badge Overlay */}
                    <div
                        className={`reaction-tutorial-audio-badge ${
                            isPlaying ? "hide-while-playing" : ""
                        }`}
                    >
                        <span className="reaction-tutorial-pulse-dot" />
                        <Volume2 size={12} className="reaction-tutorial-audio-icon" aria-hidden="true" />
                        <span>
                            {activeLanguage.nativeName} ({activeLanguage.name})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReactionTutorialPlayer;
