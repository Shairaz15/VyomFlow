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
    return (
        <div className="navigation-hud">
            <div className="hud-top-row">
                <div className="hud-badge currentLocation">
                    <span className="badge-label">CURRENT LOCATION</span>
                    <span className="badge-value">
                        {currentNode.emoji} {currentNode.label}
                    </span>
                </div>

                <div className="hud-badge destinationTarget">
                    <span className="badge-label">TARGET DESTINATION</span>
                    <span className="badge-value">
                        {destinationNode.emoji} {destinationNode.label}
                    </span>
                </div>
            </div>

            <div className="hud-stats-row">
                <div className="stat-pill">
                    <span className="stat-icon">👣</span>
                    <span className="stat-label">Moves:</span>
                    <span className="stat-val">{moveCount}</span>
                </div>

                <div className="stat-pill">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-label">Time:</span>
                    <span className="stat-val">{elapsedTimeSeconds.toFixed(1)}s</span>
                </div>
            </div>
        </div>
    );
}
