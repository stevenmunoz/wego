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
- Search in `web/src/features/`, `web/src/pages/`, `backend/src/`

**If no arguments:**
- Ask user for the feature name
- Provide examples from the codebase:
  - InDriver Import
  - Vehicle Finances
  - External Rides
  - Reporting Dashboard
  - Chat/Conversations
  - User Management
  - Finance Categories

### 2. Gather Feature Information

**Explore the codebase to understand the feature:**

```bash
# Find related files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) | xargs grep -l "<feature-name>" | head -20

# Check for existing specs
ls docs/specs/<feature-slug>/ 2>/dev/null

# Find related pages
grep -r "<FeatureName>" web/src/pages/ --include="*.tsx"

# Find related hooks
ls web/src/features/<feature-name>/hooks/ 2>/dev/null

# Check Firebase collections
grep -r "collection.*<feature>" web/src/core/firebase/ --include="*.ts"
```

**Identify key components:**
- Pages/routes
- Components
- Hooks
- Firebase services
- Backend endpoints
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
│  Backend (Python/FastAPI) [if applicable]                       │
│  ├─ Endpoint: /api/v1/[endpoint]                               │
│  └─ Service: [service-file].py                                 │
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

### Backend (if applicable)

| File | Purpose |
|------|---------|
| `backend/src/presentation/api/v1/endpoints/[endpoint].py` | API endpoints |
| `backend/src/application/[service].py` | Business logic |

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

### Firestore Indexes Required

```json
{
  "collectionGroup": "[collection_name]",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "[field1]", "order": "ASCENDING" },
    { "fieldPath": "[field2]", "order": "DESCENDING" }
  ]
}
```

## API Endpoints (if applicable)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/[resource]` | Get all [resources] |
| POST | `/api/v1/[resource]` | Create new [resource] |
| PUT | `/api/v1/[resource]/{id}` | Update [resource] |
| DELETE | `/api/v1/[resource]/{id}` | Delete [resource] |

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_[VAR]` | Description | Yes/No |

### Firebase Security Rules

```javascript
match /[collection]/{docId} {
  allow read: if [condition];
  allow write: if [condition];
}
```

## Usage Examples

### Basic Usage

```typescript
// Example code showing how to use the feature
```

### Advanced Usage

```typescript
// More complex example
```

## Common Issues and Solutions

### Issue: [Problem Description]

**Symptoms:** What the user observes

**Root Cause:** Why this happens

**Solution:**
```bash
# Commands or code to fix
```

## Testing

### Unit Tests
- `tests/unit/[feature]/...`

### Integration Tests
- `tests/integration/[feature]/...`

### Manual Testing Checklist
- [ ] Test case 1
- [ ] Test case 2

## Related Documentation

- [Link to related docs](./RELATED_DOC.md)
- [External reference](https://external-link.com)

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | YYYY-MM-DD | Initial implementation |

---

**Last Updated**: [Current Date]
```

### 4. Update Feature Index

**Create or update `docs/features/README.md`:**

```markdown
# Feature Documentation

This directory contains documentation for all implemented features in the WeGo platform.

## Features Index

| Feature | Description | Status |
|---------|-------------|--------|
| [Feature Name](./FEATURE_NAME.md) | Brief description | ✅ Complete |

## Quick Links

- [InDriver Import](./INDRIVER_IMPORT.md) - OCR extraction from InDriver screenshots
- [Vehicle Finances](./VEHICLE_FINANCES.md) - Income/expense tracking for vehicles
- [External Rides](./EXTERNAL_RIDES.md) - Manual ride entry wizard
- [Reporting Dashboard](./REPORTING.md) - Analytics and goal tracking
- ...

## Adding New Documentation

Use the `/document-feature` command to create documentation for new features.
```

### 5. Cross-Reference

**Check if documentation should be referenced in:**

1. **CLAUDE.md** - If the feature introduces:
   - New data models
   - New conventions
   - Critical configuration

2. **README.md** (root) - If the feature is user-facing

### 6. Generate Documentation

**After gathering all information, create the documentation file with:**

1. Real file paths from the codebase exploration
2. Actual data models from TypeScript types
3. Real API endpoints from backend routes
4. Actual Firebase collections and indexes
5. Common issues discovered during development

## Documentation Standards

### Naming Convention
- Use `SCREAMING_SNAKE_CASE.md` for files
- Examples: `INDRIVER_IMPORT.md`, `VEHICLE_FINANCES.md`, `EXTERNAL_RIDES.md`

### Required Sections
1. Overview
2. Architecture (with ASCII diagram)
3. Key Files
4. Data Model
5. Common Issues and Solutions
6. Last Updated date

### Optional Sections (include if applicable)
- API Endpoints
- Configuration
- Usage Examples
- Testing
- Changelog

### Quality Checklist
- [ ] All file paths are accurate
- [ ] Data models match actual TypeScript types
- [ ] API endpoints are documented correctly
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

## Notes

- Focus on accuracy over completeness - better to document what's known well
- Include real code examples from the codebase
- Document common issues encountered during development
- Keep the documentation maintainable - avoid over-documentation
- Use the feature's actual implementation as the source of truth
