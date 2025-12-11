"""API v1 router combining all endpoints."""

from fastapi import APIRouter

from src.presentation.api.v1.endpoints import auth, users
from src.presentation.api.v1.endpoints.agents import chat
from src.presentation.api.v1.endpoints.indriver import router as indriver_router

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(chat.router)
api_router.include_router(indriver_router)
