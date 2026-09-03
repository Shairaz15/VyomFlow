import type { PatternRoundData } from "../types/patternTypes";

/**
 * Extracts deep cognitive features from raw pattern assessment data.
 */
export function extractPatternFeatures(rounds: PatternRoundData[]) {
    if (rounds.length === 0) {
        return {
            sequenceAccuracyTrend: 0,
            learningRate: 0,
            errorGrowthRate: 0,
            memoryLoadTolerance: 0,
            patternStabilityIndex: 0,
        };
    }

    // 1. Learning Rate: Speedup acquisition across rounds (normalized in seconds)
    const normalizedTimes = rounds.map(r => {
        const timeInSec = r.completionTime > 100 ? r.completionTime / 1000 : r.completionTime;
        return timeInSec / Math.max(1, r.sequenceLength);
    });
    const timeSlope = calculateSlope(normalizedTimes);
    // Negative slope = faster per round = positive learning rate index
    // Clinical baseline is centered at ~23.3 (range 5 to 45)
    const learningRate = Math.max(5, Math.min(45, Math.round(23.3 + (-timeSlope * 25))));


    // 2. Memory Load Tolerance: Performance at max sequence length
    const maxSeqLength = Math.max(...rounds.map(r => r.sequenceLength));
    const maxLoadRounds = rounds.filter(r => r.sequenceLength >= maxSeqLength - 1);
    const memoryLoadTolerance = maxLoadRounds.length > 0
        ? (maxLoadRounds.filter(r => r.isCorrect).length / maxLoadRounds.length) * 100
        : 0;

    // 3. Pattern Stability: Variance in response latency
    const latencies = rounds.map(r => r.responseLatency);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const variance = latencies.reduce((sum, val) => sum + Math.pow(val - avgLatency, 2), 0) / latencies.length;
    // Higher variance = lower stability. Map 0-1000 variance to 100-0 score.
    const patternStabilityIndex = Math.max(0, 100 - (Math.sqrt(variance) / 10));

    // 4. Error Growth Rate
    // Compare error rate in first half vs second half
    const mid = Math.floor(rounds.length / 2);
    const firstHalf = rounds.slice(0, mid);
    const secondHalf = rounds.slice(mid);
    const firstHalfErrors = firstHalf.filter(r => !r.isCorrect).length;
    const secondHalfErrors = secondHalf.filter(r => !r.isCorrect).length;
    const errorGrowthRate = mid > 0 ? (secondHalfErrors - firstHalfErrors) / mid : 0;

    return {
        sequenceAccuracyTrend: 0, // Placeholder
        learningRate,
        errorGrowthRate,
        memoryLoadTolerance,
        patternStabilityIndex,
    };
}

function calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
}
