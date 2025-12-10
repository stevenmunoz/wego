"""Repository interfaces for agent domain."""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from src.domain.agents.entities import AgentExecution, Conversation, Message, Tool


class IConversationRepository(ABC):
    """Interface for conversation repository."""

    @abstractmethod
    async def create(self, conversation: Conversation) -> Conversation:
        """Create a new conversation."""
        pass

    @abstractmethod
    async def get_by_id(self, conversation_id: UUID) -> Optional[Conversation]:
        """Get conversation by ID."""
        pass

    @abstractmethod
    async def get_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Conversation]:
        """Get conversations for a user."""
        pass

    @abstractmethod
    async def update(self, conversation: Conversation) -> Conversation:
        """Update existing conversation."""
        pass

    @abstractmethod
    async def delete(self, conversation_id: UUID) -> bool:
        """Delete conversation."""
        pass


class IMessageRepository(ABC):
    """Interface for message repository."""

    @abstractmethod
    async def create(self, message: Message) -> Message:
        """Create a new message."""
        pass

    @abstractmethod
    async def get_by_conversation_id(
        self, conversation_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Message]:
        """Get messages for a conversation."""
        pass

    @abstractmethod
    async def delete_by_conversation_id(self, conversation_id: UUID) -> bool:
        """Delete all messages in a conversation."""
        pass


class IToolRepository(ABC):
    """Interface for tool repository."""

    @abstractmethod
    async def create(self, tool: Tool) -> Tool:
        """Create a new tool."""
        pass

    @abstractmethod
    async def get_by_id(self, tool_id: UUID) -> Optional[Tool]:
        """Get tool by ID."""
        pass

    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Tool]:
        """Get tool by name."""
        pass

    @abstractmethod
    async def list_enabled(self) -> List[Tool]:
        """List all enabled tools."""
        pass

    @abstractmethod
    async def update(self, tool: Tool) -> Tool:
        """Update existing tool."""
        pass


class IAgentExecutionRepository(ABC):
    """Interface for agent execution repository."""

    @abstractmethod
    async def create(self, execution: AgentExecution) -> AgentExecution:
        """Create a new execution record."""
        pass

    @abstractmethod
    async def get_by_id(self, execution_id: UUID) -> Optional[AgentExecution]:
        """Get execution by ID."""
        pass

    @abstractmethod
    async def get_by_conversation_id(
        self, conversation_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AgentExecution]:
        """Get executions for a conversation."""
        pass

    @abstractmethod
    async def update(self, execution: AgentExecution) -> AgentExecution:
        """Update existing execution."""
        pass
