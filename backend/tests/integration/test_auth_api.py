"""Integration tests for authentication API."""

import pytest
from google.cloud.firestore_v1 import AsyncClient as FirestoreClient
from httpx import AsyncClient

from src.core.config import settings


@pytest.mark.asyncio
class TestAuthAPI:
    """Test cases for authentication API endpoints."""

    async def test_login_success(self, client: AsyncClient, db_client: FirestoreClient) -> None:
        """Test successful login."""
        # First create a user
        user_data = {
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
        }
        create_response = await client.post(f"{settings.API_V1_PREFIX}/users/", json=user_data)
        assert create_response.status_code == 201

        # Then login
        login_data = {
            "email": "test@example.com",
            "password": "password123",
        }
        response = await client.post(f"{settings.API_V1_PREFIX}/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(self, client: AsyncClient) -> None:
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword",
        }
        response = await client.post(f"{settings.API_V1_PREFIX}/auth/login", json=login_data)

        assert response.status_code == 401

    async def test_logout(self, client: AsyncClient) -> None:
        """Test logout endpoint."""
        response = await client.post(f"{settings.API_V1_PREFIX}/auth/logout")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
