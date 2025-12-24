"""Pytest configuration and fixtures."""

import asyncio
import os
import uuid
from collections.abc import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from google.cloud.firestore_v1 import AsyncClient
from httpx import AsyncClient as HTTPAsyncClient

from src.domain.entities import UserRole
from src.infrastructure.database import get_db, initialize_firebase
from src.main import app
from src.presentation.dependencies import get_current_user_id, get_current_user_role

# Set Firebase emulator environment variables for testing
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
os.environ["FIREBASE_PROJECT_ID"] = "test-project"


def generate_test_user_id() -> str:
    """Generate a unique test user ID to prevent collisions with production data."""
    return f"test-user-{uuid.uuid4().hex[:12]}"


def generate_test_admin_id() -> str:
    """Generate a unique test admin ID to prevent collisions with production data."""
    return f"test-admin-{uuid.uuid4().hex[:12]}"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def setup_firebase():
    """Initialize Firebase for testing."""
    # Initialize Firebase with test configuration
    initialize_firebase()
    yield


@pytest.fixture(scope="function")
async def db_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Create test Firestore client.

    Note: This fixture provides access to the Firestore emulator.
    Make sure the Firebase emulator is running on localhost:8080
    """
    client = get_db()
    yield client

    # Clean up test data after each test
    # Delete all collections (you can customize this based on your needs)
    collections = ["users", "conversations", "messages", "executions"]
    for collection_name in collections:
        collection_ref = client.collection(collection_name)
        docs = collection_ref.stream()
        async for doc in docs:
            await doc.reference.delete()


# ============================================================================
# Authentication Fixtures
# ============================================================================

@pytest.fixture
def mock_user_id() -> str:
    """Generate a unique test user ID for each test run."""
    return generate_test_user_id()


@pytest.fixture
def mock_admin_user_id() -> str:
    """Generate a unique test admin user ID for each test run."""
    return generate_test_admin_id()


@pytest.fixture
def authenticated_client(mock_user_id: str) -> TestClient:
    """
    Create test client with authentication bypassed.

    This fixture overrides the get_current_user_id dependency to return
    a test user ID, simulating an authenticated user.
    """
    async def override_get_current_user_id() -> str:
        return mock_user_id

    async def override_get_current_user_role() -> UserRole:
        return UserRole.USER

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    app.dependency_overrides[get_current_user_role] = override_get_current_user_role

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(mock_admin_user_id: str) -> TestClient:
    """
    Create test client with admin authentication.

    This fixture overrides auth dependencies to simulate an admin user.
    """
    async def override_get_current_user_id() -> str:
        return mock_admin_user_id

    async def override_get_current_user_role() -> UserRole:
        return UserRole.ADMIN

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    app.dependency_overrides[get_current_user_role] = override_get_current_user_role

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client() -> TestClient:
    """
    Create test client WITHOUT authentication override.

    This client will trigger real authentication checks, which should
    fail with 401/403 errors when no valid token is provided.
    """
    # Clear any existing overrides to ensure real auth is used
    app.dependency_overrides.clear()
    return TestClient(app)


@pytest.fixture(scope="function")
async def client(db_client: AsyncClient) -> AsyncGenerator[HTTPAsyncClient, None]:
    """Create test HTTP client with DB override."""

    async def override_get_db() -> AsyncClient:
        return db_client

    app.dependency_overrides[get_db] = override_get_db

    async with HTTPAsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def authenticated_async_client(
    db_client: AsyncClient, mock_user_id: str
) -> AsyncGenerator[HTTPAsyncClient, None]:
    """Create authenticated async HTTP client."""

    async def override_get_db() -> AsyncClient:
        return db_client

    async def override_get_current_user_id() -> str:
        return mock_user_id

    async def override_get_current_user_role() -> UserRole:
        return UserRole.USER

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    app.dependency_overrides[get_current_user_role] = override_get_current_user_role

    async with HTTPAsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
