# Getting Started

Welcome to the Enterprise App Template! This guide will help you get up and running quickly.

## Prerequisites

Make sure you have the following installed:

- **Docker & Docker Compose** (recommended for quickest setup)
- **Python 3.11+** (for local backend development)
- **Node.js 18+** (for web and mobile development)
- **Git**

## 🚀 Quickest Way to Start

### Using Docker (Recommended)

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd scalable-app-template
```

2. **Set up environment variables**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp mobile/.env.example mobile/.env
```

3. **Start all services**

```bash
docker-compose -f docker-compose.dev.yml up
```

4. **Access the applications**

- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

The backend will automatically:
- Create the database
- Run migrations
- Start the API server

## 📱 Running the Frontend Applications

### Web App

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:3000

### Mobile App

```bash
cd mobile
npm install
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
pytest
```

### Web Tests

```bash
cd web
npm test
```

## 🔑 First Steps

### 1. Create a User Account

Using the API documentation at http://localhost:8000/docs:

1. Go to `POST /api/v1/users/` endpoint
2. Click "Try it out"
3. Enter user details:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```
4. Execute

### 2. Login

1. Go to `POST /api/v1/auth/login` endpoint
2. Enter credentials:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
3. Copy the `access_token` from the response

### 3. Access Protected Endpoints

1. Click the "Authorize" button at the top
2. Enter: `Bearer <your-access-token>`
3. Now you can access protected endpoints like `GET /api/v1/users/me`

## 📚 What to Explore Next

### Backend

- **Domain Layer** (`backend/src/domain/`) - Business entities and rules
- **Use Cases** (`backend/src/application/use_cases/`) - Application logic
- **API Routes** (`backend/src/presentation/api/`) - HTTP endpoints
- **Tests** (`backend/tests/`) - Test examples

### Frontend

- **Features** (`web/src/features/`) - Feature-based organization
- **API Client** (`web/src/core/api/`) - API integration
- **Auth Flow** (`web/src/features/auth/`) - Authentication example
- **Routing** (`web/src/routes/`) - Route configuration

### Mobile

- **Core Services** (`mobile/src/core/`) - API and auth services
- **Features** (`mobile/src/features/`) - Feature modules
- **Navigation** (`mobile/src/navigation/`) - Navigation setup

## 🏗️ Adding Your First Feature

Let's add a simple "posts" feature:

### 1. Create Domain Entity

`backend/src/domain/entities.py`:

```python
class Post:
    def __init__(self, id: UUID, title: str, content: str, author_id: UUID):
        self.id = id
        self.title = title
        self.content = content
        self.author_id = author_id
```

### 2. Create Repository Interface

`backend/src/domain/repositories.py`:

```python
class IPostRepository(ABC):
    @abstractmethod
    async def create(self, post: Post) -> Post:
        pass
```

### 3. Create Use Case

`backend/src/application/use_cases/post_use_cases.py`:

```python
class CreatePostUseCase:
    def __init__(self, post_repository: IPostRepository):
        self._post_repository = post_repository

    async def execute(self, dto: PostCreateDTO) -> PostResponseDTO:
        post = Post.create(...)
        created_post = await self._post_repository.create(post)
        return PostResponseDTO.from_entity(created_post)
```

### 4. Create API Endpoint

`backend/src/presentation/api/v1/endpoints/posts.py`:

```python
@router.post("/posts/")
async def create_post(dto: PostCreateDTO, use_case: CreatePostUseCase = Depends()):
    return await use_case.execute(dto)
```

### 5. Add to Frontend

`web/src/features/posts/components/CreatePostForm.tsx`:

```typescript
export const CreatePostForm = () => {
  const { mutate: createPost } = useCreatePost();
  // Component implementation
};
```

## 🛠️ Development Workflow

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Write code following the established patterns
- Add tests for new functionality
- Update documentation if needed

3. **Run tests**
```bash
# Backend
cd backend && pytest

# Web
cd web && npm test
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

Pre-commit hooks will automatically:
- Format your code
- Run linters
- Check types

5. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

## 📖 Next Steps

- Read [Clean Architecture](docs/architecture/CLEAN_ARCHITECTURE.md) to understand the architecture
- Check [Development Setup](docs/setup/DEVELOPMENT_SETUP.md) for detailed setup instructions
- Review [Deployment Guide](docs/deployment/DEPLOYMENT.md) when ready to deploy
- Explore the sample authentication feature to see patterns in action

## 🆘 Need Help?

- Check the [Troubleshooting](docs/setup/DEVELOPMENT_SETUP.md#troubleshooting) section
- Review existing code examples in the template
- Check the API documentation at http://localhost:8000/docs
- Look at test files for usage examples

## 🎯 Pro Tips

- Use the interactive API docs for testing endpoints
- Enable auto-reload for both backend and frontend
- Use Docker for consistent development environment
- Write tests as you develop features
- Follow the existing code patterns and structure
- Keep business logic in the domain layer
- Use dependency injection for testability

Happy coding! 🚀
