"""
Authentication Tests for InDriver API Endpoints

These tests verify that:
1. Unauthenticated requests are rejected with 401/403
2. Authenticated requests succeed
3. Invalid tokens are rejected

CRITICAL: These tests prevent the auth flow from breaking silently.
"""

import io
from unittest.mock import MagicMock, patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from PIL import Image

from src.main import app


@pytest.fixture
def sample_image_bytes():
    """Create a sample test image."""
    img = Image.new("RGB", (100, 100), color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


class TestExtractEndpointAuth:
    """Authentication tests for /api/v1/indriver/extract endpoint."""

    def test_extract_without_auth_returns_401_or_403(self, unauthenticated_client, sample_image_bytes):
        """
        Request without authentication is rejected.

        This is the CRITICAL test that was missing - it ensures
        unauthenticated requests cannot access the extract endpoint.
        """
        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True, results=[], errors=[],
                summary=MagicMock(total_files=1, successful_extractions=0, failed_extractions=1, average_confidence=0.0)
            )

            response = unauthenticated_client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.png", sample_image_bytes, "image/png")},
            )

        # Should be 401 Unauthorized or 403 Forbidden
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ], f"Expected 401 or 403, got {response.status_code}: {response.json()}"

    def test_extract_with_invalid_bearer_token_returns_401(self, sample_image_bytes):
        """Request with invalid bearer token is rejected."""
        client = TestClient(app)
        app.dependency_overrides.clear()  # Ensure real auth is used

        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True, results=[], errors=[],
                summary=MagicMock(total_files=1, successful_extractions=0, failed_extractions=1, average_confidence=0.0)
            )

            response = client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.png", sample_image_bytes, "image/png")},
                headers={"Authorization": "Bearer invalid-token-12345"},
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_extract_with_wrong_auth_scheme_returns_403(self, sample_image_bytes):
        """Request with wrong auth scheme (not Bearer) is rejected."""
        client = TestClient(app)
        app.dependency_overrides.clear()

        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True, results=[], errors=[],
                summary=MagicMock(total_files=1, successful_extractions=0, failed_extractions=1, average_confidence=0.0)
            )

            response = client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.png", sample_image_bytes, "image/png")},
                headers={"Authorization": "Basic dXNlcjpwYXNz"},  # Basic auth
            )

        # HTTPBearer returns 403 for wrong scheme
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_extract_with_valid_auth_succeeds(self, authenticated_client, sample_image_bytes):
        """
        Authenticated request succeeds.

        This test uses the authenticated_client fixture which overrides
        the auth dependency to simulate a logged-in user.
        """
        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True,
                results=[],
                errors=[],
                summary=MagicMock(
                    total_files=1,
                    successful_extractions=0,
                    failed_extractions=1,
                    average_confidence=0.0,
                ),
            )

            response = authenticated_client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.png", sample_image_bytes, "image/png")},
            )

        # Should succeed (not 401/403)
        assert response.status_code not in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ], f"Auth should have succeeded, got {response.status_code}"


class TestImportEndpointAuth:
    """Authentication tests for /api/v1/indriver/import endpoint."""

    def test_import_without_auth_returns_401_or_403(self, unauthenticated_client):
        """Import endpoint requires authentication."""
        response = unauthenticated_client.post(
            "/api/v1/indriver/import",
            json={"rides": [], "driver_id": "test-driver"},
        )

        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_import_with_valid_auth_succeeds(self, authenticated_client):
        """Authenticated import request is processed (may return 400 for empty rides, but not 401/403)."""
        response = authenticated_client.post(
            "/api/v1/indriver/import",
            json={"rides": [], "driver_id": "test-driver"},
        )

        # 400 is expected for empty rides, but NOT 401/403
        assert response.status_code not in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


class TestExportEndpointAuth:
    """Authentication tests for /api/v1/indriver/export endpoint."""

    def test_export_without_auth_returns_401_or_403(self, unauthenticated_client):
        """Export endpoint requires authentication."""
        response = unauthenticated_client.post(
            "/api/v1/indriver/export",
            json={"rides": [], "format": "csv"},
        )

        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_export_with_valid_auth_succeeds(self, authenticated_client):
        """Authenticated export request is processed."""
        response = authenticated_client.post(
            "/api/v1/indriver/export",
            json={"rides": [], "format": "csv"},
        )

        # 400 is expected for empty rides, but NOT 401/403
        assert response.status_code not in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


class TestValidateEndpointAuth:
    """Authentication tests for /api/v1/indriver/validate endpoint."""

    def test_validate_without_auth_returns_401_or_403(self, unauthenticated_client):
        """Validate endpoint requires authentication."""
        response = unauthenticated_client.post(
            "/api/v1/indriver/validate",
            json={"id": "test", "status": "completed"},
        )

        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


class TestStatsEndpointAuth:
    """Authentication tests for /api/v1/indriver/stats endpoint."""

    def test_stats_without_auth_returns_401_or_403(self, unauthenticated_client):
        """Stats endpoint requires authentication."""
        response = unauthenticated_client.get("/api/v1/indriver/stats")

        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_stats_with_valid_auth_succeeds(self, authenticated_client):
        """Authenticated stats request succeeds."""
        response = authenticated_client.get("/api/v1/indriver/stats")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_extractions" in data
        assert "tesseract_available" in data


class TestAuthErrorMessages:
    """Test that auth errors return proper error messages."""

    def test_missing_auth_header_message(self, unauthenticated_client):
        """Missing auth header returns helpful error."""
        response = unauthenticated_client.get("/api/v1/indriver/stats")

        # Should get 401 or 403, and have some detail
        assert response.status_code in [401, 403]
        # The response should be JSON with a detail field
        data = response.json()
        assert "detail" in data

    def test_invalid_token_message(self):
        """Invalid token returns helpful error."""
        client = TestClient(app)
        app.dependency_overrides.clear()

        response = client.get(
            "/api/v1/indriver/stats",
            headers={"Authorization": "Bearer clearly-invalid-token"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "detail" in data
        # Should mention token issue
        detail_lower = data["detail"].lower()
        assert any(word in detail_lower for word in ["token", "invalid", "verification", "failed"])
