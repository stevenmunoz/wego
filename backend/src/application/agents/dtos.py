"""DTOs for agent application layer."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from src.domain.agents.entities import AgentRole, AgentStatus, MessageRole


# Message DTOs
class MessageCreateDTO(BaseModel):
    """DTO for creating a message."""

    role: MessageRole
    content: str
    metadata: Optional[Dict[str, Any]] = None


class MessageResponseDTO(BaseModel):
    """DTO for message response."""

    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# Conversation DTOs
class ConversationCreateDTO(BaseModel):
    """DTO for creating a conversation."""

    title: str
    agent_config: Dict[str, Any] = Field(
        default_factory=lambda: {
            "role": "assistant",
            "temperature": 0.7,
            "max_tokens": 2000,
        }
    )
    metadata: Optional[Dict[str, Any]] = None


class ConversationResponseDTO(BaseModel):
    """DTO for conversation response."""

    id: UUID
    user_id: UUID
    title: str
    agent_config: Dict[str, Any]
    message_count: int
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponseDTO(ConversationResponseDTO):
    """DTO for detailed conversation response with messages."""

    messages: List[MessageResponseDTO]


# Chat DTOs
class ChatRequestDTO(BaseModel):
    """DTO for chat request."""

    message: str
    conversation_id: Optional[UUID] = None
    agent_config: Optional[Dict[str, Any]] = None
    use_rag: bool = False
    stream: bool = False


class ChatResponseDTO(BaseModel):
    """DTO for chat response."""

    conversation_id: UUID
    message: MessageResponseDTO
    usage: Optional[Dict[str, Any]] = None
    execution_id: Optional[UUID] = None


# Tool DTOs
class ToolCreateDTO(BaseModel):
    """DTO for creating a tool."""

    name: str
    description: str
    parameters_schema: Dict[str, Any]
    enabled: bool = True
    metadata: Optional[Dict[str, Any]] = None


class ToolResponseDTO(BaseModel):
    """DTO for tool response."""

    id: UUID
    name: str
    description: str
    parameters_schema: Dict[str, Any]
    enabled: bool
    metadata: Dict[str, Any]

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
    output_message: Optional[str]
    tools_used: List[str]
    tokens_used: Optional[int]
    execution_time_ms: Optional[int]
    error_message: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# RAG DTOs
class DocumentUploadDTO(BaseModel):
    """DTO for uploading documents to vector store."""

    documents: List[str]
    metadatas: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[UUID] = None


class DocumentSearchDTO(BaseModel):
    """DTO for searching documents."""

    query: str
    k: int = Field(default=5, ge=1, le=20)
    filter: Optional[Dict[str, Any]] = None


class DocumentSearchResultDTO(BaseModel):
    """DTO for document search results."""

    content: str
    metadata: Dict[str, Any]
    score: float
