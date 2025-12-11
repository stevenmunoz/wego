"""Domain services for agent operations."""

from typing import Any, Protocol

from src.domain.agents.entities import Message, MessageRole


class ILLMProvider(Protocol):
    """Interface for LLM provider."""

    async def generate_response(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Generate a response from the LLM."""
        ...


class IVectorStore(Protocol):
    """Interface for vector store."""

    async def add_documents(
        self,
        documents: list[str],
        metadatas: list[dict[str, Any]] | None = None,
        ids: list[str] | None = None,
    ) -> None:
        """Add documents to the vector store."""
        ...

    async def search(
        self,
        query: str,
        k: int = 5,
        filter: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Search for similar documents."""
        ...


class IToolExecutor(Protocol):
    """Interface for tool execution."""

    async def execute_tool(
        self,
        tool_name: str,
        parameters: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a tool with given parameters."""
        ...


class AgentOrchestrator:
    """Domain service for orchestrating agent operations."""

    def __init__(
        self,
        llm_provider: ILLMProvider,
        vector_store: IVectorStore | None = None,
        tool_executor: IToolExecutor | None = None,
    ) -> None:
        self._llm_provider = llm_provider
        self._vector_store = vector_store
        self._tool_executor = tool_executor

    async def execute_agent(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        tools: list[dict[str, Any]] | None = None,
        use_rag: bool = False,
    ) -> dict[str, Any]:
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
        messages: list[Message],
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
