# VyomFlow

> **Next-Generation Digital Biomarker & Multimodal Cognitive Health Platform**  
> *Privacy-first, client-side AI assessment engine for early detection and longitudinal monitoring of cognitive decline (MCI & Dementia).*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Speech_&_Multilingual-FF4F00?style=flat)](https://www.sarvam.ai/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Executive Overview

**VyomFlow** is an end-to-end digital biomarker platform designed to democratize high-frequency, non-invasive cognitive health monitoring. By fusing interactive, gamified neurocognitive tasks with on-device machine learning and multilingual speech analysis, VyomFlow captures micro-behavioral digital biomarkers across 6 core cognitive domains to identify subtle trajectory shifts long before clinical onset.

### Key Highlights
- **7 Multimodal Assessment Modules**: Covering episodic visual/verbal memory, psychomotor speed, executive function, speech acoustics, sustained attention, and visuospatial wayfinding.
- **Client-Side AI & TreeSHAP Explainability**: Instant diagnostic risk classification (Normal, MCI, Dementia), continuous MoCA score estimation (0–30), and patient-specific feature attributions.
- **Multilingual Speech Biomarkers (Sarvam AI)**: Live speech-to-text, acoustic hesitation/pause analytics, and real-time translation across Indian regional languages.
- **Privacy-Preserving & Hybrid Sync**: Zero-friction client-side evaluation with live Supabase PostgreSQL real-time streaming and optional Firebase authentication.
- **Clinician-Ready Dashboard & Export**: 6-domain cognitive envelope radar visualization, longitudinal slope regressions, drill-down biomarker inspection, and PDF briefing generation.
- **Interactive ML Simulation & Admin Suite**: Real-time biomarker parameter manipulation, dataset preset switching (Stable, Gradual Decline, Acute), user administration, and model drift telemetry.

---

## Neurocognitive Assessment Modules

VyomFlow evaluates cognitive performance across 6 fundamental domains through 7 specialized, standardized assessments:

```
                      ┌─────────────────────────────────────────┐
                      │          VyomFlow Core Engine           │
                      └────────────────────┬────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┬─────────────────┐
         ▼                  ▼                    ▼                  ▼                 ▼
 ┌───────────────┐  ┌───────────────┐   ┌─────────────────┐  ┌───────────────┐ ┌───────────────┐
 │ Visual Memory │  │ Story Verbal  │   │  SAVT Reaction  │  │ Pattern Exec  │ │ Spatial Nav   │
 │ Recall (VMRA) │  │ Recall & STT  │   │  Time & Latency │  │ Working Mem   │ │ & Wayfinding  │
 └───────┬───────┘  └───────┬───────┘   └────────┬────────┘  └───────┬───────┘ └───────┬───────┘
         │                  │                    │                   │                 │
         └──────────────────┴──────────────┬─────┴───────────────────┴─────────────────┘
                                           ▼
                    ┌─────────────────────────────────────────┐
                    │      Multimodal Feature Extraction      │
                    │   - Intrusion Errors   - WPM / Pauses   │
                    │   - Forgetting Slope   - PSI Latency    │
                    │   - Working Load Tol   - Wayfinding Dev │
                    └──────────────────────┬──────────────────┘
                                           ▼
                    ┌─────────────────────────────────────────┐
                    │   Multi-Task Clinical AI Engine         │
                    │   • Diagnostic Classification (p(Diag)) │
                    │   • Continuous MoCA Estimation (0-30)   │
                    │   • TreeSHAP Feature Attributions       │
                    │   • 6-Domain Envelope Radar Score       │
                    └─────────────────────────────────────────┘
```

### 1. Visual Memory Recall Assessment (VMRA)
- **Domain**: Episodic Visual Memory & Consolidation
- **Biomarkers**: Immediate recall accuracy, 30-minute delayed recall degradation curve, intrusion error frequency, primacy/recency retention bias, grid spatial selection latency.

### 2. Story Verbal Recall Assessment
- **Domain**: Auditory-Verbal Episodic Memory & Semantic Organization
- **Biomarkers**: Narrative unit retention ratio, immediate vs. delayed story detail recall, omission index, cross-lingual transcript fidelity powered by Sarvam AI.

### 3. Reaction Time & Psychomotor Latency (SAVT)
- **Domain**: Processing Speed & Vigilance
- **Biomarkers**: Simple & choice reaction mean latency (ms), intra-individual latency variability (IIV), lapse frequency (>500ms outliers), estimated WAIS-IV Processing Speed Index (PSI).

### 4. Pattern Recognition & Working Memory
- **Domain**: Executive Function & Fluid Reasoning
- **Biomarkers**: Visuospatial working memory load tolerance, sequence difficulty progression breakpoint, learning rate, pattern stability index.

### 5. Language & Acoustic Speech Fluency
- **Domain**: Expressive Language & Semantic Processing
- **Biomarkers**: Cognitive Speech Index (CSI), Speech Rate (WPM), Type-Token Ratio (Lexical Diversity / Root-TTR), pause duration distribution, hesitation markers, semantic coherence.

### 6. Sustained Attention & Vigilance Task
- **Domain**: Sustained & Divided Attention
- **Biomarkers**: Target discrimination accuracy (d-prime), commission errors (false alarms), omission errors, vigilance decrement over time.

### 7. Spatial Navigation & Wayfinding
- **Domain**: Visuospatial Orientation & Topographical Memory
- **Biomarkers**: Heading error angle deviation, path efficiency ratio, backtracking frequency, landmark recognition accuracy, interactive 3D map wayfinding using MapLibre GL.

---

## AI & Clinical Model Architecture

VyomFlow utilizes a multi-task learning architecture combining statistical anomaly detection with gradient-boosted decision trees trained on longitudinal patient cohort data:

1. **Feature Extractor (`featureExtractor.ts`)**: Standardizes multimodal signals across all 7 assessment streams into normalized biomarker vectors.
2. **Longitudinal Slope Analyzer (`trendAnalyzer.ts`)**: Applies ordinary least squares (OLS) regression to calculate individual rate of change ($\Delta/\text{time}$) over weekly/monthly intervals.
3. **Multi-Task Clinical Model (`clinicalModelEngine.ts`)**:
   - **Diagnostic Classifier**: Outputs tri-class probability distribution: $P(\text{Normal})$, $P(\text{MCI})$, $P(\text{Dementia})$.
   - **Continuous MoCA Regressor**: Predicts continuous Montreal Cognitive Assessment equivalent scores ($0.0 - 30.0$).
   - **TreeSHAP Attributions**: Computes exact local feature importance values with risk/protective factor categorization.
4. **Cognitive Radar Envelope**: Computes harmonized 0–100 percentile scores across the 6 core cognitive domains mapped into an interactive radar visualization.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | High-performance, concurrent component architecture |
| **Build Tool & Bundler** | Vite 7 | Lightning-fast HMR and optimized asset bundling |
| **Styling** | TailwindCSS v4 + Vanilla CSS Tokens | Sleek dark-mode glassmorphic clinical UI |
| **Data Visualization** | Recharts & Custom Canvas | 6-Domain Envelope Radar, longitudinal trend graphs |
| **Mapping & Geospatial** | MapLibre GL | Vector-tile spatial navigation and orientation testing |
| **Database & Realtime** | Supabase (PostgreSQL) | Real-time biomarker streaming, longitudinal sync |
| **Authentication** | Firebase Auth | Secure Google OAuth & email authentication |
| **Speech & Audio AI** | Sarvam AI API + WebSocket Proxy | Multilingual STT, TTS, and acoustic feature extraction |
| **On-Device ML** | OnnxRuntime Web & TF.js | Zero-latency client-side neural/tree inference |
| **Notifications** | EmailJS | Scheduled weekly cognitive assessment reminders |

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Supabase Account**: (For database and real-time streaming)
- **Firebase Project**: (Optional, for authentication)
- **Sarvam AI API Key**: (Optional, for multilingual Indian speech features)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Shairaz15/VyomFlow.git
cd VyomFlow

# Install npm dependencies
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# EmailJS Configuration (Assessment Reminders)
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here

# Firebase Configuration (Authentication)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase PostgreSQL Configuration (Biomarker Storage & Realtime)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key

# Optional Sarvam AI Key (for direct STT/translation testing)
VITE_SARVAM_API_KEY=your_sarvam_api_key
```

### 3. Database Migration

Initialize your Supabase database with the VyomFlow longitudinal schema:

```bash
npm run db:migrate
npm run db:verify
```

### 4. Running Locally

Start the Vite development server:

```bash
npm run dev
```

The app will be available at **`http://localhost:5173`**.

*(Optional)* If running the local Sarvam AI WebSocket speech proxy:
```bash
npm run sarvam-proxy
```

---

## Project Structure

```
VyomFlow/
├── src/
│   ├── admin/               # Admin portal (User Management, Analytics, Model Monitoring)
│   ├── ai/                  # Risk engine, trend analysis, feature extractors, anomaly detection
│   ├── components/
│   │   ├── common/          # Buttons, modals, charts, cards, layout primitives
│   │   ├── dashboard-v3/    # Dashboard sections (Radar envelope, trends, SHAP explainability)
│   │   ├── layout/          # PageWrapper, Navbars, Footers
│   │   └── tests/           # 7 Interactive neurocognitive assessment modules
│   ├── contexts/            # AuthContext, ThemeContext
│   ├── data/                # Normative demographic baselines and cognitive cutoff tables
│   ├── docs/                # Clinical specs, biomarker reference manuals, AI architecture
│   ├── hooks/               # Custom React hooks (ViewModel, reminders, timers, audio)
│   ├── i18n/                # Multi-language translation dictionaries and context
│   ├── ml/                  # Machine learning models, encoders, and inference runtimes
│   ├── pages/               # Landing, Dashboard, Tests, Demo, Settings, Privacy
│   ├── services/            # Supabase client, Firebase, Sarvam AI, ClinicalModelEngine
│   ├── types/               # TypeScript interfaces for biomarkers, sessions, and predictions
│   ├── utils/               # Audio processing, math utilities, data formatters
│   ├── App.tsx              # Application routing and provider tree
│   └── main.tsx             # React DOM entry point
├── ml-playground-standalone/# Standalone ML simulation interface
├── scripts/                 # Migration scripts, synthetic data generators, model training
├── supabase/                # PostgreSQL schema migrations and RLS security policies
├── public/                  # Static assets, models, and sounds
├── package.json             # Project dependencies and script definitions
└── vite.config.ts           # Vite + Tailwind + alias configuration
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Starts the local Vite development server at `localhost:5173` |
| `build` | `npm run build` | Typechecks with `tsc` and compiles optimized production bundle |
| `preview` | `npm run preview` | Previews the production build locally |
| `lint` | `npm run lint` | Runs ESLint across the codebase |
| `test` | `npm run test` | Executes unit tests via Vitest |
| `sarvam-proxy` | `npm run sarvam-proxy` | Starts local WebSocket proxy for Sarvam AI speech processing |
| `db:migrate` | `npm run db:migrate` | Runs database migrations against configured Supabase instance |
| `db:verify` | `npm run db:verify` | Verifies Supabase schema integrity and table permissions |
| `db:clean` | `npm run db:clean` | Resets local mock/test database states |

---

## Privacy & Ethical Disclosures

- **Privacy by Design**: All cognitive assessments are scored on-device in real-time. Audio recordings during speech tasks are processed for feature extraction and immediately discarded.
- **Data Ownership**: Users retain complete control over their biomarker trajectories with full data export and deletion capabilities.
- **Investigational Tool**: VyomFlow is a digital biomarker research and longitudinal tracking platform designed to support clinicians and individuals. It does **not** constitute a standalone medical diagnosis.

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Developed for accessible, longitudinal cognitive health monitoring.</sub>
</div>
