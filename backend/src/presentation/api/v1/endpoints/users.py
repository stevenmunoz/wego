"""User management endpoints."""

from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, status

from src.application.dtos import UserCreateDTO, UserResponseDTO, UserUpdateDTO
from src.application.use_cases.user_use_cases import (
    CreateUserUseCase,
    DeleteUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
)
from src.domain.entities import UserRole
from src.infrastructure.container import Container
from src.presentation.dependencies import get_current_user_id, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=UserResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
@inject
async def create_user(
    dto: UserCreateDTO,
    use_case: CreateUserUseCase = Depends(Provide[Container.create_user_use_case]),
) -> UserResponseDTO:
    """
    Create a new user.

    Public endpoint for user registration.
    """
    return await use_case.execute(dto)


@router.get("/me", response_model=UserResponseDTO)
@inject
async def get_current_user(
    current_user_id: str = Depends(get_current_user_id),
    use_case: GetUserUseCase = Depends(Provide[Container.get_user_use_case]),
) -> UserResponseDTO:
    """
    Get current user profile.

    Requires authentication.
    """
    return await use_case.execute(current_user_id)


@router.put("/me", response_model=UserResponseDTO)
@inject
async def update_current_user(
    dto: UserUpdateDTO,
    current_user_id: str = Depends(get_current_user_id),
    use_case: UpdateUserUseCase = Depends(Provide[Container.update_user_use_case]),
) -> UserResponseDTO:
    """
    Update current user profile.

    Requires authentication.
    """
    return await use_case.execute(current_user_id, dto)


@router.get("/", response_model=list[UserResponseDTO])
@inject
async def list_users(
    skip: int = 0,
    limit: int = 100,
    use_case: ListUsersUseCase = Depends(Provide[Container.list_users_use_case]),
    _: UserRole = Depends(require_admin),
) -> list[UserResponseDTO]:
    """
    List all users.

    Requires admin role.
    """
    return await use_case.execute(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponseDTO)
@inject
async def get_user(
    user_id: UUID,
    use_case: GetUserUseCase = Depends(Provide[Container.get_user_use_case]),
    _: UserRole = Depends(require_admin),
) -> UserResponseDTO:
    """
    Get user by ID.

    Requires admin role.
    """
    return await use_case.execute(user_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def delete_user(
    user_id: UUID,
    use_case: DeleteUserUseCase = Depends(Provide[Container.delete_user_use_case]),
    _: UserRole = Depends(require_admin),
) -> None:
    """
    Delete user by ID.

    Requires admin role.
    """
    await use_case.execute(user_id)
