# VyomFlow â€” Product Requirements Document

**AI-Powered Cognitive Assessment Platform**
Version: 1.0 | Date: March 25, 2026

---

## 1. Product Overview

VyomFlow is a browser-based cognitive screening platform that delivers **4 scientifically-grounded assessment modules** designed for inclusive, longitudinal cognitive tracking. Built as a React/TypeScript PWA with Firebase backend, it targets early detection of cognitive changes through repeated, low-burden sessions.

**Target Users**: Adults 40+, caregivers, primary care clinics, population-level screening programs.
**Design Philosophy**: Language-free where possible, culturally inclusive (Indian context), offline-capable, ethical & non-diagnostic.

---

## 2. Platform Architecture (Shared)

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite |
| Auth | Firebase Auth (Google Sign-In) |
| Storage | Firestore (cloud) / localStorage (demo) |
| AI/ML | Client-side feature extraction, anomaly scoring |
| Routing | React Router v6, protected routes |

**Common Patterns Across All Modules:**
- Session ID (`session-{timestamp}`) assigned per test
- Result objects stored via `firestoreService` â†’ `testResults/{userId}/{testType}`
- Normative comparison via `normativeStats.ts` (age-referenced thresholds)
- Explainability: each result carries `keyFactors: string[]`
- Dashboard integration: composite scores + trend tracking

---

## 3. Module 1 â€” Visual Memory Recall Assessment (VMRA)

**Route**: `/test/memory`, `/test/vmra`
**Duration**: ~2 minutes
**Cognitive Domain**: Episodic Memory, Visual Recognition

### 3.1 Purpose
A language-free, image-based episodic memory test using familiar Indian-context illustrations. Replaces traditional word-list recall to eliminate literacy/language bias.

### 3.2 Test Flow

| Phase | Duration | Description |
|---|---|---|
| 0: Onboarding | ~15s | Animated walkthrough (no text). Multi-language audio toggle. Skip for returning users. |
| 1: Encoding | ~25s | 6 target images shown ONE AT A TIME (3s each + 1s fade). Progress dots below. |
| 2: Retention Gap | 15s | Distractor mini-game ("tap the odd one out" Ã— 3 rounds). Prevents rehearsal. |
| 3: Immediate Recall | Untimed | 4Ã—3 grid (6 targets + 6 distractors). Tap to select/deselect. Submit when done. |
| 4: Delayed Recall | After 5 min | Re-prompted with DIFFERENT grid arrangement. Same targets + 6 NEW distractors. |
| 5: Results | ~10s | Green (correct), amber (missed), red (false positive). Star rating 1â€“5. No raw scores shown. |

### 3.3 Image Design

- **Style**: Flat vector SVG, thick outlines, solid fills, no gradients
- **Categories** (60+ objects across 8): Fruits, Kitchen, Transport, Animals, Household, Nature, Cultural, Tools
- **Cultural constraints**: Pan-India objects only; avoid region-exclusive, brand-specific, or sensitive items
- **Recognition rule**: Identifiable in <1 second; 70%+ frame fill; max 2 colors

### 3.4 Distractor Strategy

| Sessions | Targets | Distractors | Grid | Similarity |
|---|---|---|---|---|
| 1â€“3 | 5 | 5 | 3Ã—4 | Lowâ€“Medium |
| 4â€“8 | 6 | 6 | 4Ã—3 | Medium |
| 9â€“15 | 7 | 7 | 4Ã—4 | Mediumâ€“High |
| 16+ | 8 | 8 | 4Ã—4 | High |

Distractors are from the **same category** as targets (e.g., mango â†’ orange). Pools rotated to prevent rote learning.

### 3.5 Metrics & Biomarkers

**Primary Accuracy:**
| Metric | Formula |
|---|---|
| Recall Accuracy | correctHits / targetCount |
| False Positive Rate | falsePositives / distractorCount |
| Precision | correctHits / (correctHits + falsePositives) |
| F1 Score | Harmonic mean of precision & recall |
| Net Recall Score | correctHits âˆ’ falsePositives |

**Temporal Biomarkers:**
- Mean Selection Latency, First-Tap Latency, Inter-Tap Interval, Latency Variance

**Error Analysis:**
- Primacy Bias, Recency Bias, Mid-List Deficit
- Confusion Pairs (which target â†” distractor confusions)
- Intrusion Errors (unrelated distractor picks)

**Spatial Analysis:**
- Spatial Selection Bias (top/bottom/left/right dominant quadrant)
- Grid Coverage (% of grid interacted with)

**Session Quality Flags:**
- `possibleGuessing` (>80% grid selected or accuracy â‰ˆ 50% + high FPR)
- `possibleRandomTapping` (mean latency < 300ms)

**Longitudinal:**
- Forgetting Curve Slope (immediate vs. delayed ratio over sessions)
- Session-over-Session Trend (rolling 5-session average)
- Consistency Score (CoV of accuracy)
- Performance Deviation from Baseline (>2 SD = alert)

### 3.6 Decline Signals

| Signal | Threshold |
|---|---|
| Accuracy drop | >2 SD below personal baseline |
| Forgetting curve steepening | Slope increase >30% over 4 sessions |
| False positive spike | FPR increasing >15% over 3 sessions |
| Delayed recall collapse | Delayed/Immediate ratio < 0.5 |
| Consistency breakdown | CoV > 0.3 over last 5 sessions |

### 3.7 Risk Messaging (Ethical)

| Level | Icon | Message |
|---|---|---|
| Stable | ðŸŸ¢ Shield | "Your memory performance is steady." |
| Watch | ðŸŸ¡ Eye | "Some changes noticed. Keep tracking." |
| Attention | ðŸŸ  Alert | "Consider discussing with a healthcare provider." |

> **Never** says "decline detected" or mentions specific diagnoses.

---

## 4. Module 2 â€” Reaction Time Test

**Route**: `/test/reaction`
**Duration**: ~1 minute
**Cognitive Domain**: Processing Speed, Sustained Attention

### 4.1 Purpose
Measures simple reaction time (SRT) â€” a fundamental cognitive biomarker for processing speed and alertness. Detects slowing, fatigue, and attention lapses.

### 4.2 Test Flow

| Phase | Description |
|---|---|
| Idle | "Ready to begin" â€” start button |
| Instructions | Brief visual guide: "Click when the screen changes color" |
| Calibration | 1 practice round (not scored) |
| Wait â†’ Stimulus | Screen shows waiting color; random delay (2000â€“5000ms); then stimulus color appears |
| Response | User clicks/taps as fast as possible |
| Round Complete | Brief pause (1500ms), then next round |
| Test Complete | Results shown after 6 total rounds (1 calibration + 5 scored) |

### 4.3 Configuration

| Parameter | Default |
|---|---|
| Total Rounds | 6 |
| Calibration Rounds | 1 |
| Wait Duration | 2000â€“5000ms (random) |
| Timeout | 3000ms |
| Inter-Round Delay | 1500ms |

### 4.4 State Machine

```
idle â†’ instructions â†’ wait â‡„ false_start
                        â†“
                    stimulus â†’ response
                        â†“         â†“
                    timeout   round_complete â†’ (next round or test_complete)
```

**Edge Cases:**
- **False Start**: Click during wait phase â†’ flagged, round continues
- **Timeout**: No response in 3000ms â†’ flagged as missed stimulus
- **Keyboard support**: Spacebar/Enter triggers response (accessibility)

### 4.5 Metrics

**Raw (per round):**
- `reactionTime` (ms or null), `isFalseStart`, `isTimeout`, `roundIndex`

**Aggregates:**
| Metric | Description |
|---|---|
| Average RT | Mean of valid reaction times |
| Median RT | Median (robust to outliers) |
| Min / Max RT | Range of responses |
| Variance | Consistency measure |
| Fatigue Slope | Linear regression slope across rounds (positive = slowing) |

**Derived ML Features:**
| Feature | Description |
|---|---|
| Stability Index | 1 âˆ’ coefficient of variation (0 = unstable, 1 = stable) |
| Fatigue Slope | Rate of slowing over rounds |
| Attention Variability | Error rate + half CV |
| Baseline Deviation | % change from user's historical average |
| Anomaly Score | Composite 0â€“1 (>0.5 = clinically notable) |

### 4.6 Normative Comparison

| Threshold (ms) | Category |
|---|---|
| â‰¤ 220 | Exceptional |
| â‰¤ 270 | Above Average |
| â‰¤ 330 | Average |
| â‰¤ 380 | Below Average |
| > 380 | Needs Attention |

Reference: Young adult mean ~245ms, Older adult mean ~330ms.

---

## 5. Module 3 â€” Pattern Recognition (Visual Sequence Memory)

**Route**: `/tests/pattern`
**Duration**: ~2 minutes
**Cognitive Domain**: Visual Working Memory, Sequential Processing

### 5.1 Purpose
Corsi Block Tappingâ€“inspired digital assessment. Measures visual-spatial working memory span and learning capacity by requiring users to reproduce sequences of increasing length on a grid.

### 5.2 Test Flow

| Phase | Description |
|---|---|
| Instructions | Visual guide showing grid and sequence demo |
| Display | System highlights tiles in sequence (one at a time) |
| Input | User taps tiles in the same order |
| Feedback | Correct (advance) / Incorrect (retry or end) |
| Difficulty Scaling | Grid size and sequence length increase with level |
| Results | Max level reached, accuracy trend, learning curve |

### 5.3 Difficulty Scaling

| Level | Grid Size | Sequence Length |
|---|---|---|
| 1 | 3Ã—3 | 3 |
| 3 | 3Ã—3 | 4 |
| 5 | 4Ã—4 | 5 |
| 7 | 4Ã—4 | 6 |
| 9+ | 5Ã—5 | 7+ |

Grid size computed via `getGridSize(lvl)`, sequence via `getSequenceLength(lvl)`.

### 5.4 Metrics

**Raw (per round):**
| Field | Description |
|---|---|
| `level` | Current difficulty |
| `gridSize` | Grid dimensions |
| `sequenceLength` | Number of tiles in sequence |
| `targetSequence` | Correct tile order |
| `userInput` | User's actual taps |
| `isCorrect` | Round success |
| `responseLatency` | Time to first click (ms) |
| `completionTime` | Total round time (ms) |

**Session Aggregates:**
| Metric | Description |
|---|---|
| Max Level Reached | Highest level completed correctly |
| Correct Rounds | Total rounds passed |
| Average Response Latency | Mean first-click time |
| Input Errors | Wrong tiles clicked |
| Retries | Failed attempts at same level |

**Derived ML Features:**
| Feature | Description |
|---|---|
| Sequence Accuracy Trend | Slope of accuracy as difficulty increases |
| Learning Rate | Improvement metric over rounds |
| Error Growth Rate | How errors scale with difficulty |
| Memory Load Tolerance | Performance at maximum sequence length |
| Pattern Stability Index | Variance consistency across attempts |

### 5.5 Normative Comparison

| Span (Level) | Category |
|---|---|
| â‰¥ 6 | Exceptional |
| â‰¥ 5 | Above Average |
| â‰¥ 3 | Average |
| â‰¥ 2 | Below Average |
| < 2 | Needs Attention |

Reference: Young adult mean span ~5.5, Older adult mean ~3.6.

---

## 6. Module 4 â€” Language Assessment (Speech Fluency)

**Route**: `/test/language`
**Duration**: ~2 minutes
**Cognitive Domain**: Language Production, Verbal Fluency, Executive Function

### 6.1 Purpose
Assesses spontaneous speech production using the Web Speech API. User responds to a narrative prompt, and the system analyzes fluency, lexical diversity, and coherence â€” key markers for language-related cognitive changes.

### 6.2 Test Flow

| Phase | Description |
|---|---|
| Instructions | Prompt displayed (e.g., "Describe what you did yesterday in as much detail as possible.") |
| Recording | Microphone active; live transcript displayed; timer running |
| Processing | Speech analysis computed client-side |
| Results | WPM, fluency, vocabulary metrics shown with normative comparisons |

### 6.3 Prompt Pool (10 prompts, randomly selected)

1. "Describe what you did yesterday in as much detail as possible."
2. "Describe a place you visit often and why you like it."
3. "Talk about a normal day for you, from morning to night."
4. "Tell me about your favorite meal and how it is prepared."
5. "Describe an important festival or celebration you enjoy."
6. "What do you see when you look out your window?"
7. "Describe your favorite season and why you like it."
8. "Explain the rules of a game or sport you know."
9. "Talk about a memorable trip you have taken."
10. "Describe a person who has influenced your life."

### 6.4 Metrics

**Raw Metrics:**
| Metric | Description |
|---|---|
| Word Count | Total words spoken |
| Speech Duration | Recording length (seconds) |
| Pause Count | Number of detected pauses |
| Pause Duration Avg | Mean pause length |
| Filler Word Count | "um", "uh", "like", etc. |
| Repetitions | Repeated words/phrases |
| Unique Word Count | Distinct words used |

**Derived ML Features:**
| Feature | Formula / Description |
|---|---|
| WPM | Words per minute |
| Lexical Diversity | uniqueWords / totalWords |
| Fluency Index | Composite of WPM âˆ’ pauses âˆ’ fillers |
| Hesitation Index | (pauses + fillers) / totalWords |
| Speech Stability | Consistency of speech segments |
| Coherence Proxy | Heuristic based on vocabulary & structure |

### 6.5 Normative Comparison

**WPM Thresholds:**
| Range | Category |
|---|---|
| â‰¥ 160 | Fast |
| â‰¥ 130 | Average |
| â‰¥ 100 | Below Average |
| < 100 | Needs Attention |

**Hesitation Index Thresholds (lower = better):**
| Range | Category |
|---|---|
| â‰¤ 0.02 | Exceptional (highly fluent) |
| â‰¤ 0.04 | Average |
| â‰¤ 0.07 | Below Average |
| > 0.07 | Needs Attention (disrupted fluency) |

Fluency (hesitation) is prioritized over speed as a stronger cognitive biomarker.

---

## 7. Cross-Module Dashboard Integration

All 4 modules feed into a unified **Dashboard** (`/dashboard`) that provides:

- **Per-module scores** with normative color coding
- **Trend charts** (session-over-session for each domain)
- **Composite cognitive score** (weighted across modules)
- **AI risk engine** with anomaly detection across all domains
- **Explainability** â€” each session reports `keyFactors` explaining the score

### Data Flow

```
Module Result â†’ firestoreService.saveTestResult()
                         â†“
              Firestore: testResults/{userId}/{testType}/sessions[]
                         â†“
              Dashboard: useTestResults() hook â†’ trend engine â†’ risk alerts
```

---

## 8. Accessibility & Inclusivity

| Feature | Implementation |
|---|---|
| Language-free UI | Icon-based navigation, no-text instructions for VMRA |
| Multi-language audio | Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, English |
| Touch targets | Minimum 60Ã—60px (WCAG AAA) |
| High contrast | Bold outlines, clear borders, 12px spacing |
| Screen readers | Hidden alt-text labels on all images |
| Offline support | SVGs bundled (<500KB total), Service Worker cached |
| Low-end devices | Tested for 1GB RAM Android, 320px min screen width |
| Keyboard support | Space/Enter for reaction test, Tab navigation |

---

## 9. Ethical Guidelines

1. **Non-diagnostic**: The app never states "decline detected" or names conditions
2. **Supportive language**: Risk messaging uses encouraging, non-alarming phrasing
3. **No anxiety triggers**: Raw numerical scores hidden from users; star ratings used
4. **Guessing detection**: Sessions flagged for random behavior are excluded from trend analysis
5. **Data privacy**: Assessment data stored per-user; Google Auth for identity; no data sharing
6. **Informed consent**: Clear disclaimers via `ethics/disclaimer.ts` and `messagingRules.ts`
