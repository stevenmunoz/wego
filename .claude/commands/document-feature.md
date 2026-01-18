---
description: Document a completed feature in the docs/features/ folder following project conventions
---

Feature name or description to document:

$ARGUMENTS

## Overview

This command creates comprehensive documentation for completed features, maintaining a central knowledge base of all implemented functionality.

## Workflow

### 1. Identify the Feature

**If feature name provided:**
- Use it directly to find related code
- Search in `web/src/features/`, `web/src/pages/`, `web/functions/src/`

**If no arguments:**
- Ask user for the feature name
- Provide examples from the codebase:
  - InDriver Import
  - Vehicle Finances
  - External Rides
  - Reporting Dashboard
  - AI Insights
  - User Management
  - Finance Categories
  - Notifications
  - Authentication
  - Cloud Functions

### 2. Gather Feature Information

**Explore the codebase to understand the feature:**

```bash
# Find related files
grep -r "<feature-name>" web/src/ --include="*.ts" --include="*.tsx" | head -20

# Find related pages
ls web/src/pages/*.tsx

# Find related hooks
ls web/src/hooks/*.ts

# Check Firebase collections/services
ls web/src/core/firebase/*.ts

# Check Cloud Functions
ls web/functions/src/services/*.ts
ls web/functions/src/triggers/*.ts

# Check types
ls web/src/core/types/*.ts
```

**Identify key components:**
- Pages/routes
- Components
- Hooks
- Firebase services
- Cloud Functions
- Types/interfaces
- Constants/configuration

### 3. Create Documentation Structure

**Create the docs/features/ directory if it doesn't exist:**
```bash
mkdir -p docs/features
```

**Create the feature documentation file:**

File: `docs/features/<FEATURE_NAME>.md`

Use this template:

```markdown
# [Feature Name]

> Brief one-line description of what this feature does

## Overview

[2-3 paragraph description of the feature, its purpose, and who uses it]

**Key Capabilities:**
- Capability 1
- Capability 2
- Capability 3

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    [FEATURE NAME] ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: [PageName].tsx                                       │
│  ├─ Components: [component list]                               │
│  ├─ Hooks: [hook list]                                         │
│  └─ Types: [types file]                                        │
│                                                                 │
│  Firebase/Firestore                                             │
│  ├─ Collection: [collection_name]                              │
│  └─ Service: [firebase-service].ts                             │
│                                                                 │
│  Cloud Functions (if applicable)                                │
│  ├─ Trigger: [trigger-file].ts                                 │
│  └─ Service: [service-file].ts                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As a [user type]**, I can [action] so that [benefit]
2. ...

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/[Page].tsx` | Main page component |
| `web/src/features/[feature]/...` | Feature components |
| `web/src/core/firebase/[service].ts` | Firebase operations |
| `web/src/hooks/[hook].ts` | Custom hooks |

### Cloud Functions (if applicable)

| File | Purpose |
|------|---------|
| `web/functions/src/triggers/[trigger].ts` | Event triggers |
| `web/functions/src/services/[service].ts` | Business logic |

## Data Model

### Firestore Collection: `[collection_name]`

```typescript
interface [EntityName] {
  id: string;
  // ... fields
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## Common Issues and Solutions

### Issue: [Problem Description]

**Symptoms:** What the user observes

**Root Cause:** Why this happens

**Solution:**
```bash
# Commands or code to fix
```

## Related Documentation

- [Link to related docs](./RELATED_DOC.md)

---

**Last Updated**: [Current Date]
```

### 4. Update Feature Index

**Update `docs/features/README.md`:**

Add the new feature to the index table:

```markdown
| [Feature Name](./FEATURE_NAME.md) | Brief description | Complete |
```

### 5. Cross-Reference

**Check if documentation should be referenced in:**

1. **CLAUDE.md** - If the feature introduces:
   - New data models
   - New conventions
   - Critical configuration

2. **Agent files** - If the feature involves:
   - New Cloud Functions patterns
   - New Firestore patterns
   - New component patterns

### 6. Generate Documentation

**After gathering all information, create the documentation file with:**

1. Real file paths from the codebase exploration
2. Actual data models from TypeScript types
3. Actual Firebase collections and indexes
4. Common issues discovered during development
5. Cloud Functions if applicable

## Documentation Standards

### Naming Convention
- Use `SCREAMING_SNAKE_CASE.md` for files
- Examples: `INDRIVER_IMPORT.md`, `VEHICLE_FINANCES.md`, `EXTERNAL_RIDES.md`

### Required Sections
1. Overview (with Key Capabilities list)
2. Architecture (with ASCII diagram)
3. User Stories
4. Key Files (with actual paths)
5. Data Model
6. Common Issues and Solutions
7. Last Updated date

### Optional Sections (include if applicable)
- API Endpoints (for Cloud Functions)
- Configuration
- Usage Examples
- Testing
- Security Rules

### Quality Checklist
- [ ] All file paths are accurate
- [ ] Data models match actual TypeScript types
- [ ] Cloud Functions documented if present
- [ ] Common issues from development are included
- [ ] No sensitive data (API keys, secrets) included
- [ ] ASCII diagrams are readable and accurate

## Examples

**Document the InDriver Import feature:**
```
/document-feature InDriver Import
```

**Document Vehicle Finances:**
```
/document-feature Vehicle Finances
```

**Document with exploration:**
```
/document-feature
```
(Will prompt for feature selection)

## Output

After running this command, you will have:
1. New file: `docs/features/<FEATURE_NAME>.md`
2. Updated: `docs/features/README.md` with new entry
3. Cross-references updated where applicable

## Reference

**Gold standard example:** `docs/features/INDRIVER_IMPORT.md`

Use this file as a reference for structure and detail level.

## Notes

- Focus on accuracy over completeness - better to document what's known well
- Include real code examples from the codebase
- Document common issues encountered during development
- Keep the documentation maintainable - avoid over-documentation
- Use the feature's actual implementation as the source of truth
