"""Pytest configuration and fixtures."""

import asyncio
import os
from collections.abc import AsyncGenerator, Generator

import pytest
from google.cloud.firestore_v1 import AsyncClient
from httpx import AsyncClient as HTTPAsyncClient

from src.infrastructure.database import get_db, initialize_firebase
from src.main import app

# Set Firebase emulator environment variables for testing
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
os.environ["FIREBASE_PROJECT_ID"] = "test-project"


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


@pytest.fixture(scope="function")
async def client(db_client: AsyncClient) -> AsyncGenerator[HTTPAsyncClient, None]:
    """Create test HTTP client."""

    async def override_get_db() -> AsyncClient:
        return db_client

    app.dependency_overrides[get_db] = override_get_db

    async with HTTPAsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
