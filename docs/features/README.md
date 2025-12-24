# Feature Documentation

This directory contains comprehensive documentation for all implemented features in the WeGo platform.

## Purpose

Feature documentation serves as a knowledge base that:
- Helps new developers understand how features work
- Documents architecture decisions and patterns
- Captures common issues and their solutions
- Provides quick reference for maintenance and debugging

## Features Index

| Feature | Description | Status | Last Updated |
|---------|-------------|--------|--------------|
| *No features documented yet* | Use `/document-feature` to add | - | - |

## Quick Start

To document a new feature, use the Claude Code slash command:

```bash
/document-feature <Feature Name>
```

Example:
```bash
/document-feature InDriver Import
```

## Documentation Structure

Each feature document follows this structure:

```
docs/features/
├── README.md                    # This index file
├── INDRIVER_IMPORT.md          # InDriver OCR extraction feature
├── VEHICLE_FINANCES.md         # Vehicle income/expense tracking
├── EXTERNAL_RIDES.md           # Manual ride entry wizard
├── REPORTING.md                # Analytics and goal tracking
└── ...
```

## Feature Categories

### Core Features
- **Dashboard** - Main analytics and overview
- **Reporting** - Goals, metrics, and analytics
- **User Management** - User CRUD and roles

### Ride Management
- **InDriver Import** - OCR extraction from screenshots
- **External Rides** - Manual ride entry

### Financial
- **Vehicle Finances** - P/L tracking for vehicles
- **Finance Categories** - Custom expense/income categories

### Communication
- **Chat** - AI-powered conversations
- **Notifications** - System notifications

## Adding New Documentation

When documenting a feature, include:

1. **Overview** - What the feature does and why
2. **Architecture** - ASCII diagram of component structure
3. **Key Files** - Important files with their purposes
4. **Data Model** - Firestore collections and TypeScript types
5. **Common Issues** - Problems encountered and solutions

## Quality Standards

- Use accurate file paths from the actual codebase
- Include real code examples
- Document known issues and workarounds
- Keep information up-to-date with code changes
- Never include sensitive data (API keys, secrets)

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - AI agent guidelines and conventions
- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) - Testing patterns
- [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md) - Security findings
- [DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - Deployment procedures

---

**Last Updated**: 2024-12-23
