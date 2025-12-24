"""FastAPI dependencies for request handling."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from src.domain.entities import UserRole
from src.infrastructure.container import Container

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


async def get_container() -> Container:
    """Get dependency injection container."""
    return Container()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Get current user ID from Firebase ID token.

    Args:
        credentials: Authorization credentials containing Firebase ID token

    Returns:
        User ID (Firebase UID) from token

    Raises:
        HTTPException: If token is invalid
    """
    try:
        token = credentials.credentials
        # Verify Firebase ID token
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
        if not user_id:
            raise ValueError("No user ID in token")
        return user_id
    except (ValueError, firebase_auth.InvalidIdTokenError, firebase_auth.ExpiredIdTokenError) as e:
        # Log only exception type to avoid leaking implementation details
        logger.warning(f"Token validation failed: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except Exception as e:
        # Log only exception type to avoid leaking implementation details
        logger.error(f"Token verification error: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_role(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserRole:
    """
    Get current user role from Firebase ID token custom claims.

    Args:
        credentials: Authorization credentials containing Firebase ID token

    Returns:
        User role from token custom claims (defaults to USER if not set)

    Raises:
        HTTPException: If token is invalid
    """
    try:
        token = credentials.credentials
        # Verify Firebase ID token
        decoded_token = firebase_auth.verify_id_token(token)
        # Get role from custom claims (set via Firebase Admin SDK)
        role_str = decoded_token.get("role", "user")
        try:
            return UserRole(role_str)
        except ValueError:
            # Default to USER role if role string is invalid
            return UserRole.USER
    except (firebase_auth.InvalidIdTokenError, firebase_auth.ExpiredIdTokenError) as e:
        # Log only exception type to avoid leaking implementation details
        logger.warning(f"Token validation failed for role check: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except Exception as e:
        # Log only exception type to avoid leaking implementation details
        logger.error(f"Token verification error for role check: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def require_admin(
    role: UserRole = Depends(get_current_user_role),
) -> UserRole:
    """
    Require admin role.

    Args:
        role: Current user role

    Returns:
        User role if admin

    Raises:
        HTTPException: If user is not admin
    """
    if role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return role
