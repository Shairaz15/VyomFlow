import type { MovementRecord } from "../../../../types/navigationTypes";

/**
 * Dedicated Movement Logger service.
 * Acts as the single source of truth for all user movement events during navigation.
 */
export class MovementLogger {
    private logs: MovementRecord[] = [];
    private sessionStartTime: number = Date.now();
    private lastMoveTime: number = Date.now();
    private cumulativeDistance: number = 0;

    constructor() {
        this.reset();
    }

    public reset(): void {
        this.logs = [];
        this.sessionStartTime = Date.now();
        this.lastMoveTime = Date.now();
        this.cumulativeDistance = 0;
    }

    /**
     * Log a single movement decision event.
     */
    public logMove(record: {
        currentNode: string;
        previousNode: string | null;
        availableDirections: ("north" | "south" | "east" | "west")[];
        chosenDirection: "north" | "south" | "east" | "west";
        correctDirection: "north" | "south" | "east" | "west";
        backtrackStatus: boolean;
        stepDistance?: number;
    }): MovementRecord {
        const now = Date.now();
        const decisionLatency = Math.max(0, now - this.lastMoveTime);
        this.lastMoveTime = now;

        const distance = record.stepDistance ?? 1;
        this.cumulativeDistance += distance;

        const moveRecord: MovementRecord = {
            currentNode: record.currentNode,
            previousNode: record.previousNode,
            availableDirections: record.availableDirections,
            chosenDirection: record.chosenDirection,
            correctDirection: record.correctDirection,
            decisionTimestamp: now,
            decisionLatency,
            distanceTravelled: this.cumulativeDistance,
            backtrackStatus: record.backtrackStatus,
            hesitationFlag: decisionLatency > 2500, // Hesitation pause > 2.5s
            sessionTimestamp: this.sessionStartTime,
        };

        this.logs.push(moveRecord);
        return moveRecord;
    }

    /**
     * Get all logged movement records.
     * Analytics engine reads exclusively from this method.
     */
    public getMovementHistory(): MovementRecord[] {
        return [...this.logs];
    }

    /**
     * Get total move count logged.
     */
    public getMoveCount(): number {
        return this.logs.length;
    }

    /**
     * Get total session duration in ms.
     */
    public getSessionDurationMs(): number {
        return Date.now() - this.sessionStartTime;
    }
}
