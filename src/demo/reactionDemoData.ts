/**
 * Reaction Demo Data
 * Synthetic reaction test data for dashboard demonstration.
 */

import type { RoundResult } from "../components/tests/reaction/reactionLogic";
import type { ReactionTestResult } from "../components/tests/reaction/reactionFeatures";
import { createReactionTestResult } from "../components/tests/reaction/reactionFeatures";

/**
 * Creates synthetic rounds for a given profile.
 */
function createSyntheticRounds(
    baseTimes: number[],
    falseStarts: number[] = [],
    timeouts: number[] = []
): RoundResult[] {
    const rounds: RoundResult[] = [];

    for (let i = 0; i < 6; i++) {
        const isCalibration = i === 0;
        const isFalseStart = falseStarts.includes(i);
        const isTimeout = timeouts.includes(i);

        rounds.push({
            roundIndex: i,
            isCalibration,
            isFalseStart,
            isTimeout,
            reactionTime: isFalseStart || isTimeout ? null : baseTimes[i] || 300,
        });
    }

    return rounds;
}

/**
 * Fast, consistent user profile.
 */
export const FAST_USER_SESSIONS: ReactionTestResult[] = [
    createReactionTestResult(
        createSyntheticRounds([240, 245, 238, 252, 248, 241]),
        "fast-session-1"
    ),
    createReactionTestResult(
        createSyntheticRounds([235, 242, 239, 244, 240, 238]),
        "fast-session-2"
    ),
    createReactionTestResult(
        createSyntheticRounds([238, 240, 236, 245, 242, 239]),
        "fast-session-3"
    ),
];

/**
 * Declining user profile - reaction times increasing over sessions.
 */
export const DECLINING_USER_SESSIONS: ReactionTestResult[] = [
    createReactionTestResult(
        createSyntheticRounds([280, 285, 290, 295, 288, 292]),
        "decline-session-1"
    ),
    createReactionTestResult(
        createSyntheticRounds([310, 325, 318, 335, 322, 340]),
        "decline-session-2"
    ),
    createReactionTestResult(
        createSyntheticRounds([360, 380, 375, 395, 388, 410]),
        "decline-session-3"
    ),
    createReactionTestResult(
        createSyntheticRounds([420, 445, 455, 470, 465, 480]),
        "decline-session-4"
    ),
];

/**
 * Inconsistent user profile - high variance, some errors.
 */
export const INCONSISTENT_USER_SESSIONS: ReactionTestResult[] = [
    createReactionTestResult(
        createSyntheticRounds([250, 380, 290, 420, 310, 480], [2]),
        "inconsistent-session-1"
    ),
    createReactionTestResult(
        createSyntheticRounds([350, 280, 450, 260, 400, 320], [], [3]),
        "inconsistent-session-2"
    ),
    createReactionTestResult(
        createSyntheticRounds([270, 440, 300, 380, 290, 460], [1, 4]),
        "inconsistent-session-3"
    ),
];

/**
 * Get reaction demo data for a specific profile.
 */
export function getReactionDemoSessions(
    profile: "fast" | "declining" | "inconsistent"
): ReactionTestResult[] {
    switch (profile) {
        case "fast":
            return FAST_USER_SESSIONS;
        case "declining":
            return DECLINING_USER_SESSIONS;
        case "inconsistent":
            return INCONSISTENT_USER_SESSIONS;
        default:
            return DECLINING_USER_SESSIONS;
    }
}
