# Step-by-Step Build Guide
## Immersive Navigation Assessment

This document provides the exact steps to build the module **once you have your videos and images ready**.

---

## Prerequisites — What You Need to Provide

### 🎬 Videos (8 total)

| # | File Name | Content | Used In |
|---|-----------|---------|---------|
| 1 | `encoding_full.mp4` | Full A→H route video showing all landmarks (60–90 sec) | Phase 1: Route Encoding |
| 2 | `segment_h_g.mp4` | H→A clip: H to G | Phase 3: Reverse Navigation |
| 3 | `segment_g_f.mp4` | H→A clip: G to F | Phase 3: Reverse Navigation |
| 4 | `segment_f_e.mp4` | H→A clip: F to E | Phase 3: Reverse Navigation |
| 5 | `segment_e_d.mp4` | H→A clip: E to D | Phase 3: Reverse Navigation |
| 6 | `segment_d_c.mp4` | H→A clip: D to C | Phase 3: Reverse Navigation |
| 7 | `segment_c_b.mp4` | H→A clip: C to B | Phase 3: Reverse Navigation |
| 8 | `segment_b_a.mp4` | H→A clip: B to A (arrival) | Phase 3: Reverse Navigation |

**Place all videos in:** `public/videos/navigation/`

> **Recording tips:**
> - **Encoding video (A→H):** Record one continuous first-person walking video from A to H. Focus briefly on each landmark as you pass it. This video is played once to show the participant the full route and landmarks.
> - **Reverse clips (H→A):** Record a separate video walking back from H to A, then cut it into 7 clips at each intersection point (H-G, G-F, F-E, E-D, D-C, C-B, B-A). Between each clip the participant will be asked which direction to go.
> - Stable walking pace, natural movement
> - Consistent lighting
> - At each intersection, the camera should clearly show the turn options

---

### 🖼️ Images (10 total)

| # | File Name | Content | Type |
|---|-----------|---------|------|
| 1 | `landmark_01.jpg` | Landmark seen on route (e.g., Hospital) | ✅ Real |
| 2 | `landmark_02.jpg` | Landmark seen on route (e.g., Temple) | ✅ Real |
| 3 | `landmark_03.jpg` | Landmark seen on route (e.g., School) | ✅ Real |
| 4 | `landmark_04.jpg` | Landmark seen on route (e.g., Pharmacy) | ✅ Real |
| 5 | `landmark_05.jpg` | Landmark seen on route (e.g., Bus Stop) | ✅ Real |
| 6 | `landmark_06.jpg` | Distractor (e.g., Cinema — NOT on route) | ❌ Distractor |
| 7 | `landmark_07.jpg` | Distractor (e.g., Stadium — NOT on route) | ❌ Distractor |
| 8 | `landmark_08.jpg` | Distractor (e.g., Airport — NOT on route) | ❌ Distractor |
| 9 | `landmark_09.jpg` | Distractor (e.g., Fire Station — NOT on route) | ❌ Distractor |
| 10 | `landmark_10.jpg` | Distractor (e.g., Museum — NOT on route) | ❌ Distractor |

**Place all images in:** `public/images/navigation/landmarks/`

> **Image tips:**
> - Photos should be clear and recognizable
> - Crop to the landmark itself (not too zoomed out)
> - Similar style/lighting across all 10 so distractors aren't obvious
> - Real landmarks: screenshot from your video or photo from same location
> - Distractor landmarks: similar looking places NOT on the route

---

### 📋 Route Data You Need to Fill In

After recording, fill in this information (I'll hardcode it into `routeConfig.ts`):

```
Route Name: ___________________________
Location A (Start): ___________________
Location H (Destination): _____________

Waypoints: A ── B ── C ── D ── E ── F ── G ── H

Destination MCQ:
  Question: "Where are you headed?"
  Option A: _______________
  Option B: _______________ ← mark which is correct
  Option C: _______________
  Option D: _______________

Intersection 1 (at G, after H→G clip) correct direction: [ ] Left  [ ] Right  [ ] Straight  [ ] Back
Intersection 2 (at F, after G→F clip) correct direction: [ ] Left  [ ] Right  [ ] Straight  [ ] Back
Intersection 3 (at E, after F→E clip) correct direction: [ ] Left  [ ] Right  [ ] Straight  [ ] Back
Intersection 4 (at D, after E→D clip) correct direction: [ ] Left  [ ] Right  [ ] Straight  [ ] Back
Intersection 5 (at C, after D→C clip) correct direction: [ ] Left  [ ] Right  [ ] Straight  [ ] Back
Intersection 6 (at B, after C→B clip) correct direction: [ ] Left  [ ] Right  [ ] Straight  [ ] Back

Landmark chronological order (A→H, as seen in encoding video):
  1st: _______________
  2nd: _______________
  3rd: _______________
  4th: _______________
  5th: _______________
```

---

## Build Steps (In Order)

### Step 1 — Install Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Step 2 — Create New Types
Create `src/types/navigationTypes.ts` with:
- `RouteConfig` — route definition (8 waypoints, 7 segments, landmarks, MCQ)
- `IntersectionResponse` — per-intersection decision log
- `LandmarkOrderingResult` — chronology task result
- `NavigationBiomarkers` — all 17+ biomarkers
- `ImmersiveNavigationResult` — final assessment result

### Step 3 — Create Route Config Data
Create `src/data/navigation/routeConfig.ts`:
- Hardcode the single route with your video URLs, 6 intersection directions, landmark data, and destination MCQ
- Uses placeholder values until you provide the real data
- 7 segments: H→G, G→F, F→E, E→D, D→C, C→B, B→A

### Step 4 — Build the Biomarker Engine
Create `src/components/tests/navigation/services/BiomarkerEngine.ts`:
- Pure function: takes raw session data → outputs all biomarkers
- Computes weighted Navigation Score (0–100)
- No dependencies on UI or state

### Step 5 — Build UI Components (Bottom-Up)

**5a. VideoPlayer** — HTML5 `<video>` wrapper
- Props: `src`, `onEnded`, `autoPlay`, `preventSkip`
- Disables seeking, right-click context menu
- Fires callback when clip ends
- Shows placeholder card if no video URL

**5b. InstructionsPhase** — Assessment intro screen
- 4 animated step cards explaining the phases:
  1. 📹 **Watch the Route** — "Watch a first-person walking video from A to H and memorize the route and landmarks"
  2. 📍 **Destination Check** — "Answer where you were headed"
  3. 🧭 **Navigate Back** — "Watch clips from H back to A and choose the correct direction at each intersection"
  4. 🏛️ **Landmark Memory** — "Select and arrange the landmarks you saw in order"
- "Begin Assessment →" button

**5c. DestinationQuestion** — MCQ component
- 4 option buttons
- Records response time via `performance.now()`
- Green/red feedback, then advances

**5d. DirectionSelector** — Intersection decision component
- 4 large buttons: ← Left, → Right, ↑ Straight, ↓ Back
- Min 64×64px touch targets
- On wrong: button turns red, auto-advance after 1.5s
- On correct: button turns green, advance after 0.5s
- Records latency via `performance.now()`

**5e. LandmarkOrdering** — Drag-and-drop chronology
- 10 randomized landmark cards (shuffled)
- 5 empty drop slots below
- Uses `@dnd-kit/core` + `@dnd-kit/sortable`
- Touch-friendly (mobile drag support built-in)
- Submit button to finalize

**5f. NavigationResults** — Score display
- Circular gauge for Navigation Score (0–100)
- Biomarker breakdown in 4 categories
- Color-coded performance indicators
- "Back to Tests" and "Retake" buttons

### Step 6 — Build the Main Orchestrator
Create `NavigationAssessment.tsx`:
- State machine with 7 phases
- **Phase 1 (encoding):** Play full A→H video once (showing route + landmarks)
- **Phase 3 (navigation):** Play 7 reverse clips (H→G, G→F, ..., B→A). After each clip ends (except the last), show DirectionSelector and ask for directions. After last clip (B→A), transition to landmark ordering.
- Coordinates data flow between components
- Calls `BiomarkerEngine` after all phases complete
- Saves result via `useNavigationResults` hook

### Step 7 — Create Styles
Create `NavigationAssessment.css`:
- Dark glassmorphism cards
- Phase transition animations
- Direction button states (default/correct/incorrect/disabled)
- Drag-and-drop card styles
- Score gauge animation
- Mobile-first responsive breakpoints

### Step 8 — Update Hook
Modify `useTestResults.ts`:
- Change `useNavigationResults` to use `ImmersiveNavigationResult` type
- Same Firestore collection (`navigation_results`)

### Step 9 — Update Tests Page
Modify `Tests.tsx`:
- Add "Immersive Navigation" card with updated description, icon, duration

### Step 10 — Update Dashboard
Modify `Dashboard.tsx`:
- Add Navigation Score card
- Add Spatial Memory + Executive Function sub-scores
- Add historical trend line (if multiple sessions)

### Step 11 — Verify
```bash
npm run build    # Check TypeScript compiles clean
npm run dev      # Manual walkthrough of all 7 phases
```

---

## Folder Structure After Build

```
src/
├── types/
│   └── navigationTypes.ts          ← NEW (PoV-based types)
├── data/
│   └── navigation/
│       └── routeConfig.ts          ← NEW (route definition)
├── components/tests/navigation/
│   ├── NavigationAssessment.tsx     ← NEW (orchestrator)
│   ├── NavigationAssessment.css     ← NEW (styles)
│   ├── index.ts                    ← NEW (barrel export)
│   ├── components/
│   │   ├── VideoPlayer.tsx         ← NEW
│   │   ├── InstructionsPhase.tsx   ← NEW
│   │   ├── DestinationQuestion.tsx ← NEW
│   │   ├── DirectionSelector.tsx   ← NEW
│   │   ├── LandmarkOrdering.tsx    ← NEW
│   │   └── NavigationResults.tsx   ← NEW
│   └── services/
│       └── BiomarkerEngine.ts      ← NEW
└── hooks/
    └── useTestResults.ts           ← MODIFIED

public/
├── videos/navigation/
│   ├── encoding_full.mp4           ← YOU PROVIDE (A→H full route)
│   ├── segment_h_g.mp4             ← YOU PROVIDE
│   ├── segment_g_f.mp4             ← YOU PROVIDE
│   ├── segment_f_e.mp4             ← YOU PROVIDE
│   ├── segment_e_d.mp4             ← YOU PROVIDE
│   ├── segment_d_c.mp4             ← YOU PROVIDE
│   ├── segment_c_b.mp4             ← YOU PROVIDE
│   └── segment_b_a.mp4             ← YOU PROVIDE
└── images/navigation/landmarks/
    ├── landmark_01.jpg              ← YOU PROVIDE (real)
    ├── landmark_02.jpg              ← YOU PROVIDE (real)
    ├── landmark_03.jpg              ← YOU PROVIDE (real)
    ├── landmark_04.jpg              ← YOU PROVIDE (real)
    ├── landmark_05.jpg              ← YOU PROVIDE (real)
    ├── landmark_06.jpg              ← YOU PROVIDE (distractor)
    ├── landmark_07.jpg              ← YOU PROVIDE (distractor)
    ├── landmark_08.jpg              ← YOU PROVIDE (distractor)
    ├── landmark_09.jpg              ← YOU PROVIDE (distractor)
    └── landmark_10.jpg              ← YOU PROVIDE (distractor)
```

---

## Quick Checklist Before Building

- [ ] Record Insta360 PoV video of full route A→H (60–90 sec, showing landmarks)
- [ ] Record separate return video H→A and cut into 7 segment clips
- [ ] Take/collect 5 real landmark photos
- [ ] Take/collect 5 distractor landmark photos
- [ ] Fill in the Route Data form above
- [ ] Tell me to proceed with implementation!
