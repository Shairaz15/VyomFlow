# VyomFlow Cognitive Assessment Suite
## Biomarkers Catalog & Final Score Computation Specifications

This document provides a comprehensive technical and clinical specification for all **7 cognitive assessment modules** in the VyomFlow platform. It details every raw metric, derived digital biomarker (with its exact units), and the complete mathematical formulation used to calculate the **Final Score** and **Composite Profiles**.

---

## 📑 Table of Contents

1. [Module 1: Immersive Video Navigation & Spatial Memory Assessment (`NavigationAssessment`)](#module-1-immersive-video-navigation--spatial-memory-assessment)
2. [Module 2: Multilingual Spontaneous Language Assessment (`LanguageAssessment`)](#module-2-multilingual-spontaneous-language-assessment)
3. [Module 3: Story Narration & Auditory Recall Assessment (`StoryAssessment`)](#module-3-story-narration--auditory-recall-assessment)
4. [Module 4: Visual Memory Recall Assessment (`VMRA`)](#module-4-visual-memory-recall-assessment-vmra)
5. [Module 5: Sustained Attention & Vigilance Task (`SAVT` / Go/No-Go)](#module-5-sustained-attention--vigilance-task-savt)
6. [Module 6: Visual Sequence Memory & Pattern Recognition (`PatternAssessment`)](#module-6-visual-sequence-memory--pattern-recognition)
7. [Module 7: Psychomotor Simple Reaction Time Assessment (`ReactionTimeTest`)](#module-7-psychomotor-simple-reaction-time-assessment)
8. [Cross-Assessment Longitudinal AI Fusion & Risk Engine](#cross-assessment-longitudinal-ai-fusion--risk-engine)

---

## Module 1: Immersive Video Navigation & Spatial Memory Assessment
**Route:** `/test/navigation` | **Components:** `src/components/tests/navigation/` | **Engine:** `BiomarkerEngine.ts`  
**Neurocognitive Target:** Visuospatial orientation, topological route learning, landmark recognition & chronology, route reversal, executive function.

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Destination Recall Accuracy** | `destinationRecallAccuracy` | Binary accuracy of identifying arrival destination ($1$ if correct, $0$ if incorrect) | `Binary (0 or 1)` |
| **Navigation Accuracy** | `navigationAccuracy` | Proportion of correct directional decisions across 6 intersections: $\frac{\text{Correct Turns}}{\text{Total Intersections}}$ | `Ratio (0.000 to 1.000)` |
| **Wrong Turn Count** | `wrongTurnCount` | Total count of incorrect directional choices at decision junctions | `Count (0 to 6)` |
| **Correct Decision Rate** | `correctDecisionRate` | Normalized correct turn execution rate | `Ratio (0.000 to 1.000)` |
| **Average Decision Latency** | `averageDecisionLatencyMs` | Mean reaction time to choose direction after arriving at intersection: $\frac{1}{N}\sum \text{Latency}_i$ | `ms` (milliseconds) |
| **Peak Decision Latency** | `maxDecisionLatencyMs` | Maximum deliberation latency recorded at any intersection | `ms` (milliseconds) |
| **Decision Latency Variance** | `decisionLatencyVariance` | Sample variance of intersection decision reaction times: $\frac{1}{N}\sum (\text{Latency}_i - \mu)^2$ | `ms²` (square milliseconds) |
| **Hesitation Count** | `hesitationCount` | Number of intersection decisions exceeding $2\times$ the participant's average latency | `Count (events)` |
| **Landmark Recognition Accuracy** | `landmarkRecognitionAccuracy` | Proportion of genuine route landmarks identified vs distractor landmarks: $\frac{\text{Real Selected}}{\text{Total Target Real}}$ | `Ratio (0.000 to 1.000)` |
| **False Landmark Rate** | `falseLandmarkRate` | Proportion of selected landmarks that were distractors: $\frac{\text{False Selected}}{\text{Total Selected}}$ | `Ratio (0.000 to 1.000)` |
| **Landmark Sequence Accuracy** | `landmarkSequenceAccuracy` | Proportion of landmarks placed in their exact chronological route position | `Ratio (0.000 to 1.000)` |
| **Chronological Recall Score** | `chronologicalRecallScore` | Weighted sequence retention: $(0.70 \times \text{SequenceAccuracy}) + (0.30 \times \text{RecognitionAccuracy})$ | `Ratio (0.000 to 1.000)` |
| **Route Memory Score** | `routeMemoryScore` | Topological memory composite: $(0.70 \times \text{NavAccuracy}) + (0.30 \times \text{DestRecall})$ | `Ratio (0.000 to 1.000)` |
| **Visual Attention Score** | `visualAttentionScore` | $\max(0, \text{RecognitionAccuracy} \times (1 - 0.5 \times \text{FalseLandmarkRate}))$ | `Ratio (0.000 to 1.000)` |
| **Episodic Memory Score** | `episodicMemoryScore` | Temporal-spatial episodic composite: $(0.60 \times \text{ChronologicalScore}) + (0.40 \times \text{DestRecall})$ | `Ratio (0.000 to 1.000)` |

### 2. Final Score Calculation Formulation

The **Final Navigation Score** (`navigationScore`, scale: **0–100**) combines 6 clinically weighted dimensions:

```typescript
// 1. Normalize decision latency (optimal <= 2000ms, floor at 8000ms)
const normalizedLatencyScore = Math.max(0, Math.min(1, 1 - (averageDecisionLatencyMs - 2000) / 6000));

// 2. Compute distractor avoidance retention
const falseLandmarkRetention = Math.max(0, 1 - falseLandmarkRate);

// 3. Compute weighted multi-factor composite (0 - 100)
const rawScore = (
    (navigationAccuracy * 0.30) +          // 30% Directional Decision Accuracy
    (landmarkRecognitionAccuracy * 0.20) + // 20% Landmark Feature Recognition
    (chronologicalRecallScore * 0.20) +    // 20% Landmark Sequence Chronology
    (normalizedLatencyScore * 0.15) +      // 15% Processing Speed / Decision Latency
    (destinationRecallAccuracy * 0.10) +   // 10% Global Goal / Destination Memory
    (falseLandmarkRetention * 0.05)        //  5% Distractor Rejection / Precision
) * 100;

const navigationScore = Math.round(Math.max(0, Math.min(100, rawScore)));
```

---

## Module 2: Multilingual Spontaneous Language Assessment
**Route:** `/test/language` | **Components:** `src/components/tests/language/` | **Engine:** `src/ai/languageFeatures.ts`  
**Neurocognitive Target:** Expressive language, semantic retrieval, acoustic voice dynamics, motor speech stability, syntax complexity, idea density.

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Total Spoken Word Count** | `wordCount` | Total tokenized spoken words in transcript | `Count (words)` |
| **Total Recording Duration** | `speechDuration` | Total audio recording duration | `ms` (milliseconds) |
| **Active Phonation Time** | `activeSpeechDurationMs` | Cumulative duration of active acoustic vocalization (excluding silence $>250\text{ms}$) | `ms` (milliseconds) |
| **Acoustic Pause Count** | `pauseCount` | Total number of detected silent intervals ($> 250\text{ms}$) | `Count (events)` |
| **Total Pause Duration** | `pauseDurationTotalMs` | Cumulative duration of all silent pauses | `ms` (milliseconds) |
| **Average Pause Duration** | `pauseDurationAvg` | Mean duration per silence episode: $\frac{\text{Total Pause Duration}}{\text{Pause Count}}$ | `ms` (milliseconds) |
| **Filler Word Count** | `fillerWordCount` | Detected filled pauses from multilingual Indic & English lexicons (*um, uh, मतलब, यार, வந்து, అంటే, etc.*) | `Count (events)` |
| **Speech Repetition / Stutter** | `repetitions` | Count of adjacent identical words repeated in succession ($w_i = w_{i-1}$) | `Count (events)` |
| **Vocabulary Size** | `uniqueWordCount` | Number of distinct lexical tokens | `Count (unique words)` |
| **Speaking Rate (WPM)** | `wpm` | Overall speech rate: $\frac{\text{Word Count}}{\text{Duration (min)}}$ | `WPM` (words/min) |
| **Articulation Rate** | `articulationRate` | Pure motor speech rate: $\frac{\text{Word Count}}{\text{Active Speech Duration (min)}}$ | `WPM` (words/min active speech) |
| **Phonation Ratio** | `phonationRatio` | Proportion of total time spent in active phonation: $\frac{\text{Active Speech Duration}}{\text{Total Duration}}$ | `Ratio (0.00 to 1.00)` |
| **Type-Token Ratio (TTR)** | `lexicalDiversity` | Lexical diversity: $\frac{\text{Unique Words}}{\text{Total Words}}$ | `Ratio (0.000 to 1.000)` |
| **Root TTR (Guiraud's Index)** | `rootTTR` | Length-invariant vocabulary richness: $\min\left(1.0, \frac{\text{Unique Words}}{\sqrt{\text{Total Words}}} / 6.5\right)$ | `Unitless Index (0.000 to 1.000)` |
| **Hesitation Index** | `hesitationIndex` | Disfluency density: $\frac{\text{Fillers} + (1.5 \times \text{Reps}) + (0.5 \times \text{Pauses})}{\text{Total Words}}$ | `Ratio (disfluencies / word)` |
| **Fluency Score** | `fluencyIndex` | Score penalized for excessive hesitations and WPM deviations outside 110–175 WPM | `Score (10 to 100)` |
| **Motor Speech Stability** | `speechStability` | Composite of phonation ratio and disfluency: $(\text{PhonationRatio} \times 60) + ((1 - \text{HesitationIndex}) \times 40)$ | `Score (10 to 100)` |
| **Semantic Prompt Coherence** | `semanticCoherence` | Keyword overlap and contextual depth with prompt topic | `Score (30 to 100)` |
| **Syntactic Complexity** | `syntacticComplexity` | Mean Length of Utterance (MLU: words per clause, optimal 7–14) & structural clauses | `Score (20 to 100)` |
| **Idea Density** | `ideaDensity` | Proportion of content words (nouns, verbs, adjectives) to total words | `Ratio (0.00 to 1.00)` |
| **Cognitive Speech Index (CSI)**| `cognitiveSpeechIndex`| Clinically weighted 5-pillar composite cognitive speech index | `Score (10 to 100)` |

### 2. Final Score Calculation Formulation

The module produces the **Cognitive Speech Index (CSI)** (`cognitiveSpeechIndex`, scale: **10–100**):

```typescript
// 1. Calculate Fluency Score (0 - 100)
let fluencyScore = 100;
fluencyScore -= Math.min(60, hesitationIndex * 150); // Penalty for hesitations
if (wpm < 110 && wpm > 0) {
    fluencyScore -= (110 - wpm) * 0.45; // Penalty for abnormally slow speech
} else if (wpm > 175) {
    fluencyScore -= (wpm - 175) * 0.35; // Penalty for rapid/cluttered speech
} else if (wpm === 0) {
    fluencyScore = 10;
}
const fluencyIndex = Math.max(10, Math.min(100, Math.round(fluencyScore)));

// 2. Calculate Acoustic Stability Score (0 - 100)
const acousticScore = Math.min(100, (phonationRatio * 85) + (totalPauses <= 4 ? 15 : Math.max(0, 15 - (totalPauses - 4) * 3)));

// 3. Calculate Lexical Richness Score (0 - 100)
const lexicalScore = Math.min(100, (rootTTR * 70) + (lexicalDiversity * 30));

// 4. Multi-Pillar CSI Composite (30% Fluency, 25% Acoustics, 20% Lexical, 15% Semantics, 10% Syntax)
const compositeCSI = Math.round(
    (fluencyIndex * 0.30) +
    (acousticScore * 0.25) +
    (lexicalScore * 0.20) +
    (semanticCoherence * 0.15) +
    (syntacticComplexity * 0.10)
);

const cognitiveSpeechIndex = Math.max(10, Math.min(100, compositeCSI));
```

---

## Module 3: Story Narration & Auditory Recall Assessment
**Route:** `/test/story` | **Components:** `src/components/tests/story/` | **Engine:** `StoryScoring.ts`, `StoryMatchingService.ts`  
**Neurocognitive Target:** Auditory episodic memory, proposition retention, chronological story reconstruction, discourse coherence.

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Information Unit Recall** | `recallAccuracy` | Proportion of key story propositions recalled: $\frac{\text{Matched Units}}{\text{Total Units}}$ | `Ratio (0.00 to 1.00)` |
| **Recalled Units Count** | `infoUnitsRecalled` | Absolute count of key story facts correctly matched | `Count (units)` |
| **Total Story Units** | `totalInfoUnits` | Total Information Units embedded in the reference story | `Count (units)` |
| **Omission Count** | `omissionCount` | Total key facts omitted during recall | `Count (units)` |
| **False Recall / Confabulation**| `falseRecallCount` | Count of extraneous, invented, or mismatched propositions | `Count (statements)` |
| **Comprehension MCQ Accuracy** | `mcqAccuracy` | Multiple-choice comprehension accuracy: $\frac{\text{Correct MCQs}}{\text{Total Questions}}$ | `Ratio (0.00 to 1.00)` |
| **Comprehension Response Time** | `avgResponseTimeMs` | Mean reaction time to answer multiple-choice comprehension questions | `ms` (milliseconds) |
| **Story Sequence Score** | `storySequenceScore` | Monotonic chronological order preservation of recalled propositions | `Ratio (0.00 to 1.00)` |
| **Narrative Completeness** | `narrativeCompleteness` | Mean of unweighted recall accuracy and importance-weighted unit score | `Ratio (0.00 to 1.00)` |
| **Semantic & Lexical Similarity**| `similarityScore` | Mean of Jaccard set overlap and Normalized Levenshtein similarity: $\frac{\text{Jaccard} + \text{Levenshtein}}{2}$ | `Ratio (0.00 to 1.00)` |
| **Jaccard Similarity** | `jaccardSimilarity` | Word set intersection over union against reference story | `Ratio (0.00 to 1.00)` |
| **Levenshtein Similarity** | `levenshteinSimilarity` | Edit-distance string similarity normalized to story length | `Ratio (0.00 to 1.00)` |
| **Retelling Speech Rate** | `speechRateWPM` | Words per minute during the oral retelling phase | `WPM` (words/min) |
| **Retelling Lexical Diversity**| `lexicalDiversity` | Type-Token Ratio in the participant's recall speech | `Ratio (0.00 to 1.00)` |
| **Retelling Hesitation Rate** | `hesitationRate` | Disfluencies and pauses per total words spoken | `Ratio (0.00 to 1.00)` |
| **Acoustic Pause Frequency** | `pauseFrequency` | Number of pauses ($>250\text{ms}$) per minute of retelling audio | `Pauses / min` |
| **Final Story Recall Score** | `storyRecallScore` | Comprehensive narrative & comprehension composite score | `Score (25 to 100)` |

### 2. Final Score Calculation Formulation

The **Story Recall Score** (`storyRecallScore`, scale: **25–100**) combines comprehension, proposition extraction, speech stability, and narrative sequence:

```typescript
// 1. Calculate speech biomarker sub-score (0.0 to 1.0)
const wpmScore = Math.min(1.0, speechRateWPM / 120);
const diversityScore = Math.min(1.0, lexicalDiversity);
const fluencyScore = Math.max(0, 1 - hesitationRate);
const speechBiomarkerScore = (wpmScore * 0.40) + (diversityScore * 0.30) + (fluencyScore * 0.30);

// 2. Importance-weighted Information Units Score (0.0 to 1.0)
const infoUnitsScore = totalEarnedWeight / totalPossibleWeight;

// 3. Multi-factor raw composite (0.0 to 1.0)
const rawScore = 
    (mcqAccuracy * 0.40) +          // 40% Objective Comprehension Accuracy
    (recallAccuracy * 0.20) +       // 20% Unweighted Information Unit Recall
    (infoUnitsScore * 0.15) +       // 15% Importance-Weighted Unit Recall
    (speechBiomarkerScore * 0.15) + // 15% Oral Fluency & Speech Biomarkers
    (storySequenceScore * 0.05) +   //  5% Chronological Narrative Sequence
    (similarityScore * 0.05);       //  5% Lexical & Semantic Similarity

// 4. Clinical calibration curve (Base + Bonus scale)
const baseScore = mcqAccuracy * 50;
const bonusScore = rawScore * 50;
const storyRecallScore = Math.round(Math.min(100, Math.max(25, baseScore + bonusScore)));
```

---

## Module 4: Visual Memory Recall Assessment (VMRA)
**Route:** `/test/memory` or `/test/vmra` | **Components:** `src/pages/VmraAssessment.tsx` | **Engine:** `src/utils/vmraScoring.ts`  
**Neurocognitive Target:** Visual episodic memory, pattern separation, distractor inhibition, serial position effects (primacy/recency), spatial search strategy.

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Visual Recall Accuracy** | `recallAccuracy` | Target items correctly selected: $\frac{\text{Correct Hits}}{\text{Total Targets}}$ | `Ratio (0.00 to 1.00)` |
| **False Positive Rate** | `falsePositiveRate` | Distractor items incorrectly selected: $\frac{\text{False Positives}}{\text{Total Distractors}}$ | `Ratio (0.00 to 1.00)` |
| **Precision** | `precision` | Exactness of visual selection: $\frac{\text{Correct Hits}}{\text{Correct Hits} + \text{False Positives}}$ | `Ratio (0.00 to 1.00)` |
| **F1 Score** | `f1Score` | Harmonic mean of precision and recall: $\frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$ | `Ratio (0.00 to 1.00)` |
| **Net Recall Score** | `netRecallScore` | Guess-penalized score: $\max(0, \text{Correct Hits} - \text{False Positives})$ | `Net items count` |
| **First Tap Latency** | `firstTapLatencyMs` | Reaction time from grid display to the participant's first tap | `ms` (milliseconds) |
| **Mean Selection Latency** | `meanSelectionLatencyMs`| Average latency from grid onset across all valid selection taps | `ms` (milliseconds) |
| **Inter-Tap Interval** | `meanInterTapIntervalMs`| Mean duration elapsed between successive item selections | `ms` (milliseconds) |
| **Selection Latency Variance** | `latencyVariance` | Standard deviation of tap selection latencies | `ms` (milliseconds) |
| **Primacy Bias** | `primacyBias` | Recall accuracy for the first $2$ images presented during encoding | `Ratio (0.00 to 1.00)` |
| **Recency Bias** | `recencyBias` | Recall accuracy for the last $2$ images presented during encoding | `Ratio (0.00 to 1.00)` |
| **Mid-List Deficit** | `midListDeficit` | Degradation in recall for middle items: $1 - \text{Accuracy}(\text{Middle Items})$ | `Ratio (0.00 to 1.00)` |
| **Intrusion Errors** | `intrusionErrors` | Distractors selected that have zero visual/semantic similarity to any target | `Count (items)` |
| **Confusion Pairs** | `confusionPairs` | Count of category-matched distractor-target confusion pairings | `Count (pairs)` |
| **Spatial Bias** | `spatialBias` | Proportion of taps in Top vs Bottom, Left vs Right grid quadrants | `Ratio (0.00 to 1.00)` |
| **Grid Coverage** | `gridCoverage` | Proportion of unique grid positions interacted with | `Ratio (0.00 to 1.00)` |
| **Delayed Recall Ratio** | `delayedRecallRatio` | Retention ratio across retention delay: $\frac{\text{Delayed Accuracy}}{\text{Immediate Accuracy}}$ | `Ratio (0.00 to 1.00+)` |
| **Forgetting Curve Slope** | `forgettingCurveSlope` | Rate of memory decay per minute of delay time | `Decay / min` (slope) |
| **Composite Memory Score** | `compositeScore` | Multi-pillar composite of accuracy, normalized latency, and consistency | `Score (0 to 100)` |
| **Star Rating** | `starRating` | Normative tier: $\ge 90\% \to 5\star, \ge 75\% \to 4\star, \ge 60\% \to 3\star, \ge 40\% \to 2\star, <40\% \to 1\star$ | `Stars (1 to 5)` |

### 2. Final Score Calculation Formulation

The **VMRA Composite Score** (`compositeScore`, scale: **0–100**) combines memory accuracy, motor speed, and historical consistency:

```typescript
// 1. Accuracy Component (50% weight)
const accuracy = features.recallAccuracy; // 0.0 to 1.0

// 2. Normalized Latency Component (25% weight, calibrated between 500ms and 5000ms)
const normalizedLatency = Math.max(0, Math.min(1,
    1 - (features.meanSelectionLatencyMs - 500) / 4500
));

// 3. Intra-Individual Consistency Component (25% weight)
let consistency = 1.0;
if (previousAccuracies.length > 0) {
    const prevMean = previousAccuracies.reduce((s, v) => s + v, 0) / previousAccuracies.length;
    const deviation = Math.abs(accuracy - prevMean);
    consistency = Math.max(0, 1 - deviation * 2);
}

// 4. Weighted Composite Formulation
const rawComposite = (accuracy * 0.50 + normalizedLatency * 0.25 + consistency * 0.25) * 100;
const compositeScore = Math.max(0, Math.min(100, Math.round(rawComposite)));
```

---

## Module 5: Sustained Attention & Vigilance Task (SAVT)
**Route:** `/test/attention` | **Components:** `src/components/tests/attention/` | **Engine:** `savtFeatures.ts`, `savtScoring.ts`  
**Neurocognitive Target:** Continuous performance, Signal Detection Theory ($d'$, $\beta$), sustained vigilance decrement, impulsivity (commission errors), lapses of focus (omission errors).

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Target Hits** | `hits` | Correct tap responses to GO stimuli | `Count (events)` |
| **Omission Errors (Misses)** | `misses` | Inattention failure to respond to GO stimuli | `Count (events)` |
| **Commission Errors (False Alarms)**| `falseAlarms` | Inhibitory failure: tapping on NOGO distractor stimuli | `Count (events)` |
| **Correct Rejections** | `correctRejections` | Correctly withholding responses on NOGO stimuli | `Count (events)` |
| **Log-Linear Hit Rate** | `hitRate` | Rate with log-linear correction: $\frac{\text{Hits} + 0.5}{\text{Total GO} + 1}$ | `Ratio (0.00 to 1.00)` |
| **Log-Linear False Alarm Rate** | `falseAlarmRate` | Rate with log-linear correction: $\frac{\text{False Alarms} + 0.5}{\text{Total NOGO} + 1}$ | `Ratio (0.00 to 1.00)` |
| **Sensitivity Index ($d'$)** | `dPrime` | Signal detection sensitivity: $z(\text{HitRate}) - z(\text{FalseAlarmRate})$ | `Z-score / Std. Devs` |
| **Response Bias (Criterion $\beta$)**| `responseBias` | Likelihood ratio decision tendency: $\exp\left(-0.5 \times (z_H^2 - z_F^2)\right)$ | `Likelihood Ratio (unitless)` |
| **Omission Error Rate** | `omissionErrorRate` | Inattention biomarker: $\frac{\text{Misses}}{\text{Total GO}}$ | `Ratio (0.00 to 1.00)` |
| **Commission Error Rate** | `commissionErrorRate`| Impulsivity biomarker: $\frac{\text{False Alarms}}{\text{Total NOGO}}$ | `Ratio (0.00 to 1.00)` |
| **Mean Hit Response Time** | `meanResponseTimeMs` | Mean reaction latency on correct GO hits | `ms` (milliseconds) |
| **Median Hit Response Time** | `medianResponseTimeMs`| Median reaction latency on correct GO hits | `ms` (milliseconds) |
| **RT Variability (SD)** | `rtVariability` | Standard deviation of hit response times | `ms` (milliseconds) |
| **RT Coefficient of Variation (CV)**| `rtCoefficientOfVariation` | Intra-individual variability: $\frac{\text{SD}(\text{RT})}{\text{Mean}(\text{RT})}$ | `Unitless Ratio` |
| **Vigilance Decrement** | `vigilanceDecrement` | Linear regression slope of hit rate across the 4 chronological test blocks | `Rate / block` (slope) |
| **Vigilance Stability** | `vigilanceStability` | Consistency across blocks: $\max(0, \min(1, 1 - 4 \times \text{Variance}(\text{BlockHitRates})))$ | `Unitless Index (0.00 to 1.00)` |
| **Attention Domain Score** | `attention` | Inattention-penalized score: $((1 - \text{OmissionRate}) \times 0.60 + \text{HitRate} \times 0.40) \times 100$ | `Score (0 to 100)` |
| **Inhibition Domain Score** | `inhibition` | Impulsivity-penalized score: $((1 - \text{CommissionRate}) \times 0.60 + (1 - \text{FalseAlarmRate}) \times 0.40) \times 100$ | `Score (0 to 100)` |
| **Vigilance Domain Score** | `vigilance` | $\max(0, \min(100, \text{VigilanceStability} \times 100 - \max(0, -\text{VigilanceDecrement} \times 200)))$ | `Score (0 to 100)` |
| **Composite SAVT Score** | `compositeScore` | Overall weighted attention composite: $0.35 \cdot \text{Attn} + 0.35 \cdot \text{Inhib} + 0.30 \cdot \text{Vigil}$ | `Score (0 to 100)` |

### 2. Final Score Calculation Formulation

The **SAVT Composite Score** (`compositeScore`, scale: **0–100**) fuses three sub-domains:

```typescript
// 1. Attention Score: Focus integrity (Hit rate vs Misses)
const attention = Math.round(
    ((1 - features.omissionErrorRate) * 0.60 + features.hitRate * 0.40) * 100
);

// 2. Inhibition Score: Frontal inhibitory control (Distractor withholding)
const inhibition = Math.round(
    ((1 - features.commissionErrorRate) * 0.60 + (1 - features.falseAlarmRate) * 0.40) * 100
);

// 3. Vigilance Score: Sustained performance without fatigue degradation
const decrementPenalty = Math.max(0, -features.vigilanceDecrement * 200); // Penalize negative slope
const vigilance = Math.round(
    Math.max(0, Math.min(100, features.vigilanceStability * 100 - decrementPenalty))
);

// 4. Final Weighted Composite Score
const compositeScore = Math.round(
    attention * 0.35 +
    inhibition * 0.35 +
    vigilance * 0.30
);
```

---

## Module 6: Visual Sequence Memory & Pattern Recognition
**Route:** `/tests/pattern` | **Components:** `src/components/tests/pattern/` | **Engine:** `src/ai/patternFeatures.ts`  
**Neurocognitive Target:** Visuospatial working memory span (Corsi span analogue), non-verbal sequence encoding, visual pattern learning rate.

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Max Sequence Span** | `maxLevelReached` | Highest sequence difficulty level successfully completed | `Level / Item span` |
| **Total Rounds Completed** | `totalRounds` | Total sequence trials attempted | `Count (rounds)` |
| **Correct Sequence Rounds** | `correctRounds` | Count of perfectly reproduced sequences | `Count (rounds)` |
| **Response Initiation Latency**| `averageResponseLatency`| Mean latency elapsed before first tile tap in a round | `ms` (milliseconds) |
| **Sequence Completion Time** | `averageCompletionTime` | Mean total time to enter entire sequence | `ms` (milliseconds) |
| **Input Error Count** | `inputErrors` | Count of erroneous tile taps / failed rounds | `Count (errors)` |
| **Learning Rate** | `learningRate` | Speedup rate per item across rounds: $-\text{slope}\left(\frac{\text{CompletionTime}}{\text{SequenceLength}}\right) \times 100$ | `ms⁻¹ · 100` (Index) |
| **Memory Load Tolerance** | `memoryLoadTolerance` | Accuracy at maximum sequence span ($L \ge L_{\text{max}} - 1$): $\frac{\text{Correct Near-Max Rounds}}{\text{Total Near-Max Rounds}} \times 100$ | `Percentage (%)` |
| **Pattern Stability Index** | `patternStabilityIndex`| Response time consistency: $\max(0, 100 - \frac{\text{SD}(\text{Latency})}{10})$ | `Score (0 to 100)` |
| **Error Growth Rate** | `errorGrowthRate` | Difference in error rate between second half vs first half of trials: $\frac{\text{Errors}_{\text{2nd}} - \text{Errors}_{\text{1st}}}{\text{Rounds}/2}$ | `Error delta / round ratio` |
| **Sequence Accuracy Trend** | `sequenceAccuracyTrend` | Slope of accuracy progression over increasing sequence length | `Unitless Slope` |

### 2. Final Score & Normative Tier Calculation

The primary outcome metric is the **Maximum Level Span** (`maxLevelReached`) combined with the **Pattern Stability Index** and **Learning Rate**:

```typescript
// Normative Clinical Tiering (from src/utils/normativeStats.ts):
export function getPatternFeedback(level: number, avgLatencyMs: number) {
    if (level >= 6) {
        return { tier: 'Excellent', score: 95, percentile: 90, color: 'success' };
    } else if (level >= 4) {
        return { tier: 'Good / Normal', score: 80, percentile: 70, color: 'primary' };
    } else if (level >= 2) {
        return { tier: 'Moderate', score: 65, percentile: 45, color: 'warning' };
    } else {
        return { tier: 'Needs Attention', score: 45, percentile: 20, color: 'danger' };
    }
}
```

---

## Module 7: Psychomotor Simple Reaction Time Assessment
**Route:** `/test/reaction` | **Components:** `src/components/tests/reaction/` | **Engine:** `reactionScoring.ts`, `reactionFeatures.ts`  
**Neurocognitive Target:** Central nervous system processing speed, neuromuscular reaction latency, attention lapses, psychomotor fatigue.

### 1. Biomarkers Extracted & Units

| Biomarker Name | Code Identifier | Mathematical / Computational Definition | Unit |
| :--- | :--- | :--- | :--- |
| **Trial Reaction Time** | `reactionTime` | Latency from visual color stimulus onset to tap | `ms` (milliseconds) |
| **Mean Reaction Time** | `avg` | Mean response time across valid non-calibration rounds: $\frac{1}{N}\sum \text{RT}_i$ | `ms` (milliseconds) |
| **Median Reaction Time** | `median` | Median response time across valid trials | `ms` (milliseconds) |
| **Fastest Reaction Time** | `min` | Single fastest valid reaction time | `ms` (milliseconds) |
| **Slowest Reaction Time** | `max` | Single slowest valid reaction time | `ms` (milliseconds) |
| **Reaction Time Variance** | `variance` | Sample variance: $\frac{1}{N-1}\sum (\text{RT}_i - \mu)^2$ | `ms²` (square milliseconds) |
| **Consistency Score** | `consistencyScore` | Inverse Coefficient of Variation: $\max\left(0, 1 - \frac{\sqrt{\text{Variance}}}{\text{Mean}}\right)$ | `Unitless Index (0.00 to 1.00)` |
| **Fatigue Slope** | `fatigueSlope` | Linear regression slope of reaction times over round index $i$: $\frac{N\sum i\cdot\text{RT}_i - \sum i\sum\text{RT}_i}{N\sum i^2 - (\sum i)^2}$ | `ms / round` (or `ms/trial`) |
| **False Start Count** | `falseStartCount` | Premature clicks registered prior to visual stimulus presentation | `Count (events)` |
| **Missed Stimulus Count** | `missedStimulusCount` | Trials where response exceeded timeout window ($> 1500\text{ms}$) | `Count (events)` |
| **Stability Index** | `stabilityIndex` | Normalized stability: $\max\left(0, \min\left(1, 1 - \text{CV}\right)\right)$ | `Unitless Index (0.00 to 1.00)` |
| **Attention Variability** | `attentionVariability` | Combined error and variance metric: $\frac{\text{Errors}}{N} + \frac{\text{CV}}{2}$ | `Unitless Index / ratio` |
| **Baseline Deviation** | `baselineDeviation` | Deviation from personal baseline: $\frac{\text{Current Avg} - \text{Baseline Avg}}{\text{Baseline Avg}}$ | `Fractional Ratio / %` |
| **Reaction Anomaly Score** | `anomalyScore` | Weighted composite of baseline deviation, fatigue slope, and stability loss | `Score (0.00 to 1.00)` |

### 2. Final Score & Normative Feedback Formulation

The primary metrics are **Average Response Time** (`avg`) and **Fastest Response** (`min`), evaluated against normative feedback thresholds:

```typescript
// Normative Clinical Stratification (from src/utils/normativeStats.ts):
export function getReactionFeedback(avgTimeMs: number) {
    if (avgTimeMs < 250) {
        return { tier: 'Excellent', percentile: 90, color: 'success', label: 'Faster than 90% of adults' };
    } else if (avgTimeMs <= 350) {
        return { tier: 'Good / Normal', percentile: 65, color: 'primary', label: 'Within normal healthy range' };
    } else if (avgTimeMs <= 450) {
        return { tier: 'Slightly Slower', percentile: 35, color: 'warning', label: 'Slightly below typical baseline' };
    } else {
        return { tier: 'Needs Attention', percentile: 15, color: 'danger', label: 'Significantly delayed latency' };
    }
}
```

---

## Cross-Assessment Longitudinal AI Fusion & Risk Engine
**Components:** `src/ai/riskEngine.ts`, `src/ai/trendAnalyzer.ts`, `src/ai/anomalyDetector.ts`, `src/ml/trendPredictor.ts`

The AI Engine aggregates the digital biomarkers from all individual assessments into a continuous, personalized longitudinal health model.

```
+-----------------------------------------------------------------------------------+
|                            INDIVIDUAL ASSESSMENT MODULES                          |
|  [Navigation]     [Language]     [Story Recall]     [VMRA]     [SAVT]   [Pattern] |
+-------+---------------+---------------+---------------+----------+----------+-----+
        |               |               |               |          |          |
        +---------------+---------------+---------------+----------+----------+
                                        |
                                        v
                    +---------------------------------------+
                    |       FEATURE EXTRACTOR & NORMALIZER  |
                    |       - Memory Accuracy (0-1)         |
                    |       - Reaction Time Avg (ms)        |
                    |       - Pattern Recognition (0-1)     |
                    |       - Lexical Diversity / CSI       |
                    +-------------------+-------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+---------------------------------+           +---------------------------------+
|     LONGITUDINAL TREND ANALYZER |           |     STATISTICAL ANOMALY ENGINE  |
| - Memory Slope (delta/session)  |           | - Multi-variate Z-scores        |
| - Reaction Slope (ms/session)   |           | - Baseline Vector Distance (Δ)  |
| - Pattern Span Trajectory       |           | - Outlier Thresholding          |
+----------------+----------------+           +----------------+----------------+
                 |                                             |
                 +----------------------+----------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |          ENSEMBLE RISK ENGINE         |
                    |       - Low / Moderate / High Risk    |
                    |       - Top Contributing Factor Flags |
                    |       - Bayesian Confidence Score     |
                    +---------------------------------------+
```

### Longitudinal Fusion Biomarkers:
1. **Delta Vector ($\vec{\Delta}$)**: Instantaneous vector difference against baseline:
   $$\vec{\Delta} = \begin{bmatrix} \text{Memory}_{\text{curr}} - \text{Memory}_{\text{base}} \\ \text{Reaction}_{\text{base}} - \text{Reaction}_{\text{curr}} \\ \text{Pattern}_{\text{curr}} - \text{Pattern}_{\text{base}} \\ \text{Language}_{\text{curr}} - \text{Language}_{\text{base}} \end{bmatrix}$$
2. **Memory Trend Slope ($m_{\text{memory}}$)**: Linear regression slope of memory accuracy over time (slope $< -0.001\text{ / session}$ triggers decline flag).
3. **Reaction Trend Slope ($m_{\text{reaction}}$)**: Linear regression slope of psychomotor latency over time (slope $< -0.001\text{ / session}$ indicates progressive psychomotor slowing).
4. **Multivariate Anomaly Score ($z_{\text{anomaly}}$)**: Statistical Mahalanobis/Z-deviation distance measuring sudden acute deviations from the patient's rolling personal baseline.
5. **Risk Confidence Score**: Bayesian sample-size and variance-weighted confidence metric ($0.0\text{ to }1.0$).
