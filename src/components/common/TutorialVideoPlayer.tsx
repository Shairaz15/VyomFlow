/**
 * ==========================================================================
 * TutorialVideoPlayer.tsx
 * ==========================================================================
 * Reusable multilingual interactive video tutorial player supporting all 7
 * VyomFlow cognitive assessment modules:
 * - reaction (Reaction Time)
 * - attention (Sustained Attention & Vigilance)
 * - language (Multilingual Language Fluency)
 * - navigation (Video Navigation & Spatial Memory)
 * - pattern (Pattern Working Memory)
 * - story (Story Narration Recall)
 * - visual_memory / vmra (Visual Memory Recall Assessment)
 *
 * Features:
 * - 11 authentic localized language tracks.
 * - Original authentic English recordings for English.
 * - Auto-detects and synchronizes with active application language.
 * - Clean header without logos or emojis; compact language picker.
 * - Responsive glassmorphic card matching light and dark themes.
 */

import React, { useState, useEffect, useRef } from "react";
import { Globe, Volume2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
    getSupabaseTutorialVideoUrl,
    getLocalTutorialVideoUrl,
} from "../../services/tutorialVideoService";
import "./TutorialVideoPlayer.css";

export type AssessmentModuleType =
    | "reaction"
    | "attention"
    | "language"
    | "navigation"
    | "pattern"
    | "story"
    | "visual_memory"
    | "vmra";

export interface TutorialLanguageOption {
    code: string;
    name: string;
    nativeName: string;
    suffix: string;
}

export const TUTORIAL_LANGUAGES: TutorialLanguageOption[] = [
    { code: "en", name: "English (Indian)", nativeName: "English", suffix: "english_indian" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", suffix: "hindi" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", suffix: "kannada" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", suffix: "tamil" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", suffix: "telugu" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", suffix: "malayalam" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", suffix: "marathi" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", suffix: "bengali" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", suffix: "gujarati" },
    { code: "ur", name: "Urdu", nativeName: "اردو", suffix: "urdu" },
    { code: "ne", name: "Nepali", nativeName: "नेपाली", suffix: "nepali" },
];

export const MODULE_TUTORIAL_MAP: Record<
    string,
    { folder: string; prefix: string; defaultTitle: string }
> = {
    reaction: {
        folder: "reaction",
        prefix: "reaction_tutorial",
        defaultTitle: "Tutorial Video",
    },
    attention: {
        folder: "sustained_attention",
        prefix: "attention_tutorial",
        defaultTitle: "Tutorial Video",
    },
    language: {
        folder: "language_fluency",
        prefix: "language_tutorial",
        defaultTitle: "Tutorial Video",
    },
    navigation: {
        folder: "video_navigation",
        prefix: "navigation_tutorial",
        defaultTitle: "Tutorial Video",
    },
    pattern: {
        folder: "pattern_memory",
        prefix: "pattern_tutorial",
        defaultTitle: "Tutorial Video",
    },
    story: {
        folder: "story_recall",
        prefix: "story_tutorial",
        defaultTitle: "Tutorial Video",
    },
    visual_memory: {
        folder: "visual_memory",
        prefix: "visual_memory_tutorial",
        defaultTitle: "Tutorial Video",
    },
    vmra: {
        folder: "visual_memory",
        prefix: "visual_memory_tutorial",
        defaultTitle: "Tutorial Video",
    },
};

export interface TutorialVideoPlayerProps {
    module?: AssessmentModuleType;
    title?: string;
    className?: string;
}

export const TutorialVideoPlayer: React.FC<TutorialVideoPlayerProps> = ({
    module,
    title,
    className = "",
}) => {
    const { locale, t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    // Auto-detect module from window.location if not explicitly passed
    const resolvedModuleKey: string = (() => {
        if (module) return module;
        if (typeof window !== "undefined") {
            const path = window.location.pathname.toLowerCase();
            if (path.includes("attention") || path.includes("savt")) return "attention";
            if (path.includes("language")) return "language";
            if (path.includes("navigation")) return "navigation";
            if (path.includes("pattern")) return "pattern";
            if (path.includes("story")) return "story";
            if (path.includes("vmra") || path.includes("memory")) return "visual_memory";
            if (path.includes("reaction")) return "reaction";
        }
        return "reaction";
    })();

    const config = MODULE_TUTORIAL_MAP[resolvedModuleKey] || MODULE_TUTORIAL_MAP.reaction;

    // Clean title without raw translation key
    const rawTitle = title || t("tutorialVideo");
    const titleText =
        rawTitle && rawTitle !== "tutorialVideo" ? rawTitle : config.defaultTitle;

    // Find best match for current app locale, default to English
    const getInitialLanguageCode = (currentLocale: string): string => {
        const match = TUTORIAL_LANGUAGES.find((lang) => lang.code === currentLocale);
        return match ? match.code : "en";
    };

    const [selectedLangCode, setSelectedLangCode] = useState<string>(() =>
        getInitialLanguageCode(locale)
    );

    // Sync if user switches app language
    useEffect(() => {
        const matched = TUTORIAL_LANGUAGES.find((lang) => lang.code === locale);
        if (matched) {
            setSelectedLangCode(matched.code);
        }
    }, [locale]);

    const activeLanguage =
        TUTORIAL_LANGUAGES.find((lang) => lang.code === selectedLangCode) ||
        TUTORIAL_LANGUAGES[0]; // fallback to English

    const activeVideoUrl = getSupabaseTutorialVideoUrl(
        config.folder,
        config.prefix,
        activeLanguage.suffix
    );

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setSelectedLangCode(newCode);

        const newLang = TUTORIAL_LANGUAGES.find((l) => l.code === newCode);
        if (newLang && videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const wasPlaying = !videoRef.current.paused;
            const nextUrl = getSupabaseTutorialVideoUrl(
                config.folder,
                config.prefix,
                newLang.suffix
            );
            videoRef.current.src = nextUrl;
            videoRef.current.currentTime = currentTime;
            if (wasPlaying) {
                videoRef.current.play().catch(() => {});
            }
        }
    };

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const target = e.currentTarget;
        const localFallback = getLocalTutorialVideoUrl(
            config.folder,
            config.prefix,
            activeLanguage.suffix
        );
        const resolvedLocal = window.location.origin + localFallback;
        if (target.src !== resolvedLocal && target.src !== localFallback) {
            console.warn(`[TutorialVideoPlayer] Supabase CDN video load fallback triggered -> ${localFallback}`);
            target.src = localFallback;
            target.load();
        }
    };

    return (
        <div className={`tutorial-video-container ${className}`}>
            <div className="tutorial-video-card">
                {/* Header: Clean Title & Constrained Language Selector */}
                <div className="tutorial-video-header">
                    <h3 className="tutorial-video-title vyom-serif">
                        {titleText}
                    </h3>

                    <div
                        className="tutorial-video-lang-picker"
                        title="Select tutorial video language"
                    >
                        <Globe size={14} className="tutorial-video-globe-icon" aria-hidden="true" />
                        <select
                            id={`tutorial-lang-select-${resolvedModuleKey}`}
                            className="tutorial-video-select"
                            value={selectedLangCode}
                            onChange={handleLanguageChange}
                            aria-label="Select tutorial video language"
                        >
                            {TUTORIAL_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.nativeName} ({lang.name})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Video Stage */}
                <div className="tutorial-video-wrapper">
                    <video
                        ref={videoRef}
                        className="tutorial-video-element"
                        src={activeVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        onError={handleVideoError}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        title={`${titleText} in ${activeLanguage.name}`}
                    >
                        Your browser does not support the video tag.
                    </video>

                    {/* Audio Badge Overlay */}
                    <div
                        className={`tutorial-video-audio-badge ${
                            isPlaying ? "hide-while-playing" : ""
                        }`}
                    >
                        <span className="tutorial-video-pulse-dot" />
                        <Volume2 size={12} className="tutorial-video-audio-icon" aria-hidden="true" />
                        <span>
                            {activeLanguage.nativeName} ({activeLanguage.name})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialVideoPlayer;
