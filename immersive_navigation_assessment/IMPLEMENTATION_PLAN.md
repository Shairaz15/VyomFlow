# Immersive Navigation & Spatial Memory Assessment Module
## Implementation Plan

---

## Overview

Replace the old map-based 3D navigation assessment with a **real-world PoV video navigation module**. The participant first watches a first-person walking video of the full route (A→H) to see the route and landmarks. Then they navigate back (H→A) by choosing directions at each intersection between clips, and finally arrange landmark images in chronological order.

---

## Architecture: Clip-Based Video Flow

The route has **8 waypoints** (A through H) and **7 road segments** between them. The reverse navigation uses **7 separate video clips** (one per segment, H→G, G→F, etc.) with direction questions asked between each clip.

```
┌──────────────────────────────────────────────────────────────────┐
│                        ASSESSMENT FLOW                           │
│                                                                  │
│  Instructions → Encoding Video (A→H, full route + landmarks)    │
│       → Destination MCQ                                          │
│       → Reverse Navigation (H→A, 7 clips, 6 intersections)      │
│       → Landmark Chronology (drag-and-drop)                     │
│       → Biomarker Extraction → Results → Firestore              │
└──────────────────────────────────────────────────────────────────┘
```

**Route waypoints:**
```
A ── B ── C ── D ── E ── F ── G ── H
```

**Encoding phase:**
- Play one continuous video A→H showing the full route and all landmarks

**Navigation clip flow (H→A):**
```
Clip 1 (H→G) ends → Direction buttons appear → User picks →
  ✅ Correct: green flash → Clip 2 (G→F) plays
  ❌ Wrong: red highlight on wrong button → auto-advance → Clip 2 plays (error logged)

Clip 2 (G→F) ends → Direction buttons → User picks → Clip 3 (F→E) plays
Clip 3 (F→E) ends → Direction buttons → User picks → Clip 4 (E→D) plays
Clip 4 (E→D) ends → Direction buttons → User picks → Clip 5 (D→C) plays
Clip 5 (D→C) ends → Direction buttons → User picks → Clip 6 (C→B) plays
Clip 6 (C→B) ends → Direction buttons → User picks → Clip 7 (B→A) plays
Clip 7 (B→A) ends → Transition to Landmark Ordering phase
```

---

## Files to Create

### Types
| File | Purpose |
|------|---------|
| `src/types/navigationTypes.ts` | New PoV-based types (RouteConfig, IntersectionResponse, NavigationBiomarkers, ImmersiveNavigationResult) |

### Data
| File | Purpose |
|------|---------|
| `src/data/navigation/routeConfig.ts` | Hardcoded route config (video URLs, 6 intersection directions, landmarks, destination MCQ) |

### Components
| File | Purpose |
|------|---------|
| `src/components/tests/navigation/NavigationAssessment.tsx` | Main orchestrator — manages all 7 phases |
| `src/components/tests/navigation/NavigationAssessment.css` | All styles for the module |
| `src/components/tests/navigation/index.ts` | Barrel export |
| `.../components/InstructionsPhase.tsx` | Animated step-by-step instructions |
| `.../components/VideoPlayer.tsx` | HTML5 video player (no skip, no replay, autoplay) |
| `.../components/DestinationQuestion.tsx` | "Where are you headed?" 4-option MCQ |
| `.../components/DirectionSelector.tsx` | Left/Right/Straight/Back buttons with latency capture |
| `.../components/LandmarkOrdering.tsx` | Drag-and-drop chronology task (@dnd-kit) |
| `.../components/NavigationResults.tsx` | Score gauge + biomarker breakdown |

### Services
| File | Purpose |
|------|---------|
| `.../services/BiomarkerEngine.ts` | Pure function — computes all 17+ biomarkers from raw data |

### Files to Modify
| File | Change |
|------|--------|
| `src/hooks/useTestResults.ts` | Update `useNavigationResults` to use new `ImmersiveNavigationResult` type |
| `src/pages/Tests.tsx` | Add "Immersive Navigation" card to the test grid |
| `src/pages/Dashboard.tsx` | Add navigation score section |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## Biomarkers (17+)

### Route Memory
- `destinationRecallAccuracy` — Did they remember the destination? (0 or 1)
- `navigationAccuracy` — Correct directions / total intersections (0–1, out of 6)
- `wrongTurnCount` — Number of incorrect direction choices (out of 6)
- `correctDecisionRate` — Same as navigationAccuracy (alternate label)

### Executive Function
- `averageDecisionLatencyMs` — Mean time to pick a direction
- `maxDecisionLatencyMs` — Slowest single decision
- `decisionLatencyVariance` — Variance across all 6 decisions
- `hesitationCount` — Decisions taking > 2× the participant's average latency

### Spatial Memory
- `landmarkRecognitionAccuracy` — Correct landmarks selected / 5 (0–1)
- `falseLandmarkRate` — Distractors incorrectly selected / total selected
- `landmarkSequenceAccuracy` — Correct positions / 5 (0–1)
- `chronologicalRecallScore` — Weighted ordering score

### Composite Scores
- `routeMemoryScore` — Combined route memory metric (0–1)
- `visualAttentionScore` — Based on landmark detail recall (0–1)
- `episodicMemoryScore` — Route encoding retention (0–1)
- **`navigationScore`** — Final 0–100 weighted composite

### Scoring Weights
| Component | Weight |
|-----------|--------|
| Direction Accuracy | 30% |
| Landmark Recognition | 20% |
| Landmark Chronology | 20% |
| Decision Latency | 15% |
| Destination Recall | 10% |
| False Landmark Penalty | 5% |

---

## Data Model

```typescript
interface ImmersiveNavigationResult {
  id: string;
  sessionId: string;
  routeId: string;
  timestamp: Date;
  
  // Phase 2 — Destination MCQ
  destinationAnswer: {
    selectedIndex: number;
    isCorrect: boolean;
    responseTimeMs: number;
  };

  // Phase 3 — Intersection decisions (6 intersections between 7 clips, H→A)
  intersectionResponses: Array<{
    segmentId: string;           // e.g. "seg_h_g", "seg_g_f", etc.
    chosenDirection: 'left' | 'right' | 'straight' | 'back';
    correctDirection: 'left' | 'right' | 'straight' | 'back';
    isCorrect: boolean;
    decisionLatencyMs: number;
    timestamp: number;
  }>;

  // Phase 4 — Landmark ordering
  landmarkOrdering: {
    selectedLandmarkIds: string[];    // 5 chosen from 10
    orderedLandmarkIds: string[];     // In the order placed
    correctOrderIds: string[];        // Ground truth
    recognitionAccuracy: number;
    sequenceAccuracy: number;
  };

  // Computed
  biomarkers: NavigationBiomarkers;
  navigationScore: number;           // 0–100
}
```

---

## Firestore

- Collection: `navigation_results` (same name, new schema)
- Path: `users/{uid}/navigation_results/{docId}`
- Stores the full `ImmersiveNavigationResult` object

---

## Dashboard

Replace the existing navigation section with:
- **Navigation Score** (0–100) gauge
- **Spatial Memory Score** card
- **Executive Function Score** card
- **Historical trend** line chart (if multiple sessions)
