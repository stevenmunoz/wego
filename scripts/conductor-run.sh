#!/bin/bash

# WeGo App - Conductor Run Script
# Starts Backend (FastAPI), Web (React), and Firebase Emulator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[CONDUCTOR-RUN]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[CONDUCTOR-RUN]${NC} $1"
}

print_error() {
    echo -e "${RED}[CONDUCTOR-RUN]${NC} $1"
}

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Function to find available port
find_available_port() {
    local base_port=$1
    local port=$base_port

    while is_port_in_use $port; do
        port=$((port + 1))
        if [[ $port -gt $((base_port + 100)) ]]; then
            print_error "Could not find available port near $base_port"
            exit 1
        fi
    done

    echo $port
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2

    if is_port_in_use $port; then
        print_warning "Port $port is in use. Attempting to free it..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1

        if is_port_in_use $port; then
            print_warning "Could not free port $port. Will find alternative for $service_name."
            return 1
        else
            print_status "✓ Port $port freed"
            return 0
        fi
    fi
    return 0
}

# Verify workspace setup
if [[ ! -f ".conductor-workspace" ]]; then
    print_error "Workspace not set up. Please run setup first."
    exit 1
fi

# Store PIDs for cleanup
BACKEND_PID=""
WEB_PID=""
FIREBASE_PID=""

# Cleanup function
cleanup() {
    print_warning "Shutting down services..."

    # Kill backend
    if [[ -n "$BACKEND_PID" ]]; then
        print_status "Stopping backend (PID: $BACKEND_PID)..."
        kill -TERM $BACKEND_PID 2>/dev/null || true
        sleep 2
        kill -0 $BACKEND_PID 2>/dev/null && kill -KILL $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
        print_status "✓ Backend stopped"
    fi

    # Kill web
    if [[ -n "$WEB_PID" ]]; then
        print_status "Stopping web (PID: $WEB_PID)..."
        kill -TERM $WEB_PID 2>/dev/null || true
        sleep 2
        kill -0 $WEB_PID 2>/dev/null && kill -KILL $WEB_PID 2>/dev/null || true
        wait $WEB_PID 2>/dev/null || true
        print_status "✓ Web stopped"
    fi

    # Kill Firebase emulator
    if [[ -n "$FIREBASE_PID" ]]; then
        print_status "Stopping Firebase emulator (PID: $FIREBASE_PID)..."
        kill -TERM $FIREBASE_PID 2>/dev/null || true
        sleep 2
        kill -0 $FIREBASE_PID 2>/dev/null && kill -KILL $FIREBASE_PID 2>/dev/null || true
        wait $FIREBASE_PID 2>/dev/null || true
        print_status "✓ Firebase emulator stopped"
    fi

    # Clean up any remaining processes on ports
    [[ -n "$BACKEND_PORT" ]] && lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    [[ -n "$WEB_PORT" ]] && lsof -ti:$WEB_PORT | xargs kill -9 2>/dev/null || true
    [[ -n "$FIREBASE_PORT" ]] && lsof -ti:$FIREBASE_PORT | xargs kill -9 2>/dev/null || true

    print_status "All services stopped gracefully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "🚀 Starting WeGo development environment..."
print_status "Workspace: $CONDUCTOR_WORKSPACE_NAME"
echo

# Calculate workspace-specific ports (avoid conflicts between workspaces)
WORKSPACE_HASH=$(echo "$CONDUCTOR_WORKSPACE_NAME" | cksum | cut -d' ' -f1)
BACKEND_BASE_PORT=$((8000 + WORKSPACE_HASH % 1000))
WEB_BASE_PORT=$((3000 + WORKSPACE_HASH % 1000))
FIREBASE_BASE_PORT=$((4000 + WORKSPACE_HASH % 1000))

print_status "Desired ports - Backend: $BACKEND_BASE_PORT, Web: $WEB_BASE_PORT, Firebase: $FIREBASE_BASE_PORT"

# Clean up any existing processes
print_status "Cleaning up any existing dev servers..."
pkill -f "uvicorn.*src.main:app" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "firebase emulators" 2>/dev/null || true
sleep 2

# ============================================================================
# START BACKEND SERVER
# ============================================================================

# Determine actual backend port
if ! kill_port_processes $BACKEND_BASE_PORT "backend"; then
    BACKEND_PORT=$(find_available_port $BACKEND_BASE_PORT)
    print_status "Using alternative backend port: $BACKEND_PORT"
else
    BACKEND_PORT=$BACKEND_BASE_PORT
fi

print_status "Starting FastAPI backend on port $BACKEND_PORT..."
cd backend

# Verify virtual environment
if [[ ! -d "venv" ]]; then
    print_error "Virtual environment not found. Run setup first."
    exit 1
fi

source venv/bin/activate

# Start uvicorn
if uvicorn src.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT > /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log 2>&1 &
then
    BACKEND_PID=$!
    print_status "✓ Backend process started (PID: $BACKEND_PID)"
else
    print_error "Failed to start backend"
    exit 1
fi

cd ..

# Wait for backend to be ready
print_status "Waiting for backend to initialize..."
for i in {1..15}; do
    if kill -0 $BACKEND_PID 2>/dev/null && curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        print_status "✅ Backend ready at http://localhost:$BACKEND_PORT"
        break
    elif ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend died. Check: /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log"
        cat /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log
        exit 1
    fi
    sleep 1
done

if ! curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
    print_warning "Backend may not be fully ready, but process is running"
fi

# ============================================================================
# START FIREBASE EMULATOR (OPTIONAL)
# ============================================================================

if command -v firebase &> /dev/null; then
    # Determine actual Firebase port
    if ! kill_port_processes $FIREBASE_BASE_PORT "firebase"; then
        FIREBASE_PORT=$(find_available_port $FIREBASE_BASE_PORT)
        print_status "Using alternative Firebase port: $FIREBASE_PORT"
    else
        FIREBASE_PORT=$FIREBASE_BASE_PORT
    fi

    print_status "Starting Firebase emulator on port $FIREBASE_PORT..."

    if firebase emulators:start --only firestore,auth > /tmp/conductor-firebase-$CONDUCTOR_WORKSPACE_NAME.log 2>&1 &
    then
        FIREBASE_PID=$!
        print_status "✓ Firebase emulator started (PID: $FIREBASE_PID)"
        print_status "Firebase UI will be available at http://localhost:$FIREBASE_PORT"
    else
        print_warning "Firebase emulator failed to start (optional)"
    fi
else
    print_warning "⚠️  Firebase CLI not installed (optional)"
    print_warning "   Install: npm install -g firebase-tools"
fi

# ============================================================================
# START WEB FRONTEND
# ============================================================================

# Determine actual web port
if ! kill_port_processes $WEB_BASE_PORT "web"; then
    WEB_PORT=$(find_available_port $WEB_BASE_PORT)
    print_status "Using alternative web port: $WEB_PORT"
else
    WEB_PORT=$WEB_BASE_PORT
fi

print_status "Starting React web frontend on port $WEB_PORT..."
cd web

# Verify package.json
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Run setup first."
    exit 1
fi

# Set environment variables for frontend
export VITE_API_URL="http://localhost:$BACKEND_PORT/api/v1"
export VITE_API_BASE_URL="http://localhost:$BACKEND_PORT"
export VITE_APP_NAME="WeGo App"

# Start Vite dev server
if npm run dev -- --port $WEB_PORT --host 0.0.0.0 > /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log 2>&1 &
then
    WEB_PID=$!
    print_status "✓ Web process started (PID: $WEB_PID)"
else
    print_error "Failed to start web server"
    cleanup
    exit 1
fi

cd ..

# Wait for web to be ready
print_status "Waiting for web to initialize..."
for i in {1..20}; do
    if kill -0 $WEB_PID 2>/dev/null && curl -s http://localhost:$WEB_PORT >/dev/null 2>&1; then
        print_status "✅ Web ready at http://localhost:$WEB_PORT"
        break
    elif ! kill -0 $WEB_PID 2>/dev/null; then
        print_error "Web died. Check: /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log"
        cat /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log
        cleanup
        exit 1
    fi
    sleep 1
done

if ! curl -s http://localhost:$WEB_PORT >/dev/null 2>&1; then
    print_warning "Web may not be fully ready, but process is running"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo
print_status "🎉 WeGo is now running!"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "📱 Web App:          http://localhost:$WEB_PORT"
print_status "🔧 Backend API:      http://localhost:$BACKEND_PORT"
print_status "📖 API Docs:         http://localhost:$BACKEND_PORT/docs"
print_status "🔍 Health Check:     http://localhost:$BACKEND_PORT/health"
if [[ -n "$FIREBASE_PID" ]]; then
    print_status "🔥 Firebase UI:      http://localhost:$FIREBASE_PORT"
fi
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "🗂️  Workspace: $CONDUCTOR_WORKSPACE_NAME"
echo
print_status "💡 Debug logs:"
print_status "   Backend:  /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log"
print_status "   Web:      /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log"
if [[ -n "$FIREBASE_PID" ]]; then
    print_status "   Firebase: /tmp/conductor-firebase-$CONDUCTOR_WORKSPACE_NAME.log"
fi
echo
print_status "Services will stop when Conductor run is terminated"
print_status "Press Ctrl+C to stop all services"
echo

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend died unexpectedly!"
        print_error "Check logs: /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log"
        tail -50 /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log
        cleanup
        exit 1
    fi

    if ! kill -0 $WEB_PID 2>/dev/null; then
        print_error "Web died unexpectedly!"
        print_error "Check logs: /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log"
        tail -50 /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log
        cleanup
        exit 1
    fi

    if [[ -n "$FIREBASE_PID" ]] && ! kill -0 $FIREBASE_PID 2>/dev/null; then
        print_warning "Firebase emulator died (optional service)"
        FIREBASE_PID=""
    fi

    sleep 5
done
