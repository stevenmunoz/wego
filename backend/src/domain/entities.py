"""Domain entities representing core business objects."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class UserStatus(str, Enum):
    """User status enumeration."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class User:
    """User domain entity representing a user in the system."""

    def __init__(
        self,
        id: UUID,
        email: str,
        hashed_password: str,
        full_name: str,
        role: UserRole = UserRole.USER,
        status: UserStatus = UserStatus.ACTIVE,
        is_verified: bool = False,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ) -> None:
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.full_name = full_name
        self.role = role
        self.status = status
        self.is_verified = is_verified
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def is_active(self) -> bool:
        """Check if user is active."""
        return self.status == UserStatus.ACTIVE

    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN

    def verify_email(self) -> None:
        """Mark user email as verified."""
        self.is_verified = True
        self.updated_at = datetime.utcnow()

    def suspend(self) -> None:
        """Suspend user account."""
        self.status = UserStatus.SUSPENDED
        self.updated_at = datetime.utcnow()

    def activate(self) -> None:
        """Activate user account."""
        self.status = UserStatus.ACTIVE
        self.updated_at = datetime.utcnow()

    def update_profile(self, full_name: str) -> None:
        """Update user profile information."""
        self.full_name = full_name
        self.updated_at = datetime.utcnow()

    @staticmethod
    def create(
        email: str,
        hashed_password: str,
        full_name: str,
        role: UserRole = UserRole.USER,
    ) -> "User":
        """Factory method to create a new user."""
        return User(
            id=uuid4(),
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            status=UserStatus.ACTIVE,
            is_verified=False,
        )

    def __repr__(self) -> str:
        """String representation of user."""
        return f"<User {self.email} ({self.role.value})>"
