import { useState, useEffect, useRef, useMemo } from "react";
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

interface PlaylistItem {
    id: string;
    type: "start" | "approach" | "continuation";
    segmentIndex: number; // 0 to 7 (-1 for start)
    src: string;
    label: string;
    subLabel: string;
    isDecisionPoint?: boolean;
}

export function SeamlessReverseNavigator({
    route,
    onComplete,
}: SeamlessReverseNavigatorProps) {
    const videoRefA = useRef<HTMLVideoElement>(null);
    const videoRefB = useRef<HTMLVideoElement>(null);

    // Active video player ('A' or 'B')
    const [activeVideo, setActiveVideo] = useState<"A" | "B">("A");
    const [playlistIndex, setPlaylistIndex] = useState<number>(0);
    const [isAwaitingDecision, setIsAwaitingDecision] = useState<boolean>(false);
    const [chosenDirection, setChosenDirection] = useState<NavigationDirection | null>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [allResponses, setAllResponses] = useState<IntersectionResponse[]>([]);
    const [hasError, setHasError] = useState<boolean>(false);

    const decisionStartTimeRef = useRef<number>(0);

    // Build the 17-clip playlist: start + 8*(approach + continuation)
    const playlist: PlaylistItem[] = useMemo(() => {
        const items: PlaylistItem[] = [];

        if (route.startVideoUrl) {
            items.push({
                id: "clip_start",
                type: "start",
                segmentIndex: -1,
                src: route.startVideoUrl,
                label: "Departing Point B (Basketball Court Plaza)",
                subLabel: "Beginning reverse journey retracing route back to Main Gate 1 (Point A).",
                isDecisionPoint: false,
            });
        }

        route.segments.forEach((seg, idx) => {
            // Approach clip
            items.push({
                id: `clip_approach_${seg.segmentId}`,
                type: "approach",
                segmentIndex: idx,
                src: seg.approachVideoUrl || seg.videoUrl || "",
                label: `Approaching Intersection ${idx + 1} of ${route.segments.length}`,
                subLabel: `${seg.intersectionLabel} — Look ahead before deciding turn.`,
                isDecisionPoint: true,
            });

            // Continuation clip
            items.push({
                id: `clip_continuation_${seg.segmentId}`,
                type: "continuation",
                segmentIndex: idx,
                src: seg.continuationVideoUrl,
                label: `Navigating through Intersection ${idx + 1}`,
                subLabel: `Proceeding along route towards ${seg.toWaypoint}.`,
                isDecisionPoint: false,
            });
        });

        return items;
    }, [route]);

    const currentItem = playlist[playlistIndex];
    const currentSegment =
        currentItem && currentItem.segmentIndex >= 0
            ? route.segments[currentItem.segmentIndex]
            : null;

    // Preload video links on mount
    useEffect(() => {
        playlist.forEach((item) => {
            if (item.src) {
                const link = document.createElement("link");
                link.rel = "preload";
                link.as = "video";
                link.href = item.src;
                document.head.appendChild(link);
            }
        });
    }, [playlist]);

    // Initial setup: load first clip into Video A and second clip into Video B
    useEffect(() => {
        if (playlist.length === 0) return;

        if (videoRefA.current && playlist[0]) {
            videoRefA.current.src = playlist[0].src;
            videoRefA.current.load();
            videoRefA.current.play().catch(() => {
                // Autoplay policy fallback
            });
        }

        if (videoRefB.current && playlist[1]) {
            videoRefB.current.src = playlist[1].src;
            videoRefB.current.load();
        }
    }, [playlist]);

    // Handle Time Update for active video
    const handleTimeUpdate = () => {
        const activeRef = activeVideo === "A" ? videoRefA.current : videoRefB.current;
        if (activeRef && activeRef.duration) {
            setProgress((activeRef.currentTime / activeRef.duration) * 100);
        }
    };

    // When the currently active clip ends
    const handleActiveClipEnded = () => {
        if (!currentItem) return;

        if (currentItem.isDecisionPoint) {
            // Pause active video on final frame & prompt for decision below video
            const activeRef = activeVideo === "A" ? videoRefA.current : videoRefB.current;
            if (activeRef) {
                activeRef.pause();
            }
            decisionStartTimeRef.current = performance.now();
            setChosenDirection(null);
            setIsSubmitted(false);
            setIsAwaitingDecision(true);
        } else {
            // Move directly to next clip
            advanceToNextClip();
        }
    };

    const advanceToNextClip = () => {
        const nextIndex = playlistIndex + 1;

        if (nextIndex >= playlist.length) {
            // Finished full reverse route!
            onComplete(allResponses);
            return;
        }

        // Toggle active player
        const nextActive = activeVideo === "A" ? "B" : "A";
        const currentRef = activeVideo === "A" ? videoRefA.current : videoRefB.current;
        const nextRef = nextActive === "A" ? videoRefA.current : videoRefB.current;

        setPlaylistIndex(nextIndex);
        setActiveVideo(nextActive);
        setIsAwaitingDecision(false);
        setProgress(0);

        if (nextRef) {
            nextRef.currentTime = 0;
            nextRef.play().catch((err) => {
                console.warn("Video playback error:", err);
            });
        }

        // Preload the item after next into currentRef
        const preloadIndex = nextIndex + 1;
        if (preloadIndex < playlist.length && currentRef && playlist[preloadIndex]) {
            currentRef.src = playlist[preloadIndex].src;
            currentRef.load();
        }
    };

    // Direction Decision Handlers
    const handleChooseDirection = (direction: NavigationDirection) => {
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

        // Feedback delay before seamless continuation playback
        const delay = isCorrect ? 450 : 1200;
        setTimeout(() => {
            advanceToNextClip();
        }, delay);
    };

    // Keyboard controls for directions
    useEffect(() => {
        if (!isAwaitingDecision || isSubmitted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
                handleChooseDirection("straight");
            } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                handleChooseDirection("left");
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                handleChooseDirection("right");
            } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
                handleChooseDirection("back");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAwaitingDecision, isSubmitted, currentSegment]);

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

    const currentIntersectionNumber =
        currentItem && currentItem.segmentIndex >= 0 ? currentItem.segmentIndex + 1 : 1;

    return (
        <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
            {/* Top Route Progress Bar */}
            <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-cyan-400">
                        Reverse Route (Point B → Point A)
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 font-mono">
                        Intersection {Math.min(currentIntersectionNumber, 8)} of {route.segments.length}
                    </span>
                </div>

                {/* 8 Intersections Micro Indicators */}
                <div className="flex items-center gap-1.5">
                    {route.segments.map((seg, idx) => {
                        const isDone = allResponses.some((r) => r.segmentId === seg.segmentId);
                        const isCurrent = currentItem?.segmentIndex === idx;
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
                {/* Video Element A */}
                <video
                    ref={videoRefA}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ease-out ${
                        activeVideo === "A" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onContextMenu={(e) => e.preventDefault()}
                    onTimeUpdate={activeVideo === "A" ? handleTimeUpdate : undefined}
                    onEnded={activeVideo === "A" ? handleActiveClipEnded : undefined}
                    onError={() => setHasError(true)}
                />

                {/* Video Element B */}
                <video
                    ref={videoRefB}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ease-out ${
                        activeVideo === "B" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onContextMenu={(e) => e.preventDefault()}
                    onTimeUpdate={activeVideo === "B" ? handleTimeUpdate : undefined}
                    onEnded={activeVideo === "B" ? handleActiveClipEnded : undefined}
                    onError={() => setHasError(true)}
                />

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
                            : currentItem?.label || "Retracing Route"}
                    </span>

                    {isAwaitingDecision && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md animate-pulse">
                            PAUSED
                        </span>
                    )}
                </div>

                {hasError && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-center">
                        <p className="text-sm font-medium text-rose-300">
                            Video stream error. Attempting to continue playback...
                        </p>
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
                <Card className="p-6 bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-4 animate-fadeInUp">
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
                    <div className="flex flex-col items-center justify-center space-y-2 pt-1">
                        {/* Top: Straight */}
                        <div>
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("straight")}
                                className={`min-w-[130px] min-h-[54px] px-5 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs ${getButtonClass(
                                    "straight"
                                )}`}
                            >
                                <span className="text-lg leading-none">↑</span>
                                <span>Straight</span>
                            </button>
                        </div>

                        {/* Middle Row: Left, Compass Icon, Right */}
                        <div className="flex items-center gap-4 sm:gap-6">
                            {/* Left */}
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("left")}
                                className={`min-w-[130px] min-h-[54px] px-5 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs ${getButtonClass(
                                    "left"
                                )}`}
                            >
                                <span className="text-lg leading-none">←</span>
                                <span>Turn Left</span>
                            </button>

                            {/* Compass Center Indicator */}
                            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
                                <Icon name="navigation" size={18} />
                            </div>

                            {/* Right */}
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("right")}
                                className={`min-w-[130px] min-h-[54px] px-5 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs ${getButtonClass(
                                    "right"
                                )}`}
                            >
                                <span className="text-lg leading-none">→</span>
                                <span>Turn Right</span>
                            </button>
                        </div>

                        {/* Bottom: Back */}
                        <div>
                            <button
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleChooseDirection("back")}
                                className={`min-w-[130px] min-h-[54px] px-5 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed font-semibold text-xs ${getButtonClass(
                                    "back"
                                )}`}
                            >
                                <span className="text-lg leading-none">↓</span>
                                <span>Turn Back</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80 px-2">
                        <span>Tip: Use Arrow Keys (↑ / ← / → / ↓) or Click</span>
                        <span>Latency precision: ~1ms</span>
                    </div>
                </Card>
            ) : (
                /* Continuous Navigation Status Bar (When Video is moving) */
                <Card className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Icon name="navigation" size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-white font-semibold">
                                {currentItem?.label || "Retracing Route"}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                                {currentItem?.subLabel || "Observe upcoming pathways and landmark cues."}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            🚶 Continuous PoV
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleActiveClipEnded}
                            className="text-xs"
                        >
                            Skip Clip →
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
