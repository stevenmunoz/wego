# Development Setup Guide

This guide will help you set up the development environment for WeGo, a transportation management platform built with React + Firebase.

## Prerequisites

- **Node.js 20+**: For frontend and Cloud Functions development
- **npm or yarn**: Package manager
- **Firebase CLI**: For Firebase services and deployment
- **Git**: For version control

### Installing Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd wego

# Install web dependencies
cd web
npm install

# Set up environment variables (see Environment Variables section)
cp .env.example .env.development

# Start development server
npm run dev
```

The web app will be available at http://localhost:5173

## Project Structure

```
wego/
├── web/                      # React frontend + Cloud Functions
│   ├── src/                  # React application source
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components (routes)
│   │   ├── features/         # Feature-based modules
│   │   ├── hooks/            # Custom React hooks
│   │   ├── core/             # Core utilities and Firebase
│   │   │   ├── firebase/     # Firebase service functions
│   │   │   ├── types/        # TypeScript type definitions
│   │   │   └── analytics/    # Google Analytics integration
│   │   └── tests/            # Test files
│   ├── functions/            # Firebase Cloud Functions
│   │   └── src/
│   │       ├── services/     # Business logic services
│   │       ├── triggers/     # Firestore/Storage triggers
│   │       └── scheduled/    # Scheduled functions
│   ├── public/               # Static assets
│   └── package.json
├── design-system/            # WeGo design tokens and components
├── docs/                     # Project documentation
└── CLAUDE.md                 # AI agent instructions
```

## Environment Variables

### Web App (.env.development)

Create a `.env.development` file in the `web/` directory:

```bash
# Firebase Configuration (DEV project)
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=wego-dev-a5a13.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wego-dev-a5a13
VITE_FIREBASE_STORAGE_BUCKET=wego-dev-a5a13.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Analytics (optional)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Cloud Functions (.env)

Create a `.env` file in the `web/functions/` directory:

```bash
# OpenAI API Key (for InDriver OCR extraction)
OPENAI_API_KEY=your-openai-api-key

# Anthropic API Key (for AI Insights)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Firebase Project Setup

### Switching Projects

WeGo uses two Firebase projects:
- **DEV**: `wego-dev-a5a13` (for development and testing)
- **PROD**: `wego-bac88` (for production)

```bash
# List available projects
firebase projects:list

# Switch to dev project
firebase use dev

# Switch to prod project
firebase use prod

# Check current project
firebase use
```

### Firebase Emulators (Optional)

For local development without hitting real Firebase:

```bash
cd web

# Start emulators
firebase emulators:start

# Or start specific emulators
firebase emulators:start --only firestore,auth,functions
```

Emulators will be available at:
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Functions: http://localhost:5001
- Emulator UI: http://localhost:4000

## Cloud Functions Development

### Local Development

```bash
cd web/functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (rebuild on changes)
npm run build:watch
```

### Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:processInDriverDocument

# View function logs
firebase functions:log
```

### Testing Functions Locally

```bash
# Start functions emulator
cd web
firebase emulators:start --only functions

# Or use the shell for testing
firebase functions:shell
```

## Running Tests

### Web Tests

```bash
cd web

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/hooks/useAdminRides.test.ts
```

### Type Checking

```bash
cd web

# Check types
npm run type-check

# Or directly
npx tsc --noEmit
```

## Code Quality

### Linting

```bash
cd web

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Formatting

```bash
cd web

# Check formatting
npm run format:check

# Apply formatting
npm run format
```

## Building for Production

```bash
cd web

# Build web app
npm run build

# Preview production build locally
npm run preview
```

## Debugging

### Frontend Debugging

- Use browser DevTools (F12)
- React DevTools browser extension
- Redux DevTools (for Zustand state inspection)

### Firebase Debugging

```bash
# View real-time function logs
firebase functions:log --only processInDriverDocument

# View Firestore data
# Use Firebase Console: https://console.firebase.google.com

# Check authentication issues
# Firebase Console > Authentication > Users
```

### Network Debugging

For API calls to Cloud Functions, check:
1. Browser Network tab (F12 > Network)
2. Firebase Console > Functions > Logs
3. Google Cloud Console > Logging

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Firebase Permission Issues

```bash
# Re-authenticate
firebase logout
firebase login

# Check project permissions
firebase projects:list
```

### Node Modules Issues

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Cloud Functions Build Issues

```bash
cd web/functions

# Clean and rebuild
rm -rf lib/
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |
| `firebase deploy` | Deploy to Firebase |
| `firebase emulators:start` | Start local emulators |
| `firebase functions:log` | View function logs |

## Next Steps

- Read [Clean Architecture](../architecture/CLEAN_ARCHITECTURE.md) documentation
- Review [Feature Documentation](../features/README.md)
- Check [Deployment Guide](../deployment/DEPLOYMENT.md)
- Follow [CLAUDE.md](../../CLAUDE.md) conventions

---

**Last Updated**: January 2025
