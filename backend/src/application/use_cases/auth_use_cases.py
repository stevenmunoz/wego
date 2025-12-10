"""Use cases for authentication and authorization."""

from src.application.dtos import LoginDTO, TokenResponseDTO
from src.core.exceptions import UnauthorizedException
from src.core.logging import get_logger
from src.core.security import create_access_token, create_refresh_token, decode_token, verify_token_type
from src.domain.services import IAuthenticationService

logger = get_logger(__name__)


class LoginUseCase:
    """Use case for user login."""

    def __init__(self, auth_service: IAuthenticationService) -> None:
        self._auth_service = auth_service

    async def execute(self, dto: LoginDTO) -> TokenResponseDTO:
        """
        Execute login use case.

        Args:
            dto: Login credentials

        Returns:
            Authentication tokens

        Raises:
            UnauthorizedException: If credentials are invalid
        """
        logger.info(f"Login attempt for email: {dto.email}")

        # Authenticate user
        user = await self._auth_service.authenticate_user(dto.email, dto.password)

        if not user:
            logger.warning(f"Failed login attempt for email: {dto.email}")
            raise UnauthorizedException("Invalid email or password")

        # Create tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        logger.info(f"User logged in successfully: {user.id}")

        return TokenResponseDTO(
            access_token=access_token,
            refresh_token=refresh_token,
        )


class RefreshTokenUseCase:
    """Use case for refreshing access token."""

    async def execute(self, refresh_token: str) -> TokenResponseDTO:
        """
        Execute token refresh use case.

        Args:
            refresh_token: Refresh token

        Returns:
            New authentication tokens

        Raises:
            UnauthorizedException: If refresh token is invalid
        """
        # Decode and verify refresh token
        payload = decode_token(refresh_token)
        verify_token_type(payload, "refresh")

        # Create new tokens
        token_data = {
            "sub": payload["sub"],
            "email": payload["email"],
            "role": payload["role"],
        }

        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        logger.info(f"Token refreshed for user: {payload['sub']}")

        return TokenResponseDTO(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )
