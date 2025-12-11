"""Dependency injection container."""

from dependency_injector import containers, providers

from src.application.agents.use_cases import (
    ChatUseCase,
    CreateConversationUseCase,
    GetConversationUseCase,
    ListConversationsUseCase,
)
from src.application.use_cases.auth_use_cases import LoginUseCase, RefreshTokenUseCase
from src.application.use_cases.user_use_cases import (
    CreateUserUseCase,
    DeleteUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
)
from src.core.config import settings
from src.domain.agents.services import AgentOrchestrator
from src.domain.services import AuthenticationService
from src.infrastructure.agents.llm_providers import AnthropicProvider, OpenAIProvider
from src.infrastructure.agents.repositories import (
    AgentExecutionRepository,
    ConversationRepository,
    MessageRepository,
)
from src.infrastructure.database import get_firestore
from src.infrastructure.repositories import UserRepository


class Container(containers.DeclarativeContainer):
    """Application dependency injection container."""

    # Configuration
    wiring_config = containers.WiringConfiguration(
        modules=[
            "src.presentation.api.v1.endpoints.users",
            "src.presentation.api.v1.endpoints.auth",
            "src.presentation.api.v1.endpoints.agents.chat",
        ]
    )

    # Firestore client (singleton)
    db = providers.Singleton(get_firestore)

    # Repositories - User
    user_repository = providers.Factory(
        UserRepository,
        db=db,
    )

    # Repositories - Agents
    conversation_repository = providers.Factory(
        ConversationRepository,
        db=db,
    )

    message_repository = providers.Factory(
        MessageRepository,
        db=db,
    )

    execution_repository = providers.Factory(
        AgentExecutionRepository,
        db=db,
    )

    # Domain Services
    auth_service = providers.Factory(
        AuthenticationService,
        user_repository=user_repository,
    )

    # LLM Provider (factory that returns the configured provider)
    llm_provider = providers.Singleton(
        lambda: (
            OpenAIProvider(api_key=settings.OPENAI_API_KEY)
            if settings.LLM_PROVIDER == "openai"
            else AnthropicProvider(api_key=settings.ANTHROPIC_API_KEY)
        )
    )

    # Agent Orchestrator
    agent_orchestrator = providers.Factory(
        AgentOrchestrator,
        llm_provider=llm_provider,
        vector_store=None,  # Optional: can be configured later
        tool_executor=None,  # Optional: can be configured later
    )

    # Use Cases - User
    create_user_use_case = providers.Factory(
        CreateUserUseCase,
        user_repository=user_repository,
    )

    get_user_use_case = providers.Factory(
        GetUserUseCase,
        user_repository=user_repository,
    )

    update_user_use_case = providers.Factory(
        UpdateUserUseCase,
        user_repository=user_repository,
    )

    list_users_use_case = providers.Factory(
        ListUsersUseCase,
        user_repository=user_repository,
    )

    delete_user_use_case = providers.Factory(
        DeleteUserUseCase,
        user_repository=user_repository,
    )

    # Use Cases - Auth
    login_use_case = providers.Factory(
        LoginUseCase,
        auth_service=auth_service,
    )

    refresh_token_use_case = providers.Factory(
        RefreshTokenUseCase,
    )

    # Use Cases - Agents
    create_conversation_use_case = providers.Factory(
        CreateConversationUseCase,
        conversation_repository=conversation_repository,
    )

    get_conversation_use_case = providers.Factory(
        GetConversationUseCase,
        conversation_repository=conversation_repository,
        message_repository=message_repository,
    )

    list_conversations_use_case = providers.Factory(
        ListConversationsUseCase,
        conversation_repository=conversation_repository,
    )

    chat_use_case = providers.Factory(
        ChatUseCase,
        conversation_repository=conversation_repository,
        message_repository=message_repository,
        execution_repository=execution_repository,
        agent_orchestrator=agent_orchestrator,
    )
