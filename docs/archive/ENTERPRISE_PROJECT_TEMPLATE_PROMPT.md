# LLM Prompt: Enterprise-Grade Full-Stack Project Template

## Objective
Create a production-ready, enterprise-grade project template that serves as a reusable foundation for building scalable web and mobile applications. This template should embody best practices from a super senior software engineer's perspective, implementing SOLID principles, clean architecture, and industry-standard patterns.

## Tech Stack
- **Frontend Web:** React + TypeScript
- **Mobile:** Expo (React Native with TypeScript)
- **Backend:** Python with FastAPI (prefer FastAPI for modern async capabilities, but use Django if authentication/admin features justify it)
- **Repository Structure:** Design the optimal architecture (monorepo vs microservices) based on scalability and maintainability trade-offs

## Core Requirements

### 1. Architecture Principles
Implement a **clean, layered architecture** following these principles:

- **SOLID Principles:**
  - **Single Responsibility:** Each module/class has one reason to change
  - **Open/Closed:** Open for extension, closed for modification
  - **Liskov Substitution:** Subtypes must be substitutable for their base types
  - **Interface Segregation:** Many specific interfaces over one general-purpose interface
  - **Dependency Inversion:** Depend on abstractions, not concretions

- **Clean Architecture Layers:**
  - **Domain Layer:** Business logic, entities, use cases (framework-agnostic)
  - **Application Layer:** Application-specific business rules, DTOs, interfaces
  - **Infrastructure Layer:** External concerns (database, APIs, frameworks)
  - **Presentation Layer:** UI components, controllers, view models

- **Separation of Concerns:** Clear boundaries between business logic, data access, and presentation

### 2. Backend Requirements

Create a Python backend with:

- **Project Structure:**
  ```
  backend/
  ├── src/
  │   ├── domain/           # Core business entities and interfaces
  │   ├── application/      # Use cases, DTOs, service interfaces
  │   ├── infrastructure/   # Database, external APIs, implementations
  │   ├── presentation/     # API routes, controllers, schemas
  │   └── core/             # Shared utilities, exceptions, config
  ├── tests/                # Unit, integration, and e2e tests
  └── alembic/              # Database migrations
  ```

- **Dependency Injection:** Implement a robust DI container for loose coupling
- **Repository Pattern:** Abstract data access with repository interfaces
- **Service Layer:** Encapsulate business logic in domain services
- **API Design:**
  - RESTful endpoints following Richardson Maturity Model Level 3
  - Versioned APIs (e.g., `/api/v1/`)
  - Consistent error handling and response formats
  - Request/response validation using Pydantic
  - OpenAPI/Swagger documentation auto-generation

- **Authentication & Authorization:**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Refresh token mechanism
  - Secure password hashing (bcrypt/argon2)

- **Data Layer:**
  - SQLAlchemy ORM with async support
  - Database migration system (Alembic)
  - Connection pooling and query optimization
  - Support for both PostgreSQL (production) and SQLite (development)

- **Error Handling:**
  - Custom exception hierarchy
  - Global exception handlers
  - Structured logging with correlation IDs
  - Graceful degradation strategies

- **Testing:**
  - Unit tests (pytest) with >80% coverage
  - Integration tests for API endpoints
  - Test fixtures and factories
  - Mocking external dependencies

### 3. Frontend Web Requirements (React + TypeScript)

Create a React web application with:

- **Project Structure:**
  ```
  web/
  ├── src/
  │   ├── features/         # Feature-based organization
  │   │   └── [feature]/
  │   │       ├── components/
  │   │       ├── hooks/
  │   │       ├── services/
  │   │       ├── types/
  │   │       └── index.ts
  │   ├── shared/           # Shared components, hooks, utils
  │   ├── core/             # Core services (API, auth, config)
  │   ├── layouts/          # Layout components
  │   ├── routes/           # Routing configuration
  │   └── styles/           # Global styles, theme
  ├── public/
  └── tests/
  ```

- **State Management:**
  - Choose appropriate solution (Redux Toolkit, Zustand, or React Query)
  - Separation of server state (API data) from client state (UI state)
  - Immutable state updates
  - Type-safe actions and selectors

- **Component Architecture:**
  - Atomic design principles (atoms, molecules, organisms, templates, pages)
  - Container/Presentational pattern
  - Custom hooks for reusable logic
  - Compound components for complex UI
  - Controlled components with proper form handling

- **API Integration:**
  - Type-safe API client (Axios/Fetch with TypeScript)
  - Centralized API configuration
  - Request/response interceptors
  - Error handling and retry logic
  - Loading and error states management

- **Routing:**
  - React Router with code splitting
  - Protected routes with authentication guards
  - Lazy loading for performance
  - Breadcrumb navigation

- **Performance:**
  - Code splitting and lazy loading
  - Memoization (React.memo, useMemo, useCallback)
  - Virtual scrolling for large lists
  - Image optimization
  - Bundle size optimization

- **Testing:**
  - Unit tests (Jest + React Testing Library)
  - Component tests focusing on user behavior
  - E2E tests (Playwright/Cypress)
  - Accessibility testing

### 4. Mobile Requirements (Expo + React Native)

Create an Expo mobile application with:

- **Project Structure:**
  ```
  mobile/
  ├── src/
  │   ├── features/         # Feature modules (same as web)
  │   ├── shared/           # Shared components
  │   ├── navigation/       # Navigation configuration
  │   ├── core/             # API, auth, config
  │   └── theme/            # Theme and styling
  ├── assets/
  └── __tests__/
  ```

- **Cross-Platform Considerations:**
  - Platform-specific code when necessary (`.ios.tsx`, `.android.tsx`)
  - Responsive design for different screen sizes
  - Safe area handling
  - Keyboard avoiding views

- **Navigation:**
  - React Navigation with type-safe routing
  - Stack, Tab, and Drawer navigators
  - Deep linking support
  - Authentication flow

- **Offline-First:**
  - Local storage (AsyncStorage/MMKV)
  - Offline data synchronization
  - Network state detection
  - Queue system for offline actions

- **Native Features:**
  - Camera, photo library access
  - Push notifications setup
  - Biometric authentication
  - Location services (when needed)

- **Performance:**
  - FlatList/SectionList optimization
  - Image caching
  - Native driver animations
  - Memory leak prevention

### 5. Shared Code & Reusability

- **Shared Types:** TypeScript interfaces/types shared between web, mobile, and backend (via API contracts)
- **Component Library:** Reusable UI components that work across web and mobile
- **Business Logic Sharing:** Extract platform-agnostic business logic into shared utilities
- **API Client:** Shared API client implementation
- **Validation Schemas:** Share validation logic (Zod/Yup schemas)

### 6. DevOps & Infrastructure

- **Environment Management:**
  - Configuration for dev, staging, production
  - Environment variables management (.env files)
  - Secrets management strategy

- **Docker:**
  - Dockerfile for backend
  - Docker Compose for local development
  - Multi-stage builds for optimization

- **CI/CD Pipeline:**
  - GitHub Actions / GitLab CI configuration
  - Automated testing on PR
  - Automated deployments
  - Version tagging strategy

- **Monitoring & Logging:**
  - Structured logging (JSON format)
  - Error tracking (Sentry integration ready)
  - Performance monitoring hooks
  - Health check endpoints

- **Documentation:**
  - README with setup instructions
  - Architecture decision records (ADRs)
  - API documentation (auto-generated)
  - Component storybook (for web/mobile)

### 7. Code Quality & Standards

- **Linting & Formatting:**
  - ESLint + Prettier for TypeScript/JavaScript
  - Black + isort + flake8/ruff for Python
  - Pre-commit hooks (Husky)
  - Consistent code style across all projects

- **Type Safety:**
  - Strict TypeScript configuration
  - No implicit any
  - Python type hints with mypy
  - Exhaustive type checking

- **Git Workflow:**
  - Conventional commits
  - Branch naming strategy
  - PR templates
  - Semantic versioning

### 8. Security Best Practices

- **Input Validation:** All inputs validated and sanitized
- **SQL Injection Prevention:** ORM usage, parameterized queries
- **XSS Prevention:** Content sanitization, CSP headers
- **CSRF Protection:** Token-based protection
- **Secure Headers:** CORS, HSTS, X-Frame-Options
- **Rate Limiting:** API rate limiting implementation
- **Dependency Scanning:** Automated vulnerability scanning

### 9. Scalability Considerations

- **Horizontal Scaling:** Stateless API design
- **Caching Strategy:** Redis integration ready (with interfaces)
- **Database Optimization:** Indexes, query optimization, connection pooling
- **Async Processing:** Background job queue (Celery) structure
- **CDN Ready:** Static asset serving strategy
- **Microservices Ready:** Service boundaries clearly defined

## Deliverables

1. **Complete Project Structure** with all folders and boilerplate files
2. **Sample Implementation** of at least one complete feature (e.g., user authentication) demonstrating all architectural patterns
3. **Configuration Files:** All necessary config files (tsconfig, eslint, pytest.ini, docker-compose, etc.)
4. **Documentation:**
   - Architecture overview
   - Setup instructions
   - Development guidelines
   - Deployment guide
5. **Testing Examples:** Sample tests for each layer (unit, integration, e2e)
6. **CI/CD Pipeline:** Basic pipeline configuration
7. **Scripts:** Useful scripts for development (db migrations, code generation, etc.)

## Success Criteria

- ✅ Project can be cloned and run locally with minimal setup (`docker-compose up`)
- ✅ All architectural principles are clearly demonstrated
- ✅ Code is self-documenting with clear naming and minimal comments
- ✅ Tests pass and demonstrate testing strategy
- ✅ Can serve as a template for diverse project types (e-commerce, SaaS, social, etc.)
- ✅ Zero technical debt in the foundation code
- ✅ Production-ready defaults (security, performance, monitoring)

## Additional Context

This template should represent the **dream architecture** of a super senior engineer—no compromises, no shortcuts. It should be something you'd be proud to show in a technical interview or use for your own startup. Every decision should be intentional and well-documented.

Focus on **principles over frameworks**—the template should survive framework changes by having business logic decoupled from implementation details.

## Usage Instructions

Copy this entire prompt and provide it to an LLM (Claude, GPT-4, etc.) to generate the complete project template. You can customize the tech stack section based on your specific needs before running it through the LLM.
