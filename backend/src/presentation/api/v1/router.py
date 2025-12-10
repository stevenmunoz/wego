"""API v1 router combining all endpoints."""

from fastapi import APIRouter

from src.presentation.api.v1.endpoints import auth, users
from src.presentation.api.v1.endpoints.agents import chat

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(chat.router)
