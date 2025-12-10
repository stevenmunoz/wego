# Scalable App Template

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A production-ready, enterprise-grade project template for building modern full-stack applications with web and mobile clients.

## Overview

This repository serves as a **reusable foundation** for building scalable applications following SOLID principles, clean architecture, and industry best practices. It's designed to be cloned and customized for different project types.

## Tech Stack

- **Frontend Web:** React + TypeScript
- **Mobile:** Expo (React Native with TypeScript)
- **Backend:** Python with FastAPI
- **Database:** Firebase Firestore
- **Architecture:** Clean Architecture with SOLID principles

## Key Features

### Core Architecture
- ✅ Production-ready architecture
- ✅ SOLID principles implementation
- ✅ Clean, layered architecture (Domain, Application, Infrastructure, Presentation)
- ✅ Type-safe codebase (TypeScript + Python type hints)
- ✅ Comprehensive testing setup
- ✅ CI/CD pipeline ready
- ✅ Docker containerization
- ✅ API documentation auto-generation
- ✅ Shared code between web and mobile
- ✅ Security best practices
- ✅ Scalability considerations built-in

### Agentic Services Baseline 🤖
- ✅ Multi-provider LLM integration (OpenAI, Anthropic, Local)
- ✅ Conversational AI with context management
- ✅ Tool/Function calling capabilities
- ✅ RAG (Retrieval Augmented Generation) support
- ✅ Vector store integration (ChromaDB, Pinecone, in-memory)
- ✅ Agent execution tracking and metrics
- ✅ Chat interface components (web/mobile ready)
- ✅ Extensible tool system
- ✅ Production-ready agent orchestration

## 🚀 Quick Start (5 Minutes)

**Prerequisites:**
- Python 3.11+ ([Download](https://www.python.org/downloads/))
- Node.js 18+ ([Download](https://nodejs.org/))
- OpenAI or Anthropic API key

**Setup & Run:**

```bash
# 1. One-command setup
./setup.sh

# 2. Start everything
./dev.sh
```

**Your Services:**
- 🔧 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
- 🌐 Web App: http://localhost:3000
- 🔥 Firebase Emulator UI: http://localhost:4000

**Stop Everything:**
```bash
./stop.sh
```

**📖 For more details:** See [QUICKSTART.md](QUICKSTART.md) or [RUN_INSTRUCTIONS.md](RUN_INSTRUCTIONS.md)

### Customize for Your Project

1. Update project name and branding
2. Configure environment variables for your needs
3. Add your specific business features
4. Customize authentication/authorization rules
5. Set up deployment targets
6. Configure monitoring and logging

## Project Structure

```
scalable-app-template/
├── backend/                    # Python FastAPI backend
│   ├── src/
│   │   ├── domain/            # Business entities and interfaces
│   │   ├── application/       # Use cases and DTOs
│   │   ├── infrastructure/    # Firestore repositories and external services
│   │   ├── presentation/      # API routes and controllers
│   │   └── core/              # Configuration and utilities
│   ├── tests/                 # Backend tests
│   ├── firebase.json          # Firebase emulator configuration
│   └── firestore.rules        # Firestore security rules
│
├── web/                       # React TypeScript web app
│   ├── src/
│   │   ├── features/          # Feature modules
│   │   ├── shared/            # Shared components
│   │   ├── core/              # API client, auth, config
│   │   ├── routes/            # Routing configuration
│   │   └── pages/             # Page components
│   └── tests/                 # Web tests
│
├── mobile/                    # Expo React Native app
│   ├── src/
│   │   ├── features/          # Feature modules
│   │   ├── shared/            # Shared components
│   │   ├── navigation/        # Navigation config
│   │   └── core/              # API client, auth, config
│   └── __tests__/             # Mobile tests
│
├── .github/workflows/         # CI/CD pipelines
├── docs/                      # Documentation
│   ├── architecture/          # Architecture guides
│   ├── setup/                 # Setup guides
│   └── deployment/            # Deployment guides
├── setup.sh                   # One-command setup script
├── dev.sh                     # Start development environment
├── stop.sh                    # Stop all services
└── validate.py                # Template validation script
```

## Documentation

### Architecture & Setup
- **[Clean Architecture](docs/architecture/CLEAN_ARCHITECTURE.md)** - Architecture principles and patterns
- **[Development Setup](docs/setup/DEVELOPMENT_SETUP.md)** - Detailed development setup guide
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment instructions
- **[API Documentation](http://localhost:8000/docs)** - Interactive API documentation (when running)

### Agentic Services
- **[Agentic Services Summary](docs/agentic/SUMMARY.md)** - Overview of AI/Agent capabilities
- **[Agentic Architecture](docs/agentic/AGENTIC_ARCHITECTURE.md)** - AI/Agent services architecture
- **[Quick Start: Agents](docs/agentic/QUICK_START_AGENTS.md)** - Get started with AI agents in minutes
- **[Agent Examples](backend/examples/agent_config.json)** - Pre-configured agent templates

## Philosophy

This template embodies the **dream architecture** of a super senior software engineer:

- **No compromises:** Production-ready from day one
- **Principles over frameworks:** Business logic decoupled from implementation details
- **Zero technical debt:** Clean foundation to build upon
- **Scalability first:** Designed to grow with your application
- **Developer experience:** Minimal setup, maximum productivity

## Use Cases

Perfect for:

- SaaS applications
- E-commerce platforms
- Social networks
- Enterprise applications
- MVP development
- Startup projects

## Contributing

This is a template repository. Fork it, customize it, and make it your own!

## License

MIT - Use it however you want!

---

**Built with care by senior engineers, for engineers who care about quality.**
