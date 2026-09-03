# Phase 1 — Data Foundation (`DashboardViewModel`)

> **Goal**: Create a single `DashboardViewModel` type and a `useDashboardViewModel()` hook that encapsulates ALL data fetching, ML inference, drift evaluation, alert generation, and data normalization. Every dashboard component will consume this one hook.

---

## Why This Phase Exists

The current [Dashboard.tsx](file:///c:/Users/Sashank%20Raviraj/AppData/Roaming/Desktop/VyomFlow/src/pages/Dashboard.tsx) has data scattered everywhere:
- 7 separate `useXxxResults()` hooks called inline
- Multiple `useMemo()` transforms computing `chartData`, `sessionPoints`, `latestScores`, `alertContext`
- `useEffect` calling `predictCognitiveProfile()`, `evaluateLongitudinalDrift()`, `generateClinicalAlert()` all inline
- Props passed ad-hoc with `(alertOutput as any).crossSectionalRisk = [...]` casting

This creates inconsistencies between cards and makes maintenance painful. The ViewModel centralizes everything.

---

## Files to Create

### 1. `src/services/dashboardViewModel.ts`

This is a **pure TypeScript module** (no React). It defines the `DashboardViewModel` interface and the `buildDashboardViewModel()` function.

#### Type Definitions

```typescript
import type { CognitiveModelPrediction, BiomarkerAttribution } from './clinicalModelEngine';
import type { RawDashboardData, UserDemographics } from './dataMapper';
import type { TrajectoryClassification, LongitudinalEvaluation, DriftMetrics } from './statisticalDriftEngine';
import type { AlertOutput } from './clinicalAlertEngine';

// ─── Section 1: Hero Summary ───────────────────────────────────
export interface OverviewViewModel {
  cognitiveStatus: 'Stable' | 'Possible Risk' | 'Needs Attention';
  statusEmoji: '🟢' | '🟡' | '🟠' | '🔴';
  statusColor: 'green' | 'yellow' | 'orange' | 'red';
  confidence: number;           // 0-100
  lastAssessmentDate: string;   // Human-readable date string
  comparisonSummary: string;    // "No significant decline detected"
  recommendation: string;       // "Continue annual monitoring"
}

// ─── Section 2: AI Prediction ──────────────────────────────────
export interface AIPredictionViewModel {
  predictedStatus: 'Normal' | 'MCI' | 'Dementia';
  probabilities: { normal: number; mci: number; dementia: number };
  estimatedMoCA: number;        // 0.0 - 30.0
  mocaCI: number;               // ±X points
  riskScore: number;            // 0.0 - 1.0
  riskLevel: 'Low' | 'Moderate' | 'High';
  modelConfidence: number;      // 0-100
  batteryCoverage: number;      // 0.0 - 1.0
  completedModules: string[];
}

// ─── Section 3: Domain Scores ──────────────────────────────────
export interface DomainScoreViewModel {
  key: string;                  // 'memory' | 'language' | etc.
  name: string;                 // 'Memory'
  icon: string;                 // '🧠'
  score: number;                // 0-100
  previousScore: number | null;
  delta: number | null;         // +3, -5, 0
  trend: 'up' | 'down' | 'stable';
  label: string;                // 'Good' | 'Monitor' | 'Stable' | 'Improving'
}

// ─── Section 4: Module Trend Charts ────────────────────────────
export interface ModuleSessionPoint {
  sessionLabel: string;         // "Session 1"
  date: string;                 // "12/08/2026"
  timestamp: number;
  score: number | null;
  rawResult: any;               // Full result object for biomarker drill-down
}

export interface ModuleTrendViewModel {
  moduleKey: string;            // 'vmra' | 'story' | 'language' | 'pattern' | 'reaction' | 'navigation' | 'memory'
  moduleName: string;           // 'Visual Memory (VMRA)'
  chartColor: string;           // '#06b6d4'
  unit: string;                 // '/100' | 'ms' | '%'
  domain: [number | 'auto', number | 'auto']; // Y-axis domain
  sessions: ModuleSessionPoint[];
}

// ─── Section 5: Changes Since Previous Visit ────────────────────
export interface ChangesViewModel {
  improved: { domain: string; delta: number }[];
  declined: { domain: string; delta: number }[];
  stable: string[];
}

// ─── Section 6: Assessment Module Cards ─────────────────────────
export interface AssessmentModuleViewModel {
  key: string;                  // 'vmra'
  name: string;                 // 'Visual Memory'
  icon: string;                 // '🧠'
  score: number | null;         // Latest score or null if never taken
  maxScore: number;             // 100
  isCompleted: boolean;
  sessionCount: number;         // How many times taken
  lastCompletedDate: string | null;
  route: string;                // '/test/vmra'
}

// ─── Section 7: Explainability ──────────────────────────────────
export interface ExplainabilityViewModel {
  positive: { factor: string; description: string }[];
  negative: { factor: string; description: string }[];
}

// ─── Section 8: Longitudinal Summary ────────────────────────────
export interface LongitudinalViewModel {
  trajectory: string;           // 'Stable' | 'Possible Decline' | etc.
  trajectoryColor: string;      // '#4ade80' for Stable, '#fbbf24' for Possible, etc.
  summary: string;              // "No statistically significant decline detected"
  sessionCount: number;
  lastUpdated: string;
  advancedMetrics: {
    rci: number;
    theilSenSlope: number;
    zDrift: number;
    cv: number;
  } | null;
}

// ─── Section 9: Recommendation ──────────────────────────────────
export interface RecommendationViewModel {
  text: string;
  urgency: 'routine' | 'followup' | 'clinical';
  icon: string;
}

// ─── Section 10: Clinician Report ───────────────────────────────
export interface ModuleBiomarkerSummary {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'watch' | 'concern';
}

export interface ClinicianReportViewModel {
  demographics: UserDemographics & { age: number; gender: string; educationYears: number };
  prediction: CognitiveModelPrediction;
  allModuleResults: RawDashboardData;
  topBiomarkersPerModule: Record<string, ModuleBiomarkerSummary[]>;
  driftMetrics: DriftMetrics | null;
  sessionHistory: {
    date: string;
    moduleScores: Record<string, number | null>;
  }[];
}

// ─── Master ViewModel ───────────────────────────────────────────
export interface DashboardViewModel {
  overview: OverviewViewModel;
  aiPrediction: AIPredictionViewModel;
  domainScores: DomainScoreViewModel[];
  moduleTrends: ModuleTrendViewModel[];
  changes: ChangesViewModel;
  assessmentModules: AssessmentModuleViewModel[];
  explainability: ExplainabilityViewModel;
  longitudinal: LongitudinalViewModel;
  recommendation: RecommendationViewModel;
  clinicianReport: ClinicianReportViewModel;
  radarScores: {
    memory: number;
    language: number;
    executive: number;
    processingSpeed: number;
    spatialOrientation: number;
    attention: number;
  };
  hasData: boolean;
  isLoading: boolean;
  sessionCount: number;
}
```

#### Build Function

Create a function `buildDashboardViewModel(...)` that takes:
1. All 7 module result arrays (`reactionResults`, `memoryResults`, etc.)
2. A `CognitiveModelPrediction` (from `predictCognitiveProfile()`)
3. A `LongitudinalEvaluation` (from `evaluatePatientTrajectory()`)
4. An `AlertOutput` (from `generateClinicalAlert()`)
5. `DriftMetrics | null` (from `evaluateLongitudinalDrift()`)
6. `UserDemographics`

And returns a fully computed `DashboardViewModel`.

**Key logic to implement in the build function:**

1. **Session grouping**: Group all 7 module results by date (like the current `chartData` useMemo in Dashboard.tsx lines 126-162)
2. **Score extraction for each module** (critical — fix bugs here):
   - VMRA: `features.recallAccuracy * 100` (verify field path against `VmraAssessmentResult` type)
   - Story: `storyRecallScore` (already 0-100)
   - Language: `derivedFeatures.cognitiveSpeechIndex ?? derivedFeatures.fluencyIndex` (fallback chain)
   - Pattern: `Math.min(metrics.maxLevelReached * 10, 100)`
   - Reaction: `aggregates.avg` (in ms — note: lower is better, so for scoring use `Math.max(0, 100 - (avg - 250) / 4)`)
   - Navigation: `navigationScore` (already 0-100)
   - Memory (legacy): `accuracy * 100`
3. **Domain scores**: Map from `prediction.domainScores` and compute deltas against previous session
4. **Changes**: Compare current session domain scores vs. previous session
5. **Explainability translation**: Convert `prediction.topAttributions` into human-readable descriptions:
   - `vmra_delayedRecallAccuracy` → "Strong delayed recall retention"
   - `reaction_meanLatencyMs` with negative impact → "Slower reaction time"
   - `nav_landmarkRecognitionAccuracy` → "Good landmark recognition"
   - etc.
6. **Top 5 biomarkers per module for clinician report**: For each module, extract the 5 most clinically relevant biomarkers with values and status

#### Explainability Translation Map

```typescript
const BIOMARKER_TRANSLATIONS: Record<string, { positive: string; negative: string; domain: string }> = {
  vmra_recallAccuracy: { positive: 'Strong visual memory recall', negative: 'Reduced visual memory recall', domain: 'Memory' },
  vmra_delayedRecallAccuracy: { positive: 'Good delayed recall retention', negative: 'Reduced delayed recall', domain: 'Memory' },
  vmra_forgettingCurveSlope: { positive: 'Slow forgetting rate', negative: 'Rapid forgetting rate', domain: 'Memory' },
  vmra_intrusionErrors: { positive: 'Low intrusion errors', negative: 'Elevated intrusion errors', domain: 'Memory' },
  story_recallAccuracy: { positive: 'Strong story recall', negative: 'Reduced story recall', domain: 'Memory' },
  story_infoUnitsRecalled: { positive: 'Good detail retention', negative: 'Missed key story details', domain: 'Memory' },
  lang_cognitiveSpeechIndex: { positive: 'Stable speech fluency', negative: 'Reduced speech fluency', domain: 'Language' },
  lang_lexicalDiversity: { positive: 'Rich vocabulary usage', negative: 'Limited vocabulary usage', domain: 'Language' },
  lang_hesitationIndex: { positive: 'Fluent speech production', negative: 'Increased speech hesitations', domain: 'Language' },
  reaction_meanLatencyMs: { positive: 'Fast reaction time', negative: 'Slower reaction time', domain: 'Speed' },
  reaction_vigilanceDecrement: { positive: 'Sustained attention', negative: 'Declining attention over time', domain: 'Attention' },
  pattern_maxLevelReached: { positive: 'Strong working memory span', negative: 'Reduced working memory span', domain: 'Executive' },
  pattern_memoryLoadTolerance: { positive: 'Good cognitive load tolerance', negative: 'Reduced cognitive load capacity', domain: 'Executive' },
  nav_navigationAccuracy: { positive: 'Accurate route memory', negative: 'Reduced route memory', domain: 'Spatial' },
  nav_landmarkRecognitionAccuracy: { positive: 'Good landmark recognition', negative: 'Reduced landmark recognition', domain: 'Spatial' },
  nav_spatialMemoryIndex: { positive: 'Strong spatial awareness', negative: 'Reduced spatial awareness', domain: 'Spatial' },
};
```

#### Top 5 Biomarkers Per Module (for Clinician Report)

```typescript
const MODULE_KEY_BIOMARKERS: Record<string, { key: string; label: string; unit: string; extractor: (result: any) => number | null }[]> = {
  vmra: [
    { key: 'recallAccuracy', label: 'Recall Accuracy', unit: '%', extractor: r => r?.features?.recallAccuracy != null ? r.features.recallAccuracy * 100 : null },
    { key: 'delayedRecall', label: 'Delayed Recall', unit: '%', extractor: r => r?.delayedRecall?.delayedFeatures?.recallAccuracy != null ? r.delayedRecall.delayedFeatures.recallAccuracy * 100 : null },
    { key: 'firstTapLatency', label: 'First Tap Latency', unit: 'ms', extractor: r => r?.features?.firstTapLatencyMs ?? null },
    { key: 'intrusionErrors', label: 'Intrusion Errors', unit: 'count', extractor: r => r?.features?.intrusionErrors ?? null },
    { key: 'forgettingSlope', label: 'Forgetting Curve Slope', unit: '', extractor: r => r?.delayedRecall?.forgettingCurveSlope ?? null },
  ],
  story: [
    { key: 'recallAccuracy', label: 'Recall Accuracy', unit: '%', extractor: r => r?.biomarkers?.memory?.recallAccuracy != null ? r.biomarkers.memory.recallAccuracy * 100 : null },
    { key: 'infoUnits', label: 'Info Units Recalled', unit: '', extractor: r => r?.biomarkers?.memory?.infoUnitsRecalled ?? null },
    { key: 'mcqAccuracy', label: 'Comprehension MCQ', unit: '%', extractor: r => r?.biomarkers?.comprehension?.mcqAccuracy != null ? r.biomarkers.comprehension.mcqAccuracy * 100 : null },
    { key: 'speechRate', label: 'Speech Rate', unit: 'WPM', extractor: r => r?.biomarkers?.speech?.speechRateWPM ?? null },
    { key: 'sequenceScore', label: 'Sequence Score', unit: '%', extractor: r => r?.biomarkers?.narrative?.storySequenceScore != null ? r.biomarkers.narrative.storySequenceScore * 100 : null },
  ],
  language: [
    { key: 'csi', label: 'Cognitive Speech Index', unit: '/100', extractor: r => r?.derivedFeatures?.cognitiveSpeechIndex ?? null },
    { key: 'fluency', label: 'Fluency Index', unit: '/100', extractor: r => r?.derivedFeatures?.fluencyIndex ?? null },
    { key: 'lexicalDiv', label: 'Lexical Diversity', unit: '', extractor: r => r?.derivedFeatures?.lexicalDiversity ?? null },
    { key: 'wpm', label: 'Words Per Minute', unit: 'WPM', extractor: r => r?.derivedFeatures?.wpm ?? null },
    { key: 'hesitation', label: 'Hesitation Index', unit: '', extractor: r => r?.derivedFeatures?.hesitationIndex ?? null },
  ],
  pattern: [
    { key: 'maxLevel', label: 'Max Level Reached', unit: '', extractor: r => r?.metrics?.maxLevelReached ?? null },
    { key: 'accuracy', label: 'Accuracy', unit: '%', extractor: r => r?.metrics ? (r.metrics.correctRounds / Math.max(1, r.metrics.totalRounds)) * 100 : null },
    { key: 'avgLatency', label: 'Avg Response Time', unit: 'ms', extractor: r => r?.metrics?.averageResponseLatency ?? null },
    { key: 'learningRate', label: 'Learning Rate', unit: '', extractor: r => r?.features?.learningRate ?? null },
    { key: 'stability', label: 'Pattern Stability', unit: '/100', extractor: r => r?.features?.patternStabilityIndex ?? null },
  ],
  reaction: [
    { key: 'avgLatency', label: 'Average Latency', unit: 'ms', extractor: r => r?.aggregates?.avg ?? null },
    { key: 'medianLatency', label: 'Median Latency', unit: 'ms', extractor: r => r?.aggregates?.median ?? null },
    { key: 'stdDev', label: 'Latency Std Dev', unit: 'ms', extractor: r => r?.aggregates?.std ?? null },
    { key: 'lapses', label: 'Attention Lapses', unit: 'count', extractor: r => r?.aggregates?.lapses ?? null },
    { key: 'premature', label: 'Premature Responses', unit: 'count', extractor: r => r?.aggregates?.premature ?? null },
  ],
  navigation: [
    { key: 'navScore', label: 'Navigation Score', unit: '/100', extractor: r => r?.navigationScore ?? null },
    { key: 'navAccuracy', label: 'Route Accuracy', unit: '%', extractor: r => r?.biomarkers?.navigationAccuracy != null ? r.biomarkers.navigationAccuracy * 100 : null },
    { key: 'landmarkAcc', label: 'Landmark Recognition', unit: '%', extractor: r => r?.biomarkers?.landmarkRecognitionAccuracy != null ? r.biomarkers.landmarkRecognitionAccuracy * 100 : null },
    { key: 'decisionLatency', label: 'Avg Decision Time', unit: 'ms', extractor: r => r?.biomarkers?.averageDecisionLatencyMs ?? null },
    { key: 'spatialMemory', label: 'Spatial Memory Index', unit: '%', extractor: r => r?.biomarkers?.chronologicalRecallScore != null ? r.biomarkers.chronologicalRecallScore * 100 : null },
  ],
};
```

---

### 2. `src/hooks/useDashboardViewModel.ts`

This is a **React custom hook** that orchestrates all data fetching and computation, returning a `DashboardViewModel`.

```typescript
import { useMemo, useEffect, useState } from 'react';
import {
  useReactionResults, useMemoryResults, usePatternResults,
  useLanguageResults, useVmraResults, useStoryResults, useNavigationResults
} from './useTestResults';
import { predictCognitiveProfile, type CognitiveModelPrediction } from '../services/clinicalModelEngine';
import { evaluatePatientTrajectory, evaluateLongitudinalDrift } from '../services/statisticalDriftEngine';
import { generateClinicalAlert } from '../services/clinicalAlertEngine';
import { mapToSessionData, type RawDashboardData } from '../services/dataMapper';
import { buildDashboardViewModel, type DashboardViewModel } from '../services/dashboardViewModel';

export function useDashboardViewModel(): DashboardViewModel {
  // 1. Call all 7 result hooks
  const { results: reactionResults } = useReactionResults();
  const { results: memoryResults } = useMemoryResults();
  const { results: patternResults } = usePatternResults();
  const { results: languageResults } = useLanguageResults();
  const { results: vmraResults } = useVmraResults();
  const { results: storyResults } = useStoryResults();
  const { results: navigationResults } = useNavigationResults();

  // 2. ML prediction state
  const [prediction, setPrediction] = useState<CognitiveModelPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Aggregate raw data
  const rawData: RawDashboardData = useMemo(() => ({
    reaction: reactionResults,
    memory: memoryResults,
    pattern: patternResults,
    language: languageResults,
    vmra: vmraResults,
    story: storyResults,
    navigation: navigationResults,
  }), [reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults, navigationResults]);

  // 4. Read demographics from localStorage
  const demographics = useMemo(() => {
    try {
      const saved = localStorage.getItem('vyomflow_user_profile');
      return saved ? JSON.parse(saved) : undefined;
    } catch { return undefined; }
  }, []);

  // 5. Run ML inference + drift + alert
  useEffect(() => {
    let mounted = true;
    async function compute() {
      const hasData = /* check at least one module has results */ ...;
      if (!hasData) { setIsLoading(false); return; }

      const pred = await predictCognitiveProfile(rawData, demographics);
      
      const sessions = mapToSessionData(rawData);
      let driftMetrics = null;
      if (sessions.length >= 2) {
        driftMetrics = evaluateLongitudinalDrift(sessions, 10);
      }
      
      // ... build session points for evaluatePatientTrajectory
      // ... call generateClinicalAlert
      
      if (mounted) {
        setPrediction(pred);
        setIsLoading(false);
      }
    }
    compute();
    return () => { mounted = false; };
  }, [rawData, demographics]);

  // 6. Build full ViewModel
  return useMemo(() => {
    return buildDashboardViewModel(rawData, prediction, /* evaluation, alertOutput, driftMetrics */, demographics, isLoading);
  }, [rawData, prediction, isLoading, demographics]);
}
```

> **Note**: The above is pseudocode — the implementing LLM should fill in all the computation that currently lives in Dashboard.tsx lines 126-291 and move it into `buildDashboardViewModel()`.

---

## Key Data Extraction Bug Fixes (Do During This Phase)

### Language Module
**Current issue in Dashboard.tsx line 156:**
```typescript
speech: language ? Math.round(language.derivedFeatures.wpm) : null,
csi: language ? Math.round(language.derivedFeatures.cognitiveSpeechIndex ?? 85) : null,
```

**Problem**: `cognitiveSpeechIndex` is an optional field in `LanguageDerivedFeatures`. If the language assessment doesn't compute it, it silently falls back to 85 (a magic number). The chart then shows "85" for every session which looks like real data but isn't.

**Fix**: In the ViewModel, only include a score when it's genuinely computed. Use `null` for missing data, not a fallback constant. The chart component should handle `null` as a gap in the line.

### Story Module
**Current extraction** in Dashboard.tsx line 158:
```typescript
storyRecall: storyRes ? storyRes.storyRecallScore : null,
```
This looks correct — `storyRecallScore` is a direct 0-100 score on `StoryAssessmentResult`. Verify that the Story assessment component actually sets this field after scoring (check `StoryScoring.ts` line 126).

### Navigation Module
The current extraction at Dashboard.tsx line 159 uses `navRes.navigationScore` which maps to `ImmersiveNavigationResult.navigationScore` (0-100). This appears correct.

---

## Verification After Phase 1

```bash
npm run build  # Zero TypeScript errors
```

Additionally, write a quick smoke test:
- Import `buildDashboardViewModel` and call it with mock data
- Verify the returned object has all expected fields populated
- Verify domain score deltas compute correctly
- Verify explainability translations produce human-readable text

---

## Files Summary

| Action | File |
|---|---|
| **CREATE** | `src/services/dashboardViewModel.ts` |
| **CREATE** | `src/hooks/useDashboardViewModel.ts` |
