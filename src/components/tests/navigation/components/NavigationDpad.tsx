import { useEffect, useCallback, useState } from "react";

interface NavigationDpadProps {
    availableDirections: Record<"north" | "south" | "east" | "west", boolean>;
    onMove: (direction: "north" | "south" | "east" | "west") => void;
    disabled?: boolean;
}

export function NavigationDpad({ availableDirections, onMove, disabled = false }: NavigationDpadProps) {
    const [pressedDir, setPressedDir] = useState<string | null>(null);

    const handleDirection = useCallback(
        (dir: "north" | "south" | "east" | "west") => {
            if (!disabled && availableDirections[dir]) {
                setPressedDir(dir);
                setTimeout(() => setPressedDir(null), 150);
                onMove(dir);
            }
        },
        [availableDirections, disabled, onMove]
    );

    // Keyboard arrow keys listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;

            switch (e.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    if (availableDirections.north) {
                        e.preventDefault();
                        handleDirection("north");
                    }
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    if (availableDirections.south) {
                        e.preventDefault();
                        handleDirection("south");
                    }
                    break;
                case "ArrowLeft":
                case "a":
                case "A":
                    if (availableDirections.west) {
                        e.preventDefault();
                        handleDirection("west");
                    }
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    if (availableDirections.east) {
                        e.preventDefault();
                        handleDirection("east");
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [availableDirections, disabled, handleDirection]);

    return (
        <div className="navigation-dpad-wrapper">
            <div className="dpad-grid" role="group" aria-label="Navigation Directional Controls">
                {/* Empty top-left corner */}
                <div />

                {/* UP / NORTH */}
                <button
                    type="button"
                    className={`dpad-btn dpad-up ${availableDirections.north ? "active" : "disabled"} ${
                        pressedDir === "north" ? "pressed" : ""
                    }`}
                    disabled={disabled || !availableDirections.north}
                    onClick={() => handleDirection("north")}
                    aria-label="Move North"
                >
                    <span className="dpad-arrow">▲</span>
                    <span className="dpad-key-badge">W</span>
                </button>

                {/* Empty top-right corner */}
                <div />

                {/* LEFT / WEST */}
                <button
                    type="button"
                    className={`dpad-btn dpad-left ${availableDirections.west ? "active" : "disabled"} ${
                        pressedDir === "west" ? "pressed" : ""
                    }`}
                    disabled={disabled || !availableDirections.west}
                    onClick={() => handleDirection("west")}
                    aria-label="Move West"
                >
                    <span className="dpad-arrow">◀</span>
                    <span className="dpad-key-badge">A</span>
                </button>

                {/* Dpad center hub */}
                <div className="dpad-center">
                    <span className="dpad-center-dot">●</span>
                </div>

                {/* RIGHT / EAST */}
                <button
                    type="button"
                    className={`dpad-btn dpad-right ${availableDirections.east ? "active" : "disabled"} ${
                        pressedDir === "east" ? "pressed" : ""
                    }`}
                    disabled={disabled || !availableDirections.east}
                    onClick={() => handleDirection("east")}
                    aria-label="Move East"
                >
                    <span className="dpad-arrow">▶</span>
                    <span className="dpad-key-badge">D</span>
                </button>

                {/* Empty bottom-left corner */}
                <div />

                {/* DOWN / SOUTH */}
                <button
                    type="button"
                    className={`dpad-btn dpad-down ${availableDirections.south ? "active" : "disabled"} ${
                        pressedDir === "south" ? "pressed" : ""
                    }`}
                    disabled={disabled || !availableDirections.south}
                    onClick={() => handleDirection("south")}
                    aria-label="Move South"
                >
                    <span className="dpad-arrow">▼</span>
                    <span className="dpad-key-badge">S</span>
                </button>

                {/* Empty bottom-right corner */}
                <div />
            </div>

            <p className="dpad-hint">Tap direction buttons or use Keyboard (W, A, S, D / Arrow Keys)</p>
        </div>
    );
}
