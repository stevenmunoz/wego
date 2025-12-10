# Development Setup Guide

This guide will help you set up the development environment for the Enterprise App Template.

## Prerequisites

- **Docker & Docker Compose:** For containerized development
- **Python 3.11+:** For backend development
- **Node.js 18+:** For web and mobile development
- **Git:** For version control

## Quick Start with Docker

The easiest way to run the entire stack:

```bash
# Clone the repository
git clone <repository-url>
cd scalable-app-template

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env

# Start all services
docker-compose -f docker-compose.dev.yml up
```

Services will be available at:
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Local Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Web App Setup

```bash
cd web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The web app will be available at http://localhost:3000

### Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Expo development server
npm start

# Then:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on your phone
```

## Database Setup

### Using Docker (Recommended)

```bash
docker-compose -f docker-compose.dev.yml up db redis
```

### Local PostgreSQL

```bash
# Create database
createdb app_db

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql+asyncpg://localhost:5432/app_db
DATABASE_URL_SYNC=postgresql://localhost:5432/app_db

# Run migrations
cd backend
alembic upgrade head
```

## Creating Database Migrations

```bash
cd backend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Review the generated migration file in alembic/versions/

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_user_entity.py

# Run tests in parallel
pytest -n auto
```

### Web Tests

```bash
cd web

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Code Quality Tools

### Backend

```bash
cd backend

# Format code
black src tests
isort src tests

# Lint code
ruff check src tests

# Type checking
mypy src
```

### Web

```bash
cd web

# Format code
npm run format

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## Pre-commit Hooks

```bash
# Install pre-commit hooks
npm install
npm run prepare

# Hooks will run automatically on commit
git add .
git commit -m "Your commit message"

# Manually run hooks
npx lint-staged
```

## Debugging

### Backend Debugging

Add breakpoints in your Python code:

```python
import pdb; pdb.set_trace()
```

Or use your IDE's debugger (VS Code, PyCharm, etc.)

### Frontend Debugging

- Use browser DevTools
- React DevTools extension
- Redux DevTools (if using Redux)

### API Testing

Use the interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Or use tools like:
- Postman
- Insomnia
- curl

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_db
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
ENVIRONMENT=development
DEBUG=true
```

### Web (.env)

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Enterprise App
```

### Mobile (.env)

```bash
API_URL=http://localhost:8000/api/v1
APP_NAME=Enterprise App
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn src.main:app --reload --port 8001
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U postgres -d app_db

# Reset database
docker-compose down -v
docker-compose up db
```

### Python Dependencies Issues

```bash
# Clear pip cache
pip cache purge

# Reinstall dependencies
pip install --no-cache-dir -r requirements.txt

# Upgrade pip
python -m pip install --upgrade pip
```

### Node Modules Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read [Clean Architecture](../architecture/CLEAN_ARCHITECTURE.md) documentation
- Review [API Documentation](http://localhost:8000/docs)
- Check [Deployment Guide](../deployment/DEPLOYMENT.md)
