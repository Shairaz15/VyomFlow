import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, Icon, Button } from "../../../common";
import type {
    RouteConfig,
    NavigationDirection,
    IntersectionResponse,
} from "../../../../types/navigationTypes";

interface SeamlessReverseNavigatorProps {
    route: RouteConfig;
    onComplete: (responses: IntersectionResponse[]) => void;
}

/**
 * Pause timestamps for the single reverse-navigation video (res.mp4).
 * Format: MM:SS:ms -> converted to seconds.
 * The video pauses at each timestamp to prompt a direction decision.
 */
const PAUSE_TIMESTAMPS_SECONDS: number[] = [
    0 * 60 + 8 + 5 / 100,    // 00:08:05 -> 8.05s
    0 * 60 + 19 + 2 / 100,   // 00:19:02 -> 19.02s
    0 * 60 + 24 + 14 / 100,  // 00:24:14 -> 24.14s
    0 * 60 + 35 + 3 / 100,   // 00:35:03 -> 35.03s
    0 * 60 + 45 + 17 / 100,  // 00:45:17 -> 45.17s
    0 * 60 + 54 + 0 / 100,   // 00:54:00 -> 54.00s
    1 * 60 + 5 + 8 / 100,    // 01:05:08 -> 65.08s
    1 * 60 + 13 + 0 / 100,   // 01:13:00 -> 73.00s
];

const SINGLE_VIDEO_URL = "https://pkkrxxjinpxctkoxltuy.supabase.co/storage/v1/object/public/navigation-assets/videos/res.mp4";

export function SeamlessReverseNavigator({
    route,
    onComplete,
}: SeamlessReverseNavigatorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [currentIntersection, setCurrentIntersection] = useState<number>(0); // 0-7 index into PAUSE_TIMESTAMPS
    const [isAwaitingDecision, setIsAwaitingDecision] = useState<boolean>(false);
    const [chosenDirection, setChosenDirection] = useState<NavigationDirection | null>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [allResponses, setAllResponses] = useState<IntersectionResponse[]>([]);
    const [hasError, setHasError] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);

    const decisionStartTimeRef = useRef<number>(0);
    // Track which pause points have already been triggered to avoid re-triggering
    const triggeredPausesRef = useRef<Set<number>>(new Set());
    // Track whether we're in a post-decision resume phase (to avoid immediate re-trigger)
    const isResumingRef = useRef<boolean>(false);
    const retryCountRef = useRef<number>(0);

    const currentSegment = route.segments[currentIntersection] || null;

    // Load and start the single video on mount
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.src = SINGLE_VIDEO_URL;
        video.muted = true;
        video.load();

        const timer = setTimeout(() => {
            video.play()
                .then(() => {
                    setIsPlaying(true);
                    setNeedsUserGesture(false);
                    setHasError(false);
                })
                .catch(() => {
                    setIsPlaying(false);
                    setNeedsUserGesture(true);
                });
        }, 150);

        return () => clearTimeout(timer);
    }, []);

    const handleVideoClick = () => {
        const video = videoRef.current;
        if (!video || isAwaitingDecision) return;
        if (video.paused) {
            video.play()
                .then(() => {
                    setIsPlaying(true);
                    setNeedsUserGesture(false);
                    setHasError(false);
                })
                .catch(console.error);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    // Core timeupdate handler: monitor playback and pause at timestamps
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video || isAwaitingDecision) return;

        const currentTime = video.currentTime;
        const duration = video.duration;

        // Auto-clear transient errors when time moves forward
        if (hasError) {
            setHasError(false);
        }

        // Update progress bar relative to entire video
        if (duration) {
            setProgress((currentTime / duration) * 100);
        }

        // Skip checking during the brief resume window
        if (isResumingRef.current) return;

        // Check if we've reached the next pause point
        if (currentIntersection < PAUSE_TIMESTAMPS_SECONDS.length) {
            const pauseAt = PAUSE_TIMESTAMPS_SECONDS[currentIntersection];
            // Use a tolerance window: pause when we're within 0.20s of or past the timestamp
            if (currentTime >= pauseAt - 0.20 && !triggeredPausesRef.current.has(currentIntersection)) {
                triggeredPausesRef.current.add(currentIntersection);
                video.pause();
                // Seek to the exact pause frame
                try {
                    video.currentTime = pauseAt;
                } catch {
                    // Safe ignore
                }
                decisionStartTimeRef.current = performance.now();
                setChosenDirection(null);
                setIsSubmitted(false);
                setIsAwaitingDecision(true);
                setHasError(false);
            }
        }
    }, [currentIntersection, isAwaitingDecision, hasError]);

    // Handle video ending (after all 8 intersections, the video plays to the end)
    const handleVideoEnded = useCallback(() => {
        if (currentIntersection >= PAUSE_TIMESTAMPS_SECONDS.length) {
            onComplete(allResponses);
        }
    }, [currentIntersection, allResponses, onComplete]);

    // After a decision is made, resume playback toward the next pause point (or end)
    const resumeAfterDecision = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const nextIntersection = currentIntersection + 1;
        setCurrentIntersection(nextIntersection);
        setIsAwaitingDecision(false);
        setChosenDirection(null);
        setIsSubmitted(false);
        setHasError(false);

        // If all 8 intersections are done, check if there's remaining video
        if (nextIntersection >= PAUSE_TIMESTAMPS_SECONDS.length) {
            isResumingRef.current = true;
            video.play().catch(() => {});
            setTimeout(() => {
                isResumingRef.current = false;
            }, 500);

            if (video.duration && video.currentTime >= video.duration - 0.5) {
                onComplete(allResponses);
            }
            return;
        }

        // Resume playback
        isResumingRef.current = true;
        video.play()
            .then(() => {
                setIsPlaying(true);
                setHasError(false);
            })
            .catch((err) => {
                console.warn("Video playback resume notice:", err);
            });

        // Clear the resuming flag after passing the current pause point
        setTimeout(() => {
            isResumingRef.current = false;
        }, 400);
    }, [currentIntersection, allResponses, onComplete]);

    // Direction Decision Handler
    const handleChooseDirection = useCallback((direction: NavigationDirection) => {
        if (isSubmitted || !currentSegment) return;

        const decisionLatencyMs = Math.round(performance.now() - decisionStartTimeRef.current);
        const isCorrect = direction === currentSegment.correctDirection;

        setChosenDirection(direction);
        setIsSubmitted(true);

        const response: IntersectionResponse = {
            segmentId: currentSegment.segmentId,
            chosenDirection: direction,
            correctDirection: currentSegment.correctDirection,
            isCorrect,
            decisionLatencyMs,
            timestamp: Date.now(),
        };

        const updatedResponses = [...allResponses, response];
        setAllResponses(updatedResponses);

        // Feedback delay before resuming video
        const delay = isCorrect ? 450 : 1200;
        setTimeout(() => {
            resumeAfterDecision();
        }, delay);
    }, [isSubmitted, currentSegment, allResponses, resumeAfterDecision]);

    // Keyboard & Laptop Arrowpad controls for directions
    useEffect(() => {
        if (!isAwaitingDecision || isSubmitted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            const code = e.code;

            if (key === "ArrowUp" || key === "w" || key === "W" || code === "ArrowUp" || code === "KeyW" || code === "Numpad8") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("straight");
            } else if (key === "ArrowLeft" || key === "a" || key === "A" || code === "ArrowLeft" || code === "KeyA" || code === "Numpad4") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("left");
            } else if (key === "ArrowRight" || key === "d" || key === "D" || code === "ArrowRight" || code === "KeyD" || code === "Numpad6") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("right");
            } else if (key === "ArrowDown" || key === "s" || key === "S" || code === "ArrowDown" || code === "KeyS" || code === "Numpad2") {
                e.preventDefault();
                e.stopPropagation();
                handleChooseDirection("back");
            }
        };

        window.addEventListener("keydown", handleKeyDown, { passive: false });
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAwaitingDecision, isSubmitted, handleChooseDirection]);

    // Touch Swipe Gestures
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isAwaitingDecision || isSubmitted) return;
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isAwaitingDecision || isSubmitted || !touchStartRef.current) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;
        touchStartRef.current = null;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const minSwipeDistance = 35;

        if (Math.max(absDx, absDy) < minSwipeDistance) return;

        if (absDy > absDx) {
            if (dy < 0) {
                handleChooseDirection("straight");
            } else {
                handleChooseDirection("back");
            }
        } else {
            if (dx < 0) {
                handleChooseDirection("left");
            } else {
                handleChooseDirection("right");
            }
        }
    };

    // Skip button: manually advance to next pause point or end
    const handleSkip = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const nextPauseIdx = currentIntersection;
        if (nextPauseIdx < PAUSE_TIMESTAMPS_SECONDS.length) {
            const pauseAt = PAUSE_TIMESTAMPS_SECONDS[nextPauseIdx];
            triggeredPausesRef.current.add(nextPauseIdx);
            video.pause();
            try {
                video.currentTime = pauseAt;
            } catch {
                // Safe ignore
            }
            decisionStartTimeRef.current = performance.now();
            setChosenDirection(null);
            setIsSubmitted(false);
            setIsAwaitingDecision(true);
            setHasError(false);
        }
    }, [currentIntersection]);

    // Self-healing video error recovery
    const handleVideoError = useCallback(() => {
        console.warn("Video stream notice on navigation video player.");
        const video = videoRef.current;
        if (!video) return;

        // Attempt automatic self-recovery up to 3 times
        if (retryCountRef.current < 3) {
            retryCountRef.current += 1;
            const currentPos = video.currentTime || PAUSE_TIMESTAMPS_SECONDS[currentIntersection] || 0;
            video.load();
            video.currentTime = currentPos;
            video.play()
                .then(() => {
                    setHasError(false);
                    setIsPlaying(true);
                })
                .catch(() => {
                    // If autoplay blocked or delayed
                    if (isAwaitingDecision) {
                        setHasError(false);
                    } else {
                        setHasError(true);
                    }
                });
        } else {
            // If genuinely offline, let the user continue to decision
            if (isAwaitingDecision) {
                setHasError(false);
            } else {
                setHasError(true);
            }
        }
    }, [currentIntersection, isAwaitingDecision]);

    const getButtonClass = (direction: NavigationDirection) => {
        if (!currentSegment) return "";
        const isChosen = chosenDirection === direction;
        const isTarget = direction === currentSegment.correctDirection;

        if (!isSubmitted) {
            return "bg-slate-800/90 hover:bg-slate-700/90 hover:border-cyan-500/60 border-slate-700 text-slate-200 active:scale-95 shadow-md";
        }

        if (isChosen && isTarget) {
            return "bg-emerald-500/25 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 scale-105";
        }

        if (isChosen && !isTarget) {
            return "bg-rose-500/25 border-rose-500 text-rose-300 ring-2 ring-rose-500/50";
        }

        if (isTarget) {
            return "bg-emerald-500/15 border-emerald-500/70 text-emerald-300 animate-pulse";
        }

        return "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-40";
    };

    const currentIntersectionNumber = currentIntersection + 1;

    return (
        <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
            {/* Top Route Progress Bar */}
            <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                        Reverse Route (Point B → Point A)
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                        Intersection {Math.min(currentIntersectionNumber, 8)} of {route.segments.length}
                    </span>
                </div>

                {/* 8 Intersections Micro Indicators */}
                <div className="flex items-center gap-1.5">
                    {route.segments.map((seg, idx) => {
                        const isDone = allResponses.some((r) => r.segmentId === seg.segmentId);
                        const isCurrent = currentIntersection === idx;
                        return (
                            <div
                                key={seg.segmentId}
                                title={seg.intersectionLabel}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                    isDone
                                        ? "bg-emerald-400 ring-1 ring-emerald-400/50"
                                        : isCurrent
                                        ? "bg-cyan-400 ring-2 ring-cyan-400/60 scale-125 animate-pulse"
                                        : "bg-slate-800 border border-slate-700"
                                }`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Persistent Video Player Frame */}
            <div className="nav-video-container relative w-full aspect-video max-h-[58vh] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                {/* Single Video Element */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={handleVideoClick}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onPlay={() => {
                        setIsPlaying(true);
                        setHasError(false);
                    }}
                    onPlaying={() => {
                        setIsPlaying(true);
                        setHasError(false);
                    }}
                    onCanPlay={() => {
                        setHasError(false);
                    }}
                    onSeeked={() => {
                        setHasError(false);
                    }}
                    onPause={() => setIsPlaying(false)}
                    onError={handleVideoError}
                />

                {/* Click to Play Overlay if paused or awaiting gesture */}
                {((!isPlaying && !isAwaitingDecision) || needsUserGesture) && !hasError && (
                    <div 
                        onClick={handleVideoClick}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-[2px] cursor-pointer transition-all"
                    >
                        <div className="w-16 h-16 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 transform hover:scale-110 active:scale-95 transition-all">
                            <Icon name="play" size={28} />
                        </div>
                        <span className="mt-3 text-xs font-bold text-white uppercase tracking-wider bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700">
                            Click or Tap to Start Route
                        </span>
                    </div>
                )}

                {/* Top Video Overlay Badge */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-white border border-slate-700/80 shadow-lg flex items-center gap-1.5">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isAwaitingDecision ? "bg-amber-400 animate-ping" : "bg-cyan-400 animate-pulse"
                            }`}
                        />
                        {isAwaitingDecision
                            ? `Intersection ${currentIntersectionNumber}: Decision Point`
                            : `Retracing Route — Segment ${currentIntersectionNumber}`}
                    </span>

                    {isAwaitingDecision && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md animate-pulse">
                            PAUSED
                        </span>
                    )}
                </div>

                {/* Stream Notice Overlay (only if not at decision point and video is stalled) */}
                {hasError && !isAwaitingDecision && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 text-center space-y-3">
                        <p className="text-sm font-medium text-amber-300">
                            Buffering video stream...
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    setHasError(false);
                                    videoRef.current?.play().catch(() => {});
                                }}
                            >
                                ▶ Resume Video
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleSkip}
                            >
                                Skip to Decision →
                            </Button>
                        </div>
                    </div>
                )}

                {/* Bottom Progress Bar Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900/80 z-20">
                    <div
                        className={`h-full transition-all duration-150 ease-out ${
                            isAwaitingDecision ? "bg-amber-400" : "bg-cyan-400"
                        }`}
                        style={{ width: `${isAwaitingDecision ? 100 : progress}%` }}
                    />
                </div>
            </div>

            {/* Area Directly Below Video */}
            {isAwaitingDecision && currentSegment ? (
                /* Intersection Direction Selector Panel */
                <Card
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className="p-6 bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-4 animate-fadeInUp select-none"
                >
                    <div className="text-center space-y-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Icon name="navigation" size={12} />
                            <span>Intersection {currentIntersectionNumber} of 8</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            {currentSegment.intersectionLabel}
                        </h3>
                        <p className="text-xs text-slate-400">
                            Which direction should you take to retrace your path back to Main Gate 1 (Point A)?
                        </p>
                    </div>

                    {/* Diamond / Cross Direction Control Grid */}
                    <div className="flex flex-col items-center justify-center space-y-2.5 pt-1">
                        {/* Top: Straight */}
                        <div>
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("straight")}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleChooseDirection("straight");
                                }}
                                className={`min-w-[140px] min-h-[58px] px-5 py-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs active:scale-95 touch-manipulation ${getButtonClass(
                                    "straight"
                                )}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg leading-none font-bold">↑</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                        ↑ / W
                                    </span>
                                </div>
                                <span className="mt-0.5">Straight</span>
                            </button>
                        </div>

                        {/* Middle Row: Left, Compass Icon, Right */}
                        <div className="flex items-center gap-3 sm:gap-6">
                            {/* Left */}
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("left")}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleChooseDirection("left");
                                }}
                                className={`min-w-[140px] min-h-[58px] px-5 py-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs active:scale-95 touch-manipulation ${getButtonClass(
                                    "left"
                                )}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg leading-none font-bold">←</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                        ← / A
                                    </span>
                                </div>
                                <span className="mt-0.5">Turn Left</span>
                            </button>

                            {/* Compass Center Indicator */}
                            <div className="w-11 h-11 rounded-full bg-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                                <Icon name="navigation" size={20} />
                            </div>

                            {/* Right */}
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("right")}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleChooseDirection("right");
                                }}
                                className={`min-w-[140px] min-h-[58px] px-5 py-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs active:scale-95 touch-manipulation ${getButtonClass(
                                    "right"
                                )}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg leading-none font-bold">→</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                        → / D
                                    </span>
                                </div>
                                <span className="mt-0.5">Turn Right</span>
                            </button>
                        </div>

                        {/* Bottom: Back */}
                        <div>
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("back")}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleChooseDirection("back");
                                }}
                                className={`min-w-[140px] min-h-[58px] px-5 py-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs active:scale-95 touch-manipulation ${getButtonClass(
                                    "back"
                                )}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg leading-none font-bold">↓</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-slate-700/60">
                                        ↓ / S
                                    </span>
                                </div>
                                <span className="mt-0.5">Turn Back</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80 px-2">
                        <span className="flex items-center gap-1">
                            <span>⌨️ Laptop Arrow Keys (↑ / ← / → / ↓)</span>
                            <span className="text-slate-600">•</span>
                            <span>Touch / Tap Screen</span>
                        </span>
                        <span className="font-mono text-slate-500">Instant Telemetry Active</span>
                    </div>
                </Card>
            ) : (
                /* Continuous Navigation Status Bar (When Video is moving) */
                <Card className="p-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Icon name="navigation" size={16} />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <div className="text-slate-800 dark:text-white font-bold text-sm">
                                {currentIntersection < PAUSE_TIMESTAMPS_SECONDS.length
                                    ? `Approaching Intersection ${currentIntersectionNumber}`
                                    : "Arriving at Point A (Main Gate 1)"}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 text-xs">
                                {currentIntersection < PAUSE_TIMESTAMPS_SECONDS.length
                                    ? `${route.segments[currentIntersection]?.intersectionLabel || "Observe upcoming pathways and landmark cues."}`
                                    : "Final stretch — completing reverse navigation."}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            🚶 Continuous PoV
                        </span>
                        {currentIntersection < PAUSE_TIMESTAMPS_SECONDS.length && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleSkip}
                                className="text-xs"
                            >
                                Skip to Decision →
                            </Button>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
