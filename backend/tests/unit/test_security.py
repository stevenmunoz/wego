"""Unit tests for security module."""

from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from jose import jwt

from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
    verify_token_type,
)
from src.core.exceptions import UnauthorizedException


# Mock settings for testing
class MockSettings:
    JWT_SECRET = "test-secret-key-for-testing"
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7


@pytest.fixture(autouse=True)
def mock_settings():
    """Mock settings for all tests in this module."""
    with patch("src.core.security.settings", MockSettings()):
        yield


class TestPasswordHashing:
    """Test cases for password hashing functions."""

    def test_get_password_hash_returns_different_value(self) -> None:
        """Test that hashing returns a different value than input."""
        password = "my_secure_password"
        hashed = get_password_hash(password)

        assert hashed != password
        assert len(hashed) > len(password)

    def test_get_password_hash_returns_different_hash_each_time(self) -> None:
        """Test that hashing the same password produces different hashes (due to salt)."""
        password = "my_secure_password"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2

    def test_verify_password_correct(self) -> None:
        """Test that correct password verifies successfully."""
        password = "my_secure_password"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self) -> None:
        """Test that incorrect password fails verification."""
        password = "my_secure_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty_password(self) -> None:
        """Test verification with empty password."""
        password = "my_secure_password"
        hashed = get_password_hash(password)

        assert verify_password("", hashed) is False


class TestAccessToken:
    """Test cases for access token creation."""

    def test_create_access_token_contains_data(self) -> None:
        """Test that access token contains the provided data."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)

        # Decode the token to verify contents
        payload = jwt.decode(
            token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"

    def test_create_access_token_has_type(self) -> None:
        """Test that access token has correct type."""
        data = {"sub": "user123"}
        token = create_access_token(data)

        payload = jwt.decode(
            token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        assert payload["type"] == "access"

    def test_create_access_token_has_expiration(self) -> None:
        """Test that access token has expiration claim."""
        data = {"sub": "user123"}
        token = create_access_token(data)

        payload = jwt.decode(
            token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        assert "exp" in payload
        assert "iat" in payload

    def test_create_access_token_custom_expiration(self) -> None:
        """Test access token with custom expiration delta."""
        data = {"sub": "user123"}
        expires_delta = timedelta(hours=2)
        token = create_access_token(data, expires_delta=expires_delta)

        payload = jwt.decode(
            token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        # Check that expiration is approximately 2 hours from now
        exp_time = datetime.fromtimestamp(payload["exp"])
        iat_time = datetime.fromtimestamp(payload["iat"])
        diff = exp_time - iat_time

        # Allow for small timing differences
        assert 7100 < diff.total_seconds() < 7300  # ~2 hours


class TestRefreshToken:
    """Test cases for refresh token creation."""

    def test_create_refresh_token_contains_data(self) -> None:
        """Test that refresh token contains the provided data."""
        data = {"sub": "user123"}
        token = create_refresh_token(data)

        payload = jwt.decode(
            token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        assert payload["sub"] == "user123"

    def test_create_refresh_token_has_type(self) -> None:
        """Test that refresh token has correct type."""
        data = {"sub": "user123"}
        token = create_refresh_token(data)

        payload = jwt.decode(
            token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        assert payload["type"] == "refresh"

    def test_create_refresh_token_longer_expiration(self) -> None:
        """Test that refresh token has longer expiration than access token."""
        data = {"sub": "user123"}
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)

        access_payload = jwt.decode(
            access_token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )
        refresh_payload = jwt.decode(
            refresh_token, MockSettings.JWT_SECRET, algorithms=[MockSettings.JWT_ALGORITHM]
        )

        # Refresh token should expire later than access token
        assert refresh_payload["exp"] > access_payload["exp"]


class TestDecodeToken:
    """Test cases for token decoding."""

    def test_decode_valid_token(self) -> None:
        """Test decoding a valid token."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)

        payload = decode_token(token)

        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"

    def test_decode_invalid_token_raises_exception(self) -> None:
        """Test that decoding an invalid token raises UnauthorizedException."""
        with pytest.raises(UnauthorizedException) as exc_info:
            decode_token("invalid.token.here")

        assert "Invalid token" in str(exc_info.value)

    def test_decode_tampered_token_raises_exception(self) -> None:
        """Test that decoding a tampered token raises exception."""
        data = {"sub": "user123"}
        token = create_access_token(data)

        # Tamper with the token by changing a character
        tampered_token = token[:-5] + "xxxxx"

        with pytest.raises(UnauthorizedException):
            decode_token(tampered_token)

    def test_decode_token_with_wrong_secret_raises_exception(self) -> None:
        """Test that token signed with different secret fails."""
        # Create a token with a different secret
        data = {"sub": "user123", "exp": datetime.utcnow() + timedelta(hours=1)}
        wrong_secret_token = jwt.encode(data, "wrong-secret", algorithm="HS256")

        with pytest.raises(UnauthorizedException):
            decode_token(wrong_secret_token)


class TestVerifyTokenType:
    """Test cases for token type verification."""

    def test_verify_access_token_type(self) -> None:
        """Test verifying access token type succeeds."""
        payload = {"sub": "user123", "type": "access"}

        # Should not raise
        verify_token_type(payload, "access")

    def test_verify_refresh_token_type(self) -> None:
        """Test verifying refresh token type succeeds."""
        payload = {"sub": "user123", "type": "refresh"}

        # Should not raise
        verify_token_type(payload, "refresh")

    def test_verify_wrong_token_type_raises_exception(self) -> None:
        """Test that wrong token type raises exception."""
        payload = {"sub": "user123", "type": "access"}

        with pytest.raises(UnauthorizedException) as exc_info:
            verify_token_type(payload, "refresh")

        assert "Expected refresh" in str(exc_info.value)
        assert "got access" in str(exc_info.value)

    def test_verify_missing_token_type_raises_exception(self) -> None:
        """Test that missing token type raises exception."""
        payload = {"sub": "user123"}  # No type field

        with pytest.raises(UnauthorizedException) as exc_info:
            verify_token_type(payload, "access")

        assert "Expected access" in str(exc_info.value)
        assert "got None" in str(exc_info.value)
