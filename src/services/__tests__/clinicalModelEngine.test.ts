import { describe, it, expect } from 'vitest';
import { extract75Biomarkers, predictCognitiveProfile, evaluateCrossSectionalRisk } from '../clinicalModelEngine';
import type { RawDashboardData } from '../dataMapper';

describe('VyomFlow v2 Multi-Task Clinical Cognitive Engine', () => {
    it('should extract all 80 multimodal features and interactions from raw assessment data and demographics', () => {
        const emptyData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [],
            navigation: []
        };

        const biomarkerMap = extract75Biomarkers(emptyData, { age: 72, educationYears: 14, gender: 'Male' });
        const keys = Object.keys(biomarkerMap);
        
        expect(keys.length).toBe(80);
        expect(biomarkerMap.Age).toBe(72);
        expect(biomarkerMap.Education_Years).toBe(14);
        expect(biomarkerMap.Gender).toBe(0.0); // Male
        expect(biomarkerMap).toHaveProperty('vmra_recallAccuracy');
        expect(biomarkerMap).toHaveProperty('story_recallAccuracy');
        expect(biomarkerMap).toHaveProperty('lang_wpm');
        expect(biomarkerMap).toHaveProperty('pattern_accuracy');
        expect(biomarkerMap).toHaveProperty('reaction_meanLatencyMs');
        expect(biomarkerMap).toHaveProperty('nav_navigationAccuracy');
        expect(biomarkerMap).toHaveProperty('inter_memory_speed_decay');
        expect(biomarkerMap).toHaveProperty('inter_speech_memory_synergy');
    });

    it('should predict healthy senior cognitive profile with high MoCA and Normal class', async () => {
        const healthyData: RawDashboardData = {
            reaction: [{
                timestamp: new Date().toISOString(),
                aggregates: { avg: 240, min: 200, max: 300, std: 20, lapses: 0, premature: 0 },
                rounds: []
            } as any],
            memory: [],
            pattern: [{
                sessionId: 'p1',
                timestamp: new Date(),
                metrics: { correctRounds: 8, totalRounds: 8, maxLevelReached: 8, averageResponseLatency: 600 } as any,
                features: { learningRate: 25, memoryLoadTolerance: 90, patternStabilityIndex: 90 } as any,
                explainability: { keyFactors: [] }
            }],
            language: [{
                id: 'l1',
                sessionId: 's1',
                timestamp: new Date(),
                transcript: 'Healthy speech sample with high lexical diversity',
                rawMetrics: { wordCount: 140, speechDuration: 60000, pauseDurationAvg: 250, pauseCount: 2, fillerWordCount: 1, repetitions: 0 } as any,
                derivedFeatures: {
                    wpm: 140,
                    lexicalDiversity: 0.78,
                    rootTTR: 0.88,
                    hesitationIndex: 0.02,
                    fluencyIndex: 92,
                    speechStability: 94,
                    semanticCoherence: 92,
                    syntacticComplexity: 90,
                    ideaDensity: 0.70,
                    cognitiveSpeechIndex: 92,
                    coherenceProxy: 92
                },
                explainability: { keyFactors: [] }
            }],
            vmra: [{
                sessionId: 'v1',
                timestamp: new Date(),
                config: {} as any,
                rawMetrics: {} as any,
                features: {
                    recallAccuracy: 0.95,
                    falsePositiveRate: 0.02,
                    precision: 0.98,
                    f1Score: 0.96,
                    netRecallScore: 11.5,
                    meanSelectionLatencyMs: 900,
                    gridCoverage: 0.95,
                    primacyBias: 0.95,
                    recencyBias: 0.90,
                    midListDeficit: 0.05,
                    intrusionErrors: 0
                } as any,
                profile: {} as any,
                explainability: { keyFactors: [] }
            }],
            story: [{
                id: 's1',
                sessionId: 'sess1',
                timestamp: new Date(),
                storyId: 'story-1',
                difficulty: 'medium',
                selectedLanguage: 'en-IN',
                nativeTranscript: 'Story text',
                englishTranslation: 'Story translation',
                comprehensionResponses: [],
                matchResult: {} as any,
                biomarkers: {
                    memory: { recallAccuracy: 0.92, infoUnitsRecalled: 14, totalInfoUnits: 15, omissionCount: 1, falseRecallCount: 0 },
                    comprehension: { mcqAccuracy: 0.95, correctCount: 10, totalQuestions: 10, avgResponseTimeMs: 1100 },
                    narrative: { storySequenceScore: 0.95, narrativeCompleteness: 0.92, similarityScore: 0.92 },
                    speech: { speechRateWPM: 140, lexicalDiversity: 0.75, hesitationRate: 0.02, pauseFrequency: 2 }
                },
                storyRecallScore: 92
            }],
            navigation: [{
                sessionId: 'n1',
                timestamp: new Date(),
                scenarioId: 'city-1',
                difficulty: 'medium',
                routeChoices: [],
                biomarkers: {
                    navigationAccuracy: 0.92,
                    landmarkRecognitionAccuracy: 0.90,
                    spatialMemoryIndex: 94,
                    wayfindingEfficiency: 0.92,
                    headingErrorDegrees: 8,
                    stopsAndPausesCount: 0,
                    backtrackingCount: 0,
                    timeToCompleteSeconds: 40
                },
                navigationScore: 94,
                explainability: { keyFactors: [] }
            }]
        };

        const pred = await predictCognitiveProfile(healthyData, { age: 68, educationYears: 16 });

        expect(pred.probabilities.normal).toBeGreaterThan(0.70);
        expect(pred.probabilities.dementia).toBeLessThan(0.15);
        expect(pred.predictedDiagnosis).toBe('Normal');
        expect(pred.estimatedMoCA).toBeGreaterThan(25.0);
        expect(pred.domainScores.memory).toBeGreaterThan(80);
        expect(pred.clinicalAlertTier).toBe('STABLE');
    });

    it('should predict impaired profile with elevated risk and lower MoCA score', async () => {
        const impairedData: RawDashboardData = {
            reaction: [{
                timestamp: new Date().toISOString(),
                aggregates: { avg: 620, min: 450, max: 900, std: 90, lapses: 5, premature: 3 },
                rounds: []
            } as any],
            memory: [],
            pattern: [{
                sessionId: 'p2',
                timestamp: new Date(),
                metrics: { correctRounds: 2, totalRounds: 6, maxLevelReached: 3, averageResponseLatency: 1800 } as any,
                features: { learningRate: -2, memoryLoadTolerance: 30, patternStabilityIndex: 40 } as any,
                explainability: { keyFactors: [] }
            }],
            language: [{
                id: 'l2',
                sessionId: 's2',
                timestamp: new Date(),
                transcript: 'Speaking slowly with frequent long pauses and search for words',
                rawMetrics: { wordCount: 45, speechDuration: 60000, pauseDurationAvg: 800, pauseCount: 12, fillerWordCount: 8, repetitions: 4 } as any,
                derivedFeatures: {
                    wpm: 55,
                    lexicalDiversity: 0.40,
                    rootTTR: 0.45,
                    hesitationIndex: 0.18,
                    fluencyIndex: 35,
                    speechStability: 40,
                    semanticCoherence: 45,
                    syntacticComplexity: 38,
                    ideaDensity: 0.35,
                    cognitiveSpeechIndex: 38,
                    coherenceProxy: 40
                },
                explainability: { keyFactors: [] }
            }],
            vmra: [{
                sessionId: 'v2',
                timestamp: new Date(),
                config: {} as any,
                rawMetrics: {} as any,
                features: {
                    recallAccuracy: 0.35,
                    falsePositiveRate: 0.45,
                    precision: 0.42,
                    f1Score: 0.38,
                    netRecallScore: 2.0,
                    meanSelectionLatencyMs: 2500,
                    gridCoverage: 0.45,
                    primacyBias: 0.40,
                    recencyBias: 0.40,
                    midListDeficit: 0.60,
                    intrusionErrors: 4
                } as any,
                profile: {} as any,
                explainability: { keyFactors: [] }
            }],
            story: [{
                id: 's2',
                sessionId: 'sess2',
                timestamp: new Date(),
                storyId: 'story-1',
                difficulty: 'medium',
                selectedLanguage: 'en-IN',
                nativeTranscript: 'Short story',
                englishTranslation: 'Short story',
                comprehensionResponses: [],
                matchResult: {} as any,
                biomarkers: {
                    memory: { recallAccuracy: 0.30, infoUnitsRecalled: 4, totalInfoUnits: 15, omissionCount: 11, falseRecallCount: 4 },
                    comprehension: { mcqAccuracy: 0.40, correctCount: 4, totalQuestions: 10, avgResponseTimeMs: 3200 },
                    narrative: { storySequenceScore: 0.35, narrativeCompleteness: 0.30, similarityScore: 0.35 },
                    speech: { speechRateWPM: 65, lexicalDiversity: 0.42, hesitationRate: 0.15, pauseFrequency: 8 }
                },
                storyRecallScore: 35
            }],
            navigation: [{
                sessionId: 'n2',
                timestamp: new Date(),
                scenarioId: 'city-1',
                difficulty: 'medium',
                routeChoices: [],
                biomarkers: {
                    navigationAccuracy: 0.30,
                    landmarkRecognitionAccuracy: 0.35,
                    spatialMemoryIndex: 28,
                    wayfindingEfficiency: 0.25,
                    headingErrorDegrees: 48,
                    stopsAndPausesCount: 8,
                    backtrackingCount: 6,
                    timeToCompleteSeconds: 140
                },
                navigationScore: 28,
                explainability: { keyFactors: [] }
            }]
        };

        const pred = await predictCognitiveProfile(impairedData, { age: 80, educationYears: 12 });

        expect(pred.probabilities.normal).toBeLessThan(0.35);
        expect(pred.impairmentRiskScore).toBeGreaterThan(0.65);
        expect(pred.estimatedMoCA).toBeLessThan(21.0);
        expect(['RECOMMEND_EARLIER_REASSESSMENT', 'RECOMMEND_CLINICAL_EVALUATION']).toContain(pred.clinicalAlertTier);
    });

    it('should maintain backward compatibility with evaluateCrossSectionalRisk returning 3 probabilities summing to 1', async () => {
        const sampleData: RawDashboardData = {
            reaction: [],
            memory: [],
            pattern: [],
            language: [],
            vmra: [],
            story: [],
            navigation: []
        };

        const probs = await evaluateCrossSectionalRisk(sampleData);
        expect(probs).toHaveLength(3);
        const sum = probs[0] + probs[1] + probs[2];
        expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should resist extreme telemetry noise (e.g. raw ms slopes) via robust Winsorization and never crash MoCA to 0', async () => {
        const noisyData: RawDashboardData = {
            reaction: [{
                timestamp: new Date().toISOString(),
                aggregates: { avg: 260, min: 210, max: 320, std: 25, lapses: 0, premature: 0 },
                rounds: []
            } as any],
            memory: [],
            pattern: [{
                sessionId: 'p-noisy',
                timestamp: new Date(),
                metrics: { correctRounds: 6, totalRounds: 7, maxLevelReached: 7, averageResponseLatency: 750 } as any,
                // Simulate an unscaled outlier learning rate before fix
                features: { learningRate: -4802.62, memoryLoadTolerance: 85, patternStabilityIndex: 85 } as any,
                explainability: { keyFactors: [] }
            }],
            language: [{
                id: 'l-noisy',
                sessionId: 's-noisy',
                timestamp: new Date(),
                transcript: 'A clean and fluent audio description of the image.',
                rawMetrics: { wordCount: 120, speechDuration: 55000, pauseDurationAvg: 280, pauseCount: 3, fillerWordCount: 2, repetitions: 0 } as any,
                derivedFeatures: {
                    wpm: 130,
                    lexicalDiversity: 0.72,
                    rootTTR: 0.80,
                    hesitationIndex: 0.03,
                    fluencyIndex: 88,
                    speechStability: 90,
                    semanticCoherence: 88,
                    syntacticComplexity: 85,
                    ideaDensity: 0.65,
                    cognitiveSpeechIndex: 88,
                    coherenceProxy: 88
                },
                explainability: { keyFactors: [] }
            }],
            vmra: [{
                sessionId: 'v-noisy',
                timestamp: new Date(),
                config: {} as any,
                rawMetrics: {} as any,
                features: {
                    recallAccuracy: 0.90,
                    falsePositiveRate: 0.04,
                    precision: 0.92,
                    f1Score: 0.90,
                    netRecallScore: 10.0,
                    meanSelectionLatencyMs: 1050,
                    gridCoverage: 0.90,
                    primacyBias: 0.90,
                    recencyBias: 0.85,
                    midListDeficit: 0.08,
                    intrusionErrors: 1
                } as any,
                profile: {} as any,
                explainability: { keyFactors: [] }
            }],
            story: [{
                id: 's-noisy',
                sessionId: 'sess-noisy',
                timestamp: new Date(),
                storyId: 'story-1',
                difficulty: 'medium',
                selectedLanguage: 'en-IN',
                nativeTranscript: 'Story text',
                englishTranslation: 'Story translation',
                comprehensionResponses: [],
                matchResult: {} as any,
                biomarkers: {
                    memory: { recallAccuracy: 0.88, infoUnitsRecalled: 13, totalInfoUnits: 15, omissionCount: 2, falseRecallCount: 0 },
                    comprehension: { mcqAccuracy: 0.90, correctCount: 9, totalQuestions: 10, avgResponseTimeMs: 1250 },
                    narrative: { storySequenceScore: 0.90, narrativeCompleteness: 0.88, similarityScore: 0.88 },
                    speech: { speechRateWPM: 135, lexicalDiversity: 0.72, hesitationRate: 0.03, pauseFrequency: 3 }
                },
                storyRecallScore: 88
            }],
            navigation: [{
                sessionId: 'n-noisy',
                timestamp: new Date(),
                scenarioId: 'city-1',
                difficulty: 'medium',
                routeChoices: [],
                biomarkers: {
                    navigationAccuracy: 0.88,
                    landmarkRecognitionAccuracy: 0.86,
                    spatialMemoryIndex: 90,
                    wayfindingEfficiency: 0.88,
                    headingErrorDegrees: 10,
                    stopsAndPausesCount: 1,
                    backtrackingCount: 0,
                    timeToCompleteSeconds: 45
                },
                navigationScore: 90,
                explainability: { keyFactors: [] }
            }]
        };

        const pred = await predictCognitiveProfile(noisyData, { age: 65, educationYears: 16 });

        // Estimated MoCA must be in normal range (> 24.0) and NOT 0.0
        expect(pred.estimatedMoCA).toBeGreaterThan(24.0);
        // Probability of Normal must be dominant (> 60%) and Dementia < 20%
        expect(pred.probabilities.normal).toBeGreaterThan(0.60);
        expect(pred.probabilities.dementia).toBeLessThan(0.20);
        expect(pred.predictedDiagnosis).toBe('Normal');
        expect(pred.impairmentRiskScore).toBeLessThan(0.40);
    });
});

