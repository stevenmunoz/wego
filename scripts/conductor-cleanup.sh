#!/bin/bash

# WeGo App - Conductor Cleanup Script
# Runs when Conductor archives a workspace

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[CONDUCTOR-CLEANUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[CONDUCTOR-CLEANUP]${NC} $1"
}

print_error() {
    echo -e "${RED}[CONDUCTOR-CLEANUP]${NC} $1"
}

print_status "🧹 Cleaning up WeGo workspace..."

# Stop any running processes
print_status "Stopping any running services..."

pkill -f "uvicorn.*src.main:app" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "firebase emulators" 2>/dev/null || true

print_status "✓ Services stopped"

# Clean up log files
if [[ -n "$CONDUCTOR_WORKSPACE_NAME" ]]; then
    print_status "Removing log files..."
    rm -f /tmp/conductor-backend-$CONDUCTOR_WORKSPACE_NAME.log
    rm -f /tmp/conductor-web-$CONDUCTOR_WORKSPACE_NAME.log
    rm -f /tmp/conductor-firebase-$CONDUCTOR_WORKSPACE_NAME.log
    print_status "✓ Log files removed"
fi

# Clean up workspace metadata
if [[ -f ".conductor-workspace" ]]; then
    rm -f .conductor-workspace
    print_status "✓ Workspace metadata removed"
fi

# Optional: Clean up node_modules and venv to save space
# Uncomment if you want aggressive cleanup
# print_status "Removing node_modules and venv..."
# rm -rf web/node_modules
# rm -rf backend/venv
# print_status "✓ Dependencies removed"

print_status "✅ Workspace cleanup complete!"
