"""Domain services for agent operations."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Protocol
from uuid import UUID

from src.domain.agents.entities import AgentExecution, Message, MessageRole


class ILLMProvider(Protocol):
    """Interface for LLM provider."""

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate a response from the LLM."""
        ...


class IVectorStore(Protocol):
    """Interface for vector store."""

    async def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> None:
        """Add documents to the vector store."""
        ...

    async def search(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        ...


class IToolExecutor(Protocol):
    """Interface for tool execution."""

    async def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute a tool with given parameters."""
        ...


class AgentOrchestrator:
    """Domain service for orchestrating agent operations."""

    def __init__(
        self,
        llm_provider: ILLMProvider,
        vector_store: Optional[IVectorStore] = None,
        tool_executor: Optional[IToolExecutor] = None,
    ) -> None:
        self._llm_provider = llm_provider
        self._vector_store = vector_store
        self._tool_executor = tool_executor

    async def execute_agent(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        use_rag: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute agent with given messages.

        Args:
            messages: Conversation messages
            system_prompt: Optional system prompt
            tools: Optional tools available to the agent
            use_rag: Whether to use RAG for context

        Returns:
            Agent response with metadata
        """
        # Convert messages to LLM format
        llm_messages = []

        if system_prompt:
            llm_messages.append({"role": "system", "content": system_prompt})

        # Add context from RAG if enabled
        if use_rag and self._vector_store and messages:
            last_message = messages[-1]
            search_results = await self._vector_store.search(
                query=last_message.content,
                k=5,
            )
            context = "\n\n".join([doc["content"] for doc in search_results])
            llm_messages.append({
                "role": "system",
                "content": f"Relevant context:\n{context}"
            })

        # Add conversation messages
        for msg in messages:
            llm_messages.append({
                "role": msg.role.value,
                "content": msg.content,
            })

        # Generate response
        response = await self._llm_provider.generate_response(
            messages=llm_messages,
            tools=tools,
        )

        # Handle tool calls if present
        if response.get("tool_calls") and self._tool_executor:
            tool_results = []
            for tool_call in response["tool_calls"]:
                result = await self._tool_executor.execute_tool(
                    tool_name=tool_call["name"],
                    parameters=tool_call["parameters"],
                )
                tool_results.append(result)

            # Add tool results to messages and get final response
            llm_messages.append({
                "role": "assistant",
                "content": response.get("content", ""),
                "tool_calls": response["tool_calls"],
            })
            llm_messages.append({
                "role": "tool",
                "content": str(tool_results),
            })

            response = await self._llm_provider.generate_response(
                messages=llm_messages,
                tools=tools,
            )

        return response

    async def add_to_memory(
        self,
        conversation_id: str,
        messages: List[Message],
    ) -> None:
        """Add messages to long-term memory via vector store."""
        if not self._vector_store:
            return

        documents = [msg.content for msg in messages if msg.role == MessageRole.USER]
        metadatas = [{
            "conversation_id": conversation_id,
            "role": msg.role.value,
            "created_at": msg.created_at.isoformat(),
        } for msg in messages if msg.role == MessageRole.USER]

        if documents:
            await self._vector_store.add_documents(
                documents=documents,
                metadatas=metadatas,
            )
