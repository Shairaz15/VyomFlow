import { useState, useEffect, useRef } from "react";
import { Button, Card, Icon } from "../../common";
import type { SupportedLanguage } from "../../../types/storyTypes";

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

interface StoryPlayerProps {
    storyText: string;
    languageCode: SupportedLanguage;
    onComplete: () => void;
}

function splitIntoSentenceChunks(text: string, maxLen = 350): string[] {
    if (text.length <= maxLen) return [text];
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
    const chunks: string[] = [];
    let current = "";
    for (const s of sentences) {
        if ((current + " " + s).trim().length <= maxLen) {
            current = (current + " " + s).trim();
        } else {
            if (current) chunks.push(current);
            current = s.trim();
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

export function StoryPlayer({ storyText, languageCode, onComplete }: StoryPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasFinished, setHasFinished] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        let isMounted = true;

        async function fetchTTSAudio() {
            setIsLoading(true);
            setError(null);

            try {
                const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const proxyHttpBase = isLocalDev
                    ? 'http://localhost:5001'
                    : 'https://vyomflow-proxy.onrender.com';

                // Chunk text to respect Sarvam's 500-character limit per string
                const inputChunks = splitIntoSentenceChunks(storyText, 350);
                const translatedChunks: string[] = [];

                // Step 1: Translate English story chunks to target language via Sarvam AI
                if (languageCode !== 'en-IN') {
                    for (const chunk of inputChunks) {
                        try {
                            let translateRes: Response;
                            try {
                                translateRes = await fetch(`${proxyHttpBase}/api/translate`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'api-subscription-key': SARVAM_API_KEY
                                    },
                                    body: JSON.stringify({
                                        input: chunk,
                                        source_language_code: "en-IN",
                                        target_language_code: languageCode,
                                        model: "sarvam-translate:v1"
                                    })
                                });
                            } catch {
                                translateRes = await fetch('https://api.sarvam.ai/translate', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'api-subscription-key': SARVAM_API_KEY
                                    },
                                    body: JSON.stringify({
                                        input: chunk,
                                        source_language_code: "en-IN",
                                        target_language_code: languageCode,
                                        model: "sarvam-translate:v1"
                                    })
                                });
                            }

                            if (translateRes.ok) {
                                const translateData = await translateRes.json();
                                translatedChunks.push(translateData.translated_text || chunk);
                            } else {
                                translatedChunks.push(chunk);
                            }
                        } catch {
                            translatedChunks.push(chunk);
                        }
                    }
                } else {
                    translatedChunks.push(...inputChunks);
                }

                // Step 2: Convert translated text to speech audio via Sarvam TTS
                let response: Response;
                try {
                    response = await fetch(`${proxyHttpBase}/api/tts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'api-subscription-key': SARVAM_API_KEY
                        },
                        body: JSON.stringify({
                            inputs: translatedChunks,
                            target_language_code: languageCode,
                            speaker: 'priya',
                            model: 'bulbul:v3',
                            pace: 1.0,
                            speech_sample_rate: 22050
                        })
                    });
                } catch (netErr) {
                    console.warn("[TTS] Proxy connection failed, trying direct Sarvam API...", netErr);
                    response = await fetch('https://api.sarvam.ai/text-to-speech', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'api-subscription-key': SARVAM_API_KEY
                        },
                        body: JSON.stringify({
                            inputs: translatedChunks,
                            target_language_code: languageCode,
                            speaker: 'priya',
                            model: 'bulbul:v3',
                            pace: 1.0,
                            speech_sample_rate: 22050
                        })
                    });
                }

                const data = await response.json();

                if (!response.ok) {
                    // Try direct Sarvam API if proxy returned bad request
                    try {
                        const directRes = await fetch('https://api.sarvam.ai/text-to-speech', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'api-subscription-key': SARVAM_API_KEY
                            },
                            body: JSON.stringify({
                                inputs: translatedChunks,
                                target_language_code: languageCode,
                                speaker: 'priya',
                                model: 'bulbul:v3',
                                pace: 1.0,
                                speech_sample_rate: 22050
                            })
                        });
                        if (directRes.ok) {
                            const directData = await directRes.json();
                            const directAudio = directData.audios?.[0] || directData.audio;
                            if (directAudio && isMounted) {
                                const audioUrl = `data:audio/wav;base64,${directAudio}`;
                                const audio = new Audio(audioUrl);
                                audioRef.current = audio;
                                audio.onplay = () => setIsPlaying(true);
                                audio.onended = () => {
                                    setIsPlaying(false);
                                    setHasFinished(true);
                                    onCompleteRef.current();
                                };
                                audio.onerror = () => {
                                    setError("Failed to play audio track.");
                                    setIsLoading(false);
                                };
                                setIsLoading(false);
                                audio.play().catch(() => setIsPlaying(false));
                                return;
                            }
                        }
                    } catch {}

                    const errMsg = data.error?.message || data.message || JSON.stringify(data);
                    throw new Error(`TTS Error (${response.status}): ${errMsg}`);
                }

                const base64Audio = data.audios?.[0] || data.audio;

                if (!base64Audio) {
                    throw new Error("No audio returned from speech synthesis");
                }

                if (!isMounted) return;

                const audioUrl = `data:audio/wav;base64,${base64Audio}`;
                const audio = new Audio(audioUrl);
                audioRef.current = audio;

                audio.onplay = () => setIsPlaying(true);
                audio.onended = () => {
                    setIsPlaying(false);
                    setHasFinished(true);
                    onCompleteRef.current();
                };
                audio.onerror = () => {
                    setError("Failed to play audio track. Using browser fallback.");
                    setIsLoading(false);
                };

                setIsLoading(false);

                // Auto-start playback
                audio.play().catch(e => {
                    console.warn("Autoplay blocked, user interaction required:", e);
                    setIsPlaying(false);
                });

            } catch (err: any) {
                console.error("TTS fetch error:", err);
                if (isMounted) {
                    setError(err.message || "Failed to load narration audio.");
                    setIsLoading(false);
                }
            }
        }

        fetchTTSAudio();

        return () => {
            isMounted = false;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [storyText, languageCode]);

    const handleManualPlay = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    return (
        <Card className="story-player-card animate-fadeIn">
            <div className="story-player-content">
                <div className="narration-badge">
                    <Icon name="story" size={18} />
                    <span>Pure Listening Recall (Audio-Only)</span>
                </div>

                <h3>Listening Phase</h3>
                <p className="narration-instruction">
                    Listen carefully to the story being narrated. You will only hear this narration <strong>ONCE</strong>.
                </p>

                {isLoading && (
                    <div className="player-status loading-spinner-container">
                        <div className="spinner" />
                        <p>Generating story audio narration in Sarvam AI...</p>
                    </div>
                )}

                {error && (
                    <div className="player-status error-alert">
                        <p>{error}</p>
                        <Button variant="primary" onClick={() => onComplete()}>
                            Proceed to Distractor Task
                        </Button>
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
                        <p className="player-state-label">
                            {isPlaying ? "Narrating story..." : hasFinished ? "Narration complete" : "Ready"}
                        </p>
                        {!isPlaying && !hasFinished && (
                            <Button variant="primary" onClick={handleManualPlay}>
                                <Icon name="play" size={16} /> Tap to Play Narration
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
