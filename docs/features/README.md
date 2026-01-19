# Feature Documentation

This directory contains comprehensive documentation for all implemented features in the WeGo transportation management platform.

## Features Index

| Feature | Description | Status |
|---------|-------------|--------|
| [Ride Management](./RIDE_MANAGEMENT.md) | Dashboard for tracking and managing all rides | Complete |
| [Vehicle Management](./VEHICLE_MANAGEMENT.md) | Fleet vehicle tracking with documents | Complete |
| [Vehicle Finances](./VEHICLE_FINANCES.md) | Income/expense tracking and P/L analysis | Complete |
| [Reporting Dashboard](./REPORTING_DASHBOARD.md) | Analytics, charts, and goal tracking | Complete |
| [AI Insights](./AI_INSIGHTS.md) | Claude-powered weekly business summaries | Complete |
| [User Management](./USER_MANAGEMENT.md) | Admin user and driver management | Complete |
| [External Rides](./EXTERNAL_RIDES.md) | Public form for driver ride registration | Complete |
| [InDriver Import](./INDRIVER_IMPORT.md) | OCR extraction from InDriver receipts | Complete |
| [Finance Categories](./FINANCE_CATEGORIES.md) | Custom income/expense category management | Complete |
| [Notifications](./NOTIFICATIONS.md) | Real-time admin notification system | Complete |
| [Authentication](./AUTHENTICATION.md) | Firebase Auth with role-based access | Complete |
| [Cloud Functions](./CLOUD_FUNCTIONS.md) | Backend serverless architecture | Complete |

## Quick Links

### Core Operations
- [Ride Management](./RIDE_MANAGEMENT.md) - Main dashboard showing all rides with filtering
- [Vehicle Management](./VEHICLE_MANAGEMENT.md) - Manage fleet vehicles and documents
- [Vehicle Finances](./VEHICLE_FINANCES.md) - Track vehicle profitability (P/L)

### Admin Features (Admin Only)
- [Reporting Dashboard](./REPORTING_DASHBOARD.md) - Business analytics with goals
- [AI Insights](./AI_INSIGHTS.md) - AI-generated weekly business summaries
- [User Management](./USER_MANAGEMENT.md) - Manage users, drivers, and roles
- [Finance Categories](./FINANCE_CATEGORIES.md) - Customize income/expense categories

### Data Import
- [InDriver Import](./INDRIVER_IMPORT.md) - Import rides from InDriver screenshots/PDFs
- [External Rides](./EXTERNAL_RIDES.md) - Manual ride entry via public driver form

### Technical Infrastructure
- [Cloud Functions](./CLOUD_FUNCTIONS.md) - Backend serverless functions
- [Authentication](./AUTHENTICATION.md) - Firebase Auth and access control
- [Notifications](./NOTIFICATIONS.md) - Real-time notification system

## Feature Documentation Structure

Each feature document includes:

1. **Overview** - What the feature does and who uses it
2. **Architecture** - ASCII diagram showing components and data flow
3. **User Stories** - Who does what and why
4. **Key Files** - Important file paths for implementation
5. **Data Model** - TypeScript interfaces and Firestore collections
6. **Common Issues** - Known problems and solutions
7. **Last Updated** - When documentation was last revised

## Adding New Documentation

Use the `/document-feature` command to create documentation for new features:

```bash
/document-feature Vehicle Finances
```

This will analyze the codebase and generate a structured documentation file.

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - AI agent guidelines and conventions
- [Architecture](../architecture/CLEAN_ARCHITECTURE.md) - System architecture overview
- [Development Setup](../setup/DEVELOPMENT_SETUP.md) - Local development guide
- [Deployment](../deployment/DEPLOYMENT.md) - Deployment procedures
- [Testing Strategy](../TESTING_STRATEGY.md) - Testing patterns

---

**Last Updated**: January 2025
