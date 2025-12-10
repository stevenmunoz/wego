"""Dependency injection configuration for agent services."""

from dependency_injector import containers, providers

from src.core.config import settings
from src.domain.agents.services import AgentOrchestrator
from src.infrastructure.agents.llm_providers import (
    AnthropicProvider,
    LocalLLMProvider,
    OpenAIProvider,
)
from src.infrastructure.agents.tool_executor import ToolExecutor
from src.infrastructure.agents.vector_stores import (
    ChromaDBVectorStore,
    InMemoryVectorStore,
)


def get_llm_provider():
    """Factory for LLM provider based on configuration."""
    if settings.LLM_PROVIDER == "openai":
        return OpenAIProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.LLM_MODEL,
        )
    elif settings.LLM_PROVIDER == "anthropic":
        return AnthropicProvider(
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.LLM_MODEL,
        )
    else:
        return LocalLLMProvider()


def get_vector_store():
    """Factory for vector store based on configuration."""
    if not settings.ENABLE_RAG:
        return None

    if settings.VECTOR_STORE_TYPE == "chroma":
        return ChromaDBVectorStore(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )
    else:
        return InMemoryVectorStore()


class AgentContainer(containers.DeclarativeContainer):
    """Agent services dependency injection container."""

    # Providers
    llm_provider = providers.Singleton(get_llm_provider)
    vector_store = providers.Singleton(get_vector_store)
    tool_executor = providers.Singleton(ToolExecutor)

    # Services
    agent_orchestrator = providers.Singleton(
        AgentOrchestrator,
        llm_provider=llm_provider,
        vector_store=vector_store,
        tool_executor=tool_executor,
    )
