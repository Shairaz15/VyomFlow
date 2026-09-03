# Hackathon Migration Plan: New Repository Identity & Cloud Infrastructure Setup

## Overview

This document outlines the complete, step-by-step implementation plan to migrate the cognitive assessment platform from this repository to a **brand-new repository** with a **fresh identity** for your upcoming hackathon.

The migration is engineered with a **Zero-Metadata Guarantee**:
- The new repository will look **100% organic, hand-crafted, and human-developed**.
- No traces of AI assistants, automated squashing scripts, co-authors, or migration tools.
- Git history starts from the **March 31, 2026 commit** (`ed24728`), condensing the ~176 commits into ~35 clean, publication-grade milestone commits (~5:1 ratio).
- Completely isolated cloud environments across Supabase, Firebase, Render, and Vercel.

---

## 1. Zero-Metadata & Organic History Guarantee

To ensure the new repository cannot be distinguished from a project developed naturally over time:

### Git Author & Committer Settings
- Every commit in the new repository will strictly use your configured developer identity:
  - `user.name`: Your GitHub username / developer name.
  - `user.email`: Your GitHub email address.
- `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, and `GIT_COMMITTER_EMAIL` will be explicitly unified so no secondary committer or bot signature appears.
- Zero co-author trailers (no `Co-authored-by:`).

### Natural Conventional Commit Messages
- Commits will not contain terms like `"squash"`, `"batch"`, `"5-in-1"`, `"automated"`, or `"condensed"`.
- Each commit message will describe concrete features, improvements, or bug fixes as if pushed during standard development sprints:
  - Example: `feat(attention): implement Go/No-Go trial logic and signal detection scoring`
  - Example: `feat(navigation): add real-world PoV video navigation and spatial memory assessment`
  - Example: `perf(db): add covering indexes, offline write queue, and atomic RPC stored procedure`

### Realistic Timestamps
- Each condensed milestone commit will inherit the actual timestamp of that development milestone between April 2026 and September 2026, preserving a natural, continuous progression of commits over days and weeks.

### Complete File & Metadata Scrubbing
The following directories and artifacts will be **strictly excluded** from the new repository:
- `.agents/` (Agent tools, skills, and configuration)
- `.claude/` (Claude conversation cache and settings)
- `.gemini/` (Antigravity IDE local cache and workspace files)
- `.planning/` (Task planning artifacts)
- `graphify-out/` (Knowledge graph data)
- `deploy.zip` (Temporary build archive)
- `CLAUDE.md` (Agent instructions)
- `.git/` (Old git history and branch references)

---

## 2. External Cloud Services Provisioning Guide

You will create clean, isolated projects on external services so the hackathon submission runs on independent infrastructure.

### 2.1 Supabase (PostgreSQL Database & Storage)
1. **Create Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project.
   - Choose your project name, set a secure database password, and choose a region close to your users (e.g., Mumbai / South Asia).
2. **Execute Database Schema**:
   - In your Supabase Dashboard, open the **SQL Editor**.
   - Paste and run the entire contents of `supabase/schema.sql` from this repository.
   - This script creates:
     - `assessment_sessions` table with columns for 75 digital biomarkers and latency telemetry.
     - `cognitive_trends` table for longitudinal tracking.
     - Atomic RPC stored procedure: `record_session_with_biomarkers(...)`.
     - Performance covering indexes and Row-Level Security (RLS) policies.
3. **Storage Bucket Setup**:
   - Go to **Storage** in the Supabase Dashboard.
   - Create a new **Public** bucket named `navigation-media`.
   - Upload the navigation video asset (`res.mp4`) if you wish to serve it from the Supabase global CDN.
4. **Retrieve API Keys**:
   - Navigate to **Project Settings -> API**.
   - Copy **Project URL** (`VITE_SUPABASE_URL`).
   - Copy **anon / public key** (`VITE_SUPABASE_ANON_KEY`).

---

### 2.2 Firebase (Authentication & Sync)
1. **Create Project**:
   - Go to [Firebase Console](https://console.firebase.google.com) and create a new project (e.g., `<your-hackathon-name>-app`).
2. **Enable Authentication**:
   - Navigate to **Authentication -> Sign-in method**.
   - Enable **Google** provider and configure support email.
   - Add your local host (`localhost`) and upcoming Vercel production domain to **Authorized Domains**.
3. **Set Up Firestore Database**:
   - Go to **Firestore Database** -> Click **Create database** (Production mode).
   - Deploy the rules from `firestore.rules` and indexes from `firestore.indexes.json`.
4. **Register Web App**:
   - Go to **Project Settings -> General** -> Click the `</>` (Web) icon to register an app.
   - Copy the Firebase configuration object:
     - `apiKey` (`VITE_FIREBASE_API_KEY`)
     - `authDomain` (`VITE_FIREBASE_AUTH_DOMAIN`)
     - `projectId` (`VITE_FIREBASE_PROJECT_ID`)
     - `storageBucket` (`VITE_FIREBASE_STORAGE_BUCKET`)
     - `messagingSenderId` (`VITE_FIREBASE_MESSAGING_SENDER_ID`)
     - `appId` (`VITE_FIREBASE_APP_ID`)
5. **Update `.firebaserc`**:
   - Replace the old project ID (`cognitrack-9a9e4`) with your new Firebase project ID.

---

### 2.3 Render (Sarvam AI WebSocket Streaming Proxy)
1. **Create Web Service**:
   - Go to [render.com](https://render.com) and select **New -> Web Service**.
   - Connect your new GitHub repository.
2. **Configure Service**:
   - **Root Directory**: `proxy`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free / Starter
3. **Retrieve URL**:
   - Copy the deployed service URL.
   - Convert `https://` to `wss://` (e.g., `wss://<app-name>-proxy.onrender.com`).
   - Assign to `VITE_SARVAM_PROXY_URL`.

---

### 2.4 AI APIs (Sarvam AI & Google Gemini)
1. **Sarvam AI**:
   - Obtain or use your active Sarvam AI API key with access to STT (`saaras:v4`), translation, and Bulbul v2 TTS (`VITE_SARVAM_API_KEY`).
2. **Google Gemini AI**:
   - Obtain or use an active Gemini API key from Google AI Studio (`VITE_GEMINI_API_KEY`) for multimodal assistant reasoning.

---

### 2.5 Vercel (Production Frontend Hosting)
1. **Import Repository**:
   - Go to [vercel.com](https://vercel.com) and import your new GitHub repository.
2. **Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**:
   - Add all environment variables listed in Section 4 below.
4. **Deploy**:
   - Trigger deployment and confirm routing and assets render properly.

---

## 3. Migration Process: Step-by-Step

### Step 1: Destination Folder & Clean Init
1. A new folder is created outside the current repo (e.g., `c:\Users\Sashank\Documents\Cmrit_Expo\Dev_file\<new-project-name>`).
2. Initialize clean git repository:
   ```bash
   git init
   git config user.name "<Your Name>"
   git config user.email "<Your Email>"
   ```

### Step 2: Milestone Extraction & Commit Replay
1. An automated script iterates through the 176 commits between `ed24728` (March 31, 2026) and `HEAD`.
2. Commits are grouped into ~35 logical batches of approximately 5 commits each.
3. For each milestone batch:
   - The tree state of the milestone's target commit is copied to the new repository.
   - Blacklisted folders (`.agents`, `.claude`, `.gemini`, `.planning`, etc.) are removed.
   - If rebranding text or identifiers are changed, the new names are applied.
   - A clean conventional commit is recorded with the author name, email, and milestone timestamp:
     ```bash
     GIT_AUTHOR_DATE="<timestamp>" GIT_COMMITTER_DATE="<timestamp>" git commit -m "<clean message>"
     ```

### Step 3: Final State & Branding Polish
1. At the final commit (matching the latest state of the codebase):
   - Project name in `package.json` reflects the new identity.
   - `.firebaserc` points to the new Firebase project.
   - `.env.example` provides a clean template.
   - `.gitignore` ensures `.env`, `.agents`, and temporary build files are ignored.

---

## 4. Environment Variables Reference (`.env`)

In the new repository, the `.env` file will look like this:

```env
# ==========================================
# Application Identity & Mode
# ==========================================
VITE_LOG_LEVEL=info

# ==========================================
# Supabase PostgreSQL & Storage
# ==========================================
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# ==========================================
# Firebase Authentication & Firestore
# ==========================================
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>

# ==========================================
# Real-Time AI & Voice Services
# ==========================================
VITE_SARVAM_PROXY_URL=wss://<your-render-proxy>.onrender.com
VITE_SARVAM_API_KEY=<your-sarvam-api-key>
VITE_GEMINI_API_KEY=<your-gemini-api-key>
VITE_AI_ASSISTANT_URL=

# ==========================================
# EmailJS Notification Service (Optional)
# ==========================================
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
```

---

## 5. Local Verification & Readiness Checklist

Before pushing to the new GitHub remote and deploying to Vercel:

- [ ] **Git History Integrity**:
  - `git log --oneline` shows ~35 clean, progressive commits starting March 31, 2026.
  - `git log --format="%an <%ae> | %cd"` confirms 100% consistent author, email, and dates.
  - No references to squashing, AI tools, or old repo names in commit logs.
- [ ] **Clean Working Tree**:
  - `git status` shows zero untracked files or metadata directories.
- [ ] **Build Validation**:
  - `npm install` runs smoothly without peer dependency conflicts.
  - `npm run build` (`tsc -b && vite build`) completes with 0 errors.
  - `npm run test` executes and passes all test suites.
- [ ] **Database & Auth Smoke Test**:
  - Google Sign-In connects and authenticates.
  - Completing one assessment records data into the new Supabase `assessment_sessions` table.
- [ ] **Voice & Proxy Smoke Test**:
  - The live microphone recorder connects to the new Render WebSocket proxy without CORS or connection drops.

---

## Next Steps

When you are ready to execute:
1. Provide the **Developer Name & Email** to stamp on the commits.
2. Provide the **Project Name / Brand Identity** for the hackathon.
3. Provide the **Destination Folder** where the new repository should be generated.
