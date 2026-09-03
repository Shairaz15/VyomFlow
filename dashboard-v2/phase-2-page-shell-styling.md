# Phase 2 — Dashboard Page Shell & Styling

> **Goal**: Create the `DashboardV2.tsx` page, its CSS, and wire the route in `App.tsx`. This phase produces the skeleton that Phase 3 components plug into.

---

## Prerequisites

- Phase 1 complete: `useDashboardViewModel()` hook returns a `DashboardViewModel`

---

## Files to Create / Modify

### 1. [NEW] `src/pages/DashboardV2.tsx`

A thin orchestration page (~100 lines). It calls the ViewModel hook and renders all section components in the correct order.

```tsx
import { useState } from 'react';
import { PageWrapper } from '../components/layout';
import { useDashboardViewModel } from '../hooks/useDashboardViewModel';
import { useWeeklyReminder } from '../hooks/useWeeklyReminder';
import { useLanguage } from '../i18n/LanguageContext';
import {
  HeroSummary,
  AIPredictionCard,
  DomainScoreCards,
  CognitiveRadarSection,
  ModuleTrendCharts,
  ChangesSinceLastVisit,
  AssessmentModuleCards,
  ExplainabilitySection,
  LongitudinalSummary,
  RecommendationCard,
  BiomarkerDrawer,
  SimulationControls,
} from '../components/dashboard-v2';
import { ClinicianReportModal } from '../components/dashboard-v2/ClinicianReportModal';
import './DashboardV2.css';

export function DashboardV2() {
  const vm = useDashboardViewModel();
  const { t } = useLanguage();
  useWeeklyReminder();

  // Drawer state for chart drill-down
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    moduleName: string;
    sessionDate: string;
    rawResult: any;
    moduleKey: string;
  }>({ isOpen: false, moduleName: '', sessionDate: '', rawResult: null, moduleKey: '' });

  // Clinician report modal
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Simulation controls (dev toggle)
  const [showSimControls, setShowSimControls] = useState(false);

  // Handle chart data point click
  const handleChartPointClick = (moduleKey: string, moduleName: string, session: any) => {
    setDrawerData({
      isOpen: true,
      moduleName,
      sessionDate: session.date,
      rawResult: session.rawResult,
      moduleKey,
    });
  };

  if (vm.isLoading) {
    return (
      <PageWrapper>
        <div className="dv2-loading">Loading your cognitive profile...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="dv2-container">
        {/* Header */}
        <header className="dv2-header">
          <div className="dv2-header-left">
            <h1 className="vyom-serif">Cognitive Health Dashboard</h1>
            <p>Your personalized cognitive health overview</p>
          </div>
          <div className="dv2-header-actions">
            {/* Sim toggle, Take Assessment, etc. */}
          </div>
        </header>

        {/* Simulation Controls (dev) */}
        {showSimControls && <SimulationControls />}

        {!vm.hasData ? (
          /* Empty state card */
          <div className="dv2-empty-state">...</div>
        ) : (
          <>
            {/* Section 1: Hero Summary */}
            <HeroSummary overview={vm.overview} />

            {/* Section 2: AI Prediction */}
            <AIPredictionCard prediction={vm.aiPrediction} />

            {/* Section 3: Domain Scores + Radar */}
            <DomainScoreCards domains={vm.domainScores} />
            <CognitiveRadarSection scores={vm.radarScores} />

            {/* Section 5: Change Since Last Visit */}
            <ChangesSinceLastVisit changes={vm.changes} />

            {/* Section 4: Module Trend Charts */}
            <ModuleTrendCharts
              trends={vm.moduleTrends}
              onPointClick={handleChartPointClick}
            />

            {/* Section 6: Assessment Module Cards */}
            <AssessmentModuleCards modules={vm.assessmentModules} />

            {/* Section 7: Explainability */}
            <ExplainabilitySection explainability={vm.explainability} />

            {/* Section 8: Longitudinal Summary */}
            <LongitudinalSummary longitudinal={vm.longitudinal} />

            {/* Section 9: Recommendation */}
            <RecommendationCard
              recommendation={vm.recommendation}
              onOpenReport={() => setIsReportOpen(true)}
            />
          </>
        )}

        {/* Biomarker Drill-Down Drawer */}
        <BiomarkerDrawer
          isOpen={drawerData.isOpen}
          onClose={() => setDrawerData(prev => ({ ...prev, isOpen: false }))}
          moduleName={drawerData.moduleName}
          moduleKey={drawerData.moduleKey}
          sessionDate={drawerData.sessionDate}
          rawResult={drawerData.rawResult}
        />

        {/* Clinician Report Modal */}
        <ClinicianReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportData={vm.clinicianReport}
        />
      </div>
    </PageWrapper>
  );
}
```

---

### 2. [NEW] `src/pages/DashboardV2.css`

Full stylesheet using VyomFlow design tokens. Must support light and dark mode.

#### Design Token Variables

```css
/* Import at top of file or ensure these are in :root from the landing page CSS */
.dv2-container {
  /* Design tokens — match VyomFlowLanding.css exactly */
  --dv2-navy: #17324D;
  --dv2-teal: #4F7C78;
  --dv2-sage: #8FAF8B;
  --dv2-gold: #D8B878;
  --dv2-ivory: #F7F4EC;
  --dv2-peach: #FFF3E6;
  --dv2-mint: #E8F1EC;
  --dv2-sand: #D8CBB8;
  --dv2-text: #20313A;
  --dv2-muted: #66757A;

  /* Card system */
  --dv2-card-bg: #FFFFFF;
  --dv2-card-border: rgba(23, 50, 77, 0.08);
  --dv2-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --dv2-card-radius: 16px;

  /* Status colors */
  --dv2-green: #4ade80;
  --dv2-yellow: #fbbf24;
  --dv2-orange: #f97316;
  --dv2-red: #ef4444;
  --dv2-blue: #60a5fa;

  /* Chart colors (one per module) */
  --chart-vmra: #f472b6;
  --chart-story: #60a5fa;
  --chart-language: #c084fc;
  --chart-pattern: #38bdf8;
  --chart-reaction: #fbbf24;
  --chart-navigation: #06b6d4;
  --chart-memory: #34d399;

  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  color: var(--dv2-text);
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
```

#### Dark Mode Override

```css
.dark .dv2-container,
[data-theme="dark"] .dv2-container {
  --dv2-card-bg: #14283C;
  --dv2-card-border: rgba(255, 255, 255, 0.08);
  --dv2-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --dv2-text: #F7F4EC;
  --dv2-muted: #B0C4DE;
  --dv2-ivory: #0B1929;
  background: #0B1929;
  color: #F7F4EC;
}
```

#### Key CSS Classes to Implement

```css
/* Header */
.dv2-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.dv2-header h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 2rem; color: var(--dv2-navy); }

/* Card base */
.dv2-card {
  background: var(--dv2-card-bg);
  border: 1px solid var(--dv2-card-border);
  border-radius: var(--dv2-card-radius);
  box-shadow: var(--dv2-card-shadow);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.dv2-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Section title */
.dv2-section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  color: var(--dv2-navy);
  margin-bottom: 1rem;
}

/* Grid layouts */
.dv2-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.dv2-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.dv2-grid-6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }

/* Responsive */
@media (max-width: 768px) {
  .dv2-grid-2, .dv2-grid-3, .dv2-grid-6 { grid-template-columns: 1fr; }
  .dv2-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .dv2-grid-3, .dv2-grid-6 { grid-template-columns: repeat(2, 1fr); }
}

/* Status badge */
.dv2-status-badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.375rem 1rem; border-radius: 9999px;
  font-weight: 600; font-size: 0.875rem;
}
.dv2-status-badge.green { background: rgba(74, 222, 128, 0.15); color: #16a34a; }
.dv2-status-badge.yellow { background: rgba(251, 191, 36, 0.15); color: #d97706; }
.dv2-status-badge.orange { background: rgba(249, 115, 22, 0.15); color: #ea580c; }
.dv2-status-badge.red { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

/* "AI Estimated" badge */
.dv2-ai-badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.125rem 0.5rem; border-radius: 4px;
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  background: rgba(79, 124, 120, 0.12); color: var(--dv2-teal);
  letter-spacing: 0.05em;
}

/* Loading state */
.dv2-loading {
  display: flex; justify-content: center; align-items: center;
  min-height: 60vh; font-size: 1.125rem; color: var(--dv2-muted);
}

/* Animations */
@keyframes dv2-fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.dv2-animate-in { animation: dv2-fadeIn 0.4s ease-out forwards; }

/* Slide-in drawer */
.dv2-drawer-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0; transition: opacity 0.3s ease;
  pointer-events: none;
}
.dv2-drawer-backdrop.open { opacity: 1; pointer-events: all; }

.dv2-drawer {
  position: fixed; top: 0; right: -420px; bottom: 0; z-index: 1001;
  width: 420px; max-width: 90vw;
  background: var(--dv2-card-bg);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  overflow-y: auto; padding: 2rem;
}
.dv2-drawer.open { right: 0; }

/* Print styles for clinician report */
@media print {
  .dv2-container, .dv2-header-actions, .no-print { display: none !important; }
  .clinician-report-document { display: block !important; }
}
```

---

### 3. [MODIFY] `src/App.tsx`

Add temporary route for DashboardV2:

```diff
 import { Landing, Dashboard, Tests, VmraAssessment, SarvamTest, MLPlayground } from "./pages";
+import { DashboardV2 } from "./pages/DashboardV2";

 {/* Protected Routes */}
 <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
+<Route path="/dashboard-v2" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />
```

### 4. [MODIFY] `src/pages/index.ts`

```diff
 export { Dashboard } from "./Dashboard";
+export { DashboardV2 } from "./DashboardV2";
```

---

## Verification After Phase 2

```bash
npm run build  # Zero TypeScript errors
npm run dev    # Navigate to /dashboard-v2 — should show loading state or empty state
```

---

## Files Summary

| Action | File |
|---|---|
| **CREATE** | `src/pages/DashboardV2.tsx` |
| **CREATE** | `src/pages/DashboardV2.css` |
| **MODIFY** | `src/App.tsx` (add route) |
| **MODIFY** | `src/pages/index.ts` (add export) |
