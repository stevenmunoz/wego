---
description: Streamlined feature workflow - spec, plan, and implement with natural problem-solving
---

User input (GitHub issue URL or feature description):

$ARGUMENTS

## Overview

This command guides you through building a complete feature from description to implementation, providing structure while trusting your natural ability to connect dots and solve problems.

## Core Workflow

### 1. Understand the Feature

**If GitHub issue URL provided:**
- Fetch with `gh issue view <issue_number> --json title,body,labels`
- Extract feature description, requirements, and acceptance criteria
- Use issue number for branch: `<issue-number>-<slug>`

**If plain description provided:**
- Work with description directly
- Generate branch name from key concepts

### 2. Research the Codebase

**Before planning, explore existing patterns:**

```bash
# Check existing pages
ls web/src/pages/*.tsx

# Check existing features
ls web/src/features/

# Check hooks
ls web/src/hooks/*.ts

# Check Firebase services
ls web/src/core/firebase/*.ts

# Check Cloud Functions
ls web/functions/src/

# Check existing components
ls web/src/components/

# Check type definitions
ls web/src/core/types/*.ts
```

**Read feature documentation:**
- `docs/features/` - Existing feature documentation
- `design-system/BRAND_GUIDELINES.md` - Design patterns
- `CLAUDE.md` - Project conventions

### 3. Create Implementation Plan

**Use the TodoWrite tool to create a structured plan:**

**Research Phase:**
- Technology choices and why
- Integration patterns from existing codebase
- Key libraries or approaches

**Data Model:**
- Entities, relationships, validations
- Check `web/src/core/types/` for existing types
- Design Firestore collections if needed

**Test Strategy:**
- How will we know it works?
- Critical test scenarios from user stories

### 4. Break Down Into Tasks

**Create tasks with TodoWrite:**

**Organize by dependency order:**
- Database/types before services before UI
- Mark tasks that can run in parallel

**Make tasks actionable:**
- Clear acceptance criteria
- Reference specific files/functions
- Include validation steps

**Typical structure:**
```
1. Setup
   - Create TypeScript types
   - Create Firestore service

2. Implementation
   - Implement data models
   - Create hooks
   - Build UI components
   - Wire up routes

3. Integration & Polish
   - End-to-end testing
   - Design review
   - Documentation
```

### 5. Execute Implementation

**Work through tasks progressively:**
- Mark tasks complete as you finish them
- Run tests frequently
- Validate against project conventions
- Check existing patterns before inventing new ones

**If blocked:**
- Document the issue
- Suggest alternatives
- Ask for guidance when needed

**Key checkpoints:**
- Tests pass before moving to next phase
- UI matches design system (`design-system/`)
- Firebase operations follow existing patterns
- New patterns documented for future features

### 6. Validate & Wrap Up

**Before considering complete:**
- All tasks marked complete
- Tests passing
- Project conventions followed
- Ready for PR (or explicitly document what's pending)

**Report completion** with:
- Branch name and key files
- Summary of what was built
- Next steps (PR creation, deployment, etc.)

## Key Principles

**Trust Your Judgment:**
- You know the codebase better than rigid scripts
- Adapt the workflow to what makes sense
- Skip unnecessary steps if justified

**Check Patterns First:**
- Always grep for similar components before building new ones
- Read `design-system/` before UI work
- Check `web/src/core/types/` before schema assumptions
- Follow existing service patterns in `web/src/core/firebase/`

**Project Conventions Matter:**
- All user-facing copy in Spanish (Colombia)
- All code and comments in English
- Use design system colors and components
- Follow existing file naming conventions
- Use Zustand for state management

**Communicate Progress:**
- Use TodoWrite to track phases
- Report blockers clearly
- Show reasoning for decisions

**Balance Speed with Quality:**
- Don't over-engineer
- Don't under-clarify critical ambiguities
- Build incrementally with validation loops

## Key Discovery Paths

When planning features, check these locations:

| Looking for... | Check these paths |
|----------------|-------------------|
| Existing pages | `web/src/pages/*.tsx` |
| Feature components | `web/src/features/*/` |
| Shared components | `web/src/components/*/` |
| Hooks | `web/src/hooks/*.ts` |
| Firebase operations | `web/src/core/firebase/*.ts` |
| Cloud Functions | `web/functions/src/` |
| Type definitions | `web/src/core/types/*.ts` |
| Feature documentation | `docs/features/*.md` |
| Design system | `design-system/` |
| Firestore rules | `web/firestore.rules` |
| State stores | `web/src/core/store/*.ts` |

## When Things Don't Fit

This workflow assumes typical feature development. If your task is:
- **A bug fix**: Skip to planning tests and implementation
- **A refactor**: Focus on maintaining behavior, emphasize testing
- **Research/exploration**: Spec might be overkill, jump to research phase
- **Simple enhancement**: Streamline phases based on scope

**Trust yourself to adapt the workflow intelligently.**

## Examples

**From GitHub issue:**
```
/feature https://github.com/user/repo/issues/123
```

**From description:**
```
/feature Add medication reminder notifications with push alerts and scheduling
```

**For simple features:**
```
/feature Fix appointment date picker to use MobileDatePicker
(Likely skip full workflow, just fix and test)
```

## Reference Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Project conventions, data models, tech stack |
| `docs/features/*.md` | Existing feature documentation |
| `design-system/BRAND_GUIDELINES.md` | Brand colors, typography, components |
| `.claude/agents/database.md` | Firestore patterns and best practices |
| `.claude/agents/cloud-functions.md` | Cloud Functions patterns |
| `.claude/agents/frontend.md` | React/TypeScript patterns |

---

**Remember**: This is a guide, not a jail. Use your intelligence to build great features efficiently.
