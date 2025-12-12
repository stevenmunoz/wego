---
description: Create a Pull Request to develop (or main) following WeGo pipeline guidelines
---

Optional PR title override:

$ARGUMENTS

## Overview

This command creates a well-formatted Pull Request following WeGo's deployment pipeline:

```
feature/xxx ──► develop ──► main
                  │           │
                  ▼           ▼
              DEV env      PROD env
```

## Workflow

### 1. Analyze Current State

**Run these commands in parallel to understand what we're working with:**

```bash
# Get current branch
git branch --show-current

# Check if we have a remote tracking branch
git status -sb

# See what commits will be in the PR
git log --oneline develop..HEAD 2>/dev/null || git log --oneline main..HEAD

# Check for uncommitted changes
git status --porcelain
```

### 2. Determine Target Branch

**Based on current branch:**
- If on `develop` → Target is `main` (promoting to production)
- If on `main` → Error: Cannot create PR from main
- If on any other branch → Target is `develop`

### 3. Handle Uncommitted Changes

**If there are uncommitted changes:**
- Warn the user
- Ask if they want to commit first or proceed without them
- If committing, follow standard commit guidelines with emoji

### 4. Ensure Branch is Pushed

**Check and push if needed:**
```bash
# Push with upstream tracking if not already pushed
git push -u origin HEAD
```

### 5. Gather PR Information

**Analyze the changes:**
- Review all commits since branching from target
- Identify files changed and their purpose
- Categorize changes (feature, fix, refactor, docs, etc.)

**Generate PR content:**

**Title format:**
- `feat: <description>` for new features
- `fix: <description>` for bug fixes
- `refactor: <description>` for code improvements
- `docs: <description>` for documentation
- `chore: <description>` for maintenance

If `$ARGUMENTS` is provided, use it as the title (but add appropriate prefix if missing).

### 6. Create the Pull Request

**Use GitHub CLI to create PR:**

```bash
gh pr create --base <target-branch> --title "<title>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing what this PR does>

## Changes
<List of key changes organized by category>

## Testing
- [ ] Tested locally
- [ ] Tests pass
- [ ] No TypeScript errors

## Deployment Notes
<Any special considerations for deployment>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 7. Report Results

**After PR creation, report:**
- PR URL
- Target branch and deployment environment
- What will happen after merge:
  - If merging to `develop`: "Will deploy to DEV environment (wego-dev-a5a13)"
  - If merging to `main`: "Will deploy to PROD environment (wego-bac88)"

## PR Body Template

```markdown
## Summary
<!-- Brief description of changes -->

## Changes
<!-- Categorized list of changes -->

### Features
-

### Bug Fixes
-

### Improvements
-

## Testing
- [ ] Tested locally
- [ ] Tests pass (`npm run test` or `npm run type-check`)
- [ ] No linting errors
- [ ] Manually verified key functionality

## Screenshots (if UI changes)
<!-- Add screenshots if applicable -->

## Deployment Notes
<!-- Special deployment considerations, if any -->
- Environment: DEV / PROD
- Database changes: Yes / No
- Environment variables: Yes / No

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Pipeline Reminders

**For PRs to `develop`:**
- Merging will auto-deploy to DEV: https://wego-dev-a5a13.web.app
- Backend deploys to Cloud Run (dev)
- Test thoroughly in DEV before promoting to main

**For PRs to `main`:**
- Merging will auto-deploy to PROD: https://wego-bac88.web.app
- Backend deploys to Cloud Run (prod)
- Ensure changes were tested in DEV first
- This is production - double-check everything!

## Examples

**Create PR with auto-generated title:**
```
/pr
```

**Create PR with custom title:**
```
/pr feat: add inline editing to dashboard table
```

**From develop to main (production release):**
```
/pr release: dashboard improvements and bug fixes
```

## Safety Checks

Before creating PR, verify:
1. No sensitive data in commits (API keys, passwords, .env files)
2. No console.log statements left in production code
3. TypeScript compiles without errors
4. Changes are scoped appropriately (not mixing unrelated changes)

## Notes

- Always create PRs through this command for consistency
- The PR body will be pre-filled but you can edit it on GitHub
- For urgent fixes, you can still merge directly but document why
