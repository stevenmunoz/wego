"""Data Transfer Objects for application layer."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from src.domain.entities import UserRole, UserStatus


# User DTOs
class UserCreateDTO(BaseModel):
    """DTO for creating a new user."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1)
    role: UserRole = UserRole.USER


class UserUpdateDTO(BaseModel):
    """DTO for updating user profile."""

    full_name: str = Field(..., min_length=1)


class UserResponseDTO(BaseModel):
    """DTO for user response."""

    id: UUID
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Authentication DTOs
class LoginDTO(BaseModel):
    """DTO for user login."""

    email: EmailStr
    password: str


class TokenResponseDTO(BaseModel):
    """DTO for authentication token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenDTO(BaseModel):
    """DTO for token refresh."""

    refresh_token: str


# Common DTOs
class MessageResponseDTO(BaseModel):
    """DTO for simple message responses."""

    message: str


class PaginatedResponseDTO(BaseModel):
    """DTO for paginated responses."""

    items: list
    total: int
    skip: int
    limit: int
