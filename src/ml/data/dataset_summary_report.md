# VyomFlow Synthetic Dataset – Summary Report
**Generated:** 2026-08-20 00:57:21
**Seed:** 42

---

## Overview
| Metric | Value |
| :--- | :--- |
| **Total Rows** | 10,000 |
| **Total Columns** | 146 |
| **Unique Patients** | 5,693 |
| **File** | `vyomflow_synthetic_10k.csv` |

## Diagnosis Distribution
| Diagnosis | Count | Percentage |
| :--- | ---: | ---: |
| Normal | 6,897 | 69.0% |
| MCI | 2,242 | 22.4% |
| Dementia | 861 | 8.6% |

## Cognitive Risk Level Distribution
| Risk Level | Count | Percentage |
| :--- | ---: | ---: |
| Low | 6,897 | 69.0% |
| Moderate | 2,235 | 22.4% |
| High | 868 | 8.7% |

## Session Distribution
| Session # | Count |
| :--- | ---: |
| Session 1 | 5,693 |
| Session 2 | 2,580 |
| Session 3 | 1,104 |
| Session 4 | 450 |
| Session 5 | 173 |

## Numeric Column Statistics

| Column | Min | Median | Mean | Max | Std Dev |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `age` | 18.00 | 55.00 | 54.91 | 90.00 | 15.73 |
| `assessmentSessionNumber` | 1.00 | 1.00 | 1.68 | 5.00 | 0.96 |
| `cross_anomalyScore` | 0.00 | 0.00 | 0.09 | 0.78 | 0.15 |
| `cross_languageTrend` | -0.25 | 0.00 | -0.00 | 0.14 | 0.02 |
| `cross_memoryTrend` | -0.26 | 0.00 | -0.00 | 0.12 | 0.02 |
| `cross_navigationTrend` | -0.26 | 0.00 | -0.00 | 0.12 | 0.02 |
| `cross_patternTrend` | -0.23 | 0.00 | -0.00 | 0.14 | 0.02 |
| `cross_previousMoCAEstimate` | -1.00 | -1.00 | 10.54 | 30.00 | 13.71 |
| `cross_previousSessionScore` | -1.00 | -1.00 | 33.60 | 100.00 | 40.70 |
| `cross_reactionTrend` | -9.69 | 0.00 | -0.19 | 5.08 | 1.13 |
| `cross_savtTrend` | -0.23 | 0.00 | -0.00 | 0.15 | 0.02 |
| `cross_zScoreFromBaseline` | -1.39 | 0.00 | 0.06 | 1.58 | 0.28 |
| `daysSinceFirstAssessment` | 0.00 | 0.00 | 35.70 | 360.00 | 56.35 |
| `lang_WPM` | 48.90 | 142.30 | 141.47 | 220.00 | 22.98 |
| `lang_activeSpeechDurationMs` | 6953.00 | 52827.50 | 52700.73 | 99561.00 | 13093.26 |
| `lang_articulationRate` | 55.60 | 151.90 | 152.05 | 359.10 | 22.93 |
| `lang_averagePauseDuration` | 0.00 | 443.00 | 423.26 | 955.00 | 178.83 |
| `lang_cognitiveSpeechIndex` | 37.00 | 87.00 | 84.22 | 99.00 | 9.72 |
| `lang_fillerWordCount` | 0.00 | 5.00 | 5.36 | 21.00 | 3.64 |
| `lang_fluencyIndex` | 12.00 | 88.00 | 83.63 | 100.00 | 13.39 |
| `lang_hesitationIndex` | 0.00 | 0.08 | 0.11 | 1.16 | 0.09 |
| `lang_ideaDensity` | 0.15 | 0.57 | 0.57 | 0.85 | 0.10 |
| `lang_lexicalDiversity` | 0.25 | 0.68 | 0.67 | 0.95 | 0.10 |
| `lang_pauseCount` | 0.00 | 7.00 | 7.19 | 26.00 | 4.78 |
| `lang_pauseDurationTotalMs` | 0.00 | 2885.00 | 3528.64 | 19876.00 | 2941.31 |
| `lang_phonationRatio` | 0.40 | 0.95 | 0.93 | 1.00 | 0.07 |
| `lang_repetitions` | 0.00 | 2.00 | 1.96 | 9.00 | 1.63 |
| `lang_rootTTR` | 0.34 | 1.00 | 0.95 | 1.00 | 0.10 |
| `lang_semanticCoherence` | 30.00 | 84.00 | 82.04 | 100.00 | 13.69 |
| `lang_speechDurationMs` | 15000.00 | 56131.00 | 56229.37 | 100782.00 | 12231.32 |
| `lang_speechStability` | 28.00 | 94.00 | 91.60 | 100.00 | 7.36 |
| `lang_syntacticComplexity` | 20.00 | 80.00 | 78.72 | 100.00 | 13.68 |
| `lang_uniqueWordCount` | 13.00 | 88.00 | 90.48 | 242.00 | 32.43 |
| `lang_wordCount` | 25.00 | 132.00 | 133.28 | 318.00 | 38.37 |
| `nav_averageDecisionLatencyMs` | 1198.00 | 2975.00 | 3215.92 | 7890.00 | 1023.47 |
| `nav_chronologicalRecallScore` | 0.08 | 0.76 | 0.74 | 1.00 | 0.16 |
| `nav_correctDecisionRate` | 0.06 | 0.80 | 0.78 | 1.00 | 0.16 |
| `nav_decisionLatencyVariance` | 0.00 | 981.00 | 1269.03 | 7132.00 | 924.22 |
| `nav_destinationRecallAccuracy` | 0.00 | 1.00 | 0.88 | 1.00 | 0.33 |
| `nav_episodicMemoryScore` | 0.05 | 0.85 | 0.80 | 1.00 | 0.18 |
| `nav_falseLandmarkRate` | 0.00 | 0.14 | 0.15 | 0.61 | 0.10 |
| `nav_hesitationCount` | 0.00 | 3.00 | 2.59 | 6.00 | 1.43 |
| `nav_landmarkRecognitionAccuracy` | 0.14 | 0.81 | 0.79 | 1.00 | 0.15 |
| `nav_landmarkSequenceAccuracy` | 0.00 | 0.74 | 0.72 | 1.00 | 0.18 |
| `nav_maxDecisionLatencyMs` | 1264.00 | 4349.50 | 4937.76 | 20198.00 | 2290.12 |
| `nav_navigationAccuracy` | 0.06 | 0.80 | 0.78 | 1.00 | 0.16 |
| `nav_navigationScore` | 26.00 | 82.00 | 79.15 | 100.00 | 12.94 |
| `nav_routeMemoryScore` | 0.04 | 0.85 | 0.81 | 1.00 | 0.17 |
| `nav_visualAttentionScore` | 0.11 | 0.76 | 0.74 | 1.00 | 0.16 |
| `nav_wrongTurnCount` | 0.00 | 1.00 | 1.30 | 6.00 | 1.02 |
| `pat_completionTime` | 500.00 | 2393.50 | 2692.59 | 10067.00 | 1557.74 |
| `pat_correctRounds` | 1.00 | 7.00 | 7.41 | 15.00 | 2.62 |
| `pat_errorGrowthRate` | -0.50 | 0.05 | 0.06 | 0.78 | 0.19 |
| `pat_inputErrors` | 0.00 | 2.00 | 2.46 | 9.00 | 1.38 |
| `pat_learningRate` | -14.20 | 27.20 | 26.88 | 60.00 | 10.10 |
| `pat_maxSequenceSpan` | 1.00 | 6.00 | 6.37 | 10.00 | 1.71 |
| `pat_memoryLoadTolerance` | 0.00 | 72.20 | 70.53 | 100.00 | 19.49 |
| `pat_patternScore` | 16.00 | 87.00 | 84.62 | 100.00 | 11.13 |
| `pat_patternStability` | 16.00 | 77.30 | 76.22 | 100.00 | 15.10 |
| `pat_responseLatency` | 200.00 | 1296.00 | 1339.85 | 3526.00 | 561.87 |
| `pat_sequenceAccuracyTrend` | -0.15 | 0.06 | 0.06 | 0.20 | 0.04 |
| `pat_totalRounds` | 1.00 | 10.00 | 9.87 | 15.00 | 2.29 |
| `rxn_anomalyScore` | 0.00 | 0.20 | 0.14 | 0.70 | 0.14 |
| `rxn_attentionVariability` | 0.01 | 0.41 | 0.38 | 1.42 | 0.26 |
| `rxn_baselineDeviation` | -0.29 | 0.01 | 0.01 | 0.30 | 0.08 |
| `rxn_consistencyScore` | 0.95 | 0.97 | 0.97 | 0.98 | 0.01 |
| `rxn_falseStarts` | 0.00 | 1.00 | 0.89 | 4.00 | 0.83 |
| `rxn_fatigueSlope` | -5.00 | 5.14 | 5.29 | 23.07 | 4.66 |
| `rxn_maximumReactionTime` | 150.00 | 441.00 | 455.21 | 1007.00 | 131.24 |
| `rxn_meanReactionTime` | 150.00 | 288.00 | 295.58 | 595.00 | 72.31 |
| `rxn_medianReactionTime` | 130.00 | 275.00 | 280.76 | 584.00 | 72.87 |
| `rxn_minimumReactionTime` | 100.00 | 188.00 | 192.52 | 397.00 | 50.30 |
| `rxn_missedStimuli` | 0.00 | 1.00 | 0.93 | 4.00 | 0.83 |
| `rxn_reactionVariance` | 50.00 | 54.00 | 74.14 | 297.00 | 37.43 |
| `rxn_stabilityIndex` | 0.95 | 0.97 | 0.97 | 0.98 | 0.01 |
| `savt_attentionScore` | 11.00 | 82.00 | 80.09 | 99.00 | 14.41 |
| `savt_coefficientOfVariation` | 0.03 | 0.22 | 0.22 | 0.52 | 0.07 |
| `savt_commissionErrorRate` | 0.00 | 0.17 | 0.14 | 0.58 | 0.11 |
| `savt_compositeSAVTScore` | 51.00 | 88.00 | 86.88 | 99.00 | 7.38 |
| `savt_correctRejections` | 5.00 | 10.00 | 10.33 | 12.00 | 1.30 |
| `savt_dPrime` | -1.17 | 1.98 | 2.03 | 3.88 | 0.86 |
| `savt_falseAlarmRate` | 0.04 | 0.19 | 0.17 | 0.58 | 0.10 |
| `savt_falseAlarms` | 0.00 | 2.00 | 1.67 | 7.00 | 1.30 |
| `savt_hitRate` | 0.12 | 0.81 | 0.79 | 0.98 | 0.14 |
| `savt_hits` | 3.00 | 23.00 | 22.54 | 28.00 | 4.11 |
| `savt_inhibitionScore` | 42.00 | 82.00 | 84.65 | 98.00 | 10.44 |
| `savt_meanResponseTime` | 150.00 | 450.00 | 458.79 | 883.00 | 115.13 |
| `savt_medianResponseTime` | 150.00 | 429.00 | 436.44 | 870.00 | 116.22 |
| `savt_misses` | 0.00 | 5.00 | 5.46 | 25.00 | 4.11 |
| `savt_omissionErrorRate` | 0.00 | 0.18 | 0.20 | 0.89 | 0.15 |
| `savt_responseBias` | 0.11 | 1.09 | 1.32 | 4.78 | 0.98 |
| `savt_rtVariability` | 10.00 | 94.00 | 104.11 | 345.00 | 52.53 |
| `savt_vigilanceDecrement` | -0.07 | -0.01 | -0.01 | 0.04 | 0.01 |
| `savt_vigilanceScore` | 83.00 | 98.00 | 97.45 | 100.00 | 2.64 |
| `savt_vigilanceStability` | 0.96 | 1.00 | 1.00 | 1.00 | 0.00 |
| `story_JaccardSimilarity` | 0.00 | 0.53 | 0.52 | 1.00 | 0.14 |
| `story_LevenshteinSimilarity` | 0.00 | 0.51 | 0.50 | 1.00 | 0.16 |
| `story_averageResponseTimeMs` | 1000.00 | 4288.00 | 4351.53 | 11336.00 | 1761.94 |
| `story_falseRecallCount` | 0.00 | 1.00 | 1.34 | 6.00 | 1.08 |
| `story_hesitationRate` | 0.00 | 0.11 | 0.12 | 0.44 | 0.08 |
| `story_informationUnitsRecalled` | 0.00 | 7.00 | 7.23 | 12.00 | 2.15 |
| `story_lexicalDiversity` | 0.24 | 0.62 | 0.62 | 0.95 | 0.10 |
| `story_mcqAccuracy` | 0.00 | 0.75 | 0.77 | 1.00 | 0.19 |
| `story_narrativeCompleteness` | 0.05 | 0.73 | 0.71 | 1.00 | 0.14 |
| `story_omissionCount` | 0.00 | 3.00 | 2.78 | 11.00 | 1.83 |
| `story_pauseFrequency` | 0.00 | 5.60 | 5.79 | 20.30 | 3.45 |
| `story_recallAccuracy` | 0.00 | 0.75 | 0.72 | 1.00 | 0.18 |
| `story_semanticSimilarity` | 0.01 | 0.52 | 0.51 | 0.89 | 0.13 |
| `story_speechRateWPM` | 28.70 | 124.30 | 123.76 | 197.30 | 21.65 |
| `story_storyRecallScore` | 25.00 | 76.00 | 76.14 | 99.00 | 15.76 |
| `story_storySequenceScore` | 0.04 | 0.75 | 0.73 | 1.00 | 0.18 |
| `target_attentionDomain` | 28.00 | 82.00 | 81.05 | 100.00 | 13.30 |
| `target_confidenceScore` | 0.20 | 0.79 | 0.79 | 0.98 | 0.14 |
| `target_executiveFunctionDomain` | 22.00 | 82.00 | 79.84 | 100.00 | 14.29 |
| `target_languageDomain` | 24.00 | 83.00 | 80.99 | 100.00 | 13.50 |
| `target_memoryDomain` | 19.00 | 81.00 | 79.75 | 100.00 | 14.23 |
| `target_mocaScore` | 2.00 | 28.00 | 25.77 | 30.00 | 5.19 |
| `vmra_F1Score` | 0.00 | 0.80 | 0.77 | 1.00 | 0.15 |
| `vmra_compositeMemoryScore` | 25.00 | 68.00 | 68.27 | 100.00 | 14.09 |
| `vmra_confusionPairs` | 0.00 | 1.00 | 0.95 | 5.00 | 0.87 |
| `vmra_delayedRecallRatio` | 0.31 | 0.86 | 0.86 | 1.20 | 0.14 |
| `vmra_falsePositiveRate` | 0.00 | 0.14 | 0.13 | 0.60 | 0.11 |
| `vmra_firstTapLatency` | 300.00 | 2502.50 | 2571.27 | 7853.00 | 1262.28 |
| `vmra_forgettingCurveSlope` | -0.05 | -0.01 | -0.01 | 0.02 | 0.01 |
| `vmra_gridCoverage` | 0.10 | 0.70 | 0.69 | 1.00 | 0.14 |
| `vmra_interTapInterval` | 200.00 | 1419.00 | 1476.75 | 4258.00 | 695.63 |
| `vmra_intrusionErrors` | 0.00 | 1.00 | 1.21 | 7.00 | 1.06 |
| `vmra_latencyVariance` | 0.00 | 1257.00 | 1635.38 | 10204.00 | 1381.48 |
| `vmra_meanSelectionLatency` | 400.00 | 4229.50 | 4403.12 | 13530.00 | 2301.03 |
| `vmra_midListDeficit` | 0.00 | 0.33 | 0.34 | 1.00 | 0.18 |
| `vmra_netRecallScore` | 0.00 | 4.00 | 3.85 | 8.00 | 1.71 |
| `vmra_precision` | 0.00 | 0.83 | 0.84 | 1.00 | 0.14 |
| `vmra_primacyBias` | 0.05 | 0.79 | 0.78 | 1.00 | 0.17 |
| `vmra_recallAccuracy` | 0.00 | 0.75 | 0.72 | 1.00 | 0.18 |
| `vmra_recencyBias` | 0.09 | 0.81 | 0.79 | 1.00 | 0.17 |
| `vmra_spatialBias` | 0.02 | 0.33 | 0.32 | 0.67 | 0.09 |
| `yearsOfEducation` | 0.00 | 12.00 | 11.95 | 22.00 | 3.99 |

## Column Groups

### Metadata (11 columns)
`patientId`, `age`, `gender`, `yearsOfEducation`, `primaryLanguage`, `region`, `urbanRural`, `occupationCategory`, `deviceType`, `assessmentSessionNumber`, `daysSinceFirstAssessment`

### Navigation (nav_) (16 columns)
`nav_destinationRecallAccuracy`, `nav_navigationAccuracy`, `nav_wrongTurnCount`, `nav_correctDecisionRate`, `nav_averageDecisionLatencyMs`, `nav_maxDecisionLatencyMs`, `nav_decisionLatencyVariance`, `nav_hesitationCount`, `nav_landmarkRecognitionAccuracy`, `nav_falseLandmarkRate`, `nav_landmarkSequenceAccuracy`, `nav_chronologicalRecallScore`, `nav_routeMemoryScore`, `nav_visualAttentionScore`, `nav_episodicMemoryScore`, `nav_navigationScore`

### Language (lang_) (21 columns)
`lang_wordCount`, `lang_speechDurationMs`, `lang_activeSpeechDurationMs`, `lang_pauseCount`, `lang_pauseDurationTotalMs`, `lang_averagePauseDuration`, `lang_fillerWordCount`, `lang_repetitions`, `lang_uniqueWordCount`, `lang_WPM`, `lang_articulationRate`, `lang_phonationRatio`, `lang_lexicalDiversity`, `lang_rootTTR`, `lang_hesitationIndex`, `lang_fluencyIndex`, `lang_speechStability`, `lang_semanticCoherence`, `lang_syntacticComplexity`, `lang_ideaDensity`, `lang_cognitiveSpeechIndex`

### Story Recall (story_) (16 columns)
`story_recallAccuracy`, `story_informationUnitsRecalled`, `story_omissionCount`, `story_falseRecallCount`, `story_mcqAccuracy`, `story_averageResponseTimeMs`, `story_storySequenceScore`, `story_narrativeCompleteness`, `story_semanticSimilarity`, `story_JaccardSimilarity`, `story_LevenshteinSimilarity`, `story_speechRateWPM`, `story_lexicalDiversity`, `story_hesitationRate`, `story_pauseFrequency`, `story_storyRecallScore`

### VMRA (vmra_) (19 columns)
`vmra_recallAccuracy`, `vmra_falsePositiveRate`, `vmra_precision`, `vmra_F1Score`, `vmra_netRecallScore`, `vmra_firstTapLatency`, `vmra_meanSelectionLatency`, `vmra_interTapInterval`, `vmra_latencyVariance`, `vmra_primacyBias`, `vmra_recencyBias`, `vmra_midListDeficit`, `vmra_intrusionErrors`, `vmra_confusionPairs`, `vmra_spatialBias`, `vmra_gridCoverage`, `vmra_delayedRecallRatio`, `vmra_forgettingCurveSlope`, `vmra_compositeMemoryScore`

### SAVT (savt_) (20 columns)
`savt_hits`, `savt_misses`, `savt_falseAlarms`, `savt_correctRejections`, `savt_hitRate`, `savt_falseAlarmRate`, `savt_dPrime`, `savt_responseBias`, `savt_omissionErrorRate`, `savt_commissionErrorRate`, `savt_meanResponseTime`, `savt_medianResponseTime`, `savt_rtVariability`, `savt_coefficientOfVariation`, `savt_vigilanceDecrement`, `savt_vigilanceStability`, `savt_attentionScore`, `savt_inhibitionScore`, `savt_vigilanceScore`, `savt_compositeSAVTScore`

### Pattern (pat_) (12 columns)
`pat_maxSequenceSpan`, `pat_totalRounds`, `pat_correctRounds`, `pat_responseLatency`, `pat_completionTime`, `pat_inputErrors`, `pat_learningRate`, `pat_memoryLoadTolerance`, `pat_patternStability`, `pat_errorGrowthRate`, `pat_sequenceAccuracyTrend`, `pat_patternScore`

### Reaction (rxn_) (13 columns)
`rxn_meanReactionTime`, `rxn_medianReactionTime`, `rxn_minimumReactionTime`, `rxn_maximumReactionTime`, `rxn_reactionVariance`, `rxn_consistencyScore`, `rxn_fatigueSlope`, `rxn_falseStarts`, `rxn_missedStimuli`, `rxn_stabilityIndex`, `rxn_attentionVariability`, `rxn_baselineDeviation`, `rxn_anomalyScore`

### Cross-Session (cross_) (10 columns)
`cross_previousSessionScore`, `cross_previousMoCAEstimate`, `cross_memoryTrend`, `cross_reactionTrend`, `cross_languageTrend`, `cross_navigationTrend`, `cross_patternTrend`, `cross_savtTrend`, `cross_zScoreFromBaseline`, `cross_anomalyScore`

### Targets (target_) (8 columns)
`target_mocaScore`, `target_diagnosis`, `target_cognitiveRiskLevel`, `target_memoryDomain`, `target_attentionDomain`, `target_languageDomain`, `target_executiveFunctionDomain`, `target_confidenceScore`

---
*This dataset is synthetically generated for ML pipeline development and does not represent real patient data.*