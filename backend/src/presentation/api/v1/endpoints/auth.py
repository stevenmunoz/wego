"""Authentication endpoints."""

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends

from src.application.dtos import LoginDTO, MessageResponseDTO, RefreshTokenDTO, TokenResponseDTO
from src.application.use_cases.auth_use_cases import LoginUseCase, RefreshTokenUseCase
from src.infrastructure.container import Container

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponseDTO)
@inject
async def login(
    dto: LoginDTO,
    use_case: LoginUseCase = Depends(Provide[Container.login_use_case]),
) -> TokenResponseDTO:
    """
    Login with email and password.

    Returns JWT access and refresh tokens.
    """
    return await use_case.execute(dto)


@router.post("/refresh", response_model=TokenResponseDTO)
@inject
async def refresh_token(
    dto: RefreshTokenDTO,
    use_case: RefreshTokenUseCase = Depends(Provide[Container.refresh_token_use_case]),
) -> TokenResponseDTO:
    """
    Refresh access token using refresh token.

    Returns new JWT access and refresh tokens.
    """
    return await use_case.execute(dto.refresh_token)


@router.post("/logout", response_model=MessageResponseDTO)
async def logout() -> MessageResponseDTO:
    """
    Logout user.

    Note: Since we're using stateless JWT, logout is handled client-side
    by removing the tokens. This endpoint is here for API completeness.
    """
    return MessageResponseDTO(message="Logged out successfully")
