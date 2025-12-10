# Agentic Services Architecture

This document describes the agentic/AI services architecture integrated into the enterprise template.

## Overview

The agentic services baseline provides a production-ready foundation for building AI-powered features including:

- **Conversational AI:** Multi-turn conversations with context
- **Tool/Function Calling:** Agents can execute tools to perform actions
- **RAG (Retrieval Augmented Generation):** Vector search for enhanced context
- **Multi-Provider Support:** OpenAI, Anthropic, or custom LLM providers
- **Extensible Architecture:** Easy to add new capabilities

## Architecture Layers

### Domain Layer (`backend/src/domain/agents/`)

**Entities:**
- `Message`: Individual messages in conversations
- `Conversation`: Conversation container with messages and config
- `Tool`: Executable tools/functions for agents
- `AgentExecution`: Tracking and metrics for agent runs

**Repository Interfaces:**
- `IConversationRepository`: Conversation data access
- `IMessageRepository`: Message data access
- `IToolRepository`: Tool management
- `IAgentExecutionRepository`: Execution tracking

**Services:**
- `AgentOrchestrator`: Core service orchestrating LLM calls, tool execution, and RAG

### Application Layer (`backend/src/application/agents/`)

**Use Cases:**
- `CreateConversationUseCase`: Create new conversations
- `ChatUseCase`: Process chat messages and generate responses
- `GetConversationUseCase`: Retrieve conversation with history
- `ListConversationsUseCase`: List user conversations

**DTOs:**
- Input DTOs: `ChatRequestDTO`, `ConversationCreateDTO`
- Output DTOs: `ChatResponseDTO`, `MessageResponseDTO`

### Infrastructure Layer (`backend/src/infrastructure/agents/`)

**LLM Providers:**
- `OpenAIProvider`: OpenAI GPT integration
- `AnthropicProvider`: Anthropic Claude integration
- `LocalLLMProvider`: Mock provider for development

**Vector Stores:**
- `InMemoryVectorStore`: Simple in-memory store for development
- `ChromaDBVectorStore`: ChromaDB integration for production RAG
- `PineconeVectorStore`: Pinecone integration (template)

**Tool Executor:**
- `ToolExecutor`: Executes tools/functions requested by agents
- Built-in tools: web_search, calculator, get_current_weather
- Extensible: Register custom tools

### Presentation Layer (`backend/src/presentation/api/v1/endpoints/agents/`)

**API Endpoints:**
```
POST   /api/v1/chat/                      # Send message, get response
POST   /api/v1/chat/conversations         # Create conversation
GET    /api/v1/chat/conversations         # List conversations
GET    /api/v1/chat/conversations/{id}    # Get conversation details
```

## Data Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ ChatRequest
     ▼
┌─────────────────┐
│ Chat Endpoint   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  ChatUseCase    │
└────┬────────────┘
     │
     ├─► IConversationRepository (get/create)
     ├─► IMessageRepository (create user message)
     │
     ▼
┌──────────────────────┐
│ AgentOrchestrator    │
└────┬─────────────────┘
     │
     ├─► IVectorStore (RAG search if enabled)
     ├─► ILLMProvider (generate response)
     └─► IToolExecutor (execute tools if needed)
          │
          ▼
     ┌─────────────┐
     │ LLM Response│
     └─────┬───────┘
           │
           ▼
     ┌─────────────────┐
     │ Create assistant│
     │ message         │
     └─────┬───────────┘
           │
           ▼
     ┌─────────────────┐
     │ Return to client│
     └─────────────────┘
```

## Configuration

### Environment Variables

```bash
# LLM Provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=openai  # openai, anthropic, or local
LLM_MODEL=gpt-4-turbo-preview

# RAG Configuration
ENABLE_RAG=false
VECTOR_STORE_TYPE=inmemory  # inmemory, chroma, pinecone
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### Agent Configuration

Create custom agent configurations in `backend/examples/agent_config.json`:

```json
{
  "custom_agent": {
    "role": "custom",
    "system_prompt": "Your custom system prompt",
    "temperature": 0.7,
    "max_tokens": 2000,
    "tools_enabled": true,
    "use_rag": false
  }
}
```

## Tool Development

### Creating Custom Tools

1. **Define the tool function:**

```python
async def my_custom_tool(param1: str, param2: int) -> Dict[str, Any]:
    """Your custom tool implementation."""
    result = perform_action(param1, param2)
    return {"result": result}
```

2. **Register the tool:**

```python
tool_executor = ToolExecutor()
tool_executor.register_tool("my_custom_tool", my_custom_tool)
```

3. **Define tool schema for LLM:**

```python
CUSTOM_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "my_custom_tool",
        "description": "Description of what the tool does",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "Description of param1"
                },
                "param2": {
                    "type": "integer",
                    "description": "Description of param2"
                }
            },
            "required": ["param1", "param2"]
        }
    }
}
```

## RAG Implementation

### Adding Documents to Vector Store

```python
from src.infrastructure.agents.vector_stores import InMemoryVectorStore

vector_store = InMemoryVectorStore()

await vector_store.add_documents(
    documents=["Document content 1", "Document content 2"],
    metadatas=[
        {"source": "doc1.pdf", "page": 1},
        {"source": "doc2.pdf", "page": 1}
    ]
)
```

### Using RAG in Conversations

Set `use_rag=True` in chat request:

```python
ChatRequestDTO(
    message="What does the documentation say about deployment?",
    use_rag=True
)
```

## Frontend Integration

### Using the Chat Interface

```tsx
import { ChatInterface } from '@/features/chat';

function MyPage() {
  return <ChatInterface conversationId={conversationId} />;
}
```

### Custom Chat Implementation

```tsx
import { useChat } from '@/features/chat';

function CustomChat() {
  const { sendMessage, isLoading } = useChat();

  const handleSend = () => {
    sendMessage({
      message: "Hello, agent!",
      agent_config: {
        temperature: 0.7
      }
    });
  };

  return <button onClick={handleSend}>Send</button>;
}
```

## Performance Considerations

### Token Usage Tracking

All agent executions are tracked with:
- Input/output tokens
- Execution time
- Tools used
- Success/failure status

### Caching Strategies

1. **Conversation Caching:** Cache frequently accessed conversations
2. **Vector Store Caching:** Pre-compute and cache embeddings
3. **Tool Result Caching:** Cache expensive tool call results

### Rate Limiting

Implement rate limiting at:
- API endpoint level (requests per minute)
- User level (conversations/tokens per day)
- LLM provider level (respect provider limits)

## Security Best Practices

1. **API Key Management:** Never commit API keys, use environment variables
2. **User Isolation:** Ensure users can only access their conversations
3. **Input Sanitization:** Sanitize user inputs before sending to LLM
4. **Output Filtering:** Filter sensitive information from LLM responses
5. **Tool Access Control:** Limit which tools agents can execute
6. **Content Moderation:** Implement content filtering for inappropriate requests

## Monitoring and Logging

### Metrics to Track

- Request latency
- Token usage per conversation
- Tool execution success rate
- Error rates by provider
- Conversation abandonment rate

### Logging

Structured logging includes:
```python
logger.info(
    "Agent execution completed",
    extra={
        "conversation_id": str(conversation_id),
        "tokens_used": tokens,
        "execution_time_ms": time_ms,
        "tools_used": tools
    }
)
```

## Testing Strategy

### Unit Tests

Test each component in isolation:
- Domain entities
- Use cases with mocked repositories
- Tool executors
- Vector store operations

### Integration Tests

Test the full flow:
- Create conversation
- Send message
- Receive response
- Verify message storage

### Example Test

```python
async def test_chat_flow():
    # Given
    user_id = uuid4()
    message = "Hello, agent!"

    # When
    response = await chat_use_case.execute(
        user_id=user_id,
        dto=ChatRequestDTO(message=message)
    )

    # Then
    assert response.conversation_id is not None
    assert response.message.role == MessageRole.ASSISTANT
    assert len(response.message.content) > 0
```

## Deployment Considerations

### Scaling

- Stateless API design allows horizontal scaling
- Separate vector store for scalability
- Consider async/queue for long-running agent tasks
- Cache frequently accessed conversations

### Cost Optimization

- Use cheaper models for simple tasks
- Implement token limits per conversation
- Cache tool results when possible
- Monitor and alert on unusual usage

## Next Steps

1. **Implement Memory:** Add long-term memory beyond conversation context
2. **Multi-Agent Systems:** Orchestrate multiple specialized agents
3. **Streaming Responses:** Implement SSE for real-time streaming
4. **Advanced RAG:** Implement hybrid search, reranking
5. **Agent Analytics:** Build dashboards for agent performance

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com)
- [LangChain Patterns](https://python.langchain.com)
- [Vector Database Comparison](https://github.com/erikbern/ann-benchmarks)
