# Phase 5 — Polish, Testing & Rollout

> **Goal**: Visual polish, animations, responsive testing, dark mode verification, route swap, and final end-to-end verification.

---

## Prerequisites

- Phases 1-4 complete: all data, components, and bug fixes in place
- Dashboard V2 renders correctly at `/dashboard-v2` with mock data

---

## Task 1: Visual Polish

### Animations

Add staggered entrance animations to dashboard sections:

```css
/* In DashboardV2.css */
.dv2-section:nth-child(1) { animation-delay: 0ms; }
.dv2-section:nth-child(2) { animation-delay: 60ms; }
.dv2-section:nth-child(3) { animation-delay: 120ms; }
.dv2-section:nth-child(4) { animation-delay: 180ms; }
.dv2-section:nth-child(5) { animation-delay: 240ms; }
.dv2-section:nth-child(6) { animation-delay: 300ms; }
/* etc. */
```

Each section component should have `className="dv2-section dv2-animate-in"`.

### Micro-Interactions

1. **Domain score cards**: Subtle scale-up on hover (`transform: scale(1.02)`)
2. **Assessment module cards**: Slight lift with shadow on hover
3. **Chart data points**: Enlarge active dot on hover (already handled by Recharts `activeDot`)
4. **Probability bars**: Animate width from 0 to final value on mount (CSS transition on width)
5. **Drawer**: Smooth slide-in/out (already in CSS from Phase 2)
6. **Clinician report modal**: Fade-in backdrop + scale-up content

### Typography Refinements

- Section titles: `Playfair Display`, 1.25rem, `--dv2-navy` color
- Score numbers: `Plus Jakarta Sans`, 2rem, bold, `--dv2-text` color
- Body text: `Plus Jakarta Sans`, 0.875rem-1rem
- Muted labels: `--dv2-muted` color, 0.75rem-0.875rem

### Color Harmony Check

Verify each status color looks good in both light and dark mode:

| Status | Light Mode | Dark Mode |
|---|---|---|
| 🟢 Stable | Green on white card | Green on dark card |
| 🟡 Monitor | Yellow/amber on white | Yellow on dark |
| 🟠 Risk | Orange on white | Orange on dark |
| 🔴 Evaluate | Red on white | Red on dark |

The status badge backgrounds should be semi-transparent (15% opacity fill) so they work on both light and dark card backgrounds.

---

## Task 2: Dark Mode Testing

Test each component in dark mode (`html.dark` or `[data-theme="dark"]`):

| Component | Check |
|---|---|
| Header | Title text is `--dv2-dark-text`, not invisible |
| Hero Summary | Status badge colors readable on dark background |
| AI Prediction | Probability bars visible, AI badge readable |
| Domain Cards | Card backgrounds are `--dv2-dark-card`, text is light |
| Radar Chart | Grid lines and labels visible against dark background |
| Trend Charts | Chart grid, axis labels, tooltips all readable |
| Changes | Green/red text visible on dark cards |
| Module Cards | Score numbers and labels readable |
| Explainability | Factor text and icons visible |
| Longitudinal | Trajectory badge and expanded metrics readable |
| Recommendation | Card and text visible |
| Drawer | Dark card background, text readable |
| Clinician Report | All sections readable in dark modal |

### Dark Mode Toggle

The app uses a `ThemeProvider` context from `src/contexts/ThemeContext`. The theme toggle is on the landing page navbar. Make sure the dashboard V2 container respects the `.dark` class on `<html>` or the `[data-theme="dark"]` attribute.

---

## Task 3: Responsive Testing

Test at these breakpoints:

### Mobile (< 768px)
- All grids collapse to single column
- Header stacks vertically (title above actions)
- Charts take full width
- Drawer takes 90vw width
- Radar chart scales down
- Domain cards stack vertically
- Module cards stack vertically

### Tablet (768px - 1024px)
- Domain cards: 2-column grid
- Module cards: 2-column grid
- Charts: 1 or 2 columns

### Desktop (> 1024px)
- Domain cards: 3-column grid
- Module cards: 2-column grid
- Charts: 2-column grid
- Max-width container: 1200px centered

### Specific Checks
- [ ] Long module names don't overflow cards
- [ ] Long recommendation text wraps properly
- [ ] Chart tooltips don't clip off-screen
- [ ] Drawer doesn't push content on mobile
- [ ] Probability bars don't overflow on narrow screens
- [ ] Session history table scrolls horizontally on mobile (if included)

---

## Task 4: Route Swap

Once Dashboard V2 is verified and stable:

### Modify `src/App.tsx`

```diff
-import { Landing, Dashboard, Tests, VmraAssessment, SarvamTest, MLPlayground } from "./pages";
+import { Landing, Dashboard, DashboardV2, Tests, VmraAssessment, SarvamTest, MLPlayground } from "./pages";

 {/* Protected Routes */}
-<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
-<Route path="/dashboard-v2" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />
+<Route path="/dashboard" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />
+<Route path="/dashboard-legacy" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

### Update Any Internal Links

Search the codebase for any hardcoded `/dashboard` links that might need updating (there shouldn't be any issues since the route stays the same):

```bash
# Search for dashboard navigation
grep -r "dashboard" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "dashboard-v2"
```

Check:
- Landing page "Go to Dashboard" button
- Navigation/sidebar links
- Post-assessment redirect links
- Settings page links

---

## Task 5: Final Verification Checklist

### With Mock Stable Data
- [ ] Hero: 🟢 Stable, confidence > 85%
- [ ] AI Prediction: Normal > 80%, MoCA > 26
- [ ] Domain cards: mostly green/stable trends
- [ ] Charts: 7 charts with flat/improving lines
- [ ] Changes: mostly stable or improved
- [ ] Explainability: positive factors listed
- [ ] Longitudinal: "Stable" trajectory
- [ ] Recommendation: "Continue annual monitoring"

### With Mock Declining Data
- [ ] Hero: 🟠 or 🔴, lower confidence
- [ ] AI Prediction: MCI or Dementia probabilities elevated
- [ ] Domain cards: red/orange deltas, "Monitor"/"Needs Attention" labels
- [ ] Charts: downward trends visible
- [ ] Changes: declined items in red
- [ ] Explainability: negative factors listed
- [ ] Longitudinal: "Possible Decline" or worse
- [ ] Recommendation: "Repeat in X weeks" or "Discuss with clinician"

### With No Data (Empty State)
- [ ] Shows empty state card
- [ ] "Take Your First Assessment" button visible
- [ ] No broken charts or null errors

### Chart Interaction
- [ ] Click a data point on any of the 7 charts
- [ ] Drawer slides in from right
- [ ] Shows module name and session date
- [ ] Shows top 5 biomarkers with values
- [ ] Close button works
- [ ] Clicking backdrop closes drawer

### Clinician Report
- [ ] "Download Clinician Report" button opens modal
- [ ] Modal shows demographics (from profile, not hardcoded)
- [ ] Shows prediction, probabilities, MoCA
- [ ] Shows all 7 modules with top 5 biomarkers each
- [ ] Shows radar chart
- [ ] "Print / Save PDF" button works (opens browser print dialog)
- [ ] Close button works

### Dark Mode
- [ ] Toggle to dark mode
- [ ] All 10 sections readable
- [ ] Charts have appropriate dark backgrounds
- [ ] Drawer has dark background
- [ ] Modal has dark background

### Mobile
- [ ] All sections stack vertically
- [ ] No horizontal overflow
- [ ] Touch-friendly tap targets
- [ ] Drawer usable on mobile

---

## Task 6: Cleanup

1. Remove the temporary `/dashboard-v2` route (it's now at `/dashboard`)
2. Optionally add `dashboard-v2/` folder to `.gitignore` if you don't want the planning docs in the repo
3. Run final build and test:

```bash
npm run build    # Zero errors
npm run test     # Existing tests pass
npm run dev      # Manual verification at /dashboard
```

---

## Files Summary

| Action | File | Changes |
|---|---|---|
| **MODIFY** | `src/pages/DashboardV2.css` | Add animations, polish, responsive refinements |
| **MODIFY** | `src/App.tsx` | Swap routes: DashboardV2 → `/dashboard`, old → `/dashboard-legacy` |
| **VERIFY** | All components | Dark mode, responsive, interaction testing |
