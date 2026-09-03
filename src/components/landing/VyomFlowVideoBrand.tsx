import { useEffect, useRef, useState } from 'react';

export function VyomFlowVideoBrand() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ensure video is muted for reliable browser autoplay
        video.defaultMuted = true;
        video.muted = true;

        const tryPlay = () => {
            if (video && video.paused) {
                video.play().catch(() => {});
            }
        };

        tryPlay();

        const handleCanPlay = () => tryPlay();
        const handleError = () => setVideoError(true);

        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('loadeddata', handleCanPlay);
        video.addEventListener('error', handleError);

        // Global user interaction unblocker
        window.addEventListener('click', tryPlay, { once: true });
        window.addEventListener('touchstart', tryPlay, { once: true });

        let animationFrameId: number;

        const render = () => {
            try {
                const dpr = window.devicePixelRatio || 2;
                const targetWidth = Math.max(1200, (canvas.clientWidth || 600) * dpr);
                const targetHeight = Math.max(260, (canvas.clientHeight || 130) * dpr);

                if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                }

                const w = canvas.width;
                const h = canvas.height;

                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, w, h);

                // Draw text mask
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const fontSize = Math.min(w * 0.145, h * 0.75);
                ctx.font = `900 ${fontSize}px 'Playfair Display', Georgia, serif`;
                
                // Safe letter spacing check for cross-browser support
                if ('letterSpacing' in ctx) {
                    (ctx as any).letterSpacing = '-0.025em';
                }

                const text = 'VYOMFLOW';
                ctx.fillText(text, w / 2, h / 2 + fontSize * 0.02);

                // Composite video inside text
                ctx.globalCompositeOperation = 'source-in';

                const isVideoReady =
                    video &&
                    !videoError &&
                    video.readyState >= 2 &&
                    video.videoWidth > 0 &&
                    video.videoHeight > 0;

                if (isVideoReady) {
                    if (video.paused) {
                        video.play().catch(() => {});
                    }

                    const vw = video.videoWidth || 16;
                    const vh = video.videoHeight || 9;
                    const vRatio = vw / vh;
                    const cRatio = w / h;
                    let dw = w;
                    let dh = h;
                    let dx = 0;
                    let dy = 0;

                    if (vRatio > cRatio) {
                        dw = h * vRatio;
                        dx = (w - dw) / 2;
                    } else {
                        dh = w / vRatio;
                        dy = (h - dh) / 2;
                    }

                    if (Number.isFinite(dx) && Number.isFinite(dy) && Number.isFinite(dw) && Number.isFinite(dh)) {
                        ctx.drawImage(video, dx, dy, dw, dh);
                    } else {
                        drawFallbackGradient(ctx, w, h);
                    }
                } else {
                    drawFallbackGradient(ctx, w, h);
                }

                ctx.restore();
            } catch (err) {
                // Ignore transient draw errors to keep loop running
            }

            animationFrameId = requestAnimationFrame(render);
        };

        function drawFallbackGradient(context: CanvasRenderingContext2D, width: number, height: number) {
            const grad = context.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#F7F4EC');
            grad.addColorStop(0.3, '#D8B878');
            grad.addColorStop(0.6, '#8FAF8B');
            grad.addColorStop(1, '#4F7C78');
            context.fillStyle = grad;
            context.fillRect(0, 0, width, height);
        }

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('loadeddata', handleCanPlay);
            video.removeEventListener('error', handleError);
            window.removeEventListener('click', tryPlay);
            window.removeEventListener('touchstart', tryPlay);
        };
    }, [videoError]);

    return (
        <div className="w-full flex flex-col items-center justify-center select-none py-6 overflow-hidden">
            {/* Tagline */}
            <div className="text-xs sm:text-sm font-semibold tracking-[0.28em] text-[#8FAF8B] uppercase mb-1 opacity-90 text-center">
                — MEASURING MINDS, BEYOND MEMORY —
            </div>

            {/* Offscreen Autoplaying Looping Video */}
            <video
                ref={videoRef}
                src="/videos/indian-art-mask.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute opacity-0 pointer-events-none -z-50 w-64 h-64"
            />

            {/* High-res Masked Brand Canvas */}
            <div className="w-full max-w-[1300px] px-2 flex justify-center items-center">
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto max-h-[220px] sm:max-h-[280px] md:max-h-[340px] drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
                    style={{ aspectRatio: '1200 / 240' }}
                />
            </div>
        </div>
    );
}

