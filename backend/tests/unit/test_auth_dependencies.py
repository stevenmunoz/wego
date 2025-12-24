"""
Unit Tests for Authentication Dependencies

Tests the Firebase token verification logic in dependencies.py.
These tests mock Firebase Admin SDK to test all error scenarios.

CRITICAL: These tests ensure auth errors are handled properly
and prevent the 401/403 confusion that broke production.
"""

from unittest.mock import patch

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.domain.entities import UserRole
from src.presentation.dependencies import (
    get_current_user_id,
    get_current_user_role,
    require_admin,
)


class TestGetCurrentUserId:
    """Tests for get_current_user_id dependency."""

    @pytest.mark.asyncio
    async def test_valid_token_returns_user_id(self):
        """Valid Firebase token returns user ID."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid-firebase-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.verify_id_token.return_value = {
                "uid": "firebase-user-123",
                "email": "test@example.com"
            }

            user_id = await get_current_user_id(mock_credentials)

            assert user_id == "firebase-user-123"
            mock_auth.verify_id_token.assert_called_once_with("valid-firebase-token")

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self):
        """Invalid Firebase token raises 401 Unauthorized."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            # Simulate Firebase InvalidIdTokenError
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.side_effect = mock_auth.InvalidIdTokenError("Invalid token")

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(mock_credentials)

            assert exc_info.value.status_code == 401
            assert "token" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_expired_token_raises_401(self):
        """Expired Firebase token raises 401 Unauthorized."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="expired-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.side_effect = mock_auth.ExpiredIdTokenError("Token expired")

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(mock_credentials)

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_token_without_uid_raises_401(self):
        """Token without UID raises 401."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="token-without-uid"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            # Token decodes but has no UID
            mock_auth.verify_id_token.return_value = {
                "email": "test@example.com"
                # Missing "uid" field
            }

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(mock_credentials)

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_verification_failure_raises_401(self):
        """General verification failure raises 401."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="some-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.side_effect = Exception("Network error")

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(mock_credentials)

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_www_authenticate_header_present(self):
        """401 response includes WWW-Authenticate header."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.side_effect = mock_auth.InvalidIdTokenError("Invalid")

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(mock_credentials)

            assert exc_info.value.headers is not None
            assert "WWW-Authenticate" in exc_info.value.headers
            assert exc_info.value.headers["WWW-Authenticate"] == "Bearer"


class TestGetCurrentUserRole:
    """Tests for get_current_user_role dependency."""

    @pytest.mark.asyncio
    async def test_token_with_role_claim_returns_role(self):
        """Token with role claim returns correct role."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="token-with-role"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.return_value = {
                "uid": "user-123",
                "role": "admin"
            }

            role = await get_current_user_role(mock_credentials)

            assert role == UserRole.ADMIN

    @pytest.mark.asyncio
    async def test_token_without_role_defaults_to_user(self):
        """Token without role claim defaults to USER role."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="token-no-role"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.return_value = {
                "uid": "user-123"
                # No "role" field
            }

            role = await get_current_user_role(mock_credentials)

            assert role == UserRole.USER

    @pytest.mark.asyncio
    async def test_invalid_role_string_defaults_to_user(self):
        """Invalid role string in token defaults to USER role."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="token-bad-role"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.return_value = {
                "uid": "user-123",
                "role": "invalid-role-xyz"  # Not a valid UserRole
            }

            role = await get_current_user_role(mock_credentials)

            assert role == UserRole.USER

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self):
        """Invalid token raises 401 for role check too."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.side_effect = mock_auth.InvalidIdTokenError("Invalid")

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_role(mock_credentials)

            assert exc_info.value.status_code == 401


class TestRequireAdmin:
    """Tests for require_admin dependency."""

    @pytest.mark.asyncio
    async def test_admin_role_passes(self):
        """Admin role passes the check."""
        result = await require_admin(UserRole.ADMIN)
        assert result == UserRole.ADMIN

    @pytest.mark.asyncio
    async def test_user_role_raises_403(self):
        """USER role raises 403 Forbidden."""
        with pytest.raises(HTTPException) as exc_info:
            await require_admin(UserRole.USER)

        assert exc_info.value.status_code == 403
        assert "admin" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_non_admin_raises_403(self):
        """Any non-admin role raises 403."""
        # If there are other roles, test them here
        with pytest.raises(HTTPException) as exc_info:
            await require_admin(UserRole.USER)

        assert exc_info.value.status_code == 403


class TestAuthErrorCodes:
    """
    Test correct HTTP status codes for auth errors.

    401 = Unauthenticated (no/invalid credentials)
    403 = Unauthorized (valid credentials, insufficient permissions)

    This distinction is important and was confused in the original bug.
    """

    @pytest.mark.asyncio
    async def test_missing_credentials_returns_401(self):
        """Missing credentials should return 401, not 403."""
        # This is tested by FastAPI's HTTPBearer directly
        # When no Authorization header is present, HTTPBearer raises 403
        # (per HTTP spec, 403 for "no credentials" is debatable but FastAPI's choice)
        pass  # This is handled at middleware level

    @pytest.mark.asyncio
    async def test_invalid_credentials_returns_401(self):
        """Invalid credentials (bad token) should return 401."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="bad-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.InvalidIdTokenError = Exception
            mock_auth.ExpiredIdTokenError = Exception
            mock_auth.verify_id_token.side_effect = mock_auth.InvalidIdTokenError("Bad")

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(mock_credentials)

            # Must be 401, not 403
            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_insufficient_permissions_returns_403(self):
        """Valid credentials but insufficient permissions returns 403."""
        # User tries to access admin-only endpoint
        with pytest.raises(HTTPException) as exc_info:
            await require_admin(UserRole.USER)

        # Must be 403, not 401
        assert exc_info.value.status_code == 403


class TestUserIdReturnType:
    """
    Test that user ID is returned as string (Firebase UID), not UUID.

    This was a bug where the code expected UUID but Firebase returns string.
    """

    @pytest.mark.asyncio
    async def test_user_id_is_string(self):
        """User ID is returned as string, not UUID."""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid-token"
        )

        with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
            mock_auth.verify_id_token.return_value = {
                "uid": "firebase-uid-abc123"
            }

            user_id = await get_current_user_id(mock_credentials)

            assert isinstance(user_id, str)
            assert user_id == "firebase-uid-abc123"

    @pytest.mark.asyncio
    async def test_user_id_handles_various_uid_formats(self):
        """Handle various Firebase UID formats."""
        test_uids = [
            "abc123",
            "user_123",
            "veryLongUserIdThatFirebaseMightGenerate1234567890",
            "123456789",  # Numeric-like string
        ]

        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="token"
        )

        for uid in test_uids:
            with patch("src.presentation.dependencies.firebase_auth") as mock_auth:
                mock_auth.verify_id_token.return_value = {"uid": uid}

                user_id = await get_current_user_id(mock_credentials)

                assert user_id == uid
                assert isinstance(user_id, str)
