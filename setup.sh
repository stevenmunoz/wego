#!/bin/bash
# Enterprise App Template - One-Command Setup
# This script sets up the entire development environment

set -e  # Exit on error

echo "🔧 Enterprise App Template - Setup"
echo "===================================="
echo ""

# Check Python version
echo "🐍 Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "   Install: brew install python@3.11 (macOS) or apt install python3.11 (Linux)"
    exit 1
fi

python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d'.' -f1-2)
if [ "$python_version" != "3.11" ] && [ "$python_version" != "3.10" ] && [ "$python_version" != "3.12" ]; then
    echo "⚠️  Python $python_version detected (recommended: 3.11)"
    echo "   This may cause compatibility issues with some dependencies"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Python $python_version detected"
fi
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install: brew install node (macOS) or apt install nodejs (Linux)"
    exit 1
fi

node_version=$(node --version)
echo "✅ Node.js $node_version detected"
echo ""

# Setup environment files
echo "📋 Setting up environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env

    # Generate secure secrets
    echo "   Generating secure secrets..."
    secret_key=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    jwt_secret=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

    # Update .env with secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|SECRET_KEY=.*|SECRET_KEY=$secret_key|" backend/.env
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" backend/.env
    else
        # Linux
        sed -i "s|SECRET_KEY=.*|SECRET_KEY=$secret_key|" backend/.env
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" backend/.env
    fi

    echo "✅ Created backend/.env with generated secrets"
else
    echo "   backend/.env already exists (skipping)"
fi

# Web .env
if [ ! -f web/.env ]; then
    cp web/.env.example web/.env
    echo "✅ Created web/.env"
else
    echo "   web/.env already exists (skipping)"
fi

# Mobile .env
if [ -f mobile/.env.example ] && [ ! -f mobile/.env ]; then
    cp mobile/.env.example mobile/.env
    echo "✅ Created mobile/.env"
fi

echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend

if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "   Activating virtual environment..."
source venv/bin/activate

echo "   Installing Python packages..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo "✅ Backend dependencies installed"
cd ..
echo ""

# Install web dependencies
echo "🌐 Installing web dependencies..."
cd web
if [ ! -d "node_modules" ]; then
    npm install --silent
    echo "✅ Web dependencies installed"
else
    echo "   node_modules already exists (skipping)"
fi
cd ..
echo ""

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"
echo ""

# Check for API keys
echo "🔑 Checking API configuration..."
if ! grep -q "OPENAI_API_KEY=sk-" backend/.env 2>/dev/null && \
   ! grep -q "ANTHROPIC_API_KEY=sk-ant-" backend/.env 2>/dev/null; then
    echo "⚠️  No API key found in backend/.env"
    echo ""
    echo "   The template is ready to run, but you'll need an API key for AI features."
    echo ""
    echo "   Choose your LLM provider:"
    echo "   1) OpenAI (GPT-4, GPT-3.5)"
    echo "   2) Anthropic (Claude)"
    echo "   3) Skip for now (add later)"
    echo ""
    read -p "   Enter choice (1-3): " choice

    case $choice in
        1)
            read -p "   Enter your OpenAI API key: " api_key
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$api_key|" backend/.env
                sed -i '' "s|LLM_PROVIDER=.*|LLM_PROVIDER=openai|" backend/.env
            else
                sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$api_key|" backend/.env
                sed -i "s|LLM_PROVIDER=.*|LLM_PROVIDER=openai|" backend/.env
            fi
            echo "   ✅ OpenAI API key configured"
            ;;
        2)
            read -p "   Enter your Anthropic API key: " api_key
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$api_key|" backend/.env
                sed -i '' "s|LLM_PROVIDER=.*|LLM_PROVIDER=anthropic|" backend/.env
            else
                sed -i "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$api_key|" backend/.env
                sed -i "s|LLM_PROVIDER=.*|LLM_PROVIDER=anthropic|" backend/.env
            fi
            echo "   ✅ Anthropic API key configured"
            ;;
        *)
            echo "   ⏭️  Skipped - You can add your API key later in backend/.env"
            ;;
    esac
else
    echo "✅ API key found in backend/.env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run the development environment:"
echo "     ./dev.sh"
echo ""
echo "  2. Access your app:"
echo "     • Backend API:  http://localhost:8000"
echo "     • API Docs:     http://localhost:8000/docs"
echo "     • Web App:      http://localhost:3000"
echo ""
echo "Optional:"
echo "  • Install Firebase CLI for emulator:"
echo "    npm install -g firebase-tools"
echo ""
echo "  • Configure API key (if skipped):"
echo "    Edit backend/.env and add OPENAI_API_KEY or ANTHROPIC_API_KEY"
echo ""
echo "  • Run validation:"
echo "    python3 validate.py"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
