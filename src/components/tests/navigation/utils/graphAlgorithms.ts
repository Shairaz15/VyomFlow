import type { MapGraph, MapNode, MapEdge } from "../../../../types/navigationTypes";

export interface AdjacentNodeInfo {
    node: MapNode;
    edge: MapEdge;
    direction: "north" | "south" | "east" | "west";
}

/**
 * Returns reachable neighbor nodes from a given node ID along with edge direction.
 */
export function getAdjacentNodes(graph: MapGraph, nodeId: string): AdjacentNodeInfo[] {
    const outgoingEdges = graph.edges.filter((e) => e.from === nodeId);
    const result: AdjacentNodeInfo[] = [];

    for (const edge of outgoingEdges) {
        const targetNode = graph.nodes.find((n) => n.id === edge.to);
        if (targetNode) {
            result.push({
                node: targetNode,
                edge,
                direction: edge.direction,
            });
        }
    }

    return result;
}

/**
 * Returns which D-pad directions ("north" | "south" | "east" | "west") are valid moves from nodeId.
 */
export function getAvailableDirections(
    graph: MapGraph,
    nodeId: string
): Record<"north" | "south" | "east" | "west", boolean> {
    const adjacent = getAdjacentNodes(graph, nodeId);
    const available = {
        north: false,
        south: false,
        east: false,
        west: false,
    };

    for (const item of adjacent) {
        available[item.direction] = true;
    }

    return available;
}

/**
 * Checks if a given node is on the optimal path sequence.
 */
export function isOnOptimalPath(nodeId: string, optimalPath: string[]): boolean {
    return optimalPath.includes(nodeId);
}

/**
 * Compares actual path traversed with optimal path sequence.
 * Returns route deviation (extra steps taken beyond optimal).
 */
export function comparePaths(
    optimalPath: string[],
    actualPath: string[]
): {
    optimalLength: number;
    actualLength: number;
    extraSteps: number;
    pathEfficiency: number;
} {
    const optimalLength = Math.max(0, optimalPath.length - 1); // number of edges
    const actualLength = Math.max(0, actualPath.length - 1); // number of edges
    const extraSteps = Math.max(0, actualLength - optimalLength);
    const pathEfficiency = actualLength > 0 ? Math.min(1, optimalLength / actualLength) : 1;

    return {
        optimalLength,
        actualLength,
        extraSteps,
        pathEfficiency,
    };
}

/**
 * Dijkstra's shortest path algorithm between startId and endId.
 */
export function findShortestPath(graph: MapGraph, startId: string, endId: string): string[] {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    for (const node of graph.nodes) {
        distances[node.id] = Infinity;
        previous[node.id] = null;
        unvisited.add(node.id);
    }

    distances[startId] = 0;

    while (unvisited.size > 0) {
        // Pick node in unvisited with smallest distance
        let currentId: string | null = null;
        let smallestDist = Infinity;

        for (const nodeId of unvisited) {
            if (distances[nodeId] < smallestDist) {
                smallestDist = distances[nodeId];
                currentId = nodeId;
            }
        }

        if (currentId === null || smallestDist === Infinity || currentId === endId) {
            break;
        }

        unvisited.delete(currentId);

        const neighbors = getAdjacentNodes(graph, currentId);
        for (const neighbor of neighbors) {
            if (unvisited.has(neighbor.node.id)) {
                const alt = distances[currentId] + neighbor.edge.weight;
                if (alt < distances[neighbor.node.id]) {
                    distances[neighbor.node.id] = alt;
                    previous[neighbor.node.id] = currentId;
                }
            }
        }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = endId;
    while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
    }

    return path[0] === startId ? path : [];
}
