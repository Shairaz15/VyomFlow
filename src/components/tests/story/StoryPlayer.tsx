import { useState, useEffect, useRef } from "react";
import { Button, Card, Icon } from "../../common";
import { useLanguage } from "../../../i18n/LanguageContext";
import type { SupportedLanguage } from "../../../types/storyTypes";
import { SARVAM_API_KEY } from "../../../utils/sarvamConfig";

interface StoryPlayerProps {
    storyText: string;
    languageCode: SupportedLanguage;
    onComplete: () => void;
}

interface StoryLineTrack {
    text: string;
    audioUrl: string;
}

/**
 * Robust sentence splitter:
 * - Protects common English & Indian honorifics (Mr., Mrs., Dr., etc.) from being split into fragments.
 * - Handles English punctuation (. ! ?) and Indic dandas (। ||).
 * - Merges any tiny fragment (< 8 chars) back into adjacent sentences to prevent Sarvam API empty/short text errors.
 */
function extractCleanSentences(text: string): string[] {
    if (!text) return [];

    const sanitized = text
        .replace(/Mr\./gi, 'Mr')
        .replace(/Mrs\./gi, 'Mrs')
        .replace(/Ms\./gi, 'Ms')
        .replace(/Dr\./gi, 'Dr')
        .replace(/Prof\./gi, 'Prof')
        .replace(/Shri\./gi, 'Shri')
        .replace(/Smt\./gi, 'Smt');

    const rawMatches = sanitized.match(/[^.!?|।\n]+[.!?|।]*(\s+|$)/g);
    if (!rawMatches || rawMatches.length === 0) return [sanitized.trim()];

    const result: string[] = [];
    for (const chunk of rawMatches) {
        const trimmed = chunk.trim();
        if (!trimmed || !/[\p{L}\p{N}]/u.test(trimmed)) continue;

        if (result.length > 0 && trimmed.length < 8) {
            result[result.length - 1] = `${result[result.length - 1]} ${trimmed}`;
        } else {
            result.push(trimmed);
        }
    }

    return result.length > 0 ? result : [text.trim()];
}

/**
 * Synthesize voice audio for a piece of text using Sarvam AI TTS gateways
 */
async function fetchTTSWithFallback(
    text: string,
    languageCode: string,
    proxyHttpBase: string
): Promise<string | null> {
    const payload = JSON.stringify({
        inputs: [text],
        target_language_code: languageCode,
        speaker: 'priya',
        model: 'bulbul:v3',
        pace: 0.85,
        speech_sample_rate: 22050
    });

    const isApexDomain = typeof window !== 'undefined' && window.location.hostname === 'vyomflow.me';
    const apiBase = isApexDomain ? 'https://www.vyomflow.me' : '';

    const endpoints: Array<{ url: string; headers: Record<string, string> }> = [
        {
            url: `${apiBase}/api/tts`,
            headers: {
                'Content-Type': 'application/json'
            }
        },
        {
            url: `${apiBase}/api/sarvam-tts`,
            headers: {
                'Content-Type': 'application/json'
            }
        },
        {
            url: `${proxyHttpBase}/api/tts`,
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY
            }
        },
        {
            url: 'https://api.sarvam.ai/text-to-speech',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY
            }
        }
    ];

    for (const ep of endpoints) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const res = await fetch(ep.url, {
                    method: 'POST',
                    headers: ep.headers,
                    body: payload
                });
                if (res.ok) {
                    const data = await res.json();
                    const base64 = data.audios?.[0] || data.audio;
                    if (base64) return base64;
                }
            } catch (err) {
                console.warn(`[Sarvam TTS] Attempt ${attempt + 1} on ${ep.url} failed:`, err);
            }
            if (attempt === 0) {
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }

    return null;
}

export function StoryPlayer({ storyText, languageCode, onComplete }: StoryPlayerProps) {
    const { t } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasFinished, setHasFinished] = useState(false);

    // Line-by-Line Tracks State
    const [tracks, setTracks] = useState<StoryLineTrack[]>([]);
    const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
    const [fallbackSentences, setFallbackSentences] = useState<string[]>([]);

    const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('story_subtitles_enabled');
            return saved !== null ? saved === 'true' : true;
        } catch {
            return true;
        }
    });

    const toggleSubtitles = () => {
        setSubtitlesEnabled(prev => {
            const next = !prev;
            try {
                localStorage.setItem('story_subtitles_enabled', String(next));
            } catch {}
            return next;
        });
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const playTimeoutRef = useRef<number | null>(null);
    const runGeneration = useRef(0);
    const isMountedRef = useRef(true);

    // Sequential audio queue playback
    const playLine = (index: number, lineTracks: StoryLineTrack[]) => {
        if (index >= lineTracks.length) {
            setIsPlaying(false);
            setHasFinished(true);
            onCompleteRef.current();
            return;
        }

        setActiveLineIdx(index);
        setIsPlaying(true);

        const currentTrack = lineTracks[index];
        const audio = new Audio(currentTrack.audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
            playTimeoutRef.current = window.setTimeout(() => {
                playLine(index + 1, lineTracks);
            }, 180);
        };
        audio.onerror = (e) => {
            console.warn(`[StoryPlayer] Audio error on line ${index}, advancing:`, e);
            playTimeoutRef.current = window.setTimeout(() => {
                playLine(index + 1, lineTracks);
            }, 100);
        };

        audio.play().catch(e => {
            console.warn("Autoplay blocked, user interaction required:", e);
            setIsPlaying(false);
        });
    };

    // Resilient offline/device Web Speech fallback
    const startNativeSpeechFallback = (sentences: string[]) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setError("Unable to synthesize Sarvam voice track. Please check internet connection.");
            setIsLoading(false);
            return;
        }

        window.speechSynthesis.cancel();
        setFallbackSentences(sentences);
        setIsLoading(false);
        setIsPlaying(true);
        let idx = 0;

        const speakNext = () => {
            if (!isMountedRef.current) return;
            if (idx >= sentences.length) {
                setIsPlaying(false);
                setHasFinished(true);
                onCompleteRef.current();
                return;
            }

            setActiveLineIdx(idx);
            const utterance = new SpeechSynthesisUtterance(sentences[idx]);
            utterance.lang = languageCode || 'en-IN';
            utterance.rate = 0.88;

            utterance.onend = () => {
                idx++;
                playTimeoutRef.current = window.setTimeout(speakNext, 200);
            };
            utterance.onerror = () => {
                idx++;
                playTimeoutRef.current = window.setTimeout(speakNext, 100);
            };

            window.speechSynthesis.speak(utterance);
        };

        speakNext();
    };

    useEffect(() => {
        isMountedRef.current = true;
        const currentRun = ++runGeneration.current;

        async function generateStoryAudioPipeline() {
            setIsLoading(true);
            setError(null);

            try {
                const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const isApexDomain = window.location.hostname === 'vyomflow.me';
                const apiBase = isApexDomain ? 'https://www.vyomflow.me' : '';
                const proxyHttpBase = isLocalDev
                    ? 'http://localhost:5001'
                    : 'https://vyomflow-proxy.onrender.com';

                // Step 1: Split story into clean sentences
                const rawSentences = extractCleanSentences(storyText);

                // Step 2: Translate if English story provided for a non-English language
                let spokenSentences = rawSentences;
                const isLikelyEnglish = /[a-zA-Z]{4,}/.test(storyText);
                if (languageCode !== 'en-IN' && isLikelyEnglish) {
                    spokenSentences = await Promise.all(
                        rawSentences.map(async (sentence) => {
                            const trPayload = JSON.stringify({
                                input: sentence,
                                source_language_code: "en-IN",
                                target_language_code: languageCode,
                                model: "sarvam-translate:v1"
                            });

                            const trEndpoints: Array<{ url: string; headers: Record<string, string> }> = [
                                {
                                    url: `${apiBase}/api/translate`,
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                },
                                {
                                    url: `${apiBase}/api/sarvam-translate`,
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                },
                                {
                                    url: `${proxyHttpBase}/api/translate`,
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'api-subscription-key': SARVAM_API_KEY
                                    }
                                },
                                {
                                    url: 'https://api.sarvam.ai/translate',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'api-subscription-key': SARVAM_API_KEY
                                    }
                                }
                            ];

                            for (const trEp of trEndpoints) {
                                try {
                                    const trRes = await fetch(trEp.url, {
                                        method: 'POST',
                                        headers: trEp.headers,
                                        body: trPayload
                                    });
                                    if (trRes.ok) {
                                        const trData = await trRes.json();
                                        if (trData.translated_text) {
                                            return trData.translated_text;
                                        }
                                    }
                                } catch {}
                            }
                            return sentence;
                        })
                    );
                }

                if (!isMountedRef.current || currentRun !== runGeneration.current) return;

                // Step 3: Synthesize each sentence to its own audio track via Sarvam TTS
                const trackPromises = spokenSentences.map(async (text) => {
                    const base64 = await fetchTTSWithFallback(text, languageCode, proxyHttpBase);
                    if (base64) {
                        return {
                            text,
                            audioUrl: `data:audio/wav;base64,${base64}`
                        };
                    }
                    return null;
                });

                const results = await Promise.all(trackPromises);
                const successfulTracks = results.filter((t): t is StoryLineTrack => t !== null);

                if (!isMountedRef.current || currentRun !== runGeneration.current) return;

                // If sentence tracks succeeded, start sequential line playback
                if (successfulTracks.length > 0) {
                    setTracks(successfulTracks);
                    setIsLoading(false);
                    playLine(0, successfulTracks);
                    return;
                }

                // Fail-safe 1: Single full-text Sarvam narration request
                console.warn("[StoryPlayer] Sentence chunks incomplete, attempting full-text Sarvam synthesis...");
                const fullBase64 = await fetchTTSWithFallback(spokenSentences.join(' '), languageCode, proxyHttpBase);
                if (fullBase64 && isMountedRef.current && currentRun === runGeneration.current) {
                    const fallbackTracks: StoryLineTrack[] = [{
                        text: spokenSentences.join(' '),
                        audioUrl: `data:audio/wav;base64,${fullBase64}`
                    }];
                    setTracks(fallbackTracks);
                    setIsLoading(false);
                    playLine(0, fallbackTracks);
                    return;
                }

                // Fail-safe 2: Native device speech synthesis fallback
                console.warn("[StoryPlayer] Sarvam cloud unreachable, falling back to device speech synthesis...");
                if (isMountedRef.current && currentRun === runGeneration.current) {
                    startNativeSpeechFallback(spokenSentences);
                    return;
                }

                throw new Error("Unable to synthesize Sarvam voice track. Please check internet connection.");

            } catch (err: any) {
                console.error("Sarvam story generation error:", err);
                if (isMountedRef.current && currentRun === runGeneration.current) {
                    // Try native speech before giving up with error screen
                    const sentences = extractCleanSentences(storyText);
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        startNativeSpeechFallback(sentences);
                    } else {
                        setError(err.message || "Failed to generate Sarvam voice narration.");
                        setIsLoading(false);
                    }
                }
            }
        }

        generateStoryAudioPipeline();

        return () => {
            isMountedRef.current = false;
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [storyText, languageCode]);

    const handleManualPlay = () => {
        if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(() => {
                if (tracks.length > 0) {
                    playLine(activeLineIdx, tracks);
                }
            });
        } else if (tracks.length > 0) {
            playLine(activeLineIdx, tracks);
        } else if (fallbackSentences.length > 0) {
            startNativeSpeechFallback(fallbackSentences);
        }
    };

    const currentLineText = tracks.length > 0
        ? tracks[activeLineIdx]?.text
        : fallbackSentences[activeLineIdx] || storyText;

    return (
        <Card className="story-player-card animate-fadeIn">
            <div className="story-player-content">
                {/* Header Bar with CC Toggle */}
                <div className="story-player-header-bar">
                    <div className="narration-badge">
                        <Icon name="story" size={18} />
                        <span>{subtitlesEnabled ? (t("story.listeningPhase") || "Listening Phase") : (t("story.pureListening") || "Pure Listening")}</span>
                    </div>

                    <button 
                        type="button" 
                        className={`story-cc-toggle-btn ${subtitlesEnabled ? 'active' : ''}`}
                        onClick={toggleSubtitles}
                        title={subtitlesEnabled ? 'Turn Off Closed Captions' : 'Turn On Closed Captions'}
                        aria-label="Toggle Closed Captions"
                    >
                        <span className="cc-pill-icon">CC</span>
                        <span className="cc-pill-text">{subtitlesEnabled ? 'Captions ON' : 'Captions OFF'}</span>
                    </button>
                </div>

                <h3>{t("story.listeningPhase")}</h3>
                <p className="narration-instruction">
                    {t("story.listenInstruction")}
                </p>

                {isLoading && (
                    <div className="player-status loading-spinner-container">
                        <div className="spinner" />
                        <p>{t("story.generatingAudio") || "Generating Sarvam voice narration..."}</p>
                    </div>
                )}

                {error && (
                    <div className="player-status error-alert">
                        <p>{error}</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                            <Button variant="secondary" onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                            <Button variant="primary" onClick={() => onComplete()}>
                                {t("story.proceedToQuiz")}
                            </Button>
                        </div>
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="waveform-wrapper">
                        <div className={`waveform-visualizer ${isPlaying ? 'active' : ''}`}>
                            <span className="bar bar1"></span>
                            <span className="bar bar2"></span>
                            <span className="bar bar3"></span>
                            <span className="bar bar4"></span>
                            <span className="bar bar5"></span>
                        </div>

                        {!isPlaying && !hasFinished && (
                            <Button variant="primary" onClick={handleManualPlay}>
                                <Icon name="play" size={16} /> {t("story.tapToPlayNarration")}
                            </Button>
                        )}

                        {/* Live Line-by-Line Synchronized Closed Caption */}
                        {subtitlesEnabled && isPlaying && (
                            <div className="story-single-line-caption">
                                <div key={`line-${activeLineIdx}`} className="story-caption-line-wrap">
                                    <span className="story-caption-text">
                                        {currentLineText}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
