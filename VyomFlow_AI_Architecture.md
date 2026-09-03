# VyomFlow AI Architecture & Clinical Alignment Specification
**Version:** 2.0 | **Status:** Scientific Architecture Specification | **Target:** IEEE / Digital Biomarker & Clinical Research Documentation

---

## 1. Executive Summary & Clinical Positioning

VyomFlow is an **AI-assisted cognitive screening and longitudinal digital biomarker platform** designed to estimate cognitive performance, support longitudinal monitoring, and detect subtle behavioral changes over time.

### 1.1 Clinical Scope & Regulatory Boundaries
- **Classification**: Designed in alignment with **FDA Software as a Medical Device (SaMD) Enforcement Discretion** guidelines for *Cognitive Assessment and Screening Devices* (Product Code: `QWZ`).
- **Non-Diagnostic Clarification**: VyomFlow is **not** an automated diagnostic system and does not replace comprehensive clinician-administered neuropsychological evaluations, neuroimaging, or clinical diagnostic workups.
- **Clinical Alignment**: Assessments are **clinically aligned** with established neuropsychological paradigms (e.g., Craft Story 21, Benson Complex Figure, Category Fluency, Trail Making Test, Go/No-Go Vigilance), while extracting novel digital behavioral telemetry unavailable in traditional pen-and-paper administrations.

---

## 2. Dual-Stream AI & Biostatistical Architecture

The platform architecture decouples cross-sectional clinical estimation from longitudinal trajectory tracking, routing outputs through a multi-tier confidence and clinical decision-support pipeline:

```mermaid
graph TD
    A[VyomFlow Digital Assessments\n6 Web-Based Interaction Modules] --> B[Feature Extraction Pipeline]
    B --> C1[Clinically-Aligned Features\nMemory, Fluency, Attention, Speed]
    B --> C2[Digital Behavioral Biomarkers\nMicro-latency, Pauses, Hesitation, Vigilance]
    
    C1 --> D1[Clinical Prediction Engine\nTrained on NACC-74 Cohort Data]
    C2 --> D2[Statistical Longitudinal Drift Engine\nReliable Change Index, Theil-Sen Slope, Z-Drift]
    
    D1 --> E[Composite Risk Engine]
    D2 --> E
    
    E --> F[Confidence Estimation Layer\nUncertainty, Density, Completeness, History Depth]
    F --> G[Clinical Alert Layer\nGreen: Stable | Yellow: Monitor | Orange: Re-assess | Red: Evaluate]
    G --> H[Explainability Engine\nSHAP Local & Global Attributions]
    H --> I[Patient & Clinician Dashboard]
```

---

## 3. Six-Tier Feature Taxonomy

To maintain scientific precision and prevent conflation between raw sensor signals and clinical constructs, all variables are structured across six hierarchical tiers:

```
Tier 1: Raw Measurements
  └─► Timestamps (ms), tap coordinates (x,y), audio waveform buffers, selection events.

Tier 2: Digital Biomarkers
  └─► Phonation ratio, average pause duration (ms), hesitation count, first-tap latency,
      inter-tap interval variance, Signal Detection Theory d', vigilance decrement slope.

Tier 3: Engineered Cognitive Features
  └─► Calibrated category fluency rate, delayed visual retention ratio, information unit
      recall accuracy, processing speed index, working memory span length.

Tier 4: Module Scores
  └─► Standardized 0–100 performance scores per assessment module (VMRA, Story, Language,
      SAVT, Navigation, Pattern/Reaction).

Tier 5: Cross-Module Composite Features
  └─► Global episodic memory index, executive control composite, visuospatial navigation
      composite, cross-domain cognitive stability index.

Tier 6: Machine Learning & Statistical Predictions
  └─► Estimated NACC UDS Cognitive Status (Normal / Impaired / MCI / Dementia),
      estimated CDR® Global stage (0, 0.5, 1, 2, 3), longitudinal trajectory classification.
```

---

## 4. Covariates & Metadata (Non-Biomarker Inputs)

The clinical prediction and statistical drift models explicitly incorporate demographic, linguistic, and environmental covariates as normative modifiers, keeping them distinct from behavioral biomarkers:

- **Demographics**: Age at assessment (years), Years of formal education (`EDUC`), Biological sex (`SEX`), Handedness.
- **Linguistic & Cultural Context**: Primary assessment language (e.g., `en-IN`, `hi-IN`, `ta-IN`, `kn-IN`), Regional/dialectal code, Urban vs. Rural setting.
- **Technical & Session Metadata**: Device hardware class (Desktop / Tablet / Mobile), Screen refresh/sampling frequency, Session sequence index ($t_0, t_1, \dots, t_n$), Elapsed days since baseline ($\Delta t$).

---

## 5. NACC Dataset Integration & Clinical Alignment

### 5.1 Dataset Scope
- **Source**: National Alzheimer's Coordinating Center (NACC) Uniform Data Set (UDS Release 74).
- **Cohort Size**: **217,598 participant visits from approximately 57,038 individuals** collected across 40+ Alzheimer's Disease Research Centers (ADRCs).

### 5.2 Latent Mapping (Non-Equivalence Principle)
VyomFlow does **not** claim direct equivalence between web-based tasks and clinician-administered NACC tests. Instead, the model maps engineered digital features into **clinically aligned latent representations**, learning their statistical association with gold-standard NACC outcomes:

```
VyomFlow Digital Biomarkers ──► Feature Normalizer ──► Clinically Aligned Latent Vector ──► NACC-Trained Model ──► Estimated CDR/MCI Status
```

### 5.3 Extracted NACC Feature Vector (24 Features + 3 Identifiers)

| Category | NACC Variable | Clinical Meaning | VyomFlow Equivalent Module |
|---|---|---|---|
| **Demographics** | `NACCAGE` | Age at assessment (years) | User Profile / Onboarding |
| | `EDUC` | Years of education | User Profile / Normative Adjustment |
| | `SEX` | Biological sex | User Profile |
| **Episodic Memory** | `CRAFTVRS` | Craft Story Immediate Recall (Verbatim) | Story Assessment (Immediate) |
| | `CRAFTDVR` | Craft Story Delayed Recall (Verbatim) | Story Assessment (Delayed) |
| | `UDSBENTC` | Benson Visual Figure Copy | VMRA Encoding Quality |
| | `UDSBENTD` | Benson Visual Figure Delayed Recall | VMRA Delayed Recall |
| **Language & Fluency** | `ANIMALS` | Animal category naming (60 sec) | Language Fluency (Semantic) |
| | `VEG` | Vegetable category naming (60 sec) | Language Fluency (Semantic) |
| | `MOCAFLUE` | Phonemic fluency (Letter 'F' words) | Language Fluency (Phonemic) |
| | `MINTTOTS` | Multilingual Naming Test total | Language Naming Sub-score |
| **Executive & Speed** | `TRAILA` | Trail Making Test Part A time (sec) | Reaction Time / SAVT Base Latency |
| | `TRAILB` | Trail Making Test Part B time (sec) | Navigation Junction Decision Latency |
| | `WAIS` | WAIS-R Digit Symbol Substitution | Visual Pattern Sequencing |
| **Attention & Span** | `DIGIFLEN` | Digit Span Forward max span length | Pattern Memory Span |
| | `DIGIBLEN` | Digit Span Backward max span length | Pattern Reverse Span |
| | `MOCALETT` | Letter 'A' tapping vigilance | SAVT Go/No-Go Inhibitory Control |
| **Visuospatial** | `MOCACUBE` | 3D Cube construction | Pattern Grid Construction |
| | `MOCACLOC` | Clock drawing accuracy | VMRA Spatial Layout Retention |
| | `ORIENT` | CDR Orientation (Time & Place) | Navigation Landmark & Destination Recall |
| **Target Labels** | `NACCUDSD` | UDS Diagnosis (Normal / Impaired / MCI / Dementia) | Primary Screening Output (Y1) |
| | `CDRGLOB` | Global CDR Staging (0, 0.5, 1, 2, 3) | Severity Staging Output (Y2) |
| | `CDRSUM` | CDR Sum of Boxes (0.0 to 18.0) | Continuous Decline Score (Y3) |
| | `DEMENTED` | Binary Dementia Status (0 / 1) | High-Risk Alert Output (Y4) |
| **Identifiers** | `NACCID` | Unique subject identifier | Longitudinal Time-Series Grouping |
| | `NACCVNUM` | Visit sequence number | Longitudinal Session Index |
| | `VISITYR` | Assessment calendar year | Inter-Session Interval ($\Delta t$) |

---

## 6. Statistical Longitudinal Drift Engine (100% Real-Data Foundation)

Longitudinal tracking is powered strictly by **deterministic biostatistical equations** rather than synthetic neural simulations.

### 6.1 Reliable Change Index (RCI) with Module-Specific Reliability
$$RCI = \frac{X_t - X_{\text{baseline}}}{\text{SED}} = \frac{\Delta X}{\sqrt{2 \times \text{SEM}^2}}$$
Where:
$$\text{SEM} = s_{\text{baseline}} \sqrt{1 - r_{xx}}$$
- **Module-Specific Reliability ($r_{xx}$)**: The test–retest reliability coefficient ($r_{xx}$) is **module-specific** and should be estimated empirically or obtained from published validation studies. Until empirical multi-session cohorts are available, configurable literature-derived values are used for research purposes:
  - Visual Memory (VMRA): $r_{xx} \approx 0.82$
  - Reaction & Sustained Attention (SAVT): $r_{xx} \approx 0.88$
  - Language & Speech Fluency: $r_{xx} \approx 0.78$
  - Story Recall: $r_{xx} \approx 0.84$
  - Navigation & Spatial Memory: $r_{xx} \approx 0.80$
- **Statistical Significance**: $|RCI| \ge 1.96$ indicates change exceeding measurement error at $p < 0.05$ (95% CI).

### 6.2 Theil-Sen Robust Trajectory Estimator ($\beta$)
$$\beta = \text{Median}\left( \frac{\text{Score}_j - \text{Score}_i}{t_j - t_i} \right) \quad \forall \ i < j$$
- Computes non-parametric slope across all session pairs, providing robustness against temporary acute fluctuations (e.g., sleep loss, acute illness, stress).

### 6.3 Intra-Individual Z-Score Deviation ($Z_{\text{drift}}$)
$$Z_{\text{drift}} = \frac{X_t - \mu_{\text{baseline}}}{\sigma_{\text{baseline}}}$$
- Evaluates individual performance strictly against personal historical distributions ($t_0 \dots t_k$), ensuring cultural, linguistic, and dialectal neutrality.

### 6.4 Clinically Meaningful 5-Tier Trajectory Spectrum
Trajectories are categorized using a **multi-indicator decision matrix** (combining RCI, $\beta$, $Z_{\text{drift}}$, and Coefficient of Variation $CV$):

| Trajectory Category | Decision Criteria | Clinical Interpretation |
|---|---|---|
| 🟢 **Stable** | $RCI > -1.0$, $\beta \ge -0.05/\text{month}$, $CV < 15\%$ | Performance within expected test-retest bounds. |
| 🟡 **Possible Decline** | $-1.96 < RCI \le -1.0$, $-0.15 \le \beta < -0.05/\text{month}$ | Subtle downward trend; warrants closer monitoring. |
| 🟠 **Likely Decline** | $RCI \le -1.96$ in $\ge 1$ domain, $\beta < -0.15/\text{month}$ | Statistically reliable cognitive decrease ($p < 0.05$). |
| 🔴 **Rapid Decline** | $RCI \le -2.58$ across multiple domains, $\beta < -0.30/\text{month}$ | Marked multi-domain drop ($p < 0.01$). |
| 🔵 **Improving** | $RCI \ge +1.96$, $\beta > +0.10/\text{month}$ | Practice effect or recovery from transient state. |

---

## 7. Confidence Estimation Layer

The platform computes a **Composite Reliability & Confidence Score** ($0–100\%$) for every session output, derived from five orthogonal dimensions:

$$C_{\text{composite}} = w_1 C_{\text{density}} + w_2 C_{\text{complete}} + w_3 C_{\text{OOD}} + w_4 C_{\text{uncertainty}} + w_5 C_{\text{history}}$$

1. **Training Sample Density ($C_{\text{density}}$)**: Proximity of the subject's demographic profile (Age, Education) to dense regions of the training cohort.
2. **Feature Completeness ($C_{\text{complete}}$)**: Proportion of required sub-task trials successfully completed without early termination or timeout.
3. **Out-of-Distribution Distance ($C_{\text{OOD}}$)**: Mahalanobis distance of the extracted feature vector from the normative feature covariance matrix.
4. **Prediction Uncertainty ($C_{\text{uncertainty}}$)**: Shannon entropy of the multi-class probability output ($H(p) = -\sum p_i \log p_i$).
5. **Session History Depth ($C_{\text{history}}$)**: Number of completed historical sessions available ($1 \text{ session} \rightarrow \text{lower baseline confidence}$, $\ge 3 \text{ sessions} \rightarrow \text{high trajectory confidence}$).

---

## 8. Clinical Alert Layer (Decision-Support Output)

The alert layer translates AI and statistical findings into clear, patient-friendly, non-diagnostic guidance:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          CLINICAL ALERT TIERS                              │
├────────────────────────────────────────────────────────────────────────────┤
│ 🟢 STABLE                                                                 │
│    Cognitive performance is consistent with previous baseline sessions.   │
│    Recommendation: Continue routine annual / semi-annual check-ins.        │
├────────────────────────────────────────────────────────────────────────────┤
│ 🟡 CONTINUE MONITORING                                                     │
│    Minor fluctuations observed within expected physiological bounds.       │
│    Recommendation: Repeat assessment in 6–8 weeks to confirm stability.   │
├────────────────────────────────────────────────────────────────────────────┤
│ 🟠 RECOMMEND EARLIER RE-ASSESSMENT                                         │
│    Statistically noticeable shift detected in specific cognitive domains. │
│    Recommendation: Re-assess in 3–4 weeks; review lifestyle/sleep factors. │
├────────────────────────────────────────────────────────────────────────────┤
│ 🔴 RECOMMEND CLINICAL EVALUATION                                           │
│    Persistent, statistically significant decline observed across visits.   │
│    Recommendation: Share summary report with a qualified healthcare       │
│    provider for formal clinical evaluation.                                │
└────────────────────────────────────────────────────────────────────────────┘
```
*Disclaimer*: All alert tiers represent decision-support insights and do not constitute formal medical diagnoses.

---

## 9. Cultural & Linguistic Calibration Strategy

1. **Primary Defense — Intra-Individual Longitudinal Normalization**: To eliminate cross-linguistic bias, VyomFlow prioritizes within-subject trajectory tracking ($\Delta z$-score from personal baseline), ensuring that dialectal, educational, and linguistic baselines do not generate false positives.
2. **Language-Agnostic Core Weighting (80/20 Rule)**: In cross-sectional assessments, 75–80% of the cognitive risk weighting is anchored on language-free visual/spatial/motor modules (VMRA, SAVT, PoV Navigation, Pattern Reaction).
3. **Language-Invariant Acoustic Biomarkers**: For speech modules (Story & Fluency), scoring focuses on biological indicators of cognitive strain (phonation ratio, pause frequency, hesitation latency) rather than English-centric vocabulary or grammar penalties.

---

## 10. Model Validation & Performance Benchmarking

### 10.1 Split & Validation Strategy
- **Partitioning**: 70% Training, 15% Validation, 15% Held-Out Test Split.
- **Cross-Validation**: 5-Fold Stratified Group Cross-Validation grouped by `NACCID` (ensuring zero participant-level data leakage across folds).
- **External Validation Cohorts**: Validation protocol established for independent cohorts (e.g., ADNI, LASI-DAD).

### 10.2 Evaluation Metrics
- **Classification (`NACCUDSD`, `CDRGLOB`)**: Multi-class Balanced Accuracy, Macro F1-Score, Class-wise Precision/Recall, Area Under the ROC Curve (AUROC), Area Under the PR Curve (AUPRC).
- **Continuous Estimation (`CDRSUM`, `NACCMOCA`)**: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Pearson's $r$, Coefficient of Determination ($R^2$).
- **Calibration Assessment**: Brier Score, Expected Calibration Error (ECE), Calibration Reliability Curves.

---

## 11. Explainability Engine (SHAP Framework)

Predictions are paired with transparent, local and global feature attributions using **TreeSHAP**:
- **Local Attribution**: Every assessment report presents the top contributing biomarkers with directional impact:
  - *Example*: `Reaction Time Variance (+1.2 Risk)`, `Navigation Hesitation (+0.8 Risk)`, `Lexical Diversity (-0.5 Risk / Protective)`.
- **Global Feature Importance**: Validated against published clinical literature to ensure models prioritize biologically plausible cognitive indicators over spurious correlations.

---

## 12. Ethics, Fairness & Data Governance

1. **Informed Consent & Transparency**: Clear participant onboarding explaining data usage, screening nature, and privacy rights.
2. **Subgroup Fairness & Bias Auditing**: Regular parity evaluation of model error rates across Age brackets ($\le 60, 61–75, >75$), Education tiers ($\le 8, 9–12, >12$ years), Biological Sex, and Regional/Linguistic groups.
3. **Privacy-First Architecture**: Client-side feature extraction where feasible; encryption at rest and in transit; no raw biometric audio stored post-feature extraction.

---

## 13. Model Lifecycle, Monitoring & MLOps

- **Model Versioning**: Semantic artifact versioning (`model_v1.0.0.json`) tied to training commit hashes and data snapshot timestamps.
- **Data & Concept Drift Detection**: Continuous Kolmogorov-Smirnov (K-S) testing and Population Stability Index (PSI) monitoring on incoming feature distributions.
- **Auditing & Rollback Mechanism**: Automated fallback to rule-based normative scoring if feature distributions drift beyond threshold ($PSI > 0.25$).

---

## 14. Implementation Readiness Matrix

| Component | Status | Technical Details |
|---|:---:|---|
| **6 Digital Assessment Modules** | **Implemented** | Interactive React/TSX components (VMRA, Story, Language, SAVT, Navigation, Pattern). |
| **Micro-Biomarker Extraction** | **Implemented** | Client-side latency, pause detection, $d'$, lexical diversity, and navigation hesitation logging. |
| **NACC-74 Training Pipeline** | **Planned (Immediate)** | Python extraction & XGBoost/SHAP training script (`training/train_nacc_model.py`). |
| **Statistical Longitudinal Drift Engine** | **Planned (Immediate)** | TypeScript biostatistical service (`src/services/statisticalDriftEngine.ts`). |
| **Clinical Alert & Confidence Layer** | **Planned (Immediate)** | Multi-factor confidence estimator and 4-tier decision-support engine. |
| **Multi-Center Clinical Trials** | **Future Research** | Prospective IRB-approved clinical validation against in-person MoCA/CDR batteries. |
| **Blood Biomarker (p-tau217) Fusion** | **Future Research** | Multimodal fusion integrating plasma biomarkers with digital cognitive scores. |
