# WeGo Deployment Guide

This document details the deployment architecture and setup for the WeGo platform.

## Live Environments

| Environment | Frontend | Backend | API Docs |
|-------------|----------|---------|----------|
| **PROD** | https://wego-bac88.web.app | https://wego-backend-prod-yewmcmksmq-uc.a.run.app | [/docs](https://wego-backend-prod-yewmcmksmq-uc.a.run.app/docs) |
| **DEV** | https://wego-dev-a5a13.web.app | https://wego-backend-dev-l5srt4ycxa-uc.a.run.app | [/docs](https://wego-backend-dev-l5srt4ycxa-uc.a.run.app/docs) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   GitHub Repository                                                         │
│   ├── push to develop ──► GitHub Actions ──► DEV Environment               │
│   └── push to main ─────► GitHub Actions ──► PROD Environment              │
│                                                                             │
│   DEV Environment                                                           │
│   ├── Frontend: Firebase Hosting (wego-dev-a5a13.web.app)                  │
│   ├── Backend:  Cloud Run (wego-backend-dev-l5srt4ycxa-uc.a.run.app)      │
│   └── Database: Firestore (wego-dev-a5a13)                                 │
│                                                                             │
│   PROD Environment                                                          │
│   ├── Frontend: Firebase Hosting (wego-bac88.web.app)                      │
│   ├── Backend:  Cloud Run (wego-backend-prod-yewmcmksmq-uc.a.run.app)     │
│   └── Database: Firestore (wego-bac88)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## GitHub Actions Workflows

### Frontend Deployment (`deploy-web.yml`)

- **Trigger**: Push to `main` or `develop` with changes in `web/**`
- **Target**: Firebase Hosting
- **Environment Detection**: Based on branch (develop → DEV, main → PROD)

### Backend Deployment (`deploy-backend.yml`)

- **Trigger**: Push to `main` or `develop` with changes in `backend/**`
- **Target**: Google Cloud Run
- **Environment Detection**: Based on branch (develop → DEV, main → PROD)

## Initial Setup

### 1. Firebase Projects

You need two Firebase projects:
- **DEV**: `wego-dev-a5a13`
- **PROD**: `wego-bac88`

For each project:
1. Enable Firebase Authentication
2. Enable Firestore Database
3. Enable Firebase Hosting
4. Generate a service account key (Project Settings → Service Accounts → Generate New Private Key)

### 2. Google Cloud Setup (for Backend)

For each GCP project (same as Firebase projects):

#### Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### Create Artifact Registry Repository
```bash
# For DEV project
gcloud config set project wego-dev-a5a13
gcloud artifacts repositories create wego \
  --repository-format=docker \
  --location=us-central1 \
  --description="WeGo Docker images"

# For PROD project
gcloud config set project wego-bac88
gcloud artifacts repositories create wego \
  --repository-format=docker \
  --location=us-central1 \
  --description="WeGo Docker images"
```

#### Create Cloud Run Service Account
```bash
# Create service account for CI/CD
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Generate key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com
```

#### Create Secret Manager Secrets
```bash
# Create secrets for backend environment variables
echo -n "your-secret-key" | gcloud secrets create SECRET_KEY --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding SECRET_KEY \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. GitHub Repository Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Frontend Secrets (Firebase)
| Secret | Value |
|--------|-------|
| `DEV_FIREBASE_API_KEY` | From Firebase Console → Project Settings |
| `DEV_FIREBASE_AUTH_DOMAIN` | `wego-dev-a5a13.firebaseapp.com` |
| `DEV_FIREBASE_PROJECT_ID` | `wego-dev-a5a13` |
| `DEV_FIREBASE_STORAGE_BUCKET` | `wego-dev-a5a13.firebasestorage.app` |
| `DEV_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `DEV_FIREBASE_APP_ID` | From Firebase Console |
| `PROD_FIREBASE_API_KEY` | Same as above for prod project |
| `PROD_FIREBASE_AUTH_DOMAIN` | `wego-bac88.firebaseapp.com` |
| `PROD_FIREBASE_PROJECT_ID` | `wego-bac88` |
| `PROD_FIREBASE_STORAGE_BUCKET` | `wego-bac88.firebasestorage.app` |
| `PROD_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `PROD_FIREBASE_APP_ID` | From Firebase Console |
| `FIREBASE_SERVICE_ACCOUNT_DEV` | Full JSON content of service account key |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Full JSON content of service account key |

#### Backend Secrets (Cloud Run)
| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID_DEV` | `wego-dev-a5a13` |
| `GCP_PROJECT_ID_PROD` | `wego-bac88` |
| `GCP_SA_KEY_DEV` | Full JSON content of GitHub Actions service account key |
| `GCP_SA_KEY_PROD` | Full JSON content of GitHub Actions service account key |
| `DEV_API_URL` | Cloud Run URL (set after first backend deploy) |
| `PROD_API_URL` | Cloud Run URL (set after first backend deploy) |

## Deployment Flow

### Automatic Deployments

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Feature Branch  │────►│ develop branch   │────►│   main branch   │
│                 │ PR  │                  │ PR  │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐          ┌──────────────┐
                        │ DEV Deploy   │          │ PROD Deploy  │
                        │ - Frontend   │          │ - Frontend   │
                        │ - Backend    │          │ - Backend    │
                        └──────────────┘          └──────────────┘
```

1. Create feature branch from `develop`
2. Push changes and create PR to `develop`
3. Merge → Triggers DEV deployment
4. Test on DEV environment
5. Create PR from `develop` to `main`
6. Merge → Triggers PROD deployment

### First-Time Backend Deployment

After the first backend deployment to Cloud Run:

1. Get the Cloud Run URL from the GitHub Actions output
2. Add it as a GitHub Secret (`DEV_API_URL` or `PROD_API_URL`)
3. Re-deploy the frontend to inject the API URL

## Environment Variables

### Frontend (`web/`)

Vite uses `VITE_` prefix for environment variables. These are injected at build time.

```bash
# Injected by CI/CD from GitHub Secrets
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_URL  # Cloud Run backend URL
```

### Backend (`backend/`)

```bash
# Injected by Cloud Run deployment
ENVIRONMENT=development|production
PROJECT_NAME=WeGo Backend
FIREBASE_PROJECT_ID=wego-dev-a5a13|wego-bac88
USE_FIREBASE_EMULATOR=false

# From Secret Manager
SECRET_KEY
JWT_SECRET
OPENAI_API_KEY
```

## Cloud Run Configuration

The backend is deployed with these settings:

| Setting | Value |
|---------|-------|
| Memory | 1Gi |
| CPU | 1 |
| Min Instances | 0 (scale to zero) |
| Max Instances | 10 |
| Concurrency | 80 requests/instance |
| Timeout | 300 seconds |

## CORS Configuration

The backend CORS is configured in `backend/src/core/config.py`:

```python
CORS_ORIGINS: List[str] = [
    # Local development
    "http://localhost:3000",
    "http://localhost:5173",
    # Firebase Hosting - DEV
    "https://wego-dev-a5a13.web.app",
    "https://wego-dev-a5a13.firebaseapp.com",
    # Firebase Hosting - PROD
    "https://wego-bac88.web.app",
    "https://wego-bac88.firebaseapp.com",
]
```

## Troubleshooting

### Frontend shows "backend not configured" warning

1. Ensure `DEV_API_URL` or `PROD_API_URL` secret is set in GitHub
2. Re-deploy the frontend to pick up the new environment variable

### Cloud Run deployment fails

1. Check that Artifact Registry repository exists
2. Verify service account has all required permissions
3. Check Secret Manager secrets are created and accessible

### CORS errors in browser

1. Verify the frontend origin is in `CORS_ORIGINS` in backend config
2. Check that the backend is receiving the correct `Origin` header

### Build fails with OCR/PDF errors

The Docker image includes:
- `tesseract-ocr` and `tesseract-ocr-spa` for OCR
- `poppler-utils` for PDF processing

Ensure these are not removed from the Dockerfile.

## Local Development

```bash
# Frontend
cd web
cp .env.example .env.development  # Use dev Firebase config
npm run dev

# Backend
cd backend
cp .env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

## Monitoring

- **Frontend**: Firebase Console → Hosting
- **Backend**: Google Cloud Console → Cloud Run
- **Logs**: Google Cloud Console → Cloud Logging
- **Errors**: Sentry (if configured with `SENTRY_DSN`)

---

*Last updated: December 2024*
