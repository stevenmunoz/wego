#!/bin/bash
# Development environment startup script
# Starts backend, web, and Firebase emulator

set -e

echo "🚀 Starting Development Environment..."
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if .env file exists
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found!"
    echo "   Run ./setup.sh first or copy backend/.env.example to backend/.env"
    exit 1
fi

# Check API keys are configured
if ! grep -q "OPENAI_API_KEY=sk-" backend/.env 2>/dev/null && \
   ! grep -q "ANTHROPIC_API_KEY=sk-ant-" backend/.env 2>/dev/null; then
    echo "⚠️  No API key found in backend/.env"
    echo "   Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to backend/.env"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    jobs -p | xargs -r kill 2>/dev/null || true
    exit
}

trap cleanup INT TERM

# Start Backend
echo "📦 Starting Backend API..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    uvicorn src.main:app --reload --port 8000 > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started on http://localhost:8000 (PID: $BACKEND_PID)"
    echo "   Logs: logs/backend.log"
else
    echo "⚠️  Virtual environment not found. Run ./setup.sh first"
    exit 1
fi
cd ..

# Start Web
echo ""
echo "🌐 Starting Web Frontend..."
cd web
if [ -d "node_modules" ]; then
    npm run dev > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo "✅ Web started on http://localhost:3000 (PID: $WEB_PID)"
    echo "   Logs: logs/web.log"
else
    echo "⚠️  node_modules not found. Run ./setup.sh first"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
cd ..

# Start Firebase Emulator (optional)
echo ""
if command -v firebase &> /dev/null; then
    echo "🔥 Starting Firebase Emulator..."
    firebase emulators:start --only firestore,auth > logs/firebase.log 2>&1 &
    FIREBASE_PID=$!
    echo "✅ Firebase Emulator started on http://localhost:4000 (PID: $FIREBASE_PID)"
    echo "   Logs: logs/firebase.log"
else
    echo "⚠️  Firebase CLI not installed (optional)"
    echo "   Install: npm install -g firebase-tools"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Development environment is running!"
echo ""
echo "📍 Services:"
echo "   • Backend API: http://localhost:8000"
echo "   • API Docs:    http://localhost:8000/docs"
echo "   • Web App:     http://localhost:3000"
if command -v firebase &> /dev/null; then
    echo "   • Firebase UI: http://localhost:4000"
fi
echo ""
echo "📝 Logs:"
echo "   • Backend: tail -f logs/backend.log"
echo "   • Web:     tail -f logs/web.log"
if command -v firebase &> /dev/null; then
    echo "   • Firebase: tail -f logs/firebase.log"
fi
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for all background processes
wait
