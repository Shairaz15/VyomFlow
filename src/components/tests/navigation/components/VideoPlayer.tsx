import { useRef, useState, useEffect, useCallback } from "react";
import { Icon, Button } from "../../../common";

interface VideoPlayerProps {
    src: string;
    onEnded: () => void;
    autoPlay?: boolean;
    className?: string;
    label?: string;
    subLabel?: string;
}

export function VideoPlayer({
    src,
    onEnded,
    autoPlay = true,
    className = "",
    label = "Route Navigation Clip",
    subLabel = "Watch carefully and observe the surroundings and landmarks.",
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(false);

    // Attempt autoplay on mount / src change
    useEffect(() => {
        setHasError(false);
        setProgress(0);
        setShowControls(false);

        const video = videoRef.current;
        if (!video) return;

        // Set src directly on the element for maximum compatibility
        video.src = src;
        video.muted = true;
        video.load();

        if (autoPlay) {
            // Small delay to let the browser parse the source
            const timer = setTimeout(() => {
                video.play()
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(() => {
                        // Autoplay blocked — show native controls as fallback
                        setIsPlaying(false);
                        setShowControls(true);
                    });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [src, autoPlay]);

    const handlePlayClick = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.muted = true; // Ensure muted for autoplay policy
            video.play()
                .then(() => {
                    setIsPlaying(true);
                    setShowControls(false);
                })
                .catch((err) => {
                    console.error("Play failed:", err);
                    // Last resort: show native browser controls
                    setShowControls(true);
                });
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (video && video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
        }
    }, []);

    const handleVideoEnded = useCallback(() => {
        setProgress(100);
        setIsPlaying(false);
        onEnded();
    }, [onEnded]);

    const handleVideoError = useCallback(() => {
        console.warn("Video error for:", src);
        const video = videoRef.current;
        if (video?.error) {
            console.warn("MediaError code:", video.error.code, "message:", video.error.message);
        }
        setHasError(true);
    }, [src]);

    return (
        <div className={`nav-video-container relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl ${className}`}>
            {!hasError && src ? (
                <div className="relative group cursor-pointer">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        preload="auto"
                        controls={showControls}
                        disablePictureInPicture
                        controlsList="nodownload nofullscreen noremoteplayback"
                        onContextMenu={(e) => e.preventDefault()}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        onError={handleVideoError}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        className="w-full h-auto max-h-[65vh] object-cover rounded-2xl"
                    >
                        <source src={src} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* Top Overlay Badge - only when not using native controls */}
                    {!showControls && (
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-lg flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                                {label}
                            </span>
                        </div>
                    )}

                    {/* Click-to-Play overlay — shown when video is not playing and not using native controls */}
                    {!isPlaying && !showControls && (
                        <div
                            onClick={handlePlayClick}
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-[2px] transition-all"
                        >
                            <div className="w-20 h-20 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform hover:scale-110 active:scale-95 transition-all">
                                <Icon name="play" size={36} />
                            </div>
                            <span className="mt-3 text-sm font-bold text-white uppercase tracking-wider bg-slate-900/90 px-4 py-1.5 rounded-full border border-slate-700">
                                Tap to Play Video
                            </span>
                        </div>
                    )}

                    {/* Progress Bar overlay at bottom */}
                    {!showControls && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80 z-20">
                            <div
                                className="h-full bg-cyan-400 transition-all duration-150 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                /* Error / Fallback — offer direct link to video file */
                <div className="nav-video-placeholder p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[340px] space-y-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                        <Icon name="notice" size={32} />
                    </div>

                    <div className="space-y-1.5 max-w-md">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {label}
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-wide">
                            Video Stream Preview
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            {subLabel}
                        </p>
                        <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
                        >
                            Open Video in New Tab
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onEnded}
                            className="shadow-lg shadow-cyan-500/20"
                        >
                            Skip to Next Phase →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
