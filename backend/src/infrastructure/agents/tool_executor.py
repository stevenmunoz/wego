"""Tool executor implementation."""

import json
from typing import Any, Dict

import httpx

from src.core.logging import get_logger

logger = get_logger(__name__)


class ToolExecutor:
    """Executes tools/functions for agent."""

    def __init__(self) -> None:
        self._tools: Dict[str, Any] = {}
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        """Register default tools."""
        self._tools["web_search"] = self._web_search
        self._tools["calculator"] = self._calculator
        self._tools["get_current_weather"] = self._get_current_weather

    def register_tool(self, name: str, func: Any) -> None:
        """Register a custom tool."""
        self._tools[name] = func

    async def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute a tool with given parameters."""
        if tool_name not in self._tools:
            return {
                "error": f"Tool '{tool_name}' not found",
                "success": False,
            }

        try:
            logger.info(f"Executing tool: {tool_name}", extra={"parameters": parameters})

            # Parse parameters if they're a JSON string
            if isinstance(parameters, str):
                parameters = json.loads(parameters)

            result = await self._tools[tool_name](**parameters)

            logger.info(f"Tool {tool_name} executed successfully")

            return {
                "result": result,
                "success": True,
            }

        except Exception as e:
            logger.error(f"Tool execution failed: {str(e)}", exc_info=True)
            return {
                "error": str(e),
                "success": False,
            }

    async def _web_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """Perform web search (mock implementation)."""
        # In production, integrate with a real search API
        return {
            "query": query,
            "results": [
                {
                    "title": f"Result {i+1} for '{query}'",
                    "url": f"https://example.com/result-{i+1}",
                    "snippet": f"This is a mock search result for {query}",
                }
                for i in range(num_results)
            ],
        }

    async def _calculator(self, expression: str) -> Dict[str, Any]:
        """Evaluate mathematical expression."""
        try:
            # Simple safe evaluation (in production, use a proper math parser)
            result = eval(expression, {"__builtins__": {}}, {})
            return {
                "expression": expression,
                "result": result,
            }
        except Exception as e:
            return {
                "expression": expression,
                "error": str(e),
            }

    async def _get_current_weather(
        self,
        location: str,
        unit: str = "celsius",
    ) -> Dict[str, Any]:
        """Get current weather (mock implementation)."""
        # In production, integrate with a weather API
        return {
            "location": location,
            "temperature": 22,
            "unit": unit,
            "condition": "Partly cloudy",
            "humidity": 65,
        }


# Example tool schemas for LLM
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query",
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "Number of results to return (default: 5)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Evaluate a mathematical expression",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate",
                    },
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name or location",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit",
                        "default": "celsius",
                    },
                },
                "required": ["location"],
            },
        },
    },
]
