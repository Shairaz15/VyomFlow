# Dashboard V2 — Complete Redesign Implementation Plan

## Goal

Transform the current monolithic 593-line [Dashboard.tsx](file:///c:/Users/Sashank%20Raviraj/AppData/Roaming/Desktop/VyomFlow/src/pages/Dashboard.tsx) into a clean, clinician-inspired cognitive health dashboard that answers four questions in 10 seconds: *Am I okay? Has anything changed? Which areas changed? What should I do next?*

---

## Design Decisions (from Interview)

| Decision | Choice |
|---|---|
| **Strategy** | Replace entirely — new `DashboardV2.tsx`, old moved to `/dashboard-legacy` |
| **Data Architecture** | Single `DashboardViewModel` layer — one hook, one source of truth |
| **Visual Direction** | Match the VyomFlow landing page aesthetic (ivory/teal/sage/gold palette, `Plus Jakarta Sans` + `Playfair Display`, full dark mode support) |
| **Component Granularity** | One focused component per PRD section (~10 files) in `src/components/dashboard-v2/` |
| **Charts** | 7 separate charts (one per assessment module) + keep existing hexagonal radar chart |
| **Chart Interaction** | Click a data point → right-side slide-in drawer with top 5 biomarkers for that session/module |
| **Clinician Report** | Enhanced with top 5 biomarkers per module, browser print-to-PDF |
| **Color Palette** | VyomFlow design tokens: `--vyom-ivory: #F7F4EC`, `--vyom-teal: #4F7C78`, `--vyom-sage: #8FAF8B`, `--vyom-gold: #D8B878`, `--vyom-navy: #17324D`, dark: `#0B1929` |
| **Charting Library** | Keep Recharts |
| **Rollout** | Build at `/dashboard-v2` during dev, swap to `/dashboard` when done |

---

## Open Questions

> [!IMPORTANT]
> **Data extraction issues**: You mentioned Story, Language, and possibly one more module were not reflecting results properly on the dashboard. During Phase 1 (ViewModel), I'll audit all 7 extraction paths and fix any broken data flows. If I find anything ambiguous, I'll flag it before proceeding.

> [!IMPORTANT]
> **Demographics source**: Currently the clinician report hardcodes `patientAge={70}, patientGender={'Female'}, educationYears={16}`. The ViewModel will pull real demographics from the user profile in localStorage (`vyomflow_user_profile`). Is this correct, or should we also pull from Firestore?

---

## Phase 1 — Data Foundation (`DashboardViewModel`)

> The backbone. Every component in V2 consumes this single ViewModel — no widget-level data fetching, no scattered `useMemo` transforms.

### [NEW] `src/services/dashboardViewModel.ts`

Creates the `DashboardViewModel` type and the pure computation logic:

```typescript
export interface DashboardViewModel {
  // Section 1: Hero Summary
  overview: {
    cognitiveStatus: 'Stable' | 'Possible Risk' | 'Needs Attention';
    statusColor: 'green' | 'yellow' | 'orange' | 'red';
    confidence: number;           // 0-100
    lastAssessmentDate: string;
    comparisonSummary: string;    // "No significant decline detected"
    recommendation: string;       // "Continue annual monitoring"
  };

  // Section 2: AI Prediction
  aiPrediction: {
    predictedStatus: 'Normal' | 'MCI' | 'Dementia';
    probabilities: { normal: number; mci: number; dementia: number };
    estimatedMoCA: number;
    mocaCI: number;
    riskScore: number;            // 0-1
    riskLevel: 'Low' | 'Moderate' | 'High';
    modelConfidence: number;
    batteryCoverage: number;
    completedModules: string[];
  };

  // Section 3: 6 Cognitive Domains
  domainScores: {
    domain: string;
    score: number;
    previousScore: number | null;
    delta: number | null;
    trend: 'up' | 'down' | 'stable';
    label: string;                // "Good" | "Stable" | "Monitor" | "Improving"
  }[];

  // Section 4: 7 Module Trend Charts
  moduleTrends: {
    moduleKey: string;            // 'vmra' | 'story' | 'language' | etc.
    moduleName: string;
    chartColor: string;
    unit: string;
    sessions: {
      sessionLabel: string;
      date: string;
      timestamp: number;
      score: number | null;
      rawResult: any;             // Full result object for drill-down
    }[];
  }[];

  // Section 5: Change Since Previous Visit
  changes: {
    improved: { domain: string; delta: number }[];
    declined: { domain: string; delta: number }[];
    stable: string[];
  };

  // Section 6: Assessment Module Cards
  assessmentModules: {
    key: string;
    name: string;
    icon: string;
    score: number | null;
    maxScore: number;
    isCompleted: boolean;
    lastCompletedDate: string | null;
    route: string;                // Link to take/retake test
  }[];

  // Section 7: Explainability (Human-readable SHAP)
  explainability: {
    positive: { factor: string; description: string }[];
    negative: { factor: string; description: string }[];
  };

  // Section 8: Longitudinal Engine Summary
  longitudinal: {
    trajectory: string;           // 'Stable' | 'Possible Decline' etc.
    trajectoryColor: string;
    summary: string;              // "No statistically significant decline"
    sessionCount: number;
    lastUpdated: string;
    advancedMetrics?: {           // Hidden behind "Show Clinical Metrics"
      rci: number;
      theilSenSlope: number;
      zDrift: number;
      cv: number;
    };
  };

  // Section 9: Recommendation
  recommendation: {
    text: string;
    urgency: 'routine' | 'followup' | 'clinical';
  };

  // Section 10: Clinician Report Data
  clinicianReport: {
    demographics: { age: number; gender: string; education: number };
    prediction: CognitiveModelPrediction;
    allModuleResults: RawDashboardData;
    topBiomarkersPerModule: Record<string, { name: string; value: number; unit: string; status: string }[]>;
    driftMetrics: any;
    sessionHistory: any[];
  };

  // Meta
  hasData: boolean;
  isLoading: boolean;
  sessionCount: number;
}
```

### [NEW] `src/hooks/useDashboardViewModel.ts`

Custom React hook that:
1. Calls all 7 `useXxxResults()` hooks
2. Reads demographics from localStorage profile
3. Runs `predictCognitiveProfile()` for cross-sectional ML
4. Runs `evaluatePatientTrajectory()` for longitudinal drift
5. Runs `generateClinicalAlert()` for alert tier
6. Computes deltas between current and previous sessions
7. Extracts top 5 biomarkers per module for the clinician report
8. Returns a single `DashboardViewModel` object

**Bug fix**: Audit all 7 module data extraction paths to fix Story, Language, and any other modules not reflecting results.

---

## Phase 2 — Dashboard Page Shell & Styling

### [NEW] `src/pages/DashboardV2.tsx`

Thin orchestration page (~80 lines):
- Calls `useDashboardViewModel()`
- Renders the 10 section components in order
- Handles the biomarker drill-down drawer state
- Renders loading/empty states

### [NEW] `src/pages/DashboardV2.css`

Full stylesheet using the VyomFlow design system:
- CSS custom properties matching [VyomFlowLanding.css](file:///c:/Users/Sashank%20Raviraj/AppData/Roaming/Desktop/VyomFlow/src/pages/VyomFlowLanding.css) tokens
- Light mode: warm ivory cards, teal accents, sage indicators
- Dark mode: `#0B1929` base, translucent card surfaces
- Typography: `Plus Jakarta Sans` body, `Playfair Display` headings
- Card system: subtle shadows, rounded corners, hover transitions
- Responsive grid: 1-col mobile, 2-col tablet, 3-col desktop for domain cards
- Print styles for clinician report

### [MODIFY] `src/App.tsx`

- Add temporary `/dashboard-v2` route during development
- When ready: swap `/dashboard` to DashboardV2, old Dashboard to `/dashboard-legacy`

### [MODIFY] `src/pages/index.ts`

- Export `DashboardV2` alongside existing `Dashboard`

---

## Phase 3 — 10 Section Components

All in `src/components/dashboard-v2/`:

### [NEW] `HeroSummary.tsx` (~100 lines)
- Large status badge (🟢/🟡/🟠/🔴) with cognitive status text
- Confidence percentage, last assessment date
- One-line comparison summary and recommendation
- Uses `overview` slice of ViewModel

### [NEW] `AIPredictionCard.tsx` (~120 lines)
- Predicted cognitive status with "AI Estimated" badge
- Probability distribution bars (Normal / MCI / Dementia)
- Estimated MoCA score with 95% CI
- Risk score indicator
- Model confidence
- Uses `aiPrediction` slice

### [NEW] `DomainScoreCards.tsx` (~130 lines)
- 6 compact cards in a responsive grid (2x3 on desktop, 1-col mobile)
- Each card: domain name, score (0-100), delta arrow (↑/↓/→), trend label
- Uses `domainScores` slice

### [NEW] `CognitiveRadarSection.tsx` (~50 lines)
- Wraps the existing [CognitiveRadarChart.tsx](file:///c:/Users/Sashank%20Raviraj/AppData/Roaming/Desktop/VyomFlow/src/components/dashboard/CognitiveRadarChart.tsx) (hexagonal radar)
- Keeps the existing component unchanged, just re-themed with VyomFlow palette
- Uses `domainScores` slice mapped to radar format

### [NEW] `ModuleTrendCharts.tsx` (~150 lines)
- 7 Recharts `LineChart` instances (one per assessment module)
- Each chart: module name, color-coded line, clickable data points
- Click a dot → opens the `BiomarkerDrawer` with that session's top 5 biomarkers
- Responsive grid: 1-col mobile, 2-col desktop
- Uses `moduleTrends` slice

### [NEW] `ChangesSinceLastVisit.tsx` (~80 lines)
- Two columns: "Improved" (✓ green) and "Declined" (↓ orange/red)
- Each item shows domain name and delta
- Uses `changes` slice

### [NEW] `AssessmentModuleCards.tsx` (~100 lines)
- 7 module cards showing: module name, icon, score, completion status
- "Take Assessment" or "View Details" action
- Links to `/test/xxx` routes
- Uses `assessmentModules` slice

### [NEW] `ExplainabilitySection.tsx` (~90 lines)
- Human-readable SHAP translations
- Positive contributors (green ✓) and Negative contributors (red ↓)
- No raw SHAP values — only natural language
- Uses `explainability` slice

### [NEW] `LongitudinalSummary.tsx` (~100 lines)
- Trajectory status with colored badge
- Summary text ("No statistically significant decline detected")
- Session count and last updated
- Expandable "Show Clinical Metrics" section (RCI, β, Z-drift, CV)
- Uses `longitudinal` slice

### [NEW] `RecommendationCard.tsx` (~50 lines)
- Single action-oriented recommendation
- Color-coded urgency (green=routine, yellow=followup, red=clinical)
- Uses `recommendation` slice

### [NEW] `BiomarkerDrawer.tsx` (~150 lines)
- Slide-in panel from the right
- Shows top 5 biomarkers for a specific session + module
- Biomarker name, value, unit, status (normal/watch/concern)
- Triggered by clicking a chart data point
- Close button, overlay backdrop

### [MODIFY] `ClinicianReportModal.tsx`
- Enhanced with top 5 biomarkers per module section
- All 7 modules listed with their key biomarkers
- Restyled with VyomFlow palette
- Keep print-to-PDF functionality
- Uses `clinicianReport` slice

### [NEW] `index.ts` (barrel export)
- Re-exports all dashboard-v2 components

---

## Phase 4 — Integration & Data Bug Fixes

### Data Extraction Audit & Fixes

Investigate and fix modules not reflecting data:

#### [MODIFY] `src/services/dataMapper.ts`
- Audit score extraction for all 7 modules
- Verify Language `cognitiveSpeechIndex` and `fluencyIndex` extraction
- Verify Story `storyRecallScore` and `biomarkers.memory.recallAccuracy` extraction
- Add missing Navigation biomarker extraction if needed
- Add validation / defensive fallbacks for malformed data

#### [MODIFY] `src/services/clinicalModelEngine.ts`
- Verify `extract75Biomarkers()` correctly reads all 7 modules
- Ensure demographics are pulled from profile (not hardcoded)

### Simulation Controls

#### [NEW] `SimulationControls.tsx` (in dashboard-v2)
- Move simulation controls out of Dashboard page into its own component
- Keeps mock data, simulate stable/declining, clear data functionality
- Dev-only toggle

---

## Phase 5 — Polish, Testing & Rollout

### Visual Polish
- Ensure all cards match VyomFlow landing page aesthetic
- Smooth `fadeIn` / `slideIn` animations on card load
- Hover micro-interactions on domain cards and module cards
- Responsive testing (mobile, tablet, desktop)
- Dark mode testing for all 10 sections

### Route Swap
- [MODIFY] `src/App.tsx`: Move DashboardV2 to `/dashboard`, old Dashboard to `/dashboard-legacy`
- [MODIFY] `src/pages/index.ts`: Update default export

### Testing
- Verify with mock data (stable pattern + declining pattern)
- Verify all 7 module charts show correct data points
- Verify click-to-drill-down works on each chart
- Verify clinician report shows top 5 biomarkers per module
- Verify dark mode across all sections
- Verify mobile responsiveness

---

## File Summary

| Phase | New Files | Modified Files |
|---|---|---|
| **Phase 1** | `dashboardViewModel.ts`, `useDashboardViewModel.ts` | `dataMapper.ts` (bug fixes) |
| **Phase 2** | `DashboardV2.tsx`, `DashboardV2.css` | `App.tsx`, `pages/index.ts` |
| **Phase 3** | 12 component files in `dashboard-v2/` | `ClinicianReportModal.tsx` |
| **Phase 4** | `SimulationControls.tsx` | `clinicalModelEngine.ts`, `dataMapper.ts` |
| **Phase 5** | — | `App.tsx` (route swap) |

**Total: ~16 new files, ~5 modified files**

---

## Verification Plan

### Automated Tests
```bash
npm run build     # Ensure zero TypeScript errors
npm run test      # Existing test suite passes
```

### Manual Verification
1. Load `/dashboard-v2` with mock stable data → verify all 10 sections render
2. Load with mock declining data → verify Hero shows 🟠, domain deltas show red
3. Click a chart data point → verify drawer slides in with 5 biomarkers
4. Open clinician report → verify all 7 modules listed with top biomarkers
5. Toggle dark mode → verify all sections adapt correctly
6. Test on mobile viewport → verify responsive layout
7. Print clinician report → verify clean PDF output
