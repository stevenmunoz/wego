#!/bin/bash

# WeGo App - Conductor Run Script (Serverless Architecture)
# Starts Web (React) and optionally Firebase Emulators
# Backend is now serverless (Cloud Functions)

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
WEB_PID=""
FIREBASE_PID=""
FUNCTIONS_PID=""

# Cleanup function
cleanup() {
    print_warning "Shutting down services..."

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

    # Kill Functions emulator
    if [[ -n "$FUNCTIONS_PID" ]]; then
        print_status "Stopping Functions emulator (PID: $FUNCTIONS_PID)..."
        kill -TERM $FUNCTIONS_PID 2>/dev/null || true
        sleep 2
        kill -0 $FUNCTIONS_PID 2>/dev/null && kill -KILL $FUNCTIONS_PID 2>/dev/null || true
        wait $FUNCTIONS_PID 2>/dev/null || true
        print_status "✓ Functions emulator stopped"
    fi

    # Clean up any remaining processes on ports
    [[ -n "$WEB_PORT" ]] && lsof -ti:$WEB_PORT | xargs kill -9 2>/dev/null || true
    [[ -n "$FIREBASE_PORT" ]] && lsof -ti:$FIREBASE_PORT | xargs kill -9 2>/dev/null || true

    print_status "All services stopped gracefully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "🚀 Starting WeGo development environment (Serverless)..."
print_status "Workspace: $CONDUCTOR_WORKSPACE_NAME"
echo

# Calculate workspace-specific ports (avoid conflicts between workspaces)
WORKSPACE_HASH=$(echo "$CONDUCTOR_WORKSPACE_NAME" | cksum | cut -d' ' -f1)
WEB_BASE_PORT=$((3000 + WORKSPACE_HASH % 1000))
FIREBASE_BASE_PORT=$((4000 + WORKSPACE_HASH % 1000))

print_status "Desired ports - Web: $WEB_BASE_PORT, Firebase: $FIREBASE_BASE_PORT"

# Clean up any existing processes
print_status "Cleaning up any existing dev servers..."
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "firebase emulators" 2>/dev/null || true
sleep 2

# ============================================================================
# START FIREBASE EMULATORS (OPTIONAL - for local Cloud Functions testing)
# ============================================================================

USE_EMULATORS=${USE_FIREBASE_EMULATORS:-false}

if [[ "$USE_EMULATORS" == "true" ]] && command -v firebase &> /dev/null; then
    # Determine actual Firebase port
    if ! kill_port_processes $FIREBASE_BASE_PORT "firebase"; then
        FIREBASE_PORT=$(find_available_port $FIREBASE_BASE_PORT)
        print_status "Using alternative Firebase port: $FIREBASE_PORT"
    else
        FIREBASE_PORT=$FIREBASE_BASE_PORT
    fi

    print_status "Starting Firebase emulators on port $FIREBASE_PORT..."
    cd web

    # Build functions first
    if [[ -d "functions" ]]; then
        print_status "Building Cloud Functions..."
        cd functions
        npm run build 2>/dev/null || print_warning "Functions build had warnings"
        cd ..
    fi

    if firebase emulators:start --only firestore,auth,storage,functions > /tmp/conductor-firebase-$CONDUCTOR_WORKSPACE_NAME.log 2>&1 &
    then
        FIREBASE_PID=$!
        print_status "✓ Firebase emulators started (PID: $FIREBASE_PID)"
        print_status "Firebase UI will be available at http://localhost:$FIREBASE_PORT"
    else
        print_warning "Firebase emulators failed to start (optional)"
    fi

    cd ..
else
    if [[ "$USE_EMULATORS" == "true" ]]; then
        print_warning "⚠️  Firebase CLI not installed (optional)"
        print_warning "   Install: npm install -g firebase-tools"
    else
        print_status "ℹ️  Using production Firebase (set USE_FIREBASE_EMULATORS=true for local)"
    fi
fi

# ============================================================================
# START WEB FRONTEND
# ============================================================================

# Determine web port
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

# Set environment variables for frontend (serverless - no backend URL needed)
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
print_status "🎉 WeGo is now running! (Serverless Architecture)"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "📱 Web App:          http://localhost:$WEB_PORT"
if [[ -n "$FIREBASE_PID" ]]; then
    print_status "🔥 Firebase UI:      http://localhost:$FIREBASE_PORT"
    print_status "☁️  Functions:        Running in emulator"
else
    print_status "☁️  Functions:        Using production Cloud Functions"
fi
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "🗂️  Workspace: $CONDUCTOR_WORKSPACE_NAME"
echo
print_status "💡 Debug logs:"
print_status "   Web:      /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log"
if [[ -n "$FIREBASE_PID" ]]; then
    print_status "   Firebase: /tmp/conductor-firebase-$CONDUCTOR_WORKSPACE_NAME.log"
fi
echo
print_status "ℹ️  Backend is now serverless (Firebase Cloud Functions)"
print_status "   InDriver OCR processing triggers automatically on file upload"
echo
print_status "Services will stop when Conductor run is terminated"
print_status "Press Ctrl+C to stop all services"
echo

# Monitor processes
while true; do
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
