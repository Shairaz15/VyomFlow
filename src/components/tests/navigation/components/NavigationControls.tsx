import { useEffect } from "react";

interface NavigationControlsProps {
    availableDirections: ("north" | "south" | "east" | "west")[];
    onMove: (direction: "north" | "south" | "east" | "west") => void;
}

export function NavigationControls({ availableDirections, onMove }: NavigationControlsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
                if (availableDirections.includes("north")) onMove("north");
            } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
                if (availableDirections.includes("south")) onMove("south");
            } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                if (availableDirections.includes("west")) onMove("west");
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                if (availableDirections.includes("east")) onMove("east");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [availableDirections, onMove]);

    const isNorthAvailable = availableDirections.includes("north");
    const isSouthAvailable = availableDirections.includes("south");
    const isEastAvailable = availableDirections.includes("east");
    const isWestAvailable = availableDirections.includes("west");

    return (
        <div className="nav-dpad-container flex flex-col items-center justify-center p-4">
            <div className="dpad-grid relative w-48 h-48 sm:w-56 sm:h-56">
                {/* UP / NORTH */}
                <button
                    type="button"
                    disabled={!isNorthAvailable}
                    className={`dpad-btn dpad-up absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all duration-150 shadow-lg ${
                        isNorthAvailable
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 shadow-cyan-500/25 cursor-pointer"
                            : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800"
                    }`}
                    onClick={() => onMove("north")}
                    aria-label="Move North (Up)"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-[10px] uppercase font-mono tracking-wider mt-0.5">NORTH</span>
                </button>

                {/* LEFT / WEST */}
                <button
                    type="button"
                    disabled={!isWestAvailable}
                    className={`dpad-btn dpad-left absolute top-1/2 left-0 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all duration-150 shadow-lg ${
                        isWestAvailable
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 shadow-cyan-500/25 cursor-pointer"
                            : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800"
                    }`}
                    onClick={() => onMove("west")}
                    aria-label="Move West (Left)"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-[10px] uppercase font-mono tracking-wider mt-0.5">WEST</span>
                </button>

                {/* CENTER HUB */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-inner">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                </div>

                {/* RIGHT / EAST */}
                <button
                    type="button"
                    disabled={!isEastAvailable}
                    className={`dpad-btn dpad-right absolute top-1/2 right-0 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all duration-150 shadow-lg ${
                        isEastAvailable
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 shadow-cyan-500/25 cursor-pointer"
                            : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800"
                    }`}
                    onClick={() => onMove("east")}
                    aria-label="Move East (Right)"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[10px] uppercase font-mono tracking-wider mt-0.5">EAST</span>
                </button>

                {/* DOWN / SOUTH */}
                <button
                    type="button"
                    disabled={!isSouthAvailable}
                    className={`dpad-btn dpad-down absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all duration-150 shadow-lg ${
                        isSouthAvailable
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 shadow-cyan-500/25 cursor-pointer"
                            : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800"
                    }`}
                    onClick={() => onMove("south")}
                    aria-label="Move South (Down)"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-[10px] uppercase font-mono tracking-wider mt-0.5">SOUTH</span>
                </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">Use D-pad or Keyboard Arrow Keys</p>
        </div>
    );
}

export const NavigationDpad = NavigationControls;
