"""Firestore repository implementations for agent domain."""

from datetime import datetime
from typing import Any
from uuid import UUID

from google.cloud.firestore_v1 import AsyncClient

from src.domain.agents.entities import (
    AgentExecution,
    AgentRole,
    AgentStatus,
    Conversation,
    Message,
    MessageRole,
    Tool,
)
from src.domain.agents.repositories import (
    IAgentExecutionRepository,
    IConversationRepository,
    IMessageRepository,
    IToolRepository,
)


class FirestoreConversationMapper:
    """Mapper for Conversation entity and Firestore documents."""

    @staticmethod
    def to_dict(conversation: Conversation) -> dict[str, Any]:
        """Convert Conversation entity to Firestore document."""
        return {
            "id": str(conversation.id),
            "user_id": str(conversation.user_id),
            "title": conversation.title,
            "agent_config": conversation.agent_config,
            "metadata": conversation.metadata,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
        }

    @staticmethod
    def from_dict(data: dict[str, Any], messages: list[Message] | None = None) -> Conversation:
        """Convert Firestore document to Conversation entity."""
        return Conversation(
            id=UUID(data["id"]),
            user_id=UUID(data["user_id"]),
            title=data["title"],
            agent_config=data["agent_config"],
            messages=messages or [],
            metadata=data.get("metadata", {}),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )


class FirestoreMessageMapper:
    """Mapper for Message entity and Firestore documents."""

    @staticmethod
    def to_dict(message: Message) -> dict[str, Any]:
        """Convert Message entity to Firestore document."""
        return {
            "id": str(message.id),
            "conversation_id": str(message.conversation_id),
            "role": message.role.value,
            "content": message.content,
            "metadata": message.metadata,
            "created_at": message.created_at,
        }

    @staticmethod
    def from_dict(data: dict[str, Any]) -> Message:
        """Convert Firestore document to Message entity."""
        return Message(
            id=UUID(data["id"]),
            conversation_id=UUID(data["conversation_id"]),
            role=MessageRole(data["role"]),
            content=data["content"],
            metadata=data.get("metadata", {}),
            created_at=data["created_at"],
        )


class FirestoreToolMapper:
    """Mapper for Tool entity and Firestore documents."""

    @staticmethod
    def to_dict(tool: Tool) -> dict[str, Any]:
        """Convert Tool entity to Firestore document."""
        return {
            "id": str(tool.id),
            "name": tool.name,
            "description": tool.description,
            "parameters_schema": tool.parameters_schema,
            "enabled": tool.enabled,
            "metadata": tool.metadata,
        }

    @staticmethod
    def from_dict(data: dict[str, Any]) -> Tool:
        """Convert Firestore document to Tool entity."""
        return Tool(
            id=UUID(data["id"]),
            name=data["name"],
            description=data["description"],
            parameters_schema=data["parameters_schema"],
            enabled=data.get("enabled", True),
            metadata=data.get("metadata", {}),
        )


class FirestoreAgentExecutionMapper:
    """Mapper for AgentExecution entity and Firestore documents."""

    @staticmethod
    def to_dict(execution: AgentExecution) -> dict[str, Any]:
        """Convert AgentExecution entity to Firestore document."""
        return {
            "id": str(execution.id),
            "conversation_id": str(execution.conversation_id),
            "agent_role": execution.agent_role.value,
            "status": execution.status.value,
            "input_message": execution.input_message,
            "output_message": execution.output_message,
            "tools_used": execution.tools_used,
            "tokens_used": execution.tokens_used,
            "execution_time_ms": execution.execution_time_ms,
            "error_message": execution.error_message,
            "metadata": execution.metadata,
            "created_at": execution.created_at,
            "completed_at": execution.completed_at,
        }

    @staticmethod
    def from_dict(data: dict[str, Any]) -> AgentExecution:
        """Convert Firestore document to AgentExecution entity."""
        return AgentExecution(
            id=UUID(data["id"]),
            conversation_id=UUID(data["conversation_id"]),
            agent_role=AgentRole(data["agent_role"]),
            status=AgentStatus(data["status"]),
            input_message=data["input_message"],
            output_message=data.get("output_message"),
            tools_used=data.get("tools_used", []),
            tokens_used=data.get("tokens_used"),
            execution_time_ms=data.get("execution_time_ms"),
            error_message=data.get("error_message"),
            metadata=data.get("metadata", {}),
            created_at=data["created_at"],
            completed_at=data.get("completed_at"),
        )


class ConversationRepository(IConversationRepository):
    """Firestore implementation of conversation repository."""

    COLLECTION_NAME = "conversations"

    def __init__(self, db: AsyncClient) -> None:
        self._db = db
        self._collection = db.collection(self.COLLECTION_NAME)

    async def create(self, conversation: Conversation) -> Conversation:
        """Create a new conversation."""
        conv_dict = FirestoreConversationMapper.to_dict(conversation)
        await self._collection.document(str(conversation.id)).set(conv_dict)
        return conversation

    async def get_by_id(self, conversation_id: UUID) -> Conversation | None:
        """Get conversation by ID."""
        doc = await self._collection.document(str(conversation_id)).get()
        if not doc.exists:
            return None

        # Get messages for this conversation
        message_repo = MessageRepository(self._db)
        messages = await message_repo.get_by_conversation_id(conversation_id)

        return FirestoreConversationMapper.from_dict(doc.to_dict(), messages)

    async def get_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Conversation]:
        """Get conversations for a user."""
        query = (
            self._collection
            .where("user_id", "==", str(user_id))
            .order_by("updated_at", direction="DESCENDING")
            .offset(skip)
            .limit(limit)
        )
        docs = [doc async for doc in query.stream()]

        conversations = []
        for doc in docs:
            # Note: Not loading messages here for performance
            # Messages can be loaded separately when needed
            conv = FirestoreConversationMapper.from_dict(doc.to_dict())
            conversations.append(conv)

        return conversations

    async def update(self, conversation: Conversation) -> Conversation:
        """Update existing conversation."""
        conversation.updated_at = datetime.utcnow()
        conv_dict = FirestoreConversationMapper.to_dict(conversation)
        await self._collection.document(str(conversation.id)).update(conv_dict)
        return conversation

    async def delete(self, conversation_id: UUID) -> bool:
        """Delete conversation."""
        doc_ref = self._collection.document(str(conversation_id))
        doc = await doc_ref.get()

        if not doc.exists:
            return False

        # Also delete all messages in this conversation
        message_repo = MessageRepository(self._db)
        await message_repo.delete_by_conversation_id(conversation_id)

        await doc_ref.delete()
        return True


class MessageRepository(IMessageRepository):
    """Firestore implementation of message repository."""

    COLLECTION_NAME = "messages"

    def __init__(self, db: AsyncClient) -> None:
        self._db = db
        self._collection = db.collection(self.COLLECTION_NAME)

    async def create(self, message: Message) -> Message:
        """Create a new message."""
        msg_dict = FirestoreMessageMapper.to_dict(message)
        await self._collection.document(str(message.id)).set(msg_dict)
        return message

    async def get_by_conversation_id(
        self, conversation_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Message]:
        """Get messages for a conversation."""
        query = (
            self._collection
            .where("conversation_id", "==", str(conversation_id))
            .order_by("created_at")
            .offset(skip)
            .limit(limit)
        )
        docs = [doc async for doc in query.stream()]
        return [FirestoreMessageMapper.from_dict(doc.to_dict()) for doc in docs]

    async def delete_by_conversation_id(self, conversation_id: UUID) -> bool:
        """Delete all messages in a conversation."""
        query = self._collection.where("conversation_id", "==", str(conversation_id))
        docs = [doc async for doc in query.stream()]

        # Batch delete messages
        for doc in docs:
            await doc.reference.delete()

        return True


class ToolRepository(IToolRepository):
    """Firestore implementation of tool repository."""

    COLLECTION_NAME = "tools"

    def __init__(self, db: AsyncClient) -> None:
        self._db = db
        self._collection = db.collection(self.COLLECTION_NAME)

    async def create(self, tool: Tool) -> Tool:
        """Create a new tool."""
        tool_dict = FirestoreToolMapper.to_dict(tool)
        await self._collection.document(str(tool.id)).set(tool_dict)
        return tool

    async def get_by_id(self, tool_id: UUID) -> Tool | None:
        """Get tool by ID."""
        doc = await self._collection.document(str(tool_id)).get()
        if not doc.exists:
            return None
        return FirestoreToolMapper.from_dict(doc.to_dict())

    async def get_by_name(self, name: str) -> Tool | None:
        """Get tool by name."""
        query = self._collection.where("name", "==", name).limit(1)
        docs = [doc async for doc in query.stream()]

        if not docs:
            return None

        return FirestoreToolMapper.from_dict(docs[0].to_dict())

    async def list_enabled(self) -> list[Tool]:
        """List all enabled tools."""
        query = self._collection.where("enabled", "==", True)
        docs = [doc async for doc in query.stream()]
        return [FirestoreToolMapper.from_dict(doc.to_dict()) for doc in docs]

    async def update(self, tool: Tool) -> Tool:
        """Update existing tool."""
        tool_dict = FirestoreToolMapper.to_dict(tool)
        await self._collection.document(str(tool.id)).update(tool_dict)
        return tool


class AgentExecutionRepository(IAgentExecutionRepository):
    """Firestore implementation of agent execution repository."""

    COLLECTION_NAME = "agent_executions"

    def __init__(self, db: AsyncClient) -> None:
        self._db = db
        self._collection = db.collection(self.COLLECTION_NAME)

    async def create(self, execution: AgentExecution) -> AgentExecution:
        """Create a new execution record."""
        exec_dict = FirestoreAgentExecutionMapper.to_dict(execution)
        await self._collection.document(str(execution.id)).set(exec_dict)
        return execution

    async def get_by_id(self, execution_id: UUID) -> AgentExecution | None:
        """Get execution by ID."""
        doc = await self._collection.document(str(execution_id)).get()
        if not doc.exists:
            return None
        return FirestoreAgentExecutionMapper.from_dict(doc.to_dict())

    async def get_by_conversation_id(
        self, conversation_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[AgentExecution]:
        """Get executions for a conversation."""
        query = (
            self._collection
            .where("conversation_id", "==", str(conversation_id))
            .order_by("created_at", direction="DESCENDING")
            .offset(skip)
            .limit(limit)
        )
        docs = [doc async for doc in query.stream()]
        return [FirestoreAgentExecutionMapper.from_dict(doc.to_dict()) for doc in docs]

    async def update(self, execution: AgentExecution) -> AgentExecution:
        """Update existing execution."""
        exec_dict = FirestoreAgentExecutionMapper.to_dict(execution)
        await self._collection.document(str(execution.id)).update(exec_dict)
        return execution
