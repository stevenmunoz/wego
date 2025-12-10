"""Use cases for user management."""

from typing import List
from uuid import UUID

from src.application.dtos import UserCreateDTO, UserResponseDTO, UserUpdateDTO
from src.core.exceptions import ConflictException, NotFoundException
from src.core.logging import get_logger
from src.core.security import get_password_hash
from src.domain.entities import User
from src.domain.repositories import IUserRepository

logger = get_logger(__name__)


class CreateUserUseCase:
    """Use case for creating a new user."""

    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    async def execute(self, dto: UserCreateDTO) -> UserResponseDTO:
        """
        Execute user creation use case.

        Args:
            dto: User creation data

        Returns:
            Created user data

        Raises:
            ConflictException: If user with email already exists
        """
        logger.info(f"Creating new user with email: {dto.email}")

        # Check if user already exists
        if await self._user_repository.exists_by_email(dto.email):
            raise ConflictException(f"User with email {dto.email} already exists")

        # Hash password
        hashed_password = get_password_hash(dto.password)

        # Create user entity
        user = User.create(
            email=dto.email,
            hashed_password=hashed_password,
            full_name=dto.full_name,
            role=dto.role,
        )

        # Persist user
        created_user = await self._user_repository.create(user)

        logger.info(f"User created successfully: {created_user.id}")

        return UserResponseDTO.model_validate(created_user)


class GetUserUseCase:
    """Use case for retrieving user by ID."""

    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    async def execute(self, user_id: UUID) -> UserResponseDTO:
        """
        Execute get user use case.

        Args:
            user_id: User ID

        Returns:
            User data

        Raises:
            NotFoundException: If user not found
        """
        user = await self._user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")

        return UserResponseDTO.model_validate(user)


class UpdateUserUseCase:
    """Use case for updating user profile."""

    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    async def execute(self, user_id: UUID, dto: UserUpdateDTO) -> UserResponseDTO:
        """
        Execute update user use case.

        Args:
            user_id: User ID
            dto: Update data

        Returns:
            Updated user data

        Raises:
            NotFoundException: If user not found
        """
        user = await self._user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")

        # Update user entity
        user.update_profile(full_name=dto.full_name)

        # Persist changes
        updated_user = await self._user_repository.update(user)

        logger.info(f"User updated successfully: {updated_user.id}")

        return UserResponseDTO.model_validate(updated_user)


class ListUsersUseCase:
    """Use case for listing users."""

    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    async def execute(self, skip: int = 0, limit: int = 100) -> List[UserResponseDTO]:
        """
        Execute list users use case.

        Args:
            skip: Number of users to skip
            limit: Maximum number of users to return

        Returns:
            List of users
        """
        users = await self._user_repository.list(skip=skip, limit=limit)
        return [UserResponseDTO.model_validate(user) for user in users]


class DeleteUserUseCase:
    """Use case for deleting a user."""

    def __init__(self, user_repository: IUserRepository) -> None:
        self._user_repository = user_repository

    async def execute(self, user_id: UUID) -> bool:
        """
        Execute delete user use case.

        Args:
            user_id: User ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If user not found
        """
        user = await self._user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")

        result = await self._user_repository.delete(user_id)

        logger.info(f"User deleted successfully: {user_id}")

        return result
