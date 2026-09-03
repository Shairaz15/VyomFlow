# LLM BUILD INSTRUCTIONS
## Immersive Navigation & Spatial Memory Assessment Module

> **YOU ARE BUILDING THIS MODULE.** Read this entire document, then read `IMPLEMENTATION_PLAN.md` and `BUILD_GUIDE.md` in this same folder. Follow every step below precisely. Do not skip steps. Do not improvise architecture — follow the spec exactly.

---

## CONTEXT

You are working on **VyomFlow**, a cognitive assessment web app built with:
- **React 19** + **TypeScript 5.9** + **Vite 7**
- **Firebase** (Auth + Firestore)
- **TailwindCSS 4** + vanilla CSS for component-level styles
- **React Router DOM v7**
- **Recharts** for charts on the Dashboard

The app lives at: `src/` with this structure:
```
src/
├── App.tsx              ← Router (all routes defined here)
├── main.tsx             ← Entry point
├── index.css            ← Global styles
├── components/
│   ├── common/          ← Shared UI: Button, Card, CardHeader, CardContent, Icon, RiskBadge
│   ├── layout/          ← PageWrapper
│   └── tests/           ← Test modules (attention/, language/, pattern/, reaction/, story/)
├── contexts/            ← AuthContext
├── data/                ← Static data files
├── hooks/               ← useTestResults.ts (Firestore+localStorage persistence hooks)
├── pages/               ← Dashboard.tsx, Tests.tsx, Landing.tsx, Settings.tsx
├── services/            ← firestoreService.ts
├── types/               ← Type definitions per module
└── utils/               ← Logger, helpers
```

The old map-based `NavigationAssessment` has already been **deleted**. You are building its replacement from scratch.

---

## ASSESSMENT FLOW OVERVIEW

The assessment uses **8 waypoints** labeled A through H:
```
A ── B ── C ── D ── E ── F ── G ── H
```

**Two-phase video approach:**
1. **Encoding (A→H):** Play one continuous first-person video from A to H, showing the full route and all landmarks once. This lets the participant learn the route.
2. **Reverse Navigation (H→A):** Play 7 separate video clips walking back (H→G, G→F, F→E, E→D, D→C, C→B, B→A). After each clip ends, ask the participant which direction to go at that intersection before playing the next clip.

---

## CRITICAL PATTERNS TO FOLLOW

### 1. Assessment Component Pattern
Every assessment follows this exact pattern (see `StoryAssessment.tsx` or `LanguageAssessment.tsx` as reference):

```tsx
import { useState } from "react";
import { PageWrapper } from "../../layout/PageWrapper";
import { Button, Card, Icon } from "../../common";
import { useNavigationResults } from "../../../hooks/useTestResults";
import type { ImmersiveNavigationResult } from "../../../types/navigationTypes";
import "./NavigationAssessment.css";

type Phase = "instructions" | "encoding" | "destination_mcq" | "navigation" | "landmark_ordering" | "processing" | "results";

export function NavigationAssessment() {
    const { saveResult } = useNavigationResults();
    const [phase, setPhase] = useState<Phase>("instructions");
    // ... phase-based rendering with {phase === "xxx" && (...)}
}
```

### 2. Available Common Components
Import from `"../../common"` (or `"../components/common"` from pages):
- `Button` — props: `variant` ("primary" | "secondary"), `size` ("sm" | "md" | "lg"), `className`, `onClick`, `disabled`
- `Card` — props: `floating`, `className`, `onClick`, `ariaLabel`, `children`
- `CardHeader` — section header inside Card
- `CardContent` — section body inside Card  
- `Icon` — props: `name` (IconName), `size` (number), `animated` (boolean)
- `PageWrapper` — wraps every page/assessment (provides layout + nav bar)

### 3. Persistence Hook Pattern
The `useNavigationResults()` hook in `src/hooks/useTestResults.ts` currently imports `NavigationAssessmentResult` from `../types/navigationTypes`. You must:
- Replace the type import to use your new `ImmersiveNavigationResult` type
- Keep the same hook structure (useState, loadResults, saveResult, getLatestResult)
- Keep the same Firestore collection name: `"navigation_results"`
- The hook already handles Firestore vs localStorage fallback — don't change that logic

### 4. Route Registration
The route `/test/navigation` is already registered in `App.tsx`:
```tsx
import { NavigationAssessment } from "./components/tests/navigation/NavigationAssessment";
// ...
<Route path="/test/navigation" element={<ProtectedRoute><NavigationAssessment /></ProtectedRoute>} />
```
Your new `NavigationAssessment` must be the default export from `src/components/tests/navigation/index.ts`. The import path must remain `./components/tests/navigation/NavigationAssessment`.

### 5. Tests Page Card
In `src/pages/Tests.tsx`, the `TESTS` array currently does NOT include a navigation card. Add one:
```tsx
{
    id: "navigation",
    title: "Immersive Navigation",
    description: "Watch a real-world walking video from A to H, then navigate back by choosing directions at each intersection. Measures spatial memory, route learning, and executive function.",
    iconName: "navigation",
    duration: "5 min",
}
```
Also add `"navigation"` to the `handleStartTest` function routing.

### 6. CSS Approach
Each assessment has its own `.css` file imported directly. Use vanilla CSS (not Tailwind utility classes in the CSS file). You CAN use Tailwind utility classes inline in JSX `className` props — the project mixes both approaches.

### 7. Dashboard
`src/pages/Dashboard.tsx` already imports `useNavigationResults` (line 14) and destructures it (line 37):
```tsx
const { results: navigationResults } = useNavigationResults();
```
But it doesn't render any navigation-specific UI yet. Add a new section/card for "Immersive Navigation" scores.

---

## STEP-BY-STEP BUILD ORDER

### STEP 1: Install @dnd-kit
Run:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### STEP 2: Create Types — `src/types/navigationTypes.ts`

Delete the file contents completely and write new types. Must include ALL of these:

```typescript
/** Direction choices available at intersections */
export type NavigationDirection = 'left' | 'right' | 'straight' | 'back';

/** Waypoint labels on the route */
export type Waypoint = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/** A single route segment between two adjacent waypoints */
export interface RouteSegment {
    segmentId: string;          // e.g. "seg_h_g"
    videoUrl: string;           // e.g. "/videos/navigation/segment_h_g.mp4"
    fromWaypoint: Waypoint;     // e.g. "H"
    toWaypoint: Waypoint;       // e.g. "G"
    intersectionLabel: string;  // e.g. "Intersection at G"
    correctDirection: NavigationDirection;
}

/** A landmark used in the chronology task */
export interface LandmarkItem {
    id: string;
    name: string;
    imageUrl: string;
    isReal: boolean;             // true = on the route, false = distractor
    chronologicalOrder: number;  // 1-5 for real landmarks, -1 for distractors
}

/** Full route configuration */
export interface RouteConfig {
    routeId: string;
    routeName: string;
    description: string;
    encodingVideoUrl: string;    // Full A→H video
    destination: {
        question: string;
        options: string[];
        correctIndex: number;
    };
    segments: RouteSegment[];    // 7 segments: H→G, G→F, F→E, E→D, D→C, C→B, B→A
    landmarks: LandmarkItem[];
}

/** Logged response for one intersection decision */
export interface IntersectionResponse {
    segmentId: string;
    chosenDirection: NavigationDirection;
    correctDirection: NavigationDirection;
    isCorrect: boolean;
    decisionLatencyMs: number;
    timestamp: number;
}

/** Result of the destination MCQ */
export interface DestinationAnswer {
    selectedIndex: number;
    isCorrect: boolean;
    responseTimeMs: number;
}

/** Result of the landmark ordering task */
export interface LandmarkOrderingResult {
    selectedLandmarkIds: string[];
    orderedLandmarkIds: string[];
    correctOrderIds: string[];
    recognitionAccuracy: number;   // 0-1
    sequenceAccuracy: number;      // 0-1
    falseLandmarkCount: number;
}

/** All 17+ digital biomarkers */
export interface NavigationBiomarkers {
    // Route Memory
    destinationRecallAccuracy: number;  // 0 or 1
    navigationAccuracy: number;         // 0-1 (out of 6 intersections)
    wrongTurnCount: number;             // out of 6
    correctDecisionRate: number;        // 0-1

    // Executive Function
    averageDecisionLatencyMs: number;
    maxDecisionLatencyMs: number;
    decisionLatencyVariance: number;
    hesitationCount: number;            // decisions > 2× average latency

    // Spatial Memory
    landmarkRecognitionAccuracy: number; // 0-1
    falseLandmarkRate: number;           // 0-1
    landmarkSequenceAccuracy: number;    // 0-1
    chronologicalRecallScore: number;    // 0-1

    // Composite Scores
    routeMemoryScore: number;            // 0-1
    visualAttentionScore: number;        // 0-1
    episodicMemoryScore: number;         // 0-1

    // Final
    navigationScore: number;             // 0-100
}

/** Full assessment result — this is what gets saved to Firestore */
export interface ImmersiveNavigationResult {
    id: string;
    sessionId: string;
    routeId: string;
    timestamp: Date;
    destinationAnswer: DestinationAnswer;
    intersectionResponses: IntersectionResponse[];  // 6 responses
    landmarkOrdering: LandmarkOrderingResult;
    biomarkers: NavigationBiomarkers;
    navigationScore: number;  // 0-100
}
```

### STEP 3: Create Route Config — `src/data/navigation/routeConfig.ts`

Create the directory `src/data/navigation/` and file `routeConfig.ts`.

Hardcode a single route with these specs:
- `routeId`: `"route_01"`
- `encodingVideoUrl`: `"/videos/navigation/encoding_full.mp4"` — the full A→H video
- **7 segments** for reverse navigation (H→A):
  - `seg_h_g`: `/videos/navigation/segment_h_g.mp4` (H→G)
  - `seg_g_f`: `/videos/navigation/segment_g_f.mp4` (G→F)
  - `seg_f_e`: `/videos/navigation/segment_f_e.mp4` (F→E)
  - `seg_e_d`: `/videos/navigation/segment_e_d.mp4` (E→D)
  - `seg_d_c`: `/videos/navigation/segment_d_c.mp4` (D→C)
  - `seg_c_b`: `/videos/navigation/segment_c_b.mp4` (C→B)
  - `seg_b_a`: `/videos/navigation/segment_b_a.mp4` (B→A)
- A destination MCQ with 4 options (use placeholder text like "City Hospital", "Central Market", "Railway Station", "Main Park" — correctIndex: 0)
- 6 correct directions for the 6 intersections (use placeholder values: left, right, straight, left, right, straight)
- 10 landmarks (5 real with chronologicalOrder 1-5, 5 distractors with chronologicalOrder -1)
- Landmark image URLs: `/images/navigation/landmarks/landmark_01.jpg` through `landmark_10.jpg`
- Export as `export const DEMO_ROUTE: RouteConfig = { ... }`

### STEP 4: Create Biomarker Engine — `src/components/tests/navigation/services/BiomarkerEngine.ts`

Create a pure function:
```typescript
export function computeNavigationBiomarkers(
    destinationAnswer: DestinationAnswer,
    intersectionResponses: IntersectionResponse[],
    landmarkOrdering: LandmarkOrderingResult
): NavigationBiomarkers
```

**Scoring weights for `navigationScore`:**
| Component | Weight | Source |
|-----------|--------|--------|
| Direction Accuracy (navigationAccuracy) | 30% | intersectionResponses (7 intersections) |
| Landmark Recognition (landmarkRecognitionAccuracy) | 20% | landmarkOrdering |
| Landmark Chronology (chronologicalRecallScore) | 20% | landmarkOrdering |
| Decision Latency (normalized, lower = better) | 15% | intersectionResponses |
| Destination Recall (destinationRecallAccuracy) | 10% | destinationAnswer |
| False Landmark Penalty (1 - falseLandmarkRate) | 5% | landmarkOrdering |

**Hesitation threshold:** A decision is a "hesitation" if its latency > 2× the participant's average decision latency across all 7 intersections.

**Decision latency normalization for scoring:** Use a sigmoid-like normalization where latency under 2000ms maps to ~1.0 and latency over 8000ms maps to ~0.0. Formula: `Math.max(0, 1 - (avgLatency - 2000) / 6000)`.

Normalize all components to 0-1 range, apply weights, multiply by 100 for final 0-100 score.

### STEP 5: Create Components

Create directory: `src/components/tests/navigation/components/`

#### 5a. `VideoPlayer.tsx`
Props:
```typescript
interface VideoPlayerProps {
    src: string;              // Video URL
    onEnded: () => void;      // Callback when video finishes
    autoPlay?: boolean;       // Default true
    className?: string;
}
```
Requirements:
- Use HTML5 `<video>` element
- Set `controlsList="nodownload nofullscreen noremoteplayback"` and `disablePictureInPicture`
- Disable right-click context menu via `onContextMenu={(e) => e.preventDefault()}`
- Do NOT show native controls (no `controls` attribute)
- Show a custom progress bar at the bottom (thin, colored line showing playback progress)
- If `src` is empty or the video fails to load, show a styled **placeholder card** instead (dark card with a 🎥 icon and text "Video placeholder — clip will appear here")
- Fire `onEnded` when the video finishes playing
- Style: rounded corners, max-width 100%, responsive

#### 5b. `InstructionsPhase.tsx`
Props:
```typescript
interface InstructionsPhaseProps {
    onStart: () => void;
}
```
Requirements:
- Show assessment title: "Immersive Navigation Assessment"
- Show subtitle: "Real-World Spatial Memory & Route Learning"
- Show 4 numbered step cards explaining each phase:
  1. 📹 **Watch the Route** — "Watch a first-person walking video from A to H and memorize the route and landmarks"
  2. 📍 **Destination Check** — "Answer where you were headed"
  3. 🧭 **Navigate Back** — "Watch clips from H back to A and choose the correct direction at each of the 7 intersections"
  4. 🏛️ **Landmark Memory** — "Select and arrange the landmarks you saw in order"
- Show estimated duration: "~5 minutes"
- Big "Begin Assessment →" button
- Use glassmorphism dark cards matching the project's aesthetic (see existing assessment instructions for style reference)

#### 5c. `DestinationQuestion.tsx`
Props:
```typescript
interface DestinationQuestionProps {
    question: string;
    options: string[];
    correctIndex: number;
    onAnswer: (answer: DestinationAnswer) => void;
}
```
Requirements:
- Display the question in large text
- 4 option buttons stacked vertically, large touch targets (min height 56px)
- Record `performance.now()` when the component mounts (start time)
- On selection, calculate `responseTimeMs = performance.now() - startTime`
- Show visual feedback: correct = green pulse, incorrect = red pulse
- After 1.5s feedback, call `onAnswer` with `{ selectedIndex, isCorrect, responseTimeMs }`
- Disable all buttons after selection

#### 5d. `DirectionSelector.tsx`
Props:
```typescript
interface DirectionSelectorProps {
    intersectionLabel: string;
    correctDirection: NavigationDirection;
    onDecision: (response: IntersectionResponse) => void;
    segmentId: string;
}
```
Requirements:
- Show intersection context: "You're at: {intersectionLabel}"
- Show subtext: "Which direction should you go?"
- Display 4 direction buttons in a cross/diamond layout:
  - Top: ↑ Straight
  - Left: ← Left
  - Right: → Right
  - Bottom: ↓ Back
- Each button minimum 64×64px (elderly-friendly)
- Record `performance.now()` when the component mounts (start time for latency)
- On button press:
  - If **correct**: Button turns green, call `onDecision` after 500ms
  - If **wrong**: Pressed button turns red, correct button pulses green, call `onDecision` after 1500ms
- Disable all buttons after any selection
- Pass full `IntersectionResponse` object to `onDecision`

#### 5e. `LandmarkOrdering.tsx`
Props:
```typescript
interface LandmarkOrderingProps {
    landmarks: LandmarkItem[];  // All 10 (5 real + 5 distractors)
    onComplete: (result: LandmarkOrderingResult) => void;
}
```
Requirements:
- Shuffle the 10 landmarks randomly on mount
- Show 2 sections:
  1. **Available Landmarks** — Grid of 10 landmark cards (image + name). Cards are draggable.
  2. **Your Route Order (A → H)** — 5 numbered drop slots (1-5)
- Use `@dnd-kit/core` + `@dnd-kit/sortable`:
  - `DndContext` wrapping everything
  - Draggable landmark cards using `useDraggable`
  - Droppable slots using `useDroppable`
  - `DragOverlay` for smooth drag visual
- Mobile touch support is automatic with `@dnd-kit`
- Tapping a landmark card should also work as a toggle (select/deselect) for accessibility
- "Submit" button enabled only when exactly 5 landmarks are placed
- On submit, compute:
  - `recognitionAccuracy`: How many of the 5 selected are real landmarks (0-1)
  - `sequenceAccuracy`: How many are in the correct chronological position (0-1)
  - `falseLandmarkCount`: How many distractors were selected
- If no image loads, show a styled placeholder card with the landmark name

#### 5f. `NavigationResults.tsx`
Props:
```typescript
interface NavigationResultsProps {
    result: ImmersiveNavigationResult;
    onRetake: () => void;
    onBackToTests: () => void;
}
```
Requirements:
- Large circular score gauge showing Navigation Score (0-100) with color coding:
  - 80-100: Green (Excellent)
  - 60-79: Blue (Good)
  - 40-59: Amber (Fair)
  - 0-39: Red (Needs Attention)
- Biomarker breakdown in 4 collapsible/visible sections:
  1. **Route Memory** — Destination recall, direction accuracy (out of 6), wrong turns
  2. **Executive Function** — Avg/max latency, hesitation count
  3. **Spatial Memory** — Landmark recognition, false landmark rate, sequence accuracy
  4. **Episodic Memory** — Route encoding score
- Each metric shown as a labeled bar or value with performance indicator
- Two buttons: "Retake Assessment" and "Back to Tests"
- Use the `useNavigate` hook for "Back to Tests" (navigate to `/tests`)

### STEP 6: Create Main Orchestrator — `src/components/tests/navigation/NavigationAssessment.tsx`

This is the core component. It manages the state machine:

```typescript
type Phase = "instructions" | "encoding" | "destination_mcq" | "navigation" | "landmark_ordering" | "processing" | "results";
```

**Phase transitions:**
1. `instructions` → user clicks "Begin" → `encoding`
2. `encoding` → encoding video (A→H) ends (onEnded callback) → `destination_mcq`
3. `destination_mcq` → user answers → `navigation`
4. `navigation` → loop through 7 segments (H→A):
   - Play segment clip N → video ends → show DirectionSelector → user chooses → play segment clip N+1
   - After all 7 direction decisions and the last clip (B→A) ends → `landmark_ordering`
5. `landmark_ordering` → user submits → `processing`
6. `processing` → call `computeNavigationBiomarkers()` → build `ImmersiveNavigationResult` → call `saveResult()` → `results`
7. `results` → display NavigationResults

**Navigation phase state machine detail:**
- Track `currentSegmentIndex` (0-6 for 7 segments)
- Track `showDirectionSelector` (boolean)
- Clip flow:
  1. Play clip 0 (H→G) → clip ends → show DirectionSelector (ask direction at G)
  2. User decides → log response → play clip 1 (G→F) → clip ends → show DirectionSelector (ask direction at F)
  3. Continue for all 7 clips...
  4. Play clip 6 (B→A) → clip ends → this is the last clip, transition to `landmark_ordering`
- There are **7 segments and 7 intersections** — direction is asked after each clip ends (clips 0-5), except after the last clip (clip 6, arrival at A) which transitions directly to landmark ordering
- Actually: 7 clips, 6 direction questions (no question after the last clip B→A since you've arrived at A)

**Wait — correction based on the user's intent:** The user said "ask them for directions between each intersection." With 8 waypoints (A-H), there are 7 segments. Between each clip, directions are asked. So:
- Play clip 0 (H→G) → ends → ask direction → play clip 1 (G→F) → ends → ask direction → ... → play clip 5 (C→B) → ends → ask direction → play clip 6 (B→A) → ends → done
- That gives **6 direction questions** (between the 7 clips) — no question after the final arrival clip

**Updated navigation phase logic:**
- `currentSegmentIndex`: 0-6 (7 segments)
- After segment[i] ends (i = 0 to 5): show DirectionSelector, then on decision play segment[i+1]
- After segment[6] ends (B→A, arrival): transition to `landmark_ordering`
- Total direction decisions: **6** (between intersections G, F, E, D, C, B)

**Data collected across phases:**
```typescript
const [destinationAnswer, setDestinationAnswer] = useState<DestinationAnswer | null>(null);
const [intersectionResponses, setIntersectionResponses] = useState<IntersectionResponse[]>([]);
const [landmarkResult, setLandmarkResult] = useState<LandmarkOrderingResult | null>(null);
```

### STEP 7: Create Styles — `src/components/tests/navigation/NavigationAssessment.css`

Use the project's dark theme aesthetic. Key styles needed:
- `.navigation-assessment` — container with padding, max-width
- `.nav-instructions-card` — glassmorphism card (dark bg, border, rounded-3xl, shadow)
- `.nav-step-item` — step card within instructions
- `.nav-video-container` — video wrapper with rounded corners, shadow
- `.nav-video-placeholder` — placeholder when no video (dark card, icon, text)
- `.nav-progress-bar` — thin progress bar under video
- `.nav-direction-grid` — cross/diamond layout for direction buttons
- `.nav-direction-btn` — direction button base styles (64×64px min)
- `.nav-direction-btn--correct` — green state
- `.nav-direction-btn--incorrect` — red state
- `.nav-destination-options` — MCQ option list
- `.nav-landmark-grid` — grid for 10 landmark cards
- `.nav-landmark-card` — draggable landmark card
- `.nav-landmark-slot` — drop slot
- `.nav-landmark-slot--filled` — drop slot with landmark placed
- `.nav-score-gauge` — circular score display (use CSS conic-gradient or SVG)
- `.nav-biomarker-section` — biomarker category section
- `.nav-biomarker-bar` — individual metric bar
- Phase transition animations (fade-in-up)

Match the existing project aesthetic: dark slate-900 backgrounds, cyan/emerald/amber accent colors, rounded-2xl/3xl corners, subtle borders.

### STEP 8: Create Index — `src/components/tests/navigation/index.ts`

```typescript
export { NavigationAssessment } from "./NavigationAssessment";
```

### STEP 9: Update `src/hooks/useTestResults.ts`

**Line 13** — Change the import:
```typescript
// OLD:
import type { NavigationAssessmentResult } from "../types/navigationTypes";
// NEW:
import type { ImmersiveNavigationResult } from "../types/navigationTypes";
```

**Lines 728-810** — Update the `useNavigationResults` hook:
- Replace every occurrence of `NavigationAssessmentResult` with `ImmersiveNavigationResult`
- Keep everything else identical (same Firestore collection, same logic)

### STEP 10: Update `src/pages/Tests.tsx`

Add the navigation test card to the `TESTS` array (after the existing entries, before the closing `]`):
```tsx
{
    id: "navigation",
    title: "Immersive Navigation",
    description: "Watch a real-world walking video from A to H, then navigate back by choosing directions at each intersection. Measures spatial memory, route learning, and executive function.",
    iconName: "navigation",
    duration: "5 min",
},
```

In the `handleStartTest` function, ensure `"navigation"` routes to `/test/navigation`. The current code already has a fallback `navigate(`/test/${testId}`)` which will handle this, but verify.

### STEP 11: Update `src/pages/Dashboard.tsx`

The hook `useNavigationResults` is already imported and called (line 37):
```tsx
const { results: navigationResults } = useNavigationResults();
```

Add a new section in the Dashboard JSX that displays:
- A card titled "Immersive Navigation"
- If `navigationResults.length > 0`:
  - Show latest Navigation Score (0-100) with color coding
  - Show Spatial Memory Score
  - Show Executive Function Score
  - If multiple sessions, show a Recharts `LineChart` with historical scores
- If no results: Show "No navigation assessments yet" with a "Take Test →" button linking to `/test/navigation`

Match the existing Dashboard card style.

### STEP 12: Verify

Run:
```bash
npm run build
```
Fix any TypeScript errors. The build must pass cleanly.

Then:
```bash
npm run dev
```
Manually test by navigating to `/test/navigation` and walking through all 7 phases.

---

## IMPORTANT CONSTRAINTS

1. **Do NOT re-create any old map-based navigation code.** The old types (MapGraph, MapNode, MapEdge, MovementRecord, etc.) are gone and must NOT be referenced anywhere.
2. **Do NOT add `maplibre-gl` usage.** This module uses video, not maps.
3. **Do NOT use `react-beautiful-dnd`.** Use `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` only.
4. **Do NOT skip the placeholder/fallback mode** in VideoPlayer. The user doesn't have videos yet — the module must be testable without them.
5. **Use `performance.now()`** for all latency measurements, not `Date.now()`. This gives sub-millisecond precision.
6. **All components must be mobile-first responsive.** Min touch target 64×64px for directional buttons, 48×48px for other interactive elements.
7. **The `useNavigationResults` hook must keep the exact same Firestore collection name:** `"navigation_results"`.
8. **Preserve all existing comments and code** in files you modify (Tests.tsx, Dashboard.tsx, useTestResults.ts). Only add/change what's specified.
9. **Follow the existing import path conventions.** Relative imports, no path aliases.
10. **The barrel export** from `src/components/tests/navigation/index.ts` must export `NavigationAssessment` as a named export (not default).
11. **Route is A→H (8 waypoints, 7 segments).** Do not use A→B. The encoding video shows the full A→H route with landmarks. The reverse clips go H→A.

---

## FILES REFERENCE

Before you start, read these files to understand the project patterns:
- `src/App.tsx` — Router config, see how other assessments are registered
- `src/pages/Tests.tsx` — Test card grid, see how cards are structured
- `src/pages/Dashboard.tsx` — Dashboard layout, see how other test results are displayed
- `src/hooks/useTestResults.ts` — Persistence hooks, see the pattern for useNavigationResults
- `src/components/common/index.ts` — Available shared components (Button, Card, Icon, etc.)
- `src/components/tests/story/StoryAssessment.tsx` — Reference assessment implementation (similar phase-based pattern)
- `src/services/firestoreService.ts` — Firestore service (already supports "navigation_results" collection)

---

## CHECKLIST

After building, verify ALL of these:

- [ ] `src/types/navigationTypes.ts` contains all new types (no old map types)
- [ ] `src/data/navigation/routeConfig.ts` exists with DEMO_ROUTE (7 segments H→A)
- [ ] `src/components/tests/navigation/NavigationAssessment.tsx` exists and orchestrates 7 phases
- [ ] `src/components/tests/navigation/NavigationAssessment.css` exists with dark-mode styles
- [ ] `src/components/tests/navigation/index.ts` barrel exports NavigationAssessment
- [ ] `src/components/tests/navigation/components/VideoPlayer.tsx` — with placeholder fallback
- [ ] `src/components/tests/navigation/components/InstructionsPhase.tsx`
- [ ] `src/components/tests/navigation/components/DestinationQuestion.tsx`
- [ ] `src/components/tests/navigation/components/DirectionSelector.tsx` — cross layout, 64px targets
- [ ] `src/components/tests/navigation/components/LandmarkOrdering.tsx` — @dnd-kit integration
- [ ] `src/components/tests/navigation/components/NavigationResults.tsx` — score gauge + breakdown
- [ ] `src/components/tests/navigation/services/BiomarkerEngine.ts` — 17+ biomarkers computed
- [ ] `src/hooks/useTestResults.ts` — updated to use ImmersiveNavigationResult
- [ ] `src/pages/Tests.tsx` — navigation card added to TESTS array
- [ ] `src/pages/Dashboard.tsx` — navigation score section added
- [ ] `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` installed
- [ ] `npm run build` passes with zero errors
- [ ] All 7 phases render and transition correctly in dev mode
- [ ] Placeholder mode works (no video files needed for testing)
- [ ] Encoding video plays full A→H route showing landmarks
- [ ] Reverse navigation plays 7 clips (H→G through B→A) with direction questions between each
- [ ] Direction buttons show correct red/green feedback
- [ ] Landmark drag-and-drop works on both desktop and mobile
- [ ] Navigation Score displays 0-100 with correct color coding
- [ ] Result saves to Firestore when authenticated
