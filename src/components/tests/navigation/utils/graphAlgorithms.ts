import type { MapGraph, MapNode, MapEdge } from "../../../../types/navigationTypes";

export interface AdjacentNodeInfo {
    node: MapNode;
    edge: MapEdge;
    direction: "north" | "south" | "east" | "west";
}

/**
 * Get all connected adjacent nodes from a specified current node.
 */
export function getAdjacentNodes(graph: MapGraph, currentNodeId: string): AdjacentNodeInfo[] {
    const results: AdjacentNodeInfo[] = [];

    graph.edges.forEach((edge) => {
        if (edge.from === currentNodeId) {
            const targetNode = graph.nodes.find((n) => n.id === edge.to);
            if (targetNode) {
                results.push({ node: targetNode, edge, direction: edge.direction });
            }
        }
    });

    return results;
}

/**
 * Returns available cardinal directions ("north" | "south" | "east" | "west") from the current node.
 */
export function getAvailableDirections(
    graph: MapGraph,
    currentNodeId: string
): ("north" | "south" | "east" | "west")[] {
    const adj = getAdjacentNodes(graph, currentNodeId);
    return adj.map((item) => item.direction);
}

/**
 * Dijkstra's shortest path algorithm.
 * Returns array of node IDs from start to destination.
 */
export function findShortestPath(
    graph: MapGraph,
    startNodeId: string,
    destNodeId: string
): string[] {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    graph.nodes.forEach((node) => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
        unvisited.add(node.id);
    });

    distances[startNodeId] = 0;

    while (unvisited.size > 0) {
        // Find unvisited node with smallest distance
        let currentId: string | null = null;
        let smallestDist = Infinity;

        unvisited.forEach((id) => {
            if (distances[id] < smallestDist) {
                smallestDist = distances[id];
                currentId = id;
            }
        });

        if (!currentId || currentId === destNodeId || smallestDist === Infinity) {
            break;
        }

        unvisited.delete(currentId);

        const neighbors = getAdjacentNodes(graph, currentId);
        neighbors.forEach(({ node, edge }) => {
            if (unvisited.has(node.id)) {
                const alt = distances[currentId!] + edge.weight;
                if (alt < distances[node.id]) {
                    distances[node.id] = alt;
                    previous[node.id] = currentId;
                }
            }
        });
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = destNodeId;
    while (curr) {
        path.unshift(curr);
        curr = previous[curr];
    }

    return path[0] === startNodeId ? path : [];
}

/**
 * Calculates direction between two grid points or coordinates.
 */
export function getDirectionBetweenNodes(
    fromNode: MapNode,
    toNode: MapNode
): "north" | "south" | "east" | "west" {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;

    if (Math.abs(dy) >= Math.abs(dx)) {
        return dy < 0 ? "north" : "south";
    } else {
        return dx > 0 ? "east" : "west";
    }
}
