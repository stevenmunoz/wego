# Running WeGo in Conductor

This project is fully configured to run in [Conductor](https://conductor.dev) for seamless development workspace management.

## What is Conductor?

Conductor allows you to create isolated development workspaces for different branches, features, or experiments without conflicts. Each workspace has its own:
- Running services (Backend, Web, Firebase)
- Unique ports (no conflicts between workspaces)
- Independent environment

## Quick Start

### 1. Open Project in Conductor

```bash
# In Conductor, import this repository
# Conductor will detect the conductor.json configuration
```

### 2. Create a Workspace

- Click "New Workspace" in Conductor
- Choose a branch or create a new one
- Conductor will automatically run the setup script

### 3. Run the Project

- Click the "Run" button in Conductor
- All services will start automatically:
  - ✅ Backend API (FastAPI + Firebase)
  - ✅ Web Frontend (React + Vite)
  - ✅ Firebase Emulator (if installed)

### 4. Access Your App

Conductor will display the URLs for your workspace:
- **Web App**: http://localhost:PORT (varies by workspace)
- **Backend API**: http://localhost:PORT/docs
- **Firebase UI**: http://localhost:PORT (if available)

Each workspace gets unique ports automatically to avoid conflicts!

## What Happens Automatically

### Setup Phase (First Time)
When you create a workspace, Conductor runs `conductor-setup.sh` which:

1. **Smart Python Detection**
   - Automatically finds Python 3.10, 3.11, or 3.12
   - Avoids Python 3.13 (compatibility issues)
   - Creates virtual environment with correct version

2. **Environment Configuration**
   - Symlinks `.env` files from main project (if they exist)
   - Or creates new ones from templates
   - Generates secure secrets automatically
   - Fixes CORS configuration for Pydantic v2

3. **Dependency Installation**
   - Backend: `pip install -r requirements.txt`
   - Web: `npm install`
   - Validates everything is ready

### Run Phase
When you click "Run", Conductor executes `conductor-run.sh` which:

1. **Port Management**
   - Calculates unique ports based on workspace name
   - Avoids conflicts between workspaces
   - Frees up ports if needed

2. **Service Startup**
   - Starts Backend (FastAPI + Uvicorn)
   - Starts Web (React + Vite)
   - Starts Firebase Emulator (optional)
   - Monitors all processes

3. **Health Checks**
   - Waits for backend to respond
   - Verifies web server is ready
   - Shows all service URLs

4. **Monitoring**
   - Keeps services running
   - Restarts on crashes
   - Shows logs in real-time

### Cleanup Phase
When you archive a workspace, Conductor runs `conductor-cleanup.sh` which:
- Stops all running services
- Removes log files
- Cleans up temporary data

## Configuration

The project includes these Conductor files:

```
conductor.json              # Main Conductor configuration
scripts/
  conductor-setup.sh       # Setup script (runs once per workspace)
  conductor-run.sh         # Run script (starts services)
  conductor-cleanup.sh     # Cleanup script (archives workspace)
```

### conductor.json
```json
{
  "scripts": {
    "setup": "chmod +x ./scripts/conductor-setup.sh && ./scripts/conductor-setup.sh",
    "run": "chmod +x ./scripts/conductor-run.sh && ./scripts/conductor-run.sh",
    "archive": "./scripts/conductor-cleanup.sh"
  },
  "runScriptMode": "nonconcurrent"
}
```

## Environment Variables

### Shared Across Workspaces
The setup script creates symlinks to your main project's `.env` files:
- `backend/.env` → symlinked from main project
- `web/.env` → symlinked from main project

This means:
- ✅ API keys shared across all workspaces
- ✅ Single place to update configuration
- ✅ No duplicate API keys

### Workspace-Specific
Each workspace gets unique:
- Port numbers (calculated from workspace name)
- Process IDs
- Log files in `/tmp/conductor-{service}-{workspace}.log`

## Advantages of Conductor

### 1. Multiple Branches Simultaneously
Work on multiple features at once:
```
Workspace "feature-auth"    → http://localhost:8001, 3001
Workspace "bugfix-login"    → http://localhost:8002, 3002
Workspace "experiment-ui"   → http://localhost:8003, 3003
```

### 2. No Port Conflicts
Conductor automatically assigns unique ports to each workspace based on the workspace name hash.

### 3. Clean Isolation
- Each workspace has its own virtual environment
- Independent node_modules
- Separate running processes
- No interference between branches

### 4. Easy Context Switching
- Click between workspaces instantly
- All services start/stop automatically
- No manual cleanup needed

## Troubleshooting

### Setup Failed
Check the Conductor setup logs:
- Look for Python version issues (must be 3.10-3.12)
- Verify `backend/.env` exists or can be created
- Check Node.js is installed (18+)

### Services Won't Start
Check the log files:
```bash
tail -f /tmp/conductor-backend-{workspace}.log
tail -f /tmp/conductor-web-{workspace}.log
tail -f /tmp/conductor-firebase-{workspace}.log
```

### Port Already in Use
Conductor will automatically find alternative ports. Check the run logs for actual port numbers.

### Python 3.13 Issues
The setup script automatically avoids Python 3.13. If you only have Python 3.13:
```bash
# Install Python 3.11
brew install python@3.11  # macOS
sudo apt install python3.11  # Ubuntu
```

## Advanced Usage

### Custom Ports
Edit `conductor-run.sh` to change base ports:
```bash
BACKEND_BASE_PORT=8000
WEB_BASE_PORT=3000
FIREBASE_BASE_PORT=4000
```

### Skip Firebase Emulator
Firebase is optional. If you don't have it installed, the script will skip it and continue.

### View Logs
Logs are stored in `/tmp/` with workspace name:
```bash
# Backend logs
tail -f /tmp/conductor-backend-myworkspace.log

# Web logs
tail -f /tmp/conductor-web-myworkspace.log
```

### Manual Cleanup
To manually clean up a workspace:
```bash
./scripts/conductor-cleanup.sh
```

## Best Practices

### 1. Main Project Setup
Before using Conductor, set up your main project:
```bash
# In your main project directory
cp backend/.env.example backend/.env
cp web/.env.example web/.env

# Add your API keys
vim backend/.env
```

All Conductor workspaces will use these files.

### 2. API Keys
Store API keys in the main project's `.env` files:
- ✅ Shared across all workspaces
- ✅ Single source of truth
- ❌ Don't commit to git

### 3. Workspace Naming
Use descriptive workspace names:
- ✅ `feature-user-auth`
- ✅ `bugfix-cors-error`
- ✅ `experiment-new-ui`
- ❌ `test1`, `tmp`, `asdf`

## Support

### Issues with Conductor Scripts
If you encounter issues with the Conductor scripts:
1. Check log files in `/tmp/conductor-*`
2. Verify setup completed successfully
3. Try running setup again
4. Check that you're using Python 3.10-3.12

### Issues with the App
For general app issues unrelated to Conductor:
- See main [README.md](./README.md)
- Check [RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md)

## Features

### ✅ Auto-configured
- Python version detection
- Port management
- Environment setup
- Dependency installation

### ✅ Multi-workspace
- Run multiple branches simultaneously
- Unique ports per workspace
- No conflicts

### ✅ Health Checks
- Waits for services to be ready
- Verifies backend health endpoint
- Monitors process status

### ✅ Error Handling
- Detailed error messages
- Log files for debugging
- Graceful shutdown
- Automatic cleanup

## Comparison: Conductor vs Manual

| Feature | Manual (`./dev.sh`) | Conductor |
|---------|---------------------|-----------|
| Multiple branches | ❌ Must stop/restart | ✅ Isolated workspaces |
| Port conflicts | ⚠️ Manual resolution | ✅ Auto-assigned ports |
| Setup time | ⏱️ 5-10 minutes | ⚡ Automated |
| Context switching | 🐌 Slow (restart all) | ⚡ Instant (click) |
| Environment isolation | ❌ Shared | ✅ Per-workspace |
| Cleanup | 🧹 Manual | ✅ Automatic |

---

**Happy coding with Conductor!** 🎉

For more about Conductor: [conductor.dev](https://conductor.dev)
