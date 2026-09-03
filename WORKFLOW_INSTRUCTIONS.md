# VyomFlow Milestone Sync & Push Instructions

This document defines the strict workflow for advancing **VyomFlow** using 5-commit milestone batches from **CogniTrack**.

---

## 📌 Current Tracking State

- **Current CogniTrack Base Commit:** `0991ede73e60ef8abdc4fed0fffb0692484b6ec7` (`0991ede`)
- **Date:** `2026-08-03`
- **Message:** `feat(story): add explicit diagnostic error alerts and verify STT API pipeline`
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
Run in PowerShell:
```powershell
git log --pretty=format:"%h - %an, %ad : %s" --date=short --ancestry-path --topo-order --reverse <CURRENT_COGNITRACK_SHA>..cognitrack/main | Select-Object -First 5
```
- Note down commits #1, #2, #3, #4.
- Identify commit **#5** (`TARGET_SHA`) and its exact commit message.

### Step 2: Apply the Tree State of the 5th Commit
Extract the working tree of `TARGET_SHA` while skipping legacy LFS smudge errors:
```powershell
$env:GIT_LFS_SKIP_SMUDGE="1"; git checkout <TARGET_SHA> -- .
```

### Step 3: Enforce Clean Security & LFS Guardrails
Immediately apply the guardrails:
1. Unstage any `.env`, `.gemini`, `.planning`, or `deploy.zip`:
   ```powershell
   git reset HEAD -- .env .gemini .planning deploy.zip .gitattributes
   git checkout HEAD -- .gitignore public/logo.png
   Remove-Item -Force .gitattributes, deploy.zip -ErrorAction SilentlyContinue
   ```
2. Confirm `.env` is uncommitted and ignored.

### Step 4: Sync Dependencies (if package.json changed)
If `package.json` was updated in the target commit:
```powershell
npm install
```

### Step 5: Update Tracking Pointer in WORKFLOW_INSTRUCTIONS.md
Update the `Current CogniTrack Base Commit` section at the top of this file to `<TARGET_SHA>`.

### Step 6: Commit ONLY the 5th Milestone Commit
Stage all clean changes and commit with the exact commit message of the 5th commit:
```powershell
git add .
git commit -m "<MESSAGE_OF_5TH_COMMIT>"
```

### Step 7: Push to VyomFlow
Push the single clean commit directly to `VyomFlow`:
```powershell
git push origin main
```
