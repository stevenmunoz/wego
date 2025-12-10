# Clean Architecture

This project implements Clean Architecture principles to ensure maintainability, testability, and scalability.

## Layers Overview

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (API Routes, UI Components)          │
│  - FastAPI routes                       │
│  - React components                     │
│  - Request/Response handling            │
├─────────────────────────────────────────┤
│         Application Layer               │
│      (Use Cases, DTOs, Services)        │
│  - Business workflows                   │
│  - Application-specific logic           │
│  - Data transformation                  │
├─────────────────────────────────────────┤
│           Domain Layer                  │
│   (Business Logic, Entities, Interfaces)│
│  - Core business rules                  │
│  - Domain entities                      │
│  - Repository interfaces                │
├─────────────────────────────────────────┤
│       Infrastructure Layer              │
│  (Database, External APIs, Frameworks)  │
│  - Database implementations             │
│  - External service integrations        │
│  - Framework-specific code              │
└─────────────────────────────────────────┘
```

## Domain Layer

**Location:** `backend/src/domain/`

The domain layer is the heart of the application, containing:

- **Entities:** Core business objects (e.g., `User`, `Product`)
- **Value Objects:** Immutable objects representing values
- **Repository Interfaces:** Contracts for data access
- **Domain Services:** Business logic that doesn't fit in entities

### Principles:
- **Framework Independent:** No dependencies on external frameworks
- **Pure Business Logic:** Only business rules, no infrastructure concerns
- **Interfaces Over Implementations:** Define contracts, not implementations

### Example:

```python
# Domain Entity
class User:
    def __init__(self, id: UUID, email: str, ...):
        self.id = id
        self.email = email

    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE

# Repository Interface
class IUserRepository(ABC):
    @abstractmethod
    async def create(self, user: User) -> User:
        pass
```

## Application Layer

**Location:** `backend/src/application/`

The application layer orchestrates business workflows:

- **Use Cases:** Application-specific business operations
- **DTOs:** Data transfer objects for input/output
- **Service Interfaces:** Contracts for application services

### Principles:
- **Use Case Driven:** Each use case represents a business operation
- **DTO Validation:** Input validation using Pydantic
- **Thin Layer:** Orchestrates domain logic, doesn't contain it

### Example:

```python
class CreateUserUseCase:
    def __init__(self, user_repository: IUserRepository):
        self._user_repository = user_repository

    async def execute(self, dto: UserCreateDTO) -> UserResponseDTO:
        # 1. Validate input (done by Pydantic)
        # 2. Create domain entity
        user = User.create(...)
        # 3. Persist via repository
        created_user = await self._user_repository.create(user)
        # 4. Return DTO
        return UserResponseDTO.from_entity(created_user)
```

## Infrastructure Layer

**Location:** `backend/src/infrastructure/`

The infrastructure layer provides implementations:

- **Repository Implementations:** Concrete data access using SQLAlchemy
- **Database Configuration:** Database setup and migrations
- **External Services:** Third-party API integrations
- **Dependency Injection:** Container configuration

### Principles:
- **Implements Interfaces:** Implements domain repository interfaces
- **Framework Specific:** Can use framework-specific features
- **Replaceable:** Can swap implementations without affecting domain

### Example:

```python
class UserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, user: User) -> User:
        model = UserMapper.to_model(user)
        self._session.add(model)
        await self._session.flush()
        return UserMapper.to_entity(model)
```

## Presentation Layer

**Location:** `backend/src/presentation/`

The presentation layer handles external communication:

- **API Routes:** FastAPI endpoints
- **Request Validation:** Request schema validation
- **Response Formatting:** Response formatting
- **Error Handling:** Exception handling middleware

### Principles:
- **Thin Controllers:** Delegate to use cases
- **Input Validation:** Validate all inputs
- **Proper HTTP Status Codes:** Use correct status codes

### Example:

```python
@router.post("/users/", status_code=201)
async def create_user(
    dto: UserCreateDTO,
    use_case: CreateUserUseCase = Depends()
) -> UserResponseDTO:
    return await use_case.execute(dto)
```

## Dependency Flow

**Dependency Rule:** Dependencies should only point inward. Inner layers should not know about outer layers.

```
Presentation → Application → Domain ← Infrastructure
                                ↑
                        (implements interfaces)
```

- **Presentation** depends on **Application**
- **Application** depends on **Domain**
- **Infrastructure** depends on **Domain** (implements interfaces)
- **Domain** depends on **nothing**

## Benefits

1. **Testability:** Each layer can be tested independently
2. **Maintainability:** Changes in one layer don't affect others
3. **Flexibility:** Easy to swap implementations
4. **Business Focus:** Domain logic is isolated and clear
5. **Framework Independence:** Business logic isn't tied to frameworks

## Testing Strategy

- **Domain Layer:** Pure unit tests, no mocks needed
- **Application Layer:** Test use cases with mocked repositories
- **Infrastructure Layer:** Integration tests with real database
- **Presentation Layer:** API tests with test client
