# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2024-11-21

### Changed - BREAKING
- **Migrated from PostgreSQL to Firebase Firestore** - Complete database migration
  - Replaced SQLAlchemy with Firebase Admin SDK
  - Replaced Alembic migrations with Firestore schema-less design
  - Updated all repository implementations to use Firestore
  - Docker Compose now uses Firebase emulator instead of PostgreSQL

### Added
- Firebase Firestore integration with emulator support
- Firebase emulator UI for local development (http://localhost:4000)
- Comprehensive Firestore repositories for all entities
- Firebase configuration files (`firebase.json`, `firestore.rules`)
- Firestore mappers for entity serialization/deserialization
- `FIREBASE_MIGRATION_SUMMARY.md` documenting the migration
- Enhanced `.gitignore` with comprehensive coverage
- Agentic services summary in `docs/agentic/SUMMARY.md`

### Removed
- PostgreSQL dependency and Docker service
- SQLAlchemy and Alembic dependencies
- Database models and mappers (`models.py`, `mappers.py`)
- Alembic migrations directory
- Database session management

### Documentation
- Reorganized root markdown files for better clarity
- Moved archival docs to `docs/archive/`
- Updated README with Firebase setup instructions
- Updated RUN_INSTRUCTIONS with Firebase emulator details
- Updated setup.sh script for Firebase

## [1.0.0] - 2024-11-21

### Added - Initial Release
- Production-ready clean architecture template
- FastAPI backend with Python 3.11+
- React + TypeScript web application
- Expo React Native mobile application
- SOLID principles implementation across all layers
- Comprehensive authentication system with JWT
- Role-based access control (RBAC)
- Docker containerization with docker-compose
- CI/CD pipeline with GitHub Actions
- Comprehensive testing setup (pytest, Jest, React Testing Library)
- API documentation with OpenAPI/Swagger
- PostgreSQL database with Alembic migrations
- Redis for caching and background tasks
- Celery for async task processing
- Email integration with SendGrid
- Monitoring with Sentry

### Agentic Services Baseline
- Multi-provider LLM integration (OpenAI, Anthropic, Local)
- Conversational AI with context management
- Tool/Function calling capabilities
- RAG (Retrieval Augmented Generation) support
- Vector store integration (ChromaDB, Pinecone, in-memory)
- Agent execution tracking and metrics
- Chat interface components for web and mobile
- Extensible tool system
- Production-ready agent orchestration
- Pre-configured agent templates

### Documentation
- Comprehensive README with quick start guide
- Clean architecture documentation
- Development setup guide
- Deployment guide
- Agentic services architecture guide
- Quick start guide for AI agents
- Contributing guidelines

---

## Version History

- **2.0.0** - Firebase Migration (Breaking Changes)
- **1.0.0** - Initial Release with PostgreSQL

## Migration Guides

- [PostgreSQL to Firebase Migration](FIREBASE_MIGRATION_SUMMARY.md)
