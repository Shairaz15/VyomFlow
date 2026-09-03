# VyomFlow Dashboard V2 — Implementation Guide

> **Purpose**: This folder contains everything needed to rebuild the VyomFlow patient dashboard from scratch. Each phase is a self-contained markdown file with full context, file paths, types, and code patterns so any LLM or developer can execute it independently.

---

## Quick Context

- **Project**: VyomFlow — AI-assisted cognitive screening & longitudinal digital biomarker platform
- **Tech Stack**: React + TypeScript + Vite, Recharts for charts, Firebase/Firestore for auth & persistence
- **Workspace Root**: `c:\Users\Sashank Raviraj\AppData\Roaming\Desktop\VyomFlow`
- **Current Dashboard**: `src/pages/Dashboard.tsx` (593 lines, monolithic, to be replaced)
- **ML Model**: Multi-task client-side inference engine in `src/services/clinicalModelEngine.ts` — 75+ biomarkers → diagnosis, MoCA, domain scores, explainability
- **Design System**: Warm ivory/teal/sage/gold palette from the landing page (`src/pages/VyomFlowLanding.css`)

---

## Phases

| Phase | File | Summary | Dependencies |
|---|---|---|---|
| **1** | [phase-1-data-foundation.md](./phase-1-data-foundation.md) | `DashboardViewModel` type + `useDashboardViewModel` hook — single source of truth for all dashboard data | None |
| **2** | [phase-2-page-shell-styling.md](./phase-2-page-shell-styling.md) | `DashboardV2.tsx` page shell + `DashboardV2.css` full stylesheet + route wiring | Phase 1 |
| **3** | [phase-3-section-components.md](./phase-3-section-components.md) | All 12 section components (`HeroSummary`, `AIPredictionCard`, `DomainScoreCards`, etc.) | Phase 1 & 2 |
| **4** | [phase-4-integration-bugfixes.md](./phase-4-integration-bugfixes.md) | Data extraction bug fixes, demographics fix, simulation controls extraction | Phase 1–3 |
| **5** | [phase-5-polish-rollout.md](./phase-5-polish-rollout.md) | Visual polish, animations, responsive testing, route swap, final verification | Phase 1–4 |

---

## Key Design Decisions

| Decision | Choice |
|---|---|
| **Strategy** | Full replacement — new `DashboardV2.tsx`, old at `/dashboard-legacy` |
| **Data Architecture** | Single `DashboardViewModel` — one hook, one source of truth |
| **Visual Direction** | Match VyomFlow landing page (ivory/teal/sage/gold + dark mode) |
| **Components** | One file per PRD section (~10-12 files) in `src/components/dashboard-v2/` |
| **Charts** | 7 separate Recharts `LineChart` (one per assessment module) + existing hexagonal radar |
| **Chart Interaction** | Click data point → right-side slide-in drawer with top 5 biomarkers |
| **Clinician Report** | Enhanced with top 5 biomarkers per module, browser print-to-PDF |
| **Charting Library** | Keep Recharts (already installed) |

---

## 7 Assessment Modules

| # | Module | Hook | Type File | Score Key |
|---|---|---|---|---|
| 1 | Visual Memory (VMRA) | `useVmraResults()` | `src/types/vmraTypes.ts` | `features.recallAccuracy * 100` |
| 2 | Story Recall | `useStoryResults()` | `src/types/storyTypes.ts` | `storyRecallScore` (0-100) |
| 3 | Language & Speech | `useLanguageResults()` | `src/types/languageTypes.ts` | `derivedFeatures.cognitiveSpeechIndex` (0-100) |
| 4 | Pattern Working Memory | `usePatternResults()` | `src/types/patternTypes.ts` | `metrics.maxLevelReached * 10` (capped 100) |
| 5 | Reaction Time / SAVT | `useReactionResults()` | `src/types/savtTypes.ts` | `aggregates.avg` (ms, lower = better) |
| 6 | Immersive Navigation | `useNavigationResults()` | `src/types/navigationTypes.ts` | `navigationScore` (0-100) |
| 7 | Memory (legacy) | `useMemoryResults()` | `src/types/memoryTypes.ts` | `accuracy * 100` |

---

## Design Tokens (from Landing Page CSS)

```css
/* Light Mode */
--vyom-navy: #17324D;
--vyom-teal: #4F7C78;
--vyom-sage: #8FAF8B;
--vyom-gold: #D8B878;
--vyom-ivory: #F7F4EC;
--vyom-peach: #FFF3E6;
--vyom-mint-haze: #E8F1EC;
--vyom-sand: #D8CBB8;
--vyom-text-dark: #20313A;
--vyom-text-muted: #66757A;

/* Dark Mode */
--vyom-dark-bg: #0B1929;
--vyom-dark-card: #14283C;
--vyom-dark-border: rgba(255, 255, 255, 0.12);
--vyom-dark-text: #F7F4EC;
--vyom-dark-muted: #B0C4DE;

/* Fonts */
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;  /* Body */
font-family: 'Playfair Display', Georgia, serif;           /* Headings */
```

---

## Existing Services (Do NOT Rewrite)

These services are stable and should be consumed as-is:

| Service | File | What it does |
|---|---|---|
| Clinical Model Engine | `src/services/clinicalModelEngine.ts` | `predictCognitiveProfile()` — 75 biomarkers → diagnosis, MoCA, domains, SHAP |
| Statistical Drift Engine | `src/services/statisticalDriftEngine.ts` | `evaluatePatientTrajectory()` — RCI, Theil-Sen, Z-drift |
| Clinical Alert Engine | `src/services/clinicalAlertEngine.ts` | `generateClinicalAlert()` — alert tier from drift + risk |
| Clinical Alert Service | `src/services/clinicalAlertService.ts` | Confidence estimation layer |
| Data Mapper | `src/services/dataMapper.ts` | `mapToSessionData()` — groups raw results by day |
| Model Bundle | `src/services/vyomflowModelBundle.ts` | Embedded JSON model weights |

---

## Execution Instructions

1. **Execute phases in order** (1 → 2 → 3 → 4 → 5)
2. **After each phase**, run `npm run build` to verify zero TypeScript errors
3. **Phase 3 can be parallelized** — each component file is independent
4. **Test with mock data**: Use the simulation controls (stable + declining patterns) to verify
5. **Final verification**: Run `npm run dev` and test all 10 sections on desktop + mobile + dark mode
