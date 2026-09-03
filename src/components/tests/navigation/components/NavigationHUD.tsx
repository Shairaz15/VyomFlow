import type { MapNode } from "../../../../types/navigationTypes";

interface NavigationHUDProps {
    currentNode: MapNode;
    destinationNode: MapNode;
    moveCount: number;
    elapsedTimeSeconds: number;
}

export function NavigationHUD({
    currentNode,
    destinationNode,
    moveCount,
    elapsedTimeSeconds,
}: NavigationHUDProps) {
    const formattedTime = elapsedTimeSeconds.toFixed(1);

    return (
        <div className="nav-hud-bar w-full bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-4 mb-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-sm">
            {/* Current Node */}
            <div className="flex items-center gap-2">
                <span className="text-xl">{currentNode.emoji || "📍"}</span>
                <div>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Current Location</div>
                    <div className="font-semibold text-white">
                        {currentNode.landmark || currentNode.label}
                    </div>
                </div>
            </div>

            {/* Destination Target */}
            <div className="flex items-center gap-2">
                <span className="text-xl">🏁</span>
                <div>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Destination</div>
                    <div className="font-semibold text-emerald-400">
                        {destinationNode.landmark || destinationNode.label}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 font-mono">
                <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400">Moves</div>
                    <div className="font-bold text-cyan-300">{moveCount}</div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400">Timer</div>
                    <div className="font-bold text-amber-300">{formattedTime}s</div>
                </div>
            </div>
        </div>
    );
}
