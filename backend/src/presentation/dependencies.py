"""FastAPI dependencies for request handling."""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.exceptions import UnauthorizedException
from src.core.security import decode_token
from src.domain.entities import UserRole
from src.infrastructure.container import Container

# Security scheme
security = HTTPBearer()


async def get_container() -> Container:
    """Get dependency injection container."""
    return Container()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UUID:
    """
    Get current user ID from JWT token.

    Args:
        credentials: Authorization credentials

    Returns:
        User ID from token

    Raises:
        HTTPException: If token is invalid
    """
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = UUID(payload.get("sub"))
        return user_id
    except (UnauthorizedException, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_role(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserRole:
    """
    Get current user role from JWT token.

    Args:
        credentials: Authorization credentials

    Returns:
        User role from token

    Raises:
        HTTPException: If token is invalid
    """
    try:
        token = credentials.credentials
        payload = decode_token(token)
        role_str = payload.get("role")
        return UserRole(role_str)
    except (UnauthorizedException, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
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
