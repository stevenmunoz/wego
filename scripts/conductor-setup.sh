#!/bin/bash

# WeGo App - Conductor Setup Script
# Runs when Conductor creates a new workspace/branch

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[CONDUCTOR-SETUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[CONDUCTOR-SETUP]${NC} $1"
}

print_error() {
    echo -e "${RED}[CONDUCTOR-SETUP]${NC} $1"
}

# Validate workspace name
if [[ -z "$CONDUCTOR_WORKSPACE_NAME" ]]; then
    print_error "CONDUCTOR_WORKSPACE_NAME not set"
    exit 1
fi

# Validate workspace name is filesystem-safe
if ! echo "$CONDUCTOR_WORKSPACE_NAME" | grep -qE '^[a-zA-Z0-9_-]+$'; then
    print_error "Workspace name contains invalid characters: $CONDUCTOR_WORKSPACE_NAME"
    exit 1
fi

print_status "🚀 Setting up WeGo workspace: $CONDUCTOR_WORKSPACE_NAME"
print_status "📁 Project root: $PROJECT_ROOT"

# 1. Environment Variables Setup
print_status "Setting up environment variables..."

# Use CONDUCTOR_ROOT_PATH (main project directory)
if [[ -z "$CONDUCTOR_ROOT_PATH" ]]; then
    print_error "CONDUCTOR_ROOT_PATH not set - cannot locate main project directory"
    exit 1
fi

print_status "Using main project at: $CONDUCTOR_ROOT_PATH"

# Web environment setup - symlink from main project
WEB_ENV_SOURCE="$CONDUCTOR_ROOT_PATH/web/.env"
if [[ -f "$WEB_ENV_SOURCE" ]]; then
    ln -sf "$WEB_ENV_SOURCE" web/.env
    print_status "✅ Symlinked web/.env from main project"
else
    print_warning "⚠️  No web/.env file found at: $WEB_ENV_SOURCE"
    if [[ -f "web/.env.example" ]]; then
        cp web/.env.example web/.env
        print_status "✅ Created web/.env from template"
    fi
fi

# Mobile environment setup (optional)
if [[ -f "mobile/.env.example" ]] && [[ ! -f "mobile/.env" ]]; then
    cp mobile/.env.example mobile/.env
    print_status "✅ Created mobile/.env"
fi

# Cloud Functions environment setup - symlink from main project
FUNCTIONS_ENV_SOURCE="$CONDUCTOR_ROOT_PATH/web/functions/.env"
if [[ -f "$FUNCTIONS_ENV_SOURCE" ]]; then
    mkdir -p web/functions
    ln -sf "$FUNCTIONS_ENV_SOURCE" web/functions/.env
    print_status "✅ Symlinked web/functions/.env from main project"
else
    print_warning "⚠️  No web/functions/.env file found at: $FUNCTIONS_ENV_SOURCE"
    print_warning "   Cloud Functions deployment may fail without OPENAI_API_KEY"
fi

# 2. Web Frontend Setup (React/Vite)
print_status "Setting up React web frontend..."

# Verify web directory exists
if [[ ! -d "web" ]]; then
    print_error "Web directory not found in workspace"
    exit 1
fi

cd web

# Check Node.js version
if ! node --version &>/dev/null; then
    print_error "Node.js is required but not installed"
    print_error "Please install Node.js 18+ and try again"
    exit 1
fi

NODE_VERSION=$(node --version | grep -oE '[0-9]+\.[0-9]+')
print_status "✓ Found Node.js $NODE_VERSION"

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found in web directory"
    exit 1
fi

# Install npm dependencies
print_status "Installing Node.js dependencies (this may take 2-3 minutes)..."
if npm install --silent; then
    print_status "✅ Node.js dependencies installed successfully"
else
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

# 3. Cloud Functions Setup (TypeScript)
print_status "Setting up Cloud Functions..."

if [[ -d "functions" ]] && [[ -f "functions/package.json" ]]; then
    cd functions
    if npm install --silent; then
        print_status "✅ Cloud Functions dependencies installed"
    else
        print_warning "⚠️  Cloud Functions npm install failed (non-critical)"
    fi
    cd ..
else
    print_warning "⚠️  Cloud Functions directory not found (optional)"
fi

cd ..

# 4. Final Validation
print_status "Running final validation checks..."

# Verify required files exist
REQUIRED_FILES=(
    "web/package.json"
    "web/functions/package.json"
    "conductor.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_status "✓ All required files present"

# Check environment files
ENV_CHECKS=(
    "web/.env:Web environment file"
)

for check in "${ENV_CHECKS[@]}"; do
    file="${check%%:*}"
    desc="${check##*:}"

    if [[ -f "$file" ]]; then
        print_status "✓ $desc exists"
        # Check for placeholder values
        if grep -q "your.*key.*here\|example\|placeholder" "$file" 2>/dev/null; then
            print_warning "⚠ $desc contains placeholder values - update with real API keys if needed"
        fi
    else
        print_warning "⚠ $desc not found"
    fi
done

# 5. Create workspace-specific configuration
print_status "Setting up workspace configuration..."

# Create workspace info file
cat > .conductor-workspace <<EOF
# Conductor Workspace Configuration
WORKSPACE_NAME=$CONDUCTOR_WORKSPACE_NAME
WORKSPACE_PATH=$PWD
PROJECT_ROOT=$PROJECT_ROOT
SETUP_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ROOT_PATH=$CONDUCTOR_ROOT_PATH
NODE_VERSION=$NODE_VERSION
EOF

print_status "✓ Workspace configuration saved"

echo
print_status "🎉 WeGo workspace setup complete!"
print_status "📊 Workspace: $CONDUCTOR_WORKSPACE_NAME"
print_status "📦 Node.js: $NODE_VERSION"
print_status "🚀 Ready to run services with 'Run' button"
print_status ""
print_status "💡 Services that will start:"
print_status "   • Web Frontend (React + Vite)"
print_status "   • Firebase Emulator (optional, if installed)"
print_status "   Note: Cloud Functions run in Firebase cloud (DEV project)"
echo
