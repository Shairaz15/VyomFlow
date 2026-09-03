import type { SessionMetadata } from "../../../../types/navigationTypes";

export class SessionMetadataCollector {
    private startTime: number;
    private frameCount: number = 0;
    private animFrameId: number | null = null;
    private estimatedFps: number = 60;
    private inputMethod: "touch" | "keyboard" = "keyboard";

    constructor() {
        this.startTime = Date.now();
        this.startFpsTracker();
        this.registerInputListeners();
    }

    private registerInputListeners(): void {
        if (typeof window === "undefined") return;

        const touchHandler = () => {
            this.inputMethod = "touch";
        };
        const keyHandler = () => {
            this.inputMethod = "keyboard";
        };

        window.addEventListener("touchstart", touchHandler, { once: true, passive: true });
        window.addEventListener("keydown", keyHandler, { once: true });
    }

    private startFpsTracker(): void {
        if (typeof window === "undefined") return;

        let lastTime = performance.now();
        const loop = (now: number) => {
            this.frameCount++;
            const delta = now - lastTime;
            if (delta >= 1000) {
                this.estimatedFps = Math.round((this.frameCount * 1000) / delta);
                this.frameCount = 0;
                lastTime = now;
            }
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    public setInputMethod(method: "touch" | "keyboard"): void {
        this.inputMethod = method;
    }

    public collect(durationMs?: number): SessionMetadata {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
        }

        const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
        const width = typeof window !== "undefined" ? window.innerWidth : 1024;
        const height = typeof window !== "undefined" ? window.innerHeight : 768;
        const screenW = typeof screen !== "undefined" ? screen.width : 1024;
        const screenH = typeof screen !== "undefined" ? screen.height : 768;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) || (isMobile && width >= 600);

        const deviceType: "mobile" | "tablet" | "desktop" = isTablet
            ? "tablet"
            : isMobile
            ? "mobile"
            : "desktop";

        return {
            browser: this.getBrowserName(userAgent),
            deviceType,
            screenResolution: `${screenW}x${screenH}`,
            viewportSize: `${width}x${height}`,
            inputMethod: this.inputMethod,
            fps: Math.min(120, Math.max(1, this.estimatedFps)),
            timestamp: Date.now(),
            durationMs: durationMs ?? (Date.now() - this.startTime),
        };
    }

    private getBrowserName(ua: string): string {
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("SamsungBrowser")) return "Samsung Internet";
        if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
        if (ua.includes("Trident")) return "Internet Explorer";
        if (ua.includes("Edge")) return "Edge (Legacy)";
        if (ua.includes("Edg")) return "Edge (Chromium)";
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Safari")) return "Safari";
        return "Browser";
    }
}
