# Quick Start Guide

Get up and running in **5 minutes** or less!

## Prerequisites

- **Python 3.11**: `brew install python@3.11` (macOS) or `apt install python3.11` (Linux)
- **Node.js 18+**: `brew install node` (macOS) or `apt install nodejs` (Linux)
- **LLM API Key**: Get one from [OpenAI](https://platform.openai.com/) or [Anthropic](https://console.anthropic.com/)

## Setup (One Command)

```bash
./setup.sh
```

The setup script will:
- ✅ Check your Python and Node.js versions
- ✅ Create and configure environment files
- ✅ Generate secure secrets automatically
- ✅ Install all backend and frontend dependencies
- ✅ Prompt you to add your API key

## Start Development Environment

```bash
./dev.sh
```

This starts:
- **Backend API** on `http://localhost:8000`
- **Web App** on `http://localhost:3000`
- **Firebase Emulator** on `http://localhost:4000` (if installed)

## Access Your App

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Web Application | http://localhost:3000 |
| Firebase Emulator UI | http://localhost:4000 |

## Stop Everything

```bash
./stop.sh
```

Or press `Ctrl+C` in the terminal running `dev.sh`

---

## Optional: Firebase Emulator

For local Firebase testing:

```bash
# Install Firebase CLI (one-time)
npm install -g firebase-tools

# The emulator will auto-start when you run ./dev.sh
```

---

## Troubleshooting

### "No API key found"
Edit `backend/.env` and add:
```bash
OPENAI_API_KEY=your-key-here
# OR
ANTHROPIC_API_KEY=your-key-here
```

### "Python version mismatch"
Install Python 3.11:
```bash
# macOS
brew install python@3.11

# Linux
apt install python3.11
```

### "Port already in use"
Stop any running services:
```bash
./stop.sh
# Then restart
./dev.sh
```

### Validate your setup
```bash
python3 validate.py
```

---

## Next Steps

1. **Create your first user**: Visit http://localhost:8000/docs and use the `/api/v1/users/` endpoint
2. **Try the AI agent**: Use the `/api/v1/chat/` endpoint to chat with the AI
3. **Explore the web app**: Visit http://localhost:3000
4. **Read the full docs**: Check out [README.md](README.md) and [RUN_INSTRUCTIONS.md](RUN_INSTRUCTIONS.md)

---

That's it! 🎉

**Time to first run**: ~5 minutes
**Lines of setup code**: Just run `./setup.sh`
