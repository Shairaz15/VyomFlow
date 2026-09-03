# Navigation Assessment — Implementation Checklist

---

## Phase 1: Foundation — Types & Data Layer

- [ ] **1.1** Create `src/types/navigationTypes.ts`
  - [ ] Define `MapNode` interface (id, label, emoji, x, y, isStart, isDestination, landmark)
  - [ ] Define `MapEdge` interface (from, to, weight, direction)
  - [ ] Define `MapGraph` interface (nodes, edges, optimalPath)
  - [ ] Define `NavigationDifficulty` type (1 | 2 | 3 | 4)
  - [ ] Define `MoveRecord` interface (timestamp, fromNode, toNode, decisionTimeMs, isCorrectMove, isBacktrack)
  - [ ] Define `LandmarkRecallQuestion` and `LandmarkRecallResponse` interfaces
  - [ ] Define `NavigationBiomarkers` interface (all 10 biomarkers)
  - [ ] Define `NavigationAssessmentResult` interface (full result object)

- [ ] **1.2** Create `src/data/navigation/mapData.ts`
  - [ ] Define Indian Landmark Set (12 landmarks with emojis)
  - [ ] Build 3–4 Level 1 maps (5 intersections, 2 landmarks, single path)
  - [ ] Build 3–4 Level 2 maps (8 intersections, 4 landmarks, 1 dead end)
  - [ ] Build 3–4 Level 3 maps (10–12 intersections, multiple distractors)
  - [ ] Build 3–4 Level 4 maps (12+ intersections, multiple valid routes, 1 optimal)
  - [ ] Pre-calculate optimal paths for each map
  - [ ] Create landmark recall question templates per map
  - [ ] Add landmark randomization utility function

---

## Phase 2: Graph Algorithms

- [ ] **2.1** Create `src/components/tests/navigation/utils/graphAlgorithms.ts`
  - [ ] Implement `findShortestPath()` — Dijkstra's algorithm
  - [ ] Implement `getAdjacentNodes()` — returns reachable neighbors from a node
  - [ ] Implement `getDirection()` — compass direction between two nodes
  - [ ] Implement `comparePaths()` — deviation metrics between optimal and actual
  - [ ] Implement `isOnOptimalPath()` — checks if node is on the correct route
  - [ ] Implement `getAvailableDirections()` — which D-pad buttons are active for a node

---

## Phase 3: Services — Scoring & Analytics

- [ ] **3.1** Create `src/components/tests/navigation/services/NavigationScoring.ts`
  - [ ] Implement `computeNavigationScore()` with PRD-defined weights
  - [ ] Normalize Navigation Accuracy (correct / total decisions)
  - [ ] Normalize Path Efficiency (optimal / actual path length)
  - [ ] Normalize Wrong Turn Penalty
  - [ ] Normalize Completion Time Score (against difficulty-specific expected times)
  - [ ] Normalize Route Deviation Score
  - [ ] Normalize Decision Latency Score (penalize < 0.5s and > 5s)
  - [ ] Normalize Backtracking Score
  - [ ] Map final composite to 0–100

- [ ] **3.2** Create `src/components/tests/navigation/services/NavigationAnalytics.ts`
  - [ ] Implement `extractBiomarkers()` from `MoveRecord[]`
  - [ ] Calculate hesitation count (pauses > 2000ms)
  - [ ] Calculate backtrack count (returning to visited node)
  - [ ] Calculate landmark recall accuracy from quiz responses
  - [ ] Calculate planning efficiency (Level 4 — optimal vs chosen route cost)

---

## Phase 4: UI Components

- [ ] **4.1** Create `src/components/tests/navigation/components/MapBoard.tsx`
  - [ ] Render SVG container with responsive viewBox
  - [ ] Render road edges as `<line>` elements (pastel gray default)
  - [ ] Render highlighted route during encoding phase (color + dashed pattern)
  - [ ] Render landmark nodes with emoji icons
  - [ ] Render start marker (🟢) and destination marker (🏁)
  - [ ] Render pulsing current-position indicator
  - [ ] Render visited-node trail (subtle opacity)
  - [ ] Ensure color-blind-safe route highlighting

- [ ] **4.2** Create `src/components/tests/navigation/components/NavigationDpad.tsx`
  - [ ] Layout 4 directional buttons in cross pattern
  - [ ] Accept `availableDirections` prop to enable/disable buttons
  - [ ] Implement `onMove(direction)` callback
  - [ ] Large touch targets (≥ 56px × 56px)
  - [ ] Press feedback animation (scale + color pulse)
  - [ ] Mobile-optimized centered layout

- [ ] **4.3** Create `src/components/tests/navigation/components/ShapeDistractor.tsx`
  - [ ] Display random shapes (circle, square, triangle) at random positions
  - [ ] Show target instruction (e.g., "Tap all circles!")
  - [ ] 10-second countdown timer with visual display
  - [ ] Track tap accuracy (for data logging, not scoring)
  - [ ] Auto-advance when timer expires

- [ ] **4.4** Create `src/components/tests/navigation/components/NavigationHUD.tsx`
  - [ ] Show current location label with emoji
  - [ ] Show destination reminder with emoji
  - [ ] Show move counter
  - [ ] Show elapsed time
  - [ ] Show progress bar (% of optimal path completed)

- [ ] **4.5** Create `src/components/tests/navigation/components/LandmarkRecall.tsx`
  - [ ] Render 3 multiple-choice questions sequentially
  - [ ] Auto-generate questions from map graph data
  - [ ] 4 options per question
  - [ ] Track response time per question
  - [ ] Match styling with Story Assessment's ComprehensionQuiz

- [ ] **4.6** Create `src/components/tests/navigation/components/NavigationResults.tsx`
  - [ ] Large circular score gauge (0–100)
  - [ ] Biomarker breakdown horizontal bar chart
  - [ ] Route replay SVG — overlay optimal (green) vs actual (red) paths
  - [ ] Key stats display (completion time, wrong turns, backtracks, latency)
  - [ ] Landmark recall score (X / 3)
  - [ ] Level auto-advance notice ("Level X Unlocked!" if score ≥ 70)
  - [ ] Retake and Back to Tests buttons

---

## Phase 5: Main Orchestrator & Styles

- [ ] **5.1** Create `src/components/tests/navigation/NavigationAssessment.tsx`
  - [ ] Implement phase state machine: `instructions → encoding → distractor → navigation → landmark_recall → processing → results`
  - [ ] Instructions phase with assessment steps and Start button
  - [ ] Encoding phase with MapBoard (highlighted route) + countdown timer (difficulty-scaled: 15s/12s/10s/8s)
  - [ ] Distractor phase using ShapeDistractor component
  - [ ] Navigation phase with MapBoard + NavigationDpad + NavigationHUD
  - [ ] Handle D-pad input → validate move → record MoveRecord → update position
  - [ ] Detect destination reached → transition to landmark recall
  - [ ] Landmark recall phase with LandmarkRecall component
  - [ ] Processing phase → call NavigationAnalytics + NavigationScoring
  - [ ] Results phase with NavigationResults component
  - [ ] Difficulty auto-advance logic (score ≥ 70 → unlock next level)
  - [ ] Persist results via `useNavigationResults()` hook
  - [ ] Retake handler (reset state, optionally advance difficulty)

- [ ] **5.2** Create `src/components/tests/navigation/NavigationAssessment.css`
  - [ ] Map SVG container responsive sizing
  - [ ] Node/landmark emoji rendering styles
  - [ ] Road/edge styling (default + highlighted + visited)
  - [ ] D-pad button layout and animations
  - [ ] HUD overlay styles
  - [ ] Encoding phase pulsing/timer animation
  - [ ] Results dashboard layout
  - [ ] Score gauge + bar chart styling
  - [ ] Route replay overlay styles
  - [ ] Dark mode support via CSS variables
  - [ ] Mobile responsive breakpoints (360px, 768px, 1200px+)
  - [ ] High contrast and accessibility styles

- [ ] **5.3** Create `src/components/tests/navigation/index.ts`
  - [ ] Barrel export `NavigationAssessment`

---

## Phase 6: Platform Integration

- [ ] **6.1** Modify `src/services/firestoreService.ts`
  - [ ] Add `"navigation_results"` to `ResultCollectionName` union
  - [ ] Add to `clearAllFirestoreResults()` collections array
  - [ ] Add to `loadAllResultsFromFirestore()` parallel load

- [ ] **6.2** Modify `src/hooks/useTestResults.ts`
  - [ ] Add `navigationResults` key to `STORAGE_KEYS`
  - [ ] Implement `useNavigationResults()` hook (following `useStoryResults` pattern)
  - [ ] Add `navigation_results` to `clearAllTestData()`

- [ ] **6.3** Modify `src/components/common/Icon.tsx`
  - [ ] Add `"navigation"` to `IconName` type union
  - [ ] Add compass/map-pin SVG path to `iconPaths`

- [ ] **6.4** Modify `src/pages/Tests.tsx`
  - [ ] Add `"navigation"` to `TestType` union
  - [ ] Add Navigation Assessment entry to `TESTS` array
  - [ ] Add routing case in `handleStartTest()`

- [ ] **6.5** Modify `src/App.tsx`
  - [ ] Import `NavigationAssessment` component
  - [ ] Add `<Route path="/test/navigation">` with `ProtectedRoute` wrapper

- [ ] **6.6** Modify `src/pages/Dashboard.tsx`
  - [ ] Import `useNavigationResults`
  - [ ] Display navigation score in cognitive assessment summary

---

## Phase 7: Verification & Polish

- [ ] **7.1** Build verification
  - [ ] Run `npm run build` — zero TypeScript errors
  - [ ] Run `npm run dev` — app loads without console errors

- [ ] **7.2** Functional testing
  - [ ] Walk through full assessment flow (instructions → results)
  - [ ] Verify encoding timer counts down and route disappears
  - [ ] Verify D-pad enables/disables correct directions
  - [ ] Verify moves are recorded with correct timestamps
  - [ ] Verify wrong turns and backtracks are detected
  - [ ] Verify distractor shapes appear and timer auto-advances
  - [ ] Verify landmark quiz generates valid questions
  - [ ] Verify Navigation Score formula produces expected output
  - [ ] Verify route replay renders optimal vs actual correctly
  - [ ] Verify difficulty auto-advance at score ≥ 70

- [ ] **7.3** Integration testing
  - [ ] Navigation test card appears on Tests page
  - [ ] Route `/test/navigation` loads the assessment
  - [ ] Results persist to Firestore for authenticated users
  - [ ] Results fall back to localStorage for unauthenticated users
  - [ ] Navigation score appears on Dashboard
  - [ ] Clear All Data removes navigation results

- [ ] **7.4** Accessibility & responsive testing
  - [ ] Touch targets ≥ 48px on mobile
  - [ ] High-contrast colors pass WCAG AA
  - [ ] Color-blind-safe route highlighting (color + dashes)
  - [ ] Test on 360px mobile viewport
  - [ ] Test on 768px tablet viewport
  - [ ] Test on 1200px+ desktop viewport
