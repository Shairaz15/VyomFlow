import type { MapGraph } from "../../../../types/navigationTypes";
import { getAdjacentNodes } from "../utils/graphAlgorithms";

interface MapBoardProps {
    graph: MapGraph;
    currentNodeId: string;
    visitedNodes?: string[];
    highlightedPath?: string[]; // Node IDs to highlight (for encoding or replay)
    actualPath?: string[]; // Node IDs traversed (for replay)
    phase: "encoding" | "navigation" | "results";
}

export function MapBoard({
    graph,
    currentNodeId,
    visitedNodes = [],
    highlightedPath = [],
    actualPath = [],
    phase,
}: MapBoardProps) {
    const isNodeVisited = (id: string) => visitedNodes.includes(id);

    // Build edge lookup helper to see if an edge is on highlighted route
    const isEdgeInPath = (fromId: string, toId: string, path: string[]) => {
        if (!path || path.length < 2) return false;
        for (let i = 0; i < path.length - 1; i++) {
            if (
                (path[i] === fromId && path[i + 1] === toId) ||
                (path[i] === toId && path[i + 1] === fromId)
            ) {
                return true;
            }
        }
        return false;
    };

    // Fog of War helper: node is visible if it is current, visited, or adjacent to current
    const adjacentNodeIds = phase === "navigation" && currentNodeId
        ? getAdjacentNodes(graph, currentNodeId).map((item) => item.node.id)
        : [];

    const isNodeVisibleInFog = (nodeId: string) => {
        if (phase !== "navigation") return true;
        if (nodeId === currentNodeId) return true;
        if (isNodeVisited(nodeId)) return true;
        if (adjacentNodeIds.includes(nodeId)) return true;
        return false;
    };

    const isEdgeVisibleInFog = (fromId: string, toId: string) => {
        if (phase !== "navigation") return true;
        return isNodeVisibleInFog(fromId) || isNodeVisibleInFog(toId);
    };

    const currentNode = graph.nodes.find((n) => n.id === currentNodeId);

    // Direction arrow symbol converter
    const getDirectionArrow = (dir: string) => {
        switch (dir) {
            case "north": return "⬆";
            case "south": return "⬇";
            case "east": return "➡";
            case "west": return "⬅";
            default: return "➡";
        }
    };

    return (
        <div className="map-board-container">
            {/* Pattern Sequence Ribbon during Encoding */}
            {phase === "encoding" && graph.patternSequence && (
                <div className="pattern-sequence-ribbon">
                    <span className="ribbon-label">PATTERN SEQUENCE:</span>
                    <div className="ribbon-arrows">
                        {graph.patternSequence.map((dir, idx) => (
                            <span key={`seq_${idx}`} className="sequence-arrow-pill">
                                {getDirectionArrow(dir)} {dir.toUpperCase()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <svg
                viewBox="0 0 400 400"
                className="map-board-svg"
                role="img"
                aria-label={`Maze Labyrinth ${graph.name}`}
            >
                <defs>
                    <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.8" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Matrix Background Pattern */}
                    <pattern id="matrixGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
                    </pattern>
                </defs>

                {/* Matrix Grid Background */}
                <rect width="400" height="400" fill="url(#matrixGrid)" rx="12" />

                {/* 1. Render Maze Corridors / Edges */}
                <g className="map-edges">
                    {graph.edges.map((edge, idx) => {
                        const fromNode = graph.nodes.find((n) => n.id === edge.from);
                        const toNode = graph.nodes.find((n) => n.id === edge.to);
                        if (!fromNode || !toNode) return null;

                        const isHighlighted =
                            (phase === "encoding" || phase === "results") &&
                            isEdgeInPath(fromNode.id, toNode.id, highlightedPath);

                        const isActualTraversed =
                            phase === "results" && isEdgeInPath(fromNode.id, toNode.id, actualPath);

                        const inFog = isEdgeVisibleInFog(fromNode.id, toNode.id);

                        let strokeColor = "var(--map-road-default, #cbd5e1)";
                        let strokeWidth = 8;
                        let strokeDasharray = "none";
                        let strokeOpacity = inFog ? 1.0 : 0.25;

                        if (isHighlighted && isActualTraversed) {
                            strokeColor = "#10b981"; // Green: followed optimal
                            strokeWidth = 10;
                        } else if (isHighlighted) {
                            strokeColor = "#6366f1"; // Indigo: encoding path
                            strokeWidth = 10;
                            strokeDasharray = "8,4";
                        } else if (isActualTraversed) {
                            strokeColor = "#ef4444"; // Red: wrong deviation
                            strokeWidth = 8;
                        }

                        return (
                            <line
                                key={`edge_${edge.from}_${edge.to}_${idx}`}
                                x1={fromNode.x}
                                y1={fromNode.y}
                                x2={toNode.x}
                                y2={toNode.y}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeOpacity={strokeOpacity}
                                strokeLinecap="round"
                            />
                        );
                    })}
                </g>

                {/* 2. Render Maze Junction Nodes */}
                <g className="map-nodes">
                    {graph.nodes.map((node) => {
                        const isCurrent = node.id === currentNodeId && phase === "navigation";
                        const isVisited = isNodeVisited(node.id);
                        const inFog = isNodeVisibleInFog(node.id);

                        // Mask emojis & labels during navigation phase
                        const showEmojiAndLabel =
                            phase !== "navigation" ||
                            isCurrent ||
                            isVisited;

                        let fill = "#f1f5f9";
                        let stroke = "#94a3b8";
                        let radius = 18;

                        if (phase !== "navigation") {
                            if (node.isStart) {
                                fill = "#22c55e";
                                stroke = "#15803d";
                                radius = 22;
                            } else if (node.isDestination) {
                                fill = "#f59e0b";
                                stroke = "#b45309";
                                radius = 22;
                            }
                        } else {
                            if (isCurrent) {
                                fill = "#3b82f6";
                                stroke = "#1d4ed8";
                            } else if (isVisited) {
                                fill = "#e0e7ff";
                                stroke = "#6366f1";
                            }
                        }

                        return (
                            <g
                                key={`node_${node.id}`}
                                className={`map-node-group ${isCurrent ? "current-node" : ""} ${
                                    isVisited ? "visited-node" : ""
                                }`}
                                transform={`translate(${node.x}, ${node.y})`}
                                opacity={inFog ? 1.0 : 0.3}
                            >
                                <circle
                                    r={radius}
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth="3"
                                    className="node-circle"
                                />

                                {showEmojiAndLabel ? (
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={node.isStart || node.isDestination ? "20" : "16"}
                                        className="node-emoji"
                                    >
                                        {node.emoji}
                                    </text>
                                ) : (
                                    <circle r="4" fill="#64748b" />
                                )}

                                {showEmojiAndLabel && (
                                    <text
                                        y={node.isStart || node.isDestination ? 34 : 30}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="600"
                                        fill="var(--text-color, #1e293b)"
                                        className="node-label"
                                    >
                                        {node.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>

                {/* 3. Render Current Position Pulsing Halo */}
                {currentNode && phase === "navigation" && (
                    <g transform={`translate(${currentNode.x}, ${currentNode.y})`}>
                        <circle
                            r="26"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            className="pulsing-halo"
                            filter="url(#pulseGlow)"
                        />
                    </g>
                )}
            </svg>
        </div>
    );
}
