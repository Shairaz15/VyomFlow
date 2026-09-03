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
    const [hasError, setHasError] = useState<boolean>(false);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);

    // Reset error state when src changes
    useEffect(() => {
        setHasError(false);
        setProgress(0);
        setIsSimulating(false);
    }, [src]);

    const handleTimeUpdate = () => {
        if (videoRef.current && videoRef.current.duration) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            setProgress((current / duration) * 100);
        }
    };

    const handleVideoEnded = () => {
        setProgress(100);
        onEnded();
    };

    const handleVideoError = () => {
        setHasError(true);
    };

    // Simulated playback for demo / placeholder testing
    const startSimulatedPlayback = () => {
        setIsSimulating(true);
        let current = 0;
        const interval = setInterval(() => {
            current += 10;
            if (current >= 100) {
                clearInterval(interval);
                setProgress(100);
                setIsSimulating(false);
                onEnded();
            } else {
                setProgress(current);
            }
        }, 300); // 3-second simulation
    };

    return (
        <div className={`nav-video-container relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl ${className}`}>
            {!hasError && src ? (
                <>
                    <video
                        ref={videoRef}
                        src={src}
                        autoPlay={autoPlay}
                        playsInline
                        disablePictureInPicture
                        controlsList="nodownload nofullscreen noremoteplayback"
                        onContextMenu={(e) => e.preventDefault()}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        onError={handleVideoError}
                        className="w-full h-auto max-h-[65vh] object-cover rounded-2xl"
                    />

                    {/* Minimal Progress Bar overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80">
                        <div
                            className="h-full bg-cyan-400 transition-all duration-150 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </>
            ) : (
                /* Fallback Placeholder Card when video file is not yet uploaded */
                <div className="nav-video-placeholder p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[340px] space-y-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center animate-pulse">
                        <Icon name="navigation" size={32} />
                    </div>

                    <div className="space-y-1.5 max-w-md">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {label}
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-wide">
                            PoV Walking Footage Preview
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                            {subLabel}
                        </p>
                    </div>

                    <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-xs text-slate-400 max-w-sm flex items-center gap-2">
                        <Icon name="info" size={16} className="text-amber-400 flex-shrink-0" />
                        <span>Media asset: <code className="text-cyan-300 text-[11px]">{src}</code></span>
                    </div>

                    {/* Progress Bar for simulated video */}
                    {isSimulating && (
                        <div className="w-full max-w-xs space-y-1.5">
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 ease-linear rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[11px] text-cyan-300 font-mono">Simulating clip playback... {progress}%</span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                        <Button
                            variant="primary"
                            size="md"
                            disabled={isSimulating}
                            onClick={startSimulatedPlayback}
                            className="shadow-lg shadow-cyan-500/20"
                        >
                            <Icon name="play" size={16} />
                            {isSimulating ? "Playing..." : "Simulate Clip Playback (3s)"}
                        </Button>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={onEnded}
                        >
                            Skip to Next →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
