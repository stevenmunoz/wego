"""Agent domain entities."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4


class AgentRole(str, Enum):
    """Agent role types."""

    ASSISTANT = "assistant"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    DEVELOPER = "developer"
    CUSTOM = "custom"


class AgentStatus(str, Enum):
    """Agent execution status."""

    IDLE = "idle"
    THINKING = "thinking"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"


class MessageRole(str, Enum):
    """Message role in conversation."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class Message:
    """Conversation message entity."""

    def __init__(
        self,
        id: UUID,
        conversation_id: UUID,
        role: MessageRole,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
    ) -> None:
        self.id = id
        self.conversation_id = conversation_id
        self.role = role
        self.content = content
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()

    @staticmethod
    def create(
        conversation_id: UUID,
        role: MessageRole,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "Message":
        """Factory method to create a new message."""
        return Message(
            id=uuid4(),
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata,
        )


class Conversation:
    """Conversation entity managing agent-user interactions."""

    def __init__(
        self,
        id: UUID,
        user_id: UUID,
        title: str,
        agent_config: Dict[str, Any],
        messages: Optional[List[Message]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ) -> None:
        self.id = id
        self.user_id = user_id
        self.title = title
        self.agent_config = agent_config
        self.messages = messages or []
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def add_message(self, message: Message) -> None:
        """Add a message to the conversation."""
        self.messages.append(message)
        self.updated_at = datetime.utcnow()

    def get_message_count(self) -> int:
        """Get total message count."""
        return len(self.messages)

    @staticmethod
    def create(
        user_id: UUID,
        title: str,
        agent_config: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "Conversation":
        """Factory method to create a new conversation."""
        return Conversation(
            id=uuid4(),
            user_id=user_id,
            title=title,
            agent_config=agent_config,
            metadata=metadata,
        )


class Tool:
    """Tool entity representing an agent capability."""

    def __init__(
        self,
        id: UUID,
        name: str,
        description: str,
        parameters_schema: Dict[str, Any],
        enabled: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.id = id
        self.name = name
        self.description = description
        self.parameters_schema = parameters_schema
        self.enabled = enabled
        self.metadata = metadata or {}

    @staticmethod
    def create(
        name: str,
        description: str,
        parameters_schema: Dict[str, Any],
        enabled: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "Tool":
        """Factory method to create a new tool."""
        return Tool(
            id=uuid4(),
            name=name,
            description=description,
            parameters_schema=parameters_schema,
            enabled=enabled,
            metadata=metadata,
        )


class AgentExecution:
    """Agent execution tracking entity."""

    def __init__(
        self,
        id: UUID,
        conversation_id: UUID,
        agent_role: AgentRole,
        status: AgentStatus,
        input_message: str,
        output_message: Optional[str] = None,
        tools_used: Optional[List[str]] = None,
        tokens_used: Optional[int] = None,
        execution_time_ms: Optional[int] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ) -> None:
        self.id = id
        self.conversation_id = conversation_id
        self.agent_role = agent_role
        self.status = status
        self.input_message = input_message
        self.output_message = output_message
        self.tools_used = tools_used or []
        self.tokens_used = tokens_used
        self.execution_time_ms = execution_time_ms
        self.error_message = error_message
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()
        self.completed_at = completed_at

    def complete(self, output: str, tokens_used: int, execution_time_ms: int) -> None:
        """Mark execution as completed."""
        self.status = AgentStatus.COMPLETED
        self.output_message = output
        self.tokens_used = tokens_used
        self.execution_time_ms = execution_time_ms
        self.completed_at = datetime.utcnow()

    def fail(self, error_message: str) -> None:
        """Mark execution as failed."""
        self.status = AgentStatus.FAILED
        self.error_message = error_message
        self.completed_at = datetime.utcnow()

    @staticmethod
    def create(
        conversation_id: UUID,
        agent_role: AgentRole,
        input_message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "AgentExecution":
        """Factory method to create a new agent execution."""
        return AgentExecution(
            id=uuid4(),
            conversation_id=conversation_id,
            agent_role=agent_role,
            status=AgentStatus.THINKING,
            input_message=input_message,
            metadata=metadata,
        )
