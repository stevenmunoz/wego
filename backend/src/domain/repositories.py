"""Repository interfaces defining data access contracts."""

from abc import ABC, abstractmethod
from uuid import UUID

from src.domain.entities import User


class IUserRepository(ABC):
    """Interface for user repository."""

    @abstractmethod
    async def create(self, user: User) -> User:
        """Create a new user."""
        pass

    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID."""
        pass

    @abstractmethod
    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        pass

    @abstractmethod
    async def update(self, user: User) -> User:
        """Update existing user."""
        pass

    @abstractmethod
    async def delete(self, user_id: UUID) -> bool:
        """Delete user by ID."""
        pass

    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100) -> list[User]:
        """List users with pagination."""
        pass

    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        pass
