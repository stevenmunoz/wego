# How to Run This Project

## Quick Start (Docker - Recommended)

### 1. Initial Setup

```bash
# Navigate to project directory
cd scalable-app-template

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp mobile/.env.example mobile/.env
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```bash
# Required - Generate secure keys
SECRET_KEY=your-super-secret-key-here-change-this
JWT_SECRET=your-jwt-secret-key-here-change-this

# Firebase (Docker will handle emulator automatically)
FIREBASE_PROJECT_ID=demo-project
USE_FIREBASE_EMULATOR=true
FIREBASE_EMULATOR_HOST=localhost
FIREBASE_EMULATOR_PORT=8080

# Optional - For AI/Agent features
OPENAI_API_KEY=sk-your-openai-key-here  # Get from https://platform.openai.com
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo-preview
```

Edit `web/.env`:

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Enterprise App
```

### 3. Start All Services

```bash
# Start everything with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

This will start:
- ✅ Firebase Emulator for Firestore (port 8080)
- ✅ Firebase Emulator UI (port 4000)
- ✅ Redis (port 6379)
- ✅ Backend API (port 8000)

### 4. Access the Application

- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health
- **Firebase Emulator UI:** http://localhost:4000 (view and manage data)

### 5. Run Web App Separately

The web app needs to run separately:

```bash
# Open a new terminal
cd web
npm install
npm run dev
```

Access at: http://localhost:3000

### 6. Create Your First User

**Option A: Using API Documentation**

1. Go to http://localhost:8000/docs
2. Find `POST /api/v1/users/`
3. Click "Try it out"
4. Enter:
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "full_name": "Admin User",
  "role": "user"
}
```
5. Click "Execute"

**Option B: Using curl**

```bash
curl -X POST http://localhost:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "full_name": "Admin User"
  }'
```

### 7. Login

Now login with your credentials:

1. Go to http://localhost:3000/login
2. Enter email: `admin@example.com`
3. Enter password: `password123`
4. Click "Login"

---

## Option 2: Local Development (Without Docker)

### Backend Setup

```bash
# Navigate to backend
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
```

### Setup PostgreSQL Locally

**Option A: Install PostgreSQL**

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo service postgresql start

# Create database
createdb app_db
```

**Option B: Use Docker for Database Only**

```bash
docker run -d \
  --name enterprise-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### Configure Backend Environment

Edit `backend/.env`:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_db
DATABASE_URL_SYNC=postgresql://postgres:postgres@localhost:5432/app_db
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379/0
```

### Run Database Migrations

```bash
cd backend

# Run migrations
alembic upgrade head
```

### Start Backend

```bash
cd backend

# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Web App Setup

```bash
# Open new terminal
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

### Mobile App Setup (Optional)

```bash
# Open new terminal
cd mobile

# Install dependencies
npm install

# Start Expo
npm start

# Then:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on your phone
```

---

## Testing the Setup

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. Check API Documentation

Visit: http://localhost:8000/docs

You should see interactive Swagger UI.

### 3. Check Web App

Visit: http://localhost:3000

You should see the home page.

### 4. Test Authentication Flow

1. Go to http://localhost:3000/register
2. Create an account
3. Login
4. You should see the dashboard

### 5. Test AI Chat (Optional)

If you configured OpenAI API key:

1. Login to the web app
2. Go to http://localhost:3000/chat
3. Send a message
4. You should get an AI response

---

## Running Tests

### Backend Tests

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html  # macOS
# or
xdg-open htmlcov/index.html  # Linux
```

### Web Tests

```bash
cd web

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## Common Issues & Solutions

### Issue: Port 8000 already in use

**Solution:**
```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn src.main:app --reload --port 8001
```

### Issue: Database connection error

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Or check local PostgreSQL
psql -h localhost -U postgres -d app_db

# Restart database
docker-compose restart db
```

### Issue: Module not found (Python)

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Node modules error

**Solution:**
```bash
cd web

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Alembic migration error

**Solution:**
```bash
cd backend

# Reset database (CAUTION: Deletes all data)
docker-compose down -v
docker-compose up -d db

# Wait for database to start
sleep 5

# Run migrations
alembic upgrade head
```

### Issue: CORS errors in browser

**Solution:**

Check `backend/.env` has correct CORS settings:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Issue: OpenAI API key error

**Solution:**

1. Get API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```
3. Restart backend

---

## Stopping the Application

### Docker

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (deletes database data)
docker-compose -f docker-compose.dev.yml down -v
```

### Local Development

```bash
# Stop backend: Press Ctrl+C in terminal

# Stop web: Press Ctrl+C in terminal

# Deactivate Python virtual environment
deactivate
```

---

## Development Workflow

### 1. Start Your Day

```bash
# Pull latest changes
git pull

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Start web app
cd web && npm run dev
```

### 2. Make Changes

- Edit code in your IDE
- Backend auto-reloads with uvicorn
- Web app auto-reloads with Vite

### 3. Run Tests

```bash
# Before committing
cd backend && pytest
cd web && npm test
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: your feature description"
```

Pre-commit hooks will automatically:
- Format code
- Run linters
- Check types

### 5. End Your Day

```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# Or keep running in background
```

---

## Next Steps

Once running:

1. ✅ Explore the API at http://localhost:8000/docs
2. ✅ Read [Clean Architecture](docs/architecture/CLEAN_ARCHITECTURE.md)
3. ✅ Try the [Chat Feature](docs/agentic/QUICK_START_AGENTS.md)
4. ✅ Build your first feature following [Getting Started](GETTING_STARTED.md)
5. ✅ Check [Development Setup](docs/setup/DEVELOPMENT_SETUP.md) for advanced topics

---

## Quick Reference

### URLs
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Web App: http://localhost:3000
- Database: localhost:5432
- Redis: localhost:6379

### Default Credentials
Create your own via registration or API

### Commands
```bash
# Start everything
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Run migrations
cd backend && alembic upgrade head

# Create migration
cd backend && alembic revision --autogenerate -m "description"

# Backend tests
cd backend && pytest

# Web tests
cd web && npm test

# Format code
cd backend && black src tests
cd web && npm run format
```

Happy coding! 🚀
