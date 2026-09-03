import { useRef, useState, useEffect } from "react";
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
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [needsUserGesture, setNeedsUserGesture] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    // Initialize playback when src changes
    useEffect(() => {
        setHasError(false);
        setProgress(0);
        setNeedsUserGesture(false);

        const video = videoRef.current;
        if (!video) return;

        video.src = src;
        video.muted = true;
        video.load();

        if (autoPlay) {
            video.play()
                .then(() => {
                    setIsPlaying(true);
                    setNeedsUserGesture(false);
                })
                .catch(() => {
                    // Browser blocked unmuted/gestureless autoplay
                    setIsPlaying(false);
                    setNeedsUserGesture(true);
                });
        }
    }, [src, autoPlay]);

    const handlePlayClick = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play()
                .then(() => {
                    setIsPlaying(true);
                    setNeedsUserGesture(false);
                })
                .catch((err) => {
                    console.error("Play error:", err);
                });
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleToggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video && video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
        }
    };

    const handleVideoEnded = () => {
        setProgress(100);
        setIsPlaying(false);
        onEnded();
    };

    const handleVideoError = (e: any) => {
        console.warn("Video element error for src:", src, e);
        // Only set error if file truly cannot load
        if (!videoRef.current?.networkState || videoRef.current?.error?.code === 4) {
            setHasError(true);
        }
    };

    return (
        <div className={`nav-video-container relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl ${className}`}>
            {!hasError && src ? (
                <div className="relative group cursor-pointer" onClick={handlePlayClick}>
                    <video
                        ref={videoRef}
                        src={src}
                        autoPlay={autoPlay}
                        muted={isMuted}
                        playsInline
                        preload="auto"
                        disablePictureInPicture
                        controlsList="nodownload nofullscreen noremoteplayback"
                        onContextMenu={(e) => e.preventDefault()}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        onError={handleVideoError}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        className="w-full h-auto max-h-[65vh] object-cover rounded-2xl"
                    />

                    {/* Top Overlay Badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-lg flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                            {label}
                        </span>

                        <div className="pointer-events-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleToggleMute}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-colors"
                            >
                                {isMuted ? "🔇 Unmute" : "🔊 Muted"}
                            </button>
                        </div>
                    </div>

                    {/* Tap / Click to Play Prompt when paused */}
                    {(!isPlaying || needsUserGesture) && (
                        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-[2px] transition-all">
                            <div className="w-16 h-16 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform hover:scale-110 active:scale-95 transition-all">
                                <Icon name="play" size={28} />
                            </div>
                            <span className="mt-3 text-xs font-bold text-white uppercase tracking-wider bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700">
                                Click or Tap to Play Video
                            </span>
                        </div>
                    )}

                    {/* Minimal Progress Bar overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80 z-20">
                        <div
                            className="h-full bg-cyan-400 transition-all duration-150 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            ) : (
                /* Fallback Placeholder Card */
                <div className="nav-video-placeholder p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[340px] space-y-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center animate-pulse">
                        <Icon name="navigation" size={32} />
                    </div>

                    <div className="space-y-1.5 max-w-md">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {label}
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-wide">
                            PoV Walking Footage
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            {subLabel}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onEnded}
                            className="shadow-lg shadow-cyan-500/20"
                        >
                            Proceed to Destination Question →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
