# WeGo - Transportation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)

> **"Seguro para ti, comodo para tu mascota"**

WeGo is a transportation platform offering people transportation, pet transportation, senior citizens with special needs services, and premium customized services.

This is the **internal management platform** for ride tracking, driver management, commission administration, and business reports.

## Live Environments

| Environment | Frontend | Backend | API Docs |
|-------------|----------|---------|----------|
| **PROD** | [wego-bac88.web.app](https://wego-bac88.web.app) | [Cloud Run](https://wego-backend-prod-yewmcmksmq-uc.a.run.app) | [/docs](https://wego-backend-prod-yewmcmksmq-uc.a.run.app/docs) |
| **DEV** | [wego-dev-a5a13.web.app](https://wego-dev-a5a13.web.app) | [Cloud Run](https://wego-backend-dev-l5srt4ycxa-uc.a.run.app) | [/docs](https://wego-backend-dev-l5srt4ycxa-uc.a.run.app/docs) |

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: CSS Modules with design system tokens
- **State**: Zustand / React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Charts**: Recharts

### Backend
- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication + JWT
- **Validation**: Pydantic
- **OCR**: Tesseract (pytesseract)
- **PDF Processing**: pdf2image, pdfplumber
- **Deployment**: Google Cloud Run

### Infrastructure
- **Frontend Hosting**: Firebase Hosting
- **Backend Hosting**: Google Cloud Run
- **Database**: Firebase Firestore
- **CI/CD**: GitHub Actions
- **Secrets**: Google Secret Manager

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

### Local Development

```bash
# Frontend
cd web
npm install
npm run dev  # http://localhost:5173

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure your environment
uvicorn src.main:app --reload  # http://localhost:8000
```

### Environment Variables

Frontend (`web/.env.development`):
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:8000  # Local backend
```

Backend (`backend/.env`):
```bash
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
FIREBASE_PROJECT_ID=your-project-id
USE_FIREBASE_EMULATOR=true
ENVIRONMENT=development
```

## Project Structure

```
wego/
├── backend/                    # Python FastAPI backend
│   ├── src/
│   │   ├── domain/            # Business entities and interfaces
│   │   ├── application/       # Use cases and DTOs
│   │   ├── infrastructure/    # Firestore repositories
│   │   ├── presentation/      # API routes and controllers
│   │   └── core/              # Configuration and utilities
│   ├── Dockerfile             # Cloud Run deployment
│   └── requirements.txt
│
├── web/                       # React TypeScript web app
│   ├── src/
│   │   ├── features/          # Feature modules (indriver-import, auth, etc.)
│   │   ├── components/        # Shared components
│   │   │   └── VehicleFinances/  # Income/Expense forms
│   │   ├── core/              # API client, auth, config
│   │   │   ├── firebase/      # Firebase CRUD operations
│   │   │   └── types/         # TypeScript types (vehicle, vehicle-finance)
│   │   ├── hooks/             # Custom hooks (useVehicleFinances, etc.)
│   │   ├── routes/            # Routing configuration
│   │   └── pages/             # Page components
│   ├── firestore.rules        # Firestore security rules
│   ├── firestore.indexes.json # Firestore composite indexes
│   └── package.json
│
├── design-system/             # WeGo Design System
│   ├── tokens/                # CSS variables (colors, typography)
│   ├── components/            # Base component styles
│   └── BRAND_GUIDELINES.md
│
├── .github/workflows/         # CI/CD pipelines
│   ├── backend-ci.yml         # Backend lint/test
│   ├── web-ci.yml             # Frontend lint/test/build
│   ├── deploy-backend.yml     # Cloud Run deployment
│   └── deploy-web.yml         # Firebase Hosting deployment
│
├── CLAUDE.md                  # AI agent instructions
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

## Deployment

Deployments are automatic via GitHub Actions:

| Branch | Environment | Trigger |
|--------|-------------|---------|
| `develop` | DEV | Push to develop |
| `main` | PROD | PR merge to main |

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

## Features

### InDriver PDF Import
- Upload InDriver ride PDFs
- OCR extraction of ride data
- Data validation and preview
- Export to CSV/JSON
- Import to Firestore database

### Dashboard
- Real-time ride statistics
- Driver performance metrics
- Commission tracking
- Inline editing for driver, vehicle, and source fields
- Financial reports

### Vehicle Management
- Top-level vehicles collection with owner/driver associations
- Vehicle status tracking (active, inactive, sold)
- Document expiry tracking (SOAT, Tecnomecánica)
- Backward compatibility with legacy driver subcollection

### Vehicle Finance (P/L Tracking)
- **Income Tracking**: Weekly payments, tips, bonuses, and custom income types
- **Expense Tracking**: Fuel, maintenance, insurance, taxes, fines, parking, and more
- **Recurring Entries**: Support for weekly, biweekly, and monthly recurring transactions
- **P/L Summary**: Real-time profit/loss calculations with breakdowns by category
- **Multi-tenant**: Owner-based access control with admin override

### External Rides
- Public form for ride submissions (WhatsApp, phone, referral)
- Strict validation with Firestore security rules
- Multi-source ride tracking (InDriver, external, manual)

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - CI/CD and infrastructure setup
- [Brand Guidelines](design-system/BRAND_GUIDELINES.md) - Design system documentation
- [AI Instructions](CLAUDE.md) - Guidelines for AI-assisted development

## License

MIT

---

*Built with care for WeGo Transportation*
