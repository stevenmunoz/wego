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

### 2. Create Specification

Run: `.specify/scripts/bash/create-new-feature.sh --json "$FEATURE_DESCRIPTION"`

Parse output for `BRANCH_NAME`, `SPEC_FILE`, `FEATURE_DIR`.

**Write a clear specification** that answers:
- **What** are we building? (user stories, requirements)
- **Why** does it matter? (value, success criteria)
- **What's unclear?** (mark ambiguities with `[NEEDS CLARIFICATION: ...]`)

Use `.specify/templates/spec-template.md` as your guide, but adapt naturally to the feature's needs.

### 3. Clarify Ambiguities (if needed)

If you marked `[NEEDS CLARIFICATION]` items:
- Ask targeted questions (one at a time, multiple choice when helpful)
- Update spec with answers in `## Clarifications` section
- Stop when you have enough clarity to plan confidently

**Tip**: Don't over-clarify. If you can make a reasonable decision based on project patterns and constitution, do it.

### 4. Plan Implementation

Run: `.specify/scripts/bash/setup-plan.sh --json` (parse for `IMPL_PLAN`, `SPECS_DIR`)

**Create a thoughtful implementation plan** covering:

**Constitution Check** (from `.specify/memory/constitution.md`):
- Review key principles (medical safety, existing patterns, mobile-first, TDD, brand consistency)
- Document any justified deviations with clear rationale

**Research & Decisions** (`research.md`):
- Technology choices and why
- Integration patterns from existing codebase
- Key libraries or approaches

**Data Model** (`data-model.md`):
- Entities, relationships, validations
- Check `frontend/src/types/database.ts` for existing schema
- Design migrations if needed

**Contracts** (`contracts/`):
- API endpoints, request/response schemas
- Validation rules
- Error handling patterns

**Test Strategy** (`quickstart.md`):
- How will we know it works?
- Critical test scenarios from user stories
- Integration test approach

**Agent Context Update**:
- Run: `.specify/scripts/bash/update-agent-context.sh claude`
- Incrementally update CLAUDE.md with new patterns (O(1) operation)

### 5. Break Down Into Tasks

**Create `tasks.md`** with concrete, ordered tasks:

**Organize by dependency order:**
- Tests before implementation (TDD)
- Models before services before UI
- Mark `[P]` for parallel execution (independent files)

**Make tasks actionable:**
- Clear acceptance criteria
- Reference specific files/functions
- Include validation steps

**Typical structure:**
```
## Setup
- [T001] Install dependencies
- [T002] Create database migration

## Tests (run in parallel)
- [T003] [P] Contract tests for API endpoints
- [T004] [P] Model validation tests
- [T005] [P] Integration test scenarios

## Implementation
- [T006] Implement data models
- [T007] Create service layer
- [T008] Build UI components
- [T009] Wire up API endpoints

## Integration & Polish
- [T010] End-to-end testing
- [T011] Design review
- [T012] Documentation
```

Use `.specify/templates/tasks-template.md` as reference, but adapt to your feature's reality.

### 6. Execute Implementation

**Work through tasks progressively:**
- Mark tasks `[x]` as you complete them
- Run tests frequently
- Validate against constitution principles
- Check existing patterns before inventing new ones

**If blocked:**
- Document the issue
- Suggest alternatives
- Ask for guidance when needed

**Key checkpoints:**
- Tests pass before moving to next phase
- UI matches design system (`frontend/DESIGN_SYSTEM.md`)
- Database changes include migrations
- New patterns documented for future features

### 7. Validate & Wrap Up

**Before considering complete:**
- All tasks marked `[x]` in tasks.md
- Tests passing (contract, integration, unit)
- Constitution principles followed
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
- Read `DESIGN_SYSTEM.md` before UI work
- Check `database.ts` before schema assumptions
- Follow existing service patterns

**Constitution Matters:**
- Medical safety boundaries are non-negotiable
- Purple brand (#7f3dff, #6a2bff, #f4eaff) is sacred
- Mobile-first (44px+ touch targets, no native inputs)
- TDD (tests before implementation)
- RLS policies for data security

**Communicate Progress:**
- Use TodoWrite to track phases
- Report blockers clearly
- Show reasoning for decisions

**Balance Speed with Quality:**
- Don't over-engineer
- Don't under-clarify critical ambiguities
- Build incrementally with validation loops

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

## Prerequisites

Before starting, ensure:
- Git repository initialized
- `.specify/` directory exists with templates
- Scripts executable (`chmod +x .specify/scripts/bash/*.sh`)

If missing, set up specification infrastructure first.

---

**Remember**: This is a guide, not a jail. Use your intelligence to build great features efficiently.
