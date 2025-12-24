"""Use cases for agent operations."""

import time
from uuid import UUID

from src.application.agents.dtos import (
    ChatRequestDTO,
    ChatResponseDTO,
    ConversationCreateDTO,
    ConversationDetailResponseDTO,
    ConversationResponseDTO,
    MessageResponseDTO,
)
from src.core.exceptions import NotFoundException
from src.core.logging import get_logger
from src.domain.agents.entities import (
    AgentExecution,
    AgentRole,
    Conversation,
    Message,
    MessageRole,
)
from src.domain.agents.repositories import (
    IAgentExecutionRepository,
    IConversationRepository,
    IMessageRepository,
)
from src.domain.agents.services import AgentOrchestrator

logger = get_logger(__name__)


class CreateConversationUseCase:
    """Use case for creating a new conversation."""

    def __init__(
        self,
        conversation_repository: IConversationRepository,
    ) -> None:
        self._conversation_repository = conversation_repository

    async def execute(
        self,
        user_id: UUID | str,
        dto: ConversationCreateDTO,
    ) -> ConversationResponseDTO:
        """Execute conversation creation."""
        logger.info(f"Creating conversation for user: {user_id}")

        conversation = Conversation.create(
            user_id=user_id,
            title=dto.title,
            agent_config=dto.agent_config,
            metadata=dto.metadata,
        )

        created_conversation = await self._conversation_repository.create(conversation)

        return ConversationResponseDTO(
            id=created_conversation.id,
            user_id=created_conversation.user_id,
            title=created_conversation.title,
            agent_config=created_conversation.agent_config,
            message_count=0,
            metadata=created_conversation.metadata,
            created_at=created_conversation.created_at,
            updated_at=created_conversation.updated_at,
        )


class GetConversationUseCase:
    """Use case for retrieving a conversation."""

    def __init__(
        self,
        conversation_repository: IConversationRepository,
        message_repository: IMessageRepository,
    ) -> None:
        self._conversation_repository = conversation_repository
        self._message_repository = message_repository

    async def execute(
        self,
        conversation_id: UUID,
        user_id: UUID | str,
    ) -> ConversationDetailResponseDTO:
        """Execute get conversation."""
        conversation = await self._conversation_repository.get_by_id(conversation_id)

        if not conversation:
            raise NotFoundException(f"Conversation {conversation_id} not found")

        if conversation.user_id != user_id:
            raise NotFoundException(f"Conversation {conversation_id} not found")

        messages = await self._message_repository.get_by_conversation_id(conversation_id)

        message_dtos = [MessageResponseDTO.model_validate(msg) for msg in messages]

        return ConversationDetailResponseDTO(
            id=conversation.id,
            user_id=conversation.user_id,
            title=conversation.title,
            agent_config=conversation.agent_config,
            message_count=len(messages),
            metadata=conversation.metadata,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=message_dtos,
        )


class ListConversationsUseCase:
    """Use case for listing user conversations."""

    def __init__(
        self,
        conversation_repository: IConversationRepository,
    ) -> None:
        self._conversation_repository = conversation_repository

    async def execute(
        self,
        user_id: UUID | str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ConversationResponseDTO]:
        """Execute list conversations."""
        conversations = await self._conversation_repository.get_by_user_id(
            user_id,
            skip=skip,
            limit=limit,
        )

        return [
            ConversationResponseDTO(
                id=conv.id,
                user_id=conv.user_id,
                title=conv.title,
                agent_config=conv.agent_config,
                message_count=conv.get_message_count(),
                metadata=conv.metadata,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
            )
            for conv in conversations
        ]


class ChatUseCase:
    """Use case for chat interaction with agent."""

    def __init__(
        self,
        conversation_repository: IConversationRepository,
        message_repository: IMessageRepository,
        execution_repository: IAgentExecutionRepository,
        agent_orchestrator: AgentOrchestrator,
    ) -> None:
        self._conversation_repository = conversation_repository
        self._message_repository = message_repository
        self._execution_repository = execution_repository
        self._agent_orchestrator = agent_orchestrator

    async def execute(
        self,
        user_id: UUID | str,
        dto: ChatRequestDTO,
    ) -> ChatResponseDTO:
        """Execute chat interaction."""
        start_time = time.time()

        # Get or create conversation
        if dto.conversation_id:
            conversation = await self._conversation_repository.get_by_id(dto.conversation_id)
            if not conversation or conversation.user_id != user_id:
                raise NotFoundException("Conversation not found")
        else:
            # Create new conversation
            conversation = Conversation.create(
                user_id=user_id,
                title=dto.message[:50],  # Use first 50 chars as title
                agent_config=dto.agent_config or {},
            )
            conversation = await self._conversation_repository.create(conversation)

        # Create user message
        user_message = Message.create(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=dto.message,
        )
        user_message = await self._message_repository.create(user_message)

        # Create execution record
        execution = AgentExecution.create(
            conversation_id=conversation.id,
            agent_role=AgentRole.ASSISTANT,
            input_message=dto.message,
        )
        execution = await self._execution_repository.create(execution)

        try:
            # Get conversation history
            messages = await self._message_repository.get_by_conversation_id(conversation.id)

            # Execute agent
            response = await self._agent_orchestrator.execute_agent(
                messages=messages,
                system_prompt=conversation.agent_config.get("system_prompt"),
                use_rag=dto.use_rag,
            )

            # Create assistant message
            assistant_message = Message.create(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=response.get("content", ""),
                metadata=response.get("metadata", {}),
            )
            assistant_message = await self._message_repository.create(assistant_message)

            # Update execution
            execution_time_ms = int((time.time() - start_time) * 1000)
            execution.complete(
                output=response.get("content", ""),
                tokens_used=response.get("usage", {}).get("total_tokens", 0),
                execution_time_ms=execution_time_ms,
            )
            await self._execution_repository.update(execution)

            # Add to memory if RAG is enabled
            if dto.use_rag:
                await self._agent_orchestrator.add_to_memory(
                    conversation_id=str(conversation.id),
                    messages=[user_message, assistant_message],
                )

            logger.info(
                f"Chat completed in {execution_time_ms}ms",
                extra={
                    "conversation_id": str(conversation.id),
                    "tokens_used": response.get("usage", {}).get("total_tokens", 0),
                },
            )

            return ChatResponseDTO(
                conversation_id=conversation.id,
                message=MessageResponseDTO.model_validate(assistant_message),
                usage=response.get("usage"),
                execution_id=execution.id,
            )

        except Exception as e:
            logger.error(f"Chat execution failed: {str(e)}", exc_info=True)
            execution.fail(error_message=str(e))
            await self._execution_repository.update(execution)
            raise
