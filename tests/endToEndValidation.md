# End-to-End Pipeline Validation Scenarios

This document defines the structured test scenarios used to validate the end-to-end integration of the VyomFlow AI pipeline, from raw assessment telemetry to the final dashboard Clinical Alert.

## Scenario A: Healthy Participant
- **Profile:** 65yo, 16 years education, 3 historical sessions.
- **Session Scores:** High performance across all modules (VMRA: 95, SAVT: 98, Language: 92).
- **Drift Input:** $RCI > -0.5$, $\beta > -0.01$ (Stable).
- **Cross-Sectional Prediction:** `Normal` ($p > 0.95$).
- **Confidence Metrics:** High Density, 100% Completeness, 3 Sessions.
- **Expected Alert Level:** 🟢 STABLE
- **Expected Recommendation:** "Cognitive performance is consistent with previous baseline sessions. Continue routine annual check-ins."

## Scenario B: MCI-like Participant
- **Profile:** 72yo, 12 years education, 2 historical sessions.
- **Session Scores:** Mild decline in Visual Memory (VMRA: 85 $\rightarrow$ 72) and Navigation.
- **Drift Input:** $RCI \approx -1.5$ (Possible Decline), $\beta \approx -0.10$.
- **Cross-Sectional Prediction:** `MCI` ($p \approx 0.60$).
- **Confidence Metrics:** High Density, 100% Completeness, 2 Sessions.
- **Expected Alert Level:** 🟠 RE-ASSESS (or 🟡 MONITOR depending on severity threshold).
- **Expected Recommendation:** "Statistically noticeable shift detected in specific cognitive domains. Re-assess in 3-4 weeks."

## Scenario C: Persistent Decline
- **Profile:** 78yo, 14 years education, 4 historical sessions.
- **Session Scores:** Severe, cascading drop across Executive, Memory, and Language.
- **Drift Input:** $RCI < -2.58$ (Rapid Decline), $\beta < -0.35$.
- **Cross-Sectional Prediction:** `Dementia` ($p > 0.85$).
- **Confidence Metrics:** High Density, 100% Completeness, 4 Sessions.
- **Expected Alert Level:** 🔴 EVALUATE
- **Expected Recommendation:** "Persistent, statistically significant decline observed across visits. Share summary report with a qualified healthcare provider."

## Scenario D: Incomplete Assessment
- **Profile:** 68yo, 1st session.
- **Session Scores:** Participant abandoned the SAVT and Navigation modules.
- **Cross-Sectional Prediction:** `Normal` ($p \approx 0.6$ due to mean imputation of missing vars).
- **Confidence Metrics:** Completeness < 50%, 1 Session (History depth = 30%).
- **Expected Confidence Score:** $< 50\%$
- **Expected Alert Level:** 🟢 STABLE (with low confidence warning).
- **Expected Recommendation:** "... (Note: This result has low confidence due to missing data or limited session history. Please retake the assessment in optimal conditions.)"

## Scenario E: No Historical Sessions (Baseline)
- **Profile:** 60yo, 1st session.
- **Session Scores:** Normal baseline scores.
- **Drift Input:** Engine returns `INSUFFICIENT_DATA`.
- **Expected Dashboard Behavior:** Cross-sectional prediction active. Longitudinal trend charts disabled or showing "Awaiting 2nd session".
- **Expected Alert Level:** 🟢 STABLE.
