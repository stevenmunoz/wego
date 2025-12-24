"""DTOs for agent application layer."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from src.domain.agents.entities import AgentRole, AgentStatus, MessageRole


# Message DTOs
class MessageCreateDTO(BaseModel):
    """DTO for creating a message."""

    role: MessageRole
    content: str
    metadata: dict[str, Any] | None = None


class MessageResponseDTO(BaseModel):
    """DTO for message response."""

    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    metadata: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# Conversation DTOs
class ConversationCreateDTO(BaseModel):
    """DTO for creating a conversation."""

    title: str
    agent_config: dict[str, Any] = Field(
        default_factory=lambda: {
            "role": "assistant",
            "temperature": 0.7,
            "max_tokens": 2000,
        }
    )
    metadata: dict[str, Any] | None = None


class ConversationResponseDTO(BaseModel):
    """DTO for conversation response."""

    id: UUID
    user_id: UUID | str
    title: str
    agent_config: dict[str, Any]
    message_count: int
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponseDTO(ConversationResponseDTO):
    """DTO for detailed conversation response with messages."""

    messages: list[MessageResponseDTO]


# Chat DTOs
class ChatRequestDTO(BaseModel):
    """DTO for chat request."""

    message: str
    conversation_id: UUID | None = None
    agent_config: dict[str, Any] | None = None
    use_rag: bool = False
    stream: bool = False


class ChatResponseDTO(BaseModel):
    """DTO for chat response."""

    conversation_id: UUID
    message: MessageResponseDTO
    usage: dict[str, Any] | None = None
    execution_id: UUID | None = None


# Tool DTOs
class ToolCreateDTO(BaseModel):
    """DTO for creating a tool."""

    name: str
    description: str
    parameters_schema: dict[str, Any]
    enabled: bool = True
    metadata: dict[str, Any] | None = None


class ToolResponseDTO(BaseModel):
    """DTO for tool response."""

    id: UUID
    name: str
    description: str
    parameters_schema: dict[str, Any]
    enabled: bool
    metadata: dict[str, Any]

    class Config:
        from_attributes = True


# Agent Execution DTOs
class AgentExecutionResponseDTO(BaseModel):
    """DTO for agent execution response."""

    id: UUID
    conversation_id: UUID
    agent_role: AgentRole
    status: AgentStatus
    input_message: str
    output_message: str | None
    tools_used: list[str]
    tokens_used: int | None
    execution_time_ms: int | None
    error_message: str | None
    metadata: dict[str, Any]
    created_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True


# RAG DTOs
class DocumentUploadDTO(BaseModel):
    """DTO for uploading documents to vector store."""

    documents: list[str]
    metadatas: list[dict[str, Any]] | None = None
    conversation_id: UUID | None = None


class DocumentSearchDTO(BaseModel):
    """DTO for searching documents."""

    query: str
    k: int = Field(default=5, ge=1, le=20)
    filter: dict[str, Any] | None = None


class DocumentSearchResultDTO(BaseModel):
    """DTO for document search results."""

    content: str
    metadata: dict[str, Any]
    score: float
