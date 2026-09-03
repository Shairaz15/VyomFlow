import { describe, it, expect } from 'vitest';
import { extractFeatures, CLINICAL_FEATURES } from '../clinicalModelEngine';
import type { RawDashboardData } from '../dataMapper';

describe('Clinical Model Engine - 19 Feature Extraction', () => {
    it('should define exactly 19 clinical features matching the NACC specification', () => {
        expect(CLINICAL_FEATURES).toHaveLength(19);
        expect(CLINICAL_FEATURES[0]).toBe('NACCAGE');
        expect(CLINICAL_FEATURES[1]).toBe('EDUC');
        expect(CLINICAL_FEATURES[18]).toBe('ORIENT');
    });

    it('should correctly map demographics from user profile with fallbacks', () => {
        const emptyData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [],
            navigation: []
        };

        // Fallback defaults
        const defaultVector = extractFeatures(emptyData);
        expect(defaultVector[0]).toBe(65); // Default NACCAGE
        expect(defaultVector[1]).toBe(16); // Default EDUC

        // Custom user profile
        const customVector = extractFeatures(emptyData, { age: 78, educationYears: 12 });
        expect(customVector[0]).toBe(78);
        expect(customVector[1]).toBe(12);
    });

    it('should differentiate immediate and delayed story recall', () => {
        const mockData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [{
                id: 's1',
                sessionId: 'sess-1',
                timestamp: new Date(),
                storyId: 'story-1',
                difficulty: 'medium',
                selectedLanguage: 'en-IN',
                nativeTranscript: 'Story transcript',
                englishTranslation: 'Story translation',
                comprehensionResponses: [],
                matchResult: {
                    jaccardSimilarity: 0.8,
                    levenshteinSimilarity: 0.85,
                    sequenceMatchScore: 0.9,
                    infoUnitsMatched: ['u1', 'u2'],
                    infoUnitsOmitted: [],
                    falseRecalls: []
                },
                biomarkers: {
                    memory: {
                        recallAccuracy: 0.8,
                        infoUnitsRecalled: 8,
                        totalInfoUnits: 10,
                        omissionCount: 2,
                        falseRecallCount: 0
                    },
                    comprehension: {
                        mcqAccuracy: 0.9,
                        correctCount: 9,
                        totalQuestions: 10,
                        avgResponseTimeMs: 1200
                    },
                    narrative: {
                        storySequenceScore: 0.85,
                        narrativeCompleteness: 0.7, // 70% retention completeness
                        similarityScore: 0.8
                    },
                    speech: {
                        speechRateWPM: 130,
                        lexicalDiversity: 0.65,
                        hesitationRate: 0.04,
                        pauseFrequency: 3
                    }
                },
                storyRecallScore: 80
            }],
            navigation: []
        };

        const vector = extractFeatures(mockData);
        // CRAFTVRS (immediate) = 0.8 * 25 = 20
        expect(vector[2]).toBe(20);
        // CRAFTDVR (delayed) = 0.8 * 0.7 * 25 = 14
        expect(vector[3]).toBeCloseTo(14, 1);
        expect(vector[2]).not.toBe(vector[3]); // Differentiated!
    });

    it('should independently derive multi-dimensional language features', () => {
        const mockData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [{
                id: 'lang-1',
                sessionId: 'sess-1',
                timestamp: new Date(),
                transcript: 'Speaking sample text',
                rawMetrics: {
                    wordCount: 120,
                    speechDuration: 60000,
                    pauseDurationAvg: 300,
                    pauseCount: 4,
                    fillerWordCount: 2,
                    repetitions: 1,
                    uniqueWordCount: 80
                },
                derivedFeatures: {
                    wpm: 120,
                    lexicalDiversity: 0.7,
                    rootTTR: 0.8,
                    hesitationIndex: 0.03,
                    fluencyIndex: 85,
                    speechStability: 90,
                    semanticCoherence: 80,
                    syntacticComplexity: 75,
                    ideaDensity: 0.6,
                    cognitiveSpeechIndex: 88,
                    coherenceProxy: 80
                },
                explainability: { keyFactors: [] }
            }],
            vmra: [],
            story: [],
            navigation: []
        };

        const vector = extractFeatures(mockData);
        // ANIMALS: semanticCoherence * 18 + lexicalDiversity * 10 + ideaDensity * 7
        expect(vector[6]).toBeGreaterThan(15);
        // VEG: rootTTR * 16 + lexicalDiversity * 14
        expect(vector[7]).toBeGreaterThan(10);
        // MOCAFLUE: speech pace ratio * 5
        expect(vector[8]).toBeGreaterThan(2);
        // MINTTOTS: CSI * 32
        expect(vector[9]).toBeCloseTo(0.88 * 32, 0);
        // MOCALETT: Syntactic complexity * 5
        expect(vector[15]).toBeCloseTo(0.75 * 5, 0);
    });

    it('should integrate Reaction / SAVT into WAIS and TRAILA processing speed', () => {
        const fastReactionData: RawDashboardData = {
            reaction: [{
                timestamp: new Date().toISOString(),
                aggregates: { avg: 220, min: 180, max: 280, std: 25 },
                rounds: []
            } as any],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [],
            navigation: []
        };

        const slowReactionData: RawDashboardData = {
            reaction: [{
                timestamp: new Date().toISOString(),
                aggregates: { avg: 550, min: 400, max: 700, std: 60 },
                rounds: []
            } as any],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [],
            navigation: []
        };

        const fastVector = extractFeatures(fastReactionData);
        const slowVector = extractFeatures(slowReactionData);

        // WAIS score should be higher for faster reaction time
        expect(fastVector[12]).toBeGreaterThan(slowVector[12]!);
        // TRAILA time (seconds) should be lower (faster) for quick reaction time
        expect(fastVector[10]).toBeLessThan(slowVector[10]!);
    });

    it('should integrate Video Navigation into ORIENT and MOCACLOC spatial scores', () => {
        const goodNavData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [{
                sessionId: 's-1',
                timestamp: new Date(),
                config: {} as any,
                rawMetrics: {} as any,
                features: { recallAccuracy: 0.9, gridCoverage: 0.9, precision: 0.85 } as any,
                profile: {} as any,
                explainability: { keyFactors: [] }
            }],
            story: [],
            navigation: [{
                sessionId: 'nav-1',
                timestamp: new Date(),
                scenarioId: 'city-1',
                difficulty: 'medium',
                routeChoices: [],
                biomarkers: {
                    navigationAccuracy: 0.95,
                    landmarkRecognitionAccuracy: 0.9,
                    spatialMemoryIndex: 92,
                    wayfindingEfficiency: 0.9,
                    headingErrorDegrees: 5,
                    stopsAndPausesCount: 1,
                    backtrackingCount: 0,
                    timeToCompleteSeconds: 45
                },
                navigationScore: 92,
                explainability: { keyFactors: [] }
            }]
        };

        const disorientedNavData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [{
                sessionId: 's-1',
                timestamp: new Date(),
                config: {} as any,
                rawMetrics: {} as any,
                features: { recallAccuracy: 0.4, gridCoverage: 0.5, precision: 0.4 } as any,
                profile: {} as any,
                explainability: { keyFactors: [] }
            }],
            story: [],
            navigation: [{
                sessionId: 'nav-2',
                timestamp: new Date(),
                scenarioId: 'city-1',
                difficulty: 'medium',
                routeChoices: [],
                biomarkers: {
                    navigationAccuracy: 0.3,
                    landmarkRecognitionAccuracy: 0.4,
                    spatialMemoryIndex: 35,
                    wayfindingEfficiency: 0.3,
                    headingErrorDegrees: 45,
                    stopsAndPausesCount: 8,
                    backtrackingCount: 5,
                    timeToCompleteSeconds: 120
                },
                navigationScore: 35,
                explainability: { keyFactors: [] }
            }]
        };

        const goodVector = extractFeatures(goodNavData);
        const disorientedVector = extractFeatures(disorientedNavData);

        // ORIENT: 0.0 is normal, higher indicates disorientation
        expect(goodVector[18]).toBeLessThan(0.3);
        expect(disorientedVector[18]).toBeGreaterThan(1.0);

        // MOCACLOC: Clock drawing score (higher is better)
        expect(goodVector[17]).toBeGreaterThan(disorientedVector[17]!);
    });

    it('should derive Digit Span Forward and Backward lengths from Pattern memory load', () => {
        const mockData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [{
                sessionId: 'p-1',
                timestamp: new Date(),
                metrics: {
                    correctRounds: 6,
                    totalRounds: 7,
                    maxLevelReached: 7,
                    averageResponseLatency: 800,
                    averageCompletionTime: 3000
                } as any,
                features: {
                    sequenceAccuracyTrend: 0.1,
                    learningRate: 15,
                    errorGrowthRate: 0,
                    memoryLoadTolerance: 90,
                    patternStabilityIndex: 85
                } as any,
                explainability: { keyFactors: [] }
            }],
            language: [],
            vmra: [],
            story: [],
            navigation: []
        };

        const vector = extractFeatures(mockData);
        // DIGIFLEN (Forward span): maxLevelReached + 1 = 8
        expect(vector[13]).toBe(8);
        // DIGIBLEN (Backward span): ~5-6
        expect(vector[14]).toBeGreaterThanOrEqual(5);
        expect(vector[13]).toBeGreaterThan(vector[14]!);
    });
});
