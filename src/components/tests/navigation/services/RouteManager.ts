import type { MapGraph, MapNode } from "../../../../types/navigationTypes";
import { getAdjacentNodes, getAvailableDirections, findShortestPath } from "../utils/graphAlgorithms";
import { MovementLogger } from "./MovementLogger";

export interface MoveExecutionResult {
    success: boolean;
    targetNode: MapNode | null;
    isDestinationReached: boolean;
    isBacktrack: boolean;
    isCorrectMove: boolean;
}

export class RouteManager {
    private graph: MapGraph;
    private currentNodeId: string;
    private previousNodeId: string | null = null;
    private visitedNodes: string[] = [];
    private logger: MovementLogger;
    private optimalPath: string[];

    constructor(graph: MapGraph, logger: MovementLogger) {
        this.graph = graph;
        this.logger = logger;
        this.optimalPath = graph.optimalPath;

        const startNode = graph.nodes.find((n) => n.isStart) || graph.nodes[0];
        this.currentNodeId = startNode.id;
        this.visitedNodes = [startNode.id];
    }

    public getCurrentNodeId(): string {
        return this.currentNodeId;
    }

    public getCurrentNode(): MapNode {
        return this.graph.nodes.find((n) => n.id === this.currentNodeId) || this.graph.nodes[0];
    }

    public getVisitedNodes(): string[] {
        return [...this.visitedNodes];
    }

    /**
     * Execute a user move in a given cardinal direction.
     * Validates topology, determines correct path direction, logs to MovementLogger, and updates position.
     */
    public executeMove(direction: "north" | "south" | "east" | "west"): MoveExecutionResult {
        const adjacent = getAdjacentNodes(this.graph, this.currentNodeId);
        const availableDirs = getAvailableDirections(this.graph, this.currentNodeId);
        const targetObj = adjacent.find((item) => item.direction === direction);

        if (!targetObj) {
            return {
                success: false,
                targetNode: null,
                isDestinationReached: false,
                isBacktrack: false,
                isCorrectMove: false,
            };
        }

        const targetNode = targetObj.node;

        // Calculate correct direction from current node along remaining optimal path
        const currentOptimalIdx = this.optimalPath.indexOf(this.currentNodeId);
        let correctDirection: "north" | "south" | "east" | "west" = availableDirs[0];

        if (currentOptimalIdx !== -1 && currentOptimalIdx < this.optimalPath.length - 1) {
            const nextOptimalId = this.optimalPath[currentOptimalIdx + 1];
            const nextOptimalObj = adjacent.find((item) => item.node.id === nextOptimalId);
            if (nextOptimalObj) {
                correctDirection = nextOptimalObj.direction;
            }
        } else {
            // Re-calculate shortest path from current node to destination using Dijkstra
            const destNode = this.graph.nodes.find((n) => n.isDestination) || this.graph.nodes[this.graph.nodes.length - 1];
            const dynamicShortestPath = findShortestPath(this.graph, this.currentNodeId, destNode.id);
            if (dynamicShortestPath.length >= 2) {
                const nextId = dynamicShortestPath[1];
                const matchObj = adjacent.find((item) => item.node.id === nextId);
                if (matchObj) correctDirection = matchObj.direction;
            }
        }

        const isCorrectMove = targetObj.direction === correctDirection;
        const isBacktrack = this.previousNodeId !== null && targetNode.id === this.previousNodeId;

        // Log move to MovementLogger (Single Source of Truth)
        this.logger.logMove({
            currentNode: targetNode.id,
            previousNode: this.currentNodeId,
            availableDirections: availableDirs,
            chosenDirection: direction,
            correctDirection,
            backtrackStatus: isBacktrack,
        });

        // State update
        this.previousNodeId = this.currentNodeId;
        this.currentNodeId = targetNode.id;
        this.visitedNodes.push(targetNode.id);

        const isDestinationReached = !!targetNode.isDestination;

        return {
            success: true,
            targetNode,
            isDestinationReached,
            isBacktrack,
            isCorrectMove,
        };
    }
}
