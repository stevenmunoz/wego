"""Chat endpoints for agent interactions."""

from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, status
from google.cloud.firestore_v1 import AsyncClient

from src.application.agents.dtos import (
    ChatRequestDTO,
    ChatResponseDTO,
    ConversationCreateDTO,
    ConversationDetailResponseDTO,
    ConversationResponseDTO,
)
from src.application.agents.use_cases import (
    ChatUseCase,
    CreateConversationUseCase,
    GetConversationUseCase,
    ListConversationsUseCase,
)
from src.infrastructure.container import Container
from src.infrastructure.database import get_db
from src.presentation.dependencies import get_current_user_id

router = APIRouter(prefix="/chat", tags=["Agent Chat"])


@router.post("/conversations", response_model=ConversationResponseDTO, status_code=status.HTTP_201_CREATED)
@inject
async def create_conversation(
    dto: ConversationCreateDTO,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncClient = Depends(get_db),
    use_case: CreateConversationUseCase = Depends(Provide[Container.create_conversation_use_case]),
) -> ConversationResponseDTO:
    """
    Create a new conversation.

    Requires authentication.
    """
    Container.db_session.override(db)
    return await use_case.execute(current_user_id, dto)


@router.get("/conversations", response_model=list[ConversationResponseDTO])
@inject
async def list_conversations(
    skip: int = 0,
    limit: int = 100,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncClient = Depends(get_db),
    use_case: ListConversationsUseCase = Depends(Provide[Container.list_conversations_use_case]),
) -> list[ConversationResponseDTO]:
    """
    List user's conversations.

    Requires authentication.
    """
    Container.db_session.override(db)
    return await use_case.execute(current_user_id, skip=skip, limit=limit)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponseDTO)
@inject
async def get_conversation(
    conversation_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncClient = Depends(get_db),
    use_case: GetConversationUseCase = Depends(Provide[Container.get_conversation_use_case]),
) -> ConversationDetailResponseDTO:
    """
    Get conversation details with messages.

    Requires authentication.
    """
    Container.db_session.override(db)
    return await use_case.execute(conversation_id, current_user_id)


@router.post("/", response_model=ChatResponseDTO)
@inject
async def chat(
    dto: ChatRequestDTO,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncClient = Depends(get_db),
    use_case: ChatUseCase = Depends(Provide[Container.chat_use_case]),
) -> ChatResponseDTO:
    """
    Send a message and get agent response.

    Requires authentication.

    If conversation_id is provided, adds to existing conversation.
    Otherwise, creates a new conversation.
    """
    Container.db_session.override(db)
    return await use_case.execute(current_user_id, dto)
