# Phase 4 — Integration & Data Bug Fixes

> **Goal**: Audit and fix all data extraction bugs, ensure demographics flow correctly, and verify end-to-end data integrity from assessment modules through the ViewModel to dashboard components.

---

## Prerequisites

- Phases 1-3 complete: ViewModel, page shell, and all components are created and building

---

## Task 1: Audit & Fix Data Extraction in `dataMapper.ts`

**File**: `src/services/dataMapper.ts`

### Current Issues to Investigate

The `mapToSessionData()` function groups results by day and extracts a score per module. Check each extractor:

```typescript
// Current extractors — verify each one against actual result types:

// SAVT/Reaction — verify aggregates.avg exists on ReactionTestResult
processResults(data.reaction || [], 'SAVT', (r) => {
    return Math.max(0, 100 - ((r as any).aggregates?.avg || 300) / 20);
});

// Pattern — verify metrics.maxLevelReached exists on PatternAssessmentResult
processResults(data.pattern || [], 'PATTERN', (p) => {
    return Math.min(100, ((p as any).metrics?.maxLevelReached || 1) * 10);
});

// Memory — verify accuracy exists
processResults(data.memory || [], 'MEMORY', (m) => {
    return (m.accuracy || 0.5) * 100;
});

// Language — verify derivedFeatures.fluencyIndex exists on LanguageAssessmentResult
processResults(data.language || [], 'LANGUAGE', (l) => {
    return l.derivedFeatures?.fluencyIndex ?? 80;
});
// ⚠️ NOTE: Should this use cognitiveSpeechIndex instead? The CSI is the more comprehensive score.

// VMRA — verify features.recallAccuracy exists on VmraAssessmentResult
processResults(data.vmra || [], 'VMRA', (v) => {
    return (((v.features as any)?.recallAccuracy ?? (v.features as any)?.accuracy ?? 0.8)) * 100;
});

// Story — verify biomarkers.memory.recallAccuracy exists on StoryAssessmentResult
processResults(data.story || [], 'STORY', (s) => {
    return (s.biomarkers?.memory?.recallAccuracy ?? 0.8) * 100;
});
// ⚠️ NOTE: StoryAssessmentResult has a direct `storyRecallScore` (0-100) field. Using that would be
// more consistent and avoids the 0.8 fallback masking missing data.

// Navigation — verify biomarkers.navigationAccuracy exists on ImmersiveNavigationResult
processResults(data.navigation || [], 'NAVIGATION', (n) => {
    return (n.biomarkers?.navigationAccuracy ?? 0.8) * 100;
});
// ⚠️ NOTE: ImmersiveNavigationResult also has a direct `navigationScore` (0-100) field. Use that instead.
```

### Recommended Fixes

```typescript
// Fix Language: use CSI as primary, fluencyIndex as fallback, NO magic number fallback
processResults(data.language || [], 'LANGUAGE', (l) => {
    return l.derivedFeatures?.cognitiveSpeechIndex ?? l.derivedFeatures?.fluencyIndex ?? null;
});
// Return null for missing data instead of a magic 80

// Fix Story: use the direct storyRecallScore
processResults(data.story || [], 'STORY', (s) => {
    return s.storyRecallScore ?? null;
});

// Fix Navigation: use the direct navigationScore
processResults(data.navigation || [], 'NAVIGATION', (n) => {
    return n.navigationScore ?? null;
});
```

> **IMPORTANT**: After changing extractors to return `null` for missing data, verify that downstream code in `statisticalDriftEngine.ts` handles `null` module scores gracefully (it should skip missing modules from drift calculation).

---

## Task 2: Fix Demographics in Clinician Report

**File**: `src/pages/Dashboard.tsx` (current, for reference of the bug)

Currently at line 584-586:
```tsx
<ClinicianReportModal
    ...
    patientAge={70}          // ← HARDCODED
    patientGender={'Female'} // ← HARDCODED
    educationYears={16}      // ← HARDCODED
/>
```

**Fix in the ViewModel**: The `useDashboardViewModel` hook already reads demographics from localStorage:
```typescript
const saved = localStorage.getItem('vyomflow_user_profile');
```

The `vyomflow_user_profile` object structure (check `src/pages/Settings.tsx` for the save format):
```typescript
{
  age: number;
  gender: string; // 'Male' | 'Female' | 'Other'
  educationYears: number;
  name?: string;
  language?: string;
}
```

The ViewModel's `clinicianReport.demographics` should use these real values with sensible defaults:
```typescript
demographics: {
  age: profile?.age || 65,
  gender: profile?.gender || 'Not specified',
  educationYears: profile?.educationYears || 16,
}
```

---

## Task 3: Verify `clinicalModelEngine.ts` Feature Extraction

**File**: `src/services/clinicalModelEngine.ts`

The `extract75Biomarkers()` function (lines 111-400) reads from all 7 modules. Verify:

1. **Language module** (lines 213-233): Check that `data.language[last]` actually has `derivedFeatures.cognitiveSpeechIndex`. If the Language assessment doesn't compute CSI (e.g., old assessments), the function falls back to `86.0` — this is acceptable for ML input but should be flagged with lower confidence.

2. **Story module** (lines 177-193): Check that `data.story[last].biomarkers` exists and has the nested structure. The StoryAssessment component (`src/components/tests/story/StoryAssessment.tsx`) should populate `biomarkers` via `computeStoryScore()` from `StoryScoring.ts`.

3. **Navigation module** (lines 296-308): Verify `data.navigation[last].biomarkers` has `navigationAccuracy`, `landmarkRecognitionAccuracy`, `spatialMemoryIndex`, etc.

### How to Verify

Run the app, take each assessment once, then check the dashboard. Alternatively, use the simulation controls to inject mock data and verify the ViewModel produces non-null scores for all 7 modules.

---

## Task 4: Verify Module Score ↔ Domain Score Mapping

The ML model outputs 6 cognitive domain scores:
- `memory`, `language`, `executive`, `processingSpeed`, `spatialOrientation`, `attention`

The 7 assessment modules map to domains like this:

| Module | Primary Domain(s) |
|---|---|
| VMRA | Memory, Spatial |
| Story | Memory, Language |
| Language | Language |
| Pattern | Executive, Memory |
| Reaction/SAVT | Processing Speed, Attention |
| Navigation | Spatial, Memory |
| Memory (legacy) | Memory |

The `DomainScoreCards` component shows the 6 domain scores from `prediction.domainScores`, NOT raw module scores. Verify these domain scores are sensible:
- If only VMRA is completed, Memory domain should still have a reasonable score
- If no Language assessment is done, Language domain uses defaults — the ViewModel should indicate lower confidence

---

## Task 5: End-to-End Smoke Test

1. Clear all data (`clearAllTestData()`)
2. Use "Mock Declining" simulation
3. Navigate to `/dashboard-v2`
4. Verify:
   - Hero shows 🟠 or 🔴 status
   - AI Prediction shows higher MCI/Dementia probabilities
   - Domain scores show negative deltas
   - Changes section shows declined items
   - Charts show downward trends across sessions
   - Click a chart point → drawer shows biomarkers
   - Longitudinal summary shows "Possible Decline" or "Likely Decline"
   - Recommendation says to repeat assessment sooner
5. Clear and use "Mock Stable" simulation
6. Verify:
   - Hero shows 🟢 Stable
   - Charts show flat/improving trends
   - Changes section shows stable or improved items

---

## Files Summary

| Action | File | Changes |
|---|---|---|
| **MODIFY** | `src/services/dataMapper.ts` | Fix Language, Story, Navigation score extractors; remove magic fallback numbers |
| **VERIFY** | `src/services/clinicalModelEngine.ts` | Audit `extract75Biomarkers()` for all 7 modules |
| **VERIFY** | `src/components/tests/story/StoryScoring.ts` | Confirm `storyRecallScore` is populated |
| **VERIFY** | `src/components/tests/story/StoryAssessment.tsx` | Confirm biomarkers object is saved |
| **VERIFY** | `src/hooks/useDashboardViewModel.ts` | Confirm demographics read from profile |
