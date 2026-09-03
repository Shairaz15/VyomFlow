# Phase 3 — Section Components

> **Goal**: Create all 12 section components in `src/components/dashboard-v2/`. Each component receives its slice of the `DashboardViewModel` as props — no internal data fetching.

---

## Prerequisites

- Phase 1 complete: `DashboardViewModel` types defined
- Phase 2 complete: `DashboardV2.tsx` page shell renders these components, `DashboardV2.css` has all base styles

---

## Component Checklist

All files go in `src/components/dashboard-v2/`:

| # | Component | Props Slice | ~Lines |
|---|---|---|---|
| 1 | `HeroSummary.tsx` | `OverviewViewModel` | ~100 |
| 2 | `AIPredictionCard.tsx` | `AIPredictionViewModel` | ~130 |
| 3 | `DomainScoreCards.tsx` | `DomainScoreViewModel[]` | ~120 |
| 4 | `CognitiveRadarSection.tsx` | `radarScores` | ~50 |
| 5 | `ModuleTrendCharts.tsx` | `ModuleTrendViewModel[]` | ~160 |
| 6 | `ChangesSinceLastVisit.tsx` | `ChangesViewModel` | ~80 |
| 7 | `AssessmentModuleCards.tsx` | `AssessmentModuleViewModel[]` | ~100 |
| 8 | `ExplainabilitySection.tsx` | `ExplainabilityViewModel` | ~90 |
| 9 | `LongitudinalSummary.tsx` | `LongitudinalViewModel` | ~110 |
| 10 | `RecommendationCard.tsx` | `RecommendationViewModel` | ~50 |
| 11 | `BiomarkerDrawer.tsx` | drawer state | ~150 |
| 12 | `SimulationControls.tsx` | (self-contained) | ~100 |
| 13 | `ClinicianReportModal.tsx` | `ClinicianReportViewModel` | ~200 |
| 14 | `index.ts` | barrel exports | ~15 |

---

## Component Specifications

### 1. `HeroSummary.tsx`

**Props**: `{ overview: OverviewViewModel }`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  🟢  Overall Cognitive Status: Stable               │
│                                                      │
│  Confidence: 92%     Last Assessment: 12 Aug 2026   │
│                                                      │
│  Compared to last visit:                             │
│  No significant decline detected.                    │
│                                                      │
│  Recommendation: Continue annual monitoring.         │
└─────────────────────────────────────────────────────┘
```

**Implementation Notes**:
- Use `dv2-card` base class
- Large status emoji + text with `dv2-status-badge` colored by `statusColor`
- Confidence as a small circular progress indicator or inline percentage
- `comparisonSummary` in muted body text
- `recommendation` in slightly smaller italic text
- Add `dv2-animate-in` class for entrance animation

---

### 2. `AIPredictionCard.tsx`

**Props**: `{ prediction: AIPredictionViewModel }`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  AI Cognitive Assessment         [AI Estimated]      │
│                                                      │
│  Predicted Status: Normal  ●  87%                    │
│                                                      │
│  Probability Distribution:                           │
│  Normal    ████████████████████████  87%              │
│  MCI       ████                      10%              │
│  Dementia  █                          3%              │
│                                                      │
│  Estimated MoCA: 27.4 / 30    (95% CI: ±0.8)       │
│  Risk Score: Low (18%)                               │
│  Model Confidence: 94%                               │
│  Battery: 5/6 modules completed                      │
└─────────────────────────────────────────────────────┘
```

**Implementation Notes**:
- Every AI-predicted value should have a small `dv2-ai-badge` ("AI Estimated") next to it
- Probability bars: use inline CSS width for bar fill (e.g., `style={{ width: \`${prob * 100}%\` }}`)
- Bar colors: Normal=`--dv2-green`, MCI=`--dv2-yellow`, Dementia=`--dv2-red`
- MoCA score prominently displayed with `/30`
- Battery coverage as `X/6 modules completed` text

---

### 3. `DomainScoreCards.tsx`

**Props**: `{ domains: DomainScoreViewModel[] }`

**Layout**:
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🧠 Memory│ │ 🗣️ Lang  │ │ 🎯 Attn  │
│    82     │ │    91     │ │    67     │
│   ↑ 3    │ │   →       │ │   ↓      │
│   Good   │ │  Stable   │ │  Monitor │
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🧩 Exec  │ │ 🗺️ Spat  │ │ ⚡ Speed │
│    73     │ │    88     │ │    69     │
│   ↑      │ │  Stable   │ │   ↓      │
│ Improving│ │           │ │          │
└──────────┘ └──────────┘ └──────────┘
```

**Implementation Notes**:
- Use `dv2-grid-6` (3-col desktop, 2-col tablet, 1-col mobile)
- Each card: `dv2-card` with centered content
- Score number in large bold font (2rem)
- Delta arrow: `↑` green, `↓` red/orange, `→` gray
- Delta value: `+3`, `-5`
- Label colored by trend: green for Good/Improving, yellow for Monitor, gray for Stable
- Cards should have a subtle left-border color indicator matching the trend

---

### 4. `CognitiveRadarSection.tsx`

**Props**: `{ scores: { memory, language, executive, processingSpeed, spatialOrientation, attention } }`

**Implementation Notes**:
- Import and render the existing `CognitiveRadarChart` from `../dashboard/CognitiveRadarChart`
- Pass scores directly
- Wrap in a `dv2-card` with title "6-Domain Cognitive Envelope"
- No changes to the radar chart component itself — just restyle the container

---

### 5. `ModuleTrendCharts.tsx`

**Props**: `{ trends: ModuleTrendViewModel[]; onPointClick: (moduleKey, moduleName, session) => void }`

This is the most complex component.

**Layout**: 7 Recharts `LineChart` instances in a `dv2-grid-2` grid (1-col on mobile).

**Implementation Notes**:
- Each chart wrapped in a `dv2-card`
- Title: module name, Subtitle: chart description
- Use Recharts `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`
- Chart height: 200px
- Line color: from `chartColor` property on the trend
- **Clickable data points**: Use Recharts `<Line activeDot={{ onClick: ... }} />` — when a dot is clicked, call `onPointClick(moduleKey, moduleName, session)` where `session` includes the full `rawResult` for drawer drill-down
- Handle `null` scores: use `connectNulls={true}` on the `<Line>` or skip null points
- XAxis: session labels ("Session 1", "Session 2", etc.)
- YAxis: domain from the trend config
- Tooltip: show date, score, and unit
- Style tooltips to match VyomFlow palette (dark background in dark mode, light in light mode)

**Chart tooltip styling for dark mode**:
```jsx
<Tooltip
  contentStyle={{
    backgroundColor: 'var(--dv2-card-bg)',
    border: '1px solid var(--dv2-card-border)',
    borderRadius: '8px',
    color: 'var(--dv2-text)',
  }}
/>
```

---

### 6. `ChangesSinceLastVisit.tsx`

**Props**: `{ changes: ChangesViewModel }`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Changes Since Previous Visit                        │
│                                                      │
│  Improved                  │  Declined               │
│  ✓ Language      +4        │  ↓ Speed         -5     │
│  ✓ Spatial       +2        │  ↓ Attention     -3     │
└─────────────────────────────────────────────────────┘
```

**Implementation Notes**:
- Two-column layout (flex or grid)
- Improved items: green checkmark, domain name, positive delta
- Declined items: red/orange down arrow, domain name, negative delta
- If no changes in either category, show "No changes" in muted text
- If no previous session exists (first session), show "First assessment — no comparison available"

---

### 7. `AssessmentModuleCards.tsx`

**Props**: `{ modules: AssessmentModuleViewModel[] }`

**Layout**:
```
┌──────────────────┐ ┌──────────────────┐
│ 🧠 Visual Memory │ │ 📖 Story Recall  │
│     82 / 100     │ │     74 / 100     │
│   ✓ Completed    │ │   ✓ Completed    │
│   [View Details] │ │   [View Details] │
└──────────────────┘ └──────────────────┘
...etc for all 7 modules
```

**Implementation Notes**:
- Use `dv2-grid-2` grid (1-col mobile, 2-col desktop)
- Each card: icon, module name, score/maxScore, completion status
- If not completed: show "Not yet taken" with a "Take Assessment" button linking to the route
- If completed: show score and "View Details" or date of last completion
- Module route mapping:
  - vmra → `/test/memory`
  - story → `/test/story`
  - language → `/test/language`
  - pattern → `/tests/pattern`
  - reaction → `/test/reaction`
  - navigation → `/test/navigation`
  - attention → `/test/attention`

---

### 8. `ExplainabilitySection.tsx`

**Props**: `{ explainability: ExplainabilityViewModel }`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  What's Contributing to Your Results                 │
│                                                      │
│  Positive Factors          │  Areas to Watch          │
│  ✓ Strong delayed recall   │  ↓ Slower reaction time  │
│  ✓ Good landmark recog.    │  ↓ Reduced processing    │
│  ✓ Stable speech fluency   │     speed                │
└─────────────────────────────────────────────────────┘
```

**Implementation Notes**:
- Two-column layout
- Left: positive factors with green checkmark icons
- Right: negative factors with orange/red down arrow icons
- Use plain English descriptions (not biomarker names or SHAP values)
- If no attributions available, show "Complete more assessments for detailed insights"

---

### 9. `LongitudinalSummary.tsx`

**Props**: `{ longitudinal: LongitudinalViewModel }`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Trend Analysis               [Stable]               │
│                                                      │
│  No statistically significant decline detected.      │
│                                                      │
│  Compared against: 15 previous visits                │
│  Last updated: 2 weeks ago                           │
│                                                      │
│  [Show Clinical Metrics ▼]                           │
│  ┌───────────────────────────────────────────────┐  │
│  │ RCI: -0.42  │ β: -0.02/mo │ Z: -0.3 │ CV: 8% │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Implementation Notes**:
- Trajectory badge colored by `trajectoryColor`
- Summary text as main body
- Session count and last updated in muted text
- **Expandable section**: "Show Clinical Metrics" button toggles visibility of advanced metrics
- Advanced metrics shown in a compact grid when expanded
- Only show advanced section if `advancedMetrics` is not null
- Use `useState` for expand/collapse toggle

---

### 10. `RecommendationCard.tsx`

**Props**: `{ recommendation: RecommendationViewModel; onOpenReport: () => void }`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  📋 Next Steps                                       │
│                                                      │
│  Continue annual monitoring.                         │
│                                                      │
│  [Download Clinician Report]    [Take Assessment]    │
└─────────────────────────────────────────────────────┘
```

**Implementation Notes**:
- Simple card with recommendation text
- Left-border color based on urgency: green for routine, yellow for followup, red for clinical
- Two action buttons: "Download Clinician Report" (calls `onOpenReport`) and "Take Assessment" (links to `/tests`)

---

### 11. `BiomarkerDrawer.tsx`

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  moduleKey: string;
  sessionDate: string;
  rawResult: any;
}
```

**Layout** (slides in from right):
```
┌──────────────────────────┐
│  ✕  Visual Memory (VMRA) │
│  Session: 12 Aug 2026    │
│                          │
│  Top 5 Biomarkers        │
│  ────────────────────    │
│  Recall Accuracy    82%  │
│  ● Normal                │
│                          │
│  Delayed Recall     68%  │
│  ◉ Watch                 │
│                          │
│  First Tap Latency 680ms │
│  ● Normal                │
│                          │
│  Intrusion Errors    1   │
│  ● Normal                │
│                          │
│  Forgetting Slope  0.12  │
│  ● Normal                │
└──────────────────────────┘
```

**Implementation Notes**:
- Uses `dv2-drawer-backdrop` and `dv2-drawer` CSS classes (defined in Phase 2 CSS)
- Close button top-right
- Header: module name + session date
- Uses `MODULE_KEY_BIOMARKERS` mapping from Phase 1 to extract top 5 biomarkers from `rawResult`
- Each biomarker row: label, value with unit, status indicator dot (green=normal, yellow=watch, red=concern)
- Status determination: define thresholds per biomarker (e.g., recall accuracy > 70% = normal, 50-70% = watch, < 50% = concern)
- If `rawResult` is null, show "No data available for this session"

---

### 12. `SimulationControls.tsx`

**Props**: None (self-contained, uses hooks directly)

**Implementation Notes**:
- Extract the simulation controls from current Dashboard.tsx lines 366-431
- Include: Clear All Data, Simulate Declining (with baseline), Simulate Stable (with baseline), Mock Declining (no baseline), Mock Stable (no baseline)
- Uses `useReactionResults`, `useMemoryResults`, etc. hooks and the `saveResult` functions
- Uses `generateSimulatedData`, `hasBaseline`, `getMockBaseline` from `../utils/simulateUserData`
- Styled as a collapsible card with a dev/testing label

---

### 13. `ClinicianReportModal.tsx` (Enhanced)

**Props**: `{ isOpen: boolean; onClose: () => void; reportData: ClinicianReportViewModel }`

**Enhancements over current version**:

1. **Top 5 Biomarkers Per Module**: For each of the 7 modules, display a section with the 5 most important biomarkers:
   ```
   Visual Memory (VMRA)
   ─────────────────────
   Recall Accuracy      82%    Normal
   Delayed Recall       68%    Watch
   First Tap Latency   680ms   Normal
   Intrusion Errors      1     Normal
   Forgetting Slope    0.12    Normal
   ```

2. **Full prediction data**: Diagnosis, probabilities, MoCA, domain scores (already in current version)
3. **Radar chart**: Keep the existing CognitiveRadarChart rendering
4. **Demographics from ViewModel** (not hardcoded)
5. **Drift metrics**: If available, show RCI, β, Z-drift
6. **Session history table**: All sessions with per-module scores
7. **Print-to-PDF**: Keep `window.print()` functionality
8. **Restyle**: Match VyomFlow palette

---

### 14. `index.ts` (barrel export)

```typescript
export { HeroSummary } from './HeroSummary';
export { AIPredictionCard } from './AIPredictionCard';
export { DomainScoreCards } from './DomainScoreCards';
export { CognitiveRadarSection } from './CognitiveRadarSection';
export { ModuleTrendCharts } from './ModuleTrendCharts';
export { ChangesSinceLastVisit } from './ChangesSinceLastVisit';
export { AssessmentModuleCards } from './AssessmentModuleCards';
export { ExplainabilitySection } from './ExplainabilitySection';
export { LongitudinalSummary } from './LongitudinalSummary';
export { RecommendationCard } from './RecommendationCard';
export { BiomarkerDrawer } from './BiomarkerDrawer';
export { SimulationControls } from './SimulationControls';
export { ClinicianReportModal } from './ClinicianReportModal';
```

---

## Verification After Phase 3

```bash
npm run build  # Zero TypeScript errors
npm run dev    # Navigate to /dashboard-v2 with mock data — all sections should render
```

Test each section:
1. Hero shows correct status emoji and color
2. AI Prediction shows probability bars with correct widths
3. Domain cards show 6 cards with deltas
4. Radar chart renders hexagonal shape
5. 7 charts render with data points
6. Click a chart dot → drawer slides in with biomarker details
7. Changes section shows improved/declined
8. Module cards show correct scores and routes
9. Explainability shows human-readable factors
10. Longitudinal summary shows trajectory with expandable metrics
11. Recommendation shows action text
12. Clinician report modal opens with full biomarker details per module

---

## Files Summary

| Action | File |
|---|---|
| **CREATE** | `src/components/dashboard-v2/HeroSummary.tsx` |
| **CREATE** | `src/components/dashboard-v2/AIPredictionCard.tsx` |
| **CREATE** | `src/components/dashboard-v2/DomainScoreCards.tsx` |
| **CREATE** | `src/components/dashboard-v2/CognitiveRadarSection.tsx` |
| **CREATE** | `src/components/dashboard-v2/ModuleTrendCharts.tsx` |
| **CREATE** | `src/components/dashboard-v2/ChangesSinceLastVisit.tsx` |
| **CREATE** | `src/components/dashboard-v2/AssessmentModuleCards.tsx` |
| **CREATE** | `src/components/dashboard-v2/ExplainabilitySection.tsx` |
| **CREATE** | `src/components/dashboard-v2/LongitudinalSummary.tsx` |
| **CREATE** | `src/components/dashboard-v2/RecommendationCard.tsx` |
| **CREATE** | `src/components/dashboard-v2/BiomarkerDrawer.tsx` |
| **CREATE** | `src/components/dashboard-v2/SimulationControls.tsx` |
| **CREATE** | `src/components/dashboard-v2/ClinicianReportModal.tsx` |
| **CREATE** | `src/components/dashboard-v2/index.ts` |
