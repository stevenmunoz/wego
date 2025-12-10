#!/bin/bash
# Stop all development services

echo "🛑 Stopping all development services..."

# Kill processes by port
echo "   Stopping backend (port 8000)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "   Backend not running"

echo "   Stopping web (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   Web not running"

echo "   Stopping Firebase emulator (port 4000)..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || echo "   Firebase emulator not running"

# Also kill any uvicorn or firebase processes
pkill -f "uvicorn src.main:app" 2>/dev/null || true
pkill -f "firebase emulators" 2>/dev/null || true

echo ""
echo "✅ All services stopped!"
