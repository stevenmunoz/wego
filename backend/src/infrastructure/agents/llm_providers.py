"""LLM provider implementations."""

from typing import Any, Dict, List, Optional

import httpx

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class OpenAIProvider:
    """OpenAI LLM provider implementation."""

    def __init__(self, api_key: str, model: str = "gpt-4-turbo-preview") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.openai.com/v1"

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate response using OpenAI API."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0,
            )
            response.raise_for_status()

        data = response.json()
        choice = data["choices"][0]
        message = choice["message"]

        result = {
            "content": message.get("content", ""),
            "usage": data.get("usage", {}),
            "model": data.get("model"),
        }

        if message.get("tool_calls"):
            result["tool_calls"] = [
                {
                    "id": tc["id"],
                    "name": tc["function"]["name"],
                    "parameters": tc["function"]["arguments"],
                }
                for tc in message["tool_calls"]
            ]

        logger.info(
            f"OpenAI response generated",
            extra={
                "model": self.model,
                "tokens": data.get("usage", {}).get("total_tokens"),
            },
        )

        return result


class AnthropicProvider:
    """Anthropic (Claude) LLM provider implementation."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1"

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate response using Anthropic API."""
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        # Extract system message if present
        system_message = None
        formatted_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                formatted_messages.append(msg)

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 4096,
        }

        if system_message:
            payload["system"] = system_message

        if tools:
            payload["tools"] = tools

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/messages",
                headers=headers,
                json=payload,
                timeout=60.0,
            )
            response.raise_for_status()

        data = response.json()

        result = {
            "content": data["content"][0]["text"] if data["content"] else "",
            "usage": {
                "prompt_tokens": data["usage"]["input_tokens"],
                "completion_tokens": data["usage"]["output_tokens"],
                "total_tokens": data["usage"]["input_tokens"] + data["usage"]["output_tokens"],
            },
            "model": data.get("model"),
        }

        # Handle tool use
        tool_calls = [
            content for content in data["content"]
            if content.get("type") == "tool_use"
        ]

        if tool_calls:
            result["tool_calls"] = [
                {
                    "id": tc["id"],
                    "name": tc["name"],
                    "parameters": tc["input"],
                }
                for tc in tool_calls
            ]

        logger.info(
            f"Anthropic response generated",
            extra={
                "model": self.model,
                "tokens": result["usage"]["total_tokens"],
            },
        )

        return result


class LocalLLMProvider:
    """Local LLM provider for development/testing."""

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate mock response for testing."""
        last_message = messages[-1]["content"] if messages else ""

        return {
            "content": f"Mock response to: {last_message}",
            "usage": {
                "prompt_tokens": 50,
                "completion_tokens": 20,
                "total_tokens": 70,
            },
            "model": "local-mock",
        }
