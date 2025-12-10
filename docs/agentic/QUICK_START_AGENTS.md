# Quick Start: Agentic Services

Get started with AI agents in minutes!

## Prerequisites

- OpenAI API key or Anthropic API key
- Backend and database running

## Setup

### 1. Configure API Keys

Add to `backend/.env`:

```bash
# Choose your provider
LLM_PROVIDER=openai  # or anthropic, or local (for testing)

# OpenAI
OPENAI_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4-turbo-preview

# Or Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
LLM_MODEL=claude-3-5-sonnet-20241022

# RAG (optional)
ENABLE_RAG=false
VECTOR_STORE_TYPE=inmemory
```

### 2. Start the Backend

```bash
cd backend
uvicorn src.main:app --reload
```

### 3. Test the API

**Create a conversation:**

```bash
curl -X POST http://localhost:8000/api/v1/chat/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Chat",
    "agent_config": {
      "temperature": 0.7
    }
  }'
```

**Send a message:**

```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Can you help me understand clean architecture?",
    "conversation_id": "CONVERSATION_ID_FROM_ABOVE"
  }'
```

## Using the Web Interface

### 1. Start the Web App

```bash
cd web
npm run dev
```

### 2. Navigate to Chat

- Login at http://localhost:3000/login
- Go to http://localhost:3000/chat
- Start chatting!

## Example: Custom Agent

### Create a Code Review Agent

**1. Define agent config:**

```json
{
  "code_reviewer": {
    "role": "developer",
    "system_prompt": "You are an expert code reviewer. Analyze code for:\n- Bugs and potential issues\n- Performance improvements\n- Best practices\n- Security concerns\n\nProvide constructive feedback with specific examples.",
    "temperature": 0.3,
    "max_tokens": 3000,
    "tools_enabled": false
  }
}
```

**2. Use in frontend:**

```tsx
import { useChat } from '@/features/chat';

function CodeReviewChat() {
  const { sendMessage } = useChat();

  const reviewCode = (code: string) => {
    sendMessage({
      message: `Please review this code:\n\n${code}`,
      agent_config: {
        role: "developer",
        system_prompt: "You are an expert code reviewer...",
        temperature: 0.3
      }
    });
  };

  return <button onClick={() => reviewCode(myCode)}>Review Code</button>;
}
```

## Example: Tool Usage

### Enable Tools

```python
# In your chat request
ChatRequestDTO(
    message="What's the weather in San Francisco?",
    agent_config={
        "tools_enabled": True
    }
)
```

The agent will automatically call the `get_current_weather` tool!

### Create a Custom Tool

**1. Define the tool:**

```python
async def fetch_stock_price(symbol: str) -> Dict[str, Any]:
    """Fetch current stock price."""
    # Your implementation
    price = get_price_from_api(symbol)
    return {
        "symbol": symbol,
        "price": price,
        "currency": "USD"
    }
```

**2. Register it:**

```python
from src.infrastructure.agents.tool_executor import ToolExecutor

tool_executor = ToolExecutor()
tool_executor.register_tool("fetch_stock_price", fetch_stock_price)
```

**3. Add schema:**

```python
STOCK_PRICE_TOOL = {
    "type": "function",
    "function": {
        "name": "fetch_stock_price",
        "description": "Get current stock price for a symbol",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., AAPL, GOOGL)"
                }
            },
            "required": ["symbol"]
        }
    }
}
```

## Example: RAG (Retrieval Augmented Generation)

### Enable RAG

```bash
# In .env
ENABLE_RAG=true
VECTOR_STORE_TYPE=inmemory  # or chroma for production
```

### Add Documents

```python
from src.infrastructure.agents.vector_stores import InMemoryVectorStore

vector_store = InMemoryVectorStore()

# Add your documentation
await vector_store.add_documents(
    documents=[
        "Our deployment process uses Docker and Kubernetes...",
        "The authentication system uses JWT tokens...",
        "Database migrations are handled by Alembic..."
    ],
    metadatas=[
        {"source": "deployment.md"},
        {"source": "auth.md"},
        {"source": "database.md"}
    ]
)
```

### Query with RAG

```python
ChatRequestDTO(
    message="How do we handle database migrations?",
    use_rag=True  # This will search your documents for context
)
```

## Monitoring Agent Usage

### View Execution Metrics

```python
# Get executions for a conversation
executions = await execution_repository.get_by_conversation_id(conversation_id)

for execution in executions:
    print(f"Tokens used: {execution.tokens_used}")
    print(f"Execution time: {execution.execution_time_ms}ms")
    print(f"Tools used: {execution.tools_used}")
```

### Track Costs

```python
# Calculate approximate cost
COST_PER_1K_TOKENS = {
    "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015}
}

def calculate_cost(execution):
    model = execution.metadata.get("model", "gpt-4-turbo-preview")
    rates = COST_PER_1K_TOKENS[model]

    input_cost = (execution.input_tokens / 1000) * rates["input"]
    output_cost = (execution.output_tokens / 1000) * rates["output"]

    return input_cost + output_cost
```

## Common Patterns

### 1. Multi-Turn Conversation

The system automatically maintains conversation context:

```python
# Turn 1
chat("What is clean architecture?")

# Turn 2 - agent remembers previous context
chat("Can you give me an example in Python?")

# Turn 3 - still in context
chat("How does this differ from MVC?")
```

### 2. Streaming Responses (Coming Soon)

```python
async for chunk in chat_stream("Tell me a story"):
    print(chunk.content, end="", flush=True)
```

### 3. Agent Switching

```python
# Start with research agent
chat("Research the best practices for API design", agent_config={
    "role": "researcher",
    "use_rag": True
})

# Switch to developer agent in same conversation
chat("Now write a FastAPI example", agent_config={
    "role": "developer"
})
```

## Troubleshooting

### Issue: "OpenAI API key is missing"

**Solution:** Set `OPENAI_API_KEY` in `backend/.env`

### Issue: "Rate limit exceeded"

**Solution:** Implement rate limiting or use a different model

### Issue: Agent not using tools

**Solution:** Ensure `tools_enabled: True` in agent config

### Issue: RAG not finding relevant documents

**Solution:**
1. Check documents are added to vector store
2. Try more specific queries
3. Adjust `k` parameter for more results

## Next Steps

- Read [Agentic Architecture](./AGENTIC_ARCHITECTURE.md) for in-depth understanding
- Explore [Tool Development](./AGENTIC_ARCHITECTURE.md#tool-development)
- Learn about [RAG Implementation](./AGENTIC_ARCHITECTURE.md#rag-implementation)
- Check out example configurations in `backend/examples/agent_config.json`

## Production Checklist

- [ ] Set production API keys
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Implement cost tracking
- [ ] Add content filtering
- [ ] Configure vector store (Chroma/Pinecone)
- [ ] Test failover scenarios
- [ ] Document custom tools
- [ ] Set up backup for conversation data

Happy building with AI agents! 🤖
