"""Repository implementations for data access using Firestore."""

from datetime import datetime
from typing import Any, cast
from uuid import UUID

from google.cloud.firestore_v1 import Client
from google.cloud.firestore_v1.base_document import DocumentSnapshot

from src.domain.entities import User, UserRole, UserStatus
from src.domain.repositories import IUserRepository


class FirestoreUserMapper:
    """Mapper to convert between User entities and Firestore documents."""

    @staticmethod
    def to_dict(user: User) -> dict[str, Any]:
        """Convert User entity to Firestore document."""
        return {
            "id": str(user.id),
            "email": user.email,
            "hashed_password": user.hashed_password,
            "full_name": user.full_name,
            "role": user.role.value,
            "status": user.status.value,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    @staticmethod
    def from_dict(data: dict[str, Any]) -> User:
        """Convert Firestore document to User entity."""
        return User(
            id=UUID(data["id"]),
            email=data["email"],
            hashed_password=data["hashed_password"],
            full_name=data["full_name"],
            role=UserRole(data["role"]),
            status=UserStatus(data["status"]),
            is_verified=data["is_verified"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )


class UserRepository(IUserRepository):
    """Firestore implementation of user repository."""

    COLLECTION_NAME = "users"

    def __init__(self, db: Client) -> None:
        self._db = db
        self._collection = db.collection(self.COLLECTION_NAME)

    async def create(self, user: User) -> User:
        """Create a new user."""
        user_dict = FirestoreUserMapper.to_dict(user)
        self._collection.document(str(user.id)).set(user_dict)
        return user

    async def get_by_id(self, user_id: UUID | str) -> User | None:
        """Get user by ID."""
        doc = cast(DocumentSnapshot, self._collection.document(str(user_id)).get())
        if not doc.exists:
            return None
        return FirestoreUserMapper.from_dict(doc.to_dict())

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        query = self._collection.where("email", "==", email).limit(1)
        docs = list(query.stream())

        if not docs:
            return None

        return FirestoreUserMapper.from_dict(docs[0].to_dict())

    async def update(self, user: User) -> User:
        """Update existing user."""
        user.updated_at = datetime.utcnow()
        user_dict = FirestoreUserMapper.to_dict(user)
        self._collection.document(str(user.id)).update(user_dict)
        return user

    async def delete(self, user_id: UUID) -> bool:
        """Delete user by ID."""
        doc_ref = self._collection.document(str(user_id))
        doc = cast(DocumentSnapshot, doc_ref.get())

        if not doc.exists:
            return False

        doc_ref.delete()
        return True

    async def list(self, skip: int = 0, limit: int = 100) -> list[User]:
        """List users with pagination."""
        query = self._collection.offset(skip).limit(limit)
        docs = list(query.stream())
        return [FirestoreUserMapper.from_dict(doc.to_dict()) for doc in docs]

    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        query = self._collection.where("email", "==", email).limit(1)
        docs = list(query.stream())
        return len(docs) > 0
