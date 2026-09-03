# VyomFlow Milestone Sync & Push Instructions

This document defines the strict workflow for advancing **VyomFlow** using 5-commit milestone batches from **CogniTrack**.

---

## 📌 Current Tracking State

- **Current CogniTrack Base Commit:** `d75001465ee2a78807ede3d2100e022dd315d527` (`d750014`)
- **Date:** `2026-08-02`
- **Message:** `feat(api): implement Vercel Cloud Serverless Functions /api/sarvam-stt and /api/sarvam-translate for universal CORS-free mobile & cross-device Sarvam AI speech support`
- **Target VyomFlow Remote:** `https://github.com/Shairaz15/VyomFlow.git` (`origin/main`)

---

## 🎯 The 5:1 Milestone Rule

When instructed to *"fetch 5th upcoming commit and push"*:
1. **DO NOT** push 5 intermediate micro-commits.
2. **ONLY** commit the **5th upcoming commit** (the latest among the 5) as **one single clean milestone commit**.
3. All intermediate changes are folded into that single milestone state.
4. Push that single commit directly to `origin/main` (`VyomFlow`).

---

## 🔄 Step-by-Step Execution Workflow

### Step 1: Identify the Next 5 Commits from CogniTrack
Run the following command in PowerShell to list the upcoming 5 commits:
```powershell
git log --pretty=format:"%h - %an, %ad : %s" --date=short --ancestry-path --topo-order --reverse <CURRENT_COGNITRACK_SHA>..cognitrack/main | Select-Object -First 5
```
- Note down commits #1, #2, #3, #4.
- Identify commit **#5** (`TARGET_SHA`) and its exact commit message.

### Step 2: Apply the Tree State of the 5th Commit
Extract the entire working tree of `TARGET_SHA` onto the current branch without pulling in the intermediate git history:
```powershell
git checkout <TARGET_SHA> -- .
```

### Step 3: Preserve Clean Security & LFS Guardrails
Ensure no broken LFS files or temporary folders are staged:
1. Verify `.gitignore` still excludes `.gemini/`, `.planning/`, `.env`, and `deploy.zip`.
2. Ensure no `.gitattributes` introduces broken legacy Git LFS pointers for `logo.png`.

### Step 4: Sync Dependencies (if package.json changed)
If `package.json` was updated in the target commit:
```powershell
npm install
```

### Step 5: Commit ONLY the 5th Milestone Commit
Stage all changes and commit with the exact commit message of the 5th commit:
```powershell
git add .
git commit -m "<MESSAGE_OF_5TH_COMMIT>"
```

### Step 6: Push to VyomFlow
Push the single clean commit directly to `VyomFlow`:
```powershell
git push origin main
```

### Step 7: Update the Pointer in this File
Update the `Current CogniTrack Base Commit` section at the top of this file to `<TARGET_SHA>` so the next iteration continues seamlessly.
