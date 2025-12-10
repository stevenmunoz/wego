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

# Backend environment setup - symlink from main project
BACKEND_ENV_SOURCE="$CONDUCTOR_ROOT_PATH/backend/.env"
if [[ -f "$BACKEND_ENV_SOURCE" ]]; then
    ln -sf "$BACKEND_ENV_SOURCE" backend/.env
    print_status "✅ Symlinked backend/.env from main project"
else
    print_warning "⚠️  No backend/.env file found at: $BACKEND_ENV_SOURCE"
    print_status "Creating backend/.env from template..."

    if [[ -f "backend/.env.example" ]]; then
        cp backend/.env.example backend/.env

        # Generate secure secrets
        print_status "Generating secure secrets..."
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
        JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

        # Update .env with secrets and fix CORS format
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" backend/.env
            sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
            # Fix CORS_ORIGINS to JSON array format (Pydantic v2 compatibility)
            sed -i '' "s|CORS_ORIGINS=.*|CORS_ORIGINS='[\"http://localhost:3000\",\"http://localhost:19006\"]'|" backend/.env
        else
            sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" backend/.env
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
            sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS='[\"http://localhost:3000\",\"http://localhost:19006\"]'|" backend/.env
        fi

        print_status "✅ Created backend/.env with generated secrets"
    else
        print_error "backend/.env.example not found"
        exit 1
    fi
fi

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

# 2. Backend Setup (Python)
print_status "Setting up Python backend..."

# Verify backend directory exists
if [[ ! -d "backend" ]]; then
    print_error "Backend directory not found in workspace"
    exit 1
fi

cd backend

# Smart Python version detection (prefer 3.11, 3.12, 3.10, avoid 3.13)
print_status "Detecting compatible Python version..."
PYTHON_CMD=""

for py_version in python3.11 python3.12 python3.10 python3; do
    if command -v $py_version &> /dev/null; then
        py_ver=$($py_version --version 2>&1 | awk '{print $2}' | cut -d'.' -f1-2)
        if [[ "$py_ver" == "3.11" ]] || [[ "$py_ver" == "3.12" ]] || [[ "$py_ver" == "3.10" ]]; then
            PYTHON_CMD=$py_version
            PYTHON_VERSION=$py_ver
            print_status "✅ Found compatible Python $PYTHON_VERSION at $py_version"
            break
        fi
    fi
done

if [[ -z "$PYTHON_CMD" ]]; then
    print_error "No compatible Python version found (need 3.10, 3.11, or 3.12)"
    print_error "Python 3.13 is NOT compatible with this project"
    print_error "Install: brew install python@3.11 (macOS) or apt install python3.11 (Linux)"
    exit 1
fi

# Check if requirements.txt exists
if [[ ! -f "requirements.txt" ]]; then
    print_error "requirements.txt not found in backend directory"
    exit 1
fi

# Create virtual environment with compatible Python
if [[ ! -d "venv" ]]; then
    print_status "Creating Python virtual environment with $PYTHON_CMD..."
    $PYTHON_CMD -m venv venv
    print_status "✅ Virtual environment created"
else
    print_status "✓ Using existing virtual environment"
fi

# Verify venv Python is compatible
print_status "Verifying virtual environment Python version..."
VENV_PYTHON_VERSION=$(./venv/bin/python --version 2>&1 | awk '{print $2}' | cut -d'.' -f1-2)

if [[ "$VENV_PYTHON_VERSION" != "3.11" ]] && [[ "$VENV_PYTHON_VERSION" != "3.12" ]] && [[ "$VENV_PYTHON_VERSION" != "3.10" ]]; then
    print_error "Virtual environment uses incompatible Python $VENV_PYTHON_VERSION"
    print_status "Recreating virtual environment with $PYTHON_CMD..."
    rm -rf venv
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment and install dependencies
print_status "Installing Python dependencies (this may take 2-3 minutes)..."
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip &>/dev/null

# Install requirements with error handling
if pip install -r requirements.txt; then
    print_status "✅ Python dependencies installed successfully"
else
    print_error "Failed to install Python dependencies"
    print_error "Check that you're using Python 3.10-3.12 (NOT 3.13)"
    exit 1
fi

cd ..

# 3. Web Frontend Setup (React/Vite)
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

cd ..

# 4. Final Validation
print_status "Running final validation checks..."

# Verify required files exist
REQUIRED_FILES=(
    "backend/requirements.txt"
    "backend/src/main.py"
    "web/package.json"
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
    "backend/.env:Backend environment file"
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
PYTHON_VERSION=$PYTHON_VERSION
NODE_VERSION=$NODE_VERSION
EOF

print_status "✓ Workspace configuration saved"

echo
print_status "🎉 WeGo workspace setup complete!"
print_status "📊 Workspace: $CONDUCTOR_WORKSPACE_NAME"
print_status "🐍 Python: $PYTHON_VERSION (with virtual environment)"
print_status "📦 Node.js: $NODE_VERSION"
print_status "🚀 Ready to run services with 'Run' button"
print_status ""
print_status "💡 Services that will start:"
print_status "   • Backend API (FastAPI + Firebase)"
print_status "   • Web Frontend (React + Vite)"
print_status "   • Firebase Emulator (if installed)"
echo
