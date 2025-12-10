"""Domain services containing business logic that doesn't belong to entities."""

from typing import Protocol

from src.core.security import verify_password
from src.domain.entities import User
from src.domain.repositories import IUserRepository


class IAuthenticationService(Protocol):
    """Interface for authentication service."""

    async def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate user with email and password."""
        ...


class AuthenticationService:
    """Domain service for user authentication."""

    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    async def authenticate_user(self, email: str, password: str) -> User | None:
        """
        Authenticate user with email and password.

        Returns:
            User if authentication successful, None otherwise.
        """
        user = await self._user_repository.get_by_email(email)

        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        if not user.is_active():
            return None

        return user
