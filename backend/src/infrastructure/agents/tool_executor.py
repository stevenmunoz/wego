"""Tool executor implementation."""

import ast
import json
import operator
import re
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)

# Constants
MAX_JSON_PARAMETER_SIZE = 1024 * 1024  # 1MB max for JSON parameters
MAX_STRING_PARAMETER_LENGTH = 10000  # Max length for individual string params


class ToolExecutor:
    """Executes tools/functions for agent."""

    def __init__(self) -> None:
        self._tools: dict[str, Any] = {}
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
        parameters: dict[str, Any],
    ) -> dict[str, Any]:
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
                # Check size before parsing to prevent memory exhaustion
                if len(parameters) > MAX_JSON_PARAMETER_SIZE:
                    return {
                        "error": "Parameters too large",
                        "success": False,
                    }
                parameters = json.loads(parameters)

            # Validate string parameter lengths
            for key, value in parameters.items():
                if isinstance(value, str) and len(value) > MAX_STRING_PARAMETER_LENGTH:
                    return {
                        "error": f"Parameter '{key}' exceeds maximum length",
                        "success": False,
                    }

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

    async def _web_search(self, query: str, num_results: int = 5) -> dict[str, Any]:
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

    async def _calculator(self, expression: str) -> dict[str, Any]:
        """Evaluate mathematical expression safely using AST parsing."""
        try:
            result = self._safe_eval_math(expression)
            return {
                "expression": expression,
                "result": result,
            }
        except Exception as e:
            return {
                "expression": expression,
                "error": str(e),
            }

    def _safe_eval_math(self, expression: str) -> float | int:
        """
        Safely evaluate a mathematical expression using AST.

        Supports: +, -, *, /, **, //, %, parentheses, and numeric literals.
        Rejects any other operations or function calls.
        """
        # Validate expression contains only allowed characters
        if not re.match(r'^[\d\s+\-*/().%]+$', expression):
            raise ValueError("Expression contains invalid characters")

        # Parse the expression into an AST
        try:
            tree = ast.parse(expression, mode='eval')
        except SyntaxError as e:
            raise ValueError(f"Invalid expression syntax: {e}") from e

        # Define allowed operators
        allowed_operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.FloorDiv: operator.floordiv,
            ast.Mod: operator.mod,
            ast.Pow: operator.pow,
            ast.USub: operator.neg,
            ast.UAdd: operator.pos,
        }

        def _eval_node(node: ast.AST) -> float | int:
            """Recursively evaluate AST nodes."""
            if isinstance(node, ast.Expression):
                return _eval_node(node.body)
            elif isinstance(node, ast.Constant):
                if isinstance(node.value, int | float):
                    return node.value
                raise ValueError(f"Unsupported constant type: {type(node.value)}")
            elif isinstance(node, ast.BinOp):
                op_type = type(node.op)
                if op_type not in allowed_operators:
                    raise ValueError(f"Unsupported operator: {op_type.__name__}")
                left = _eval_node(node.left)
                right = _eval_node(node.right)
                # Prevent division by zero
                if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and right == 0:
                    raise ValueError("Division by zero")
                # Limit exponentiation to prevent DoS
                if op_type == ast.Pow and (abs(left) > 1000 or abs(right) > 100):
                    raise ValueError("Exponentiation values too large")
                return allowed_operators[op_type](left, right)
            elif isinstance(node, ast.UnaryOp):
                op_type = type(node.op)
                if op_type not in allowed_operators:
                    raise ValueError(f"Unsupported unary operator: {op_type.__name__}")
                operand = _eval_node(node.operand)
                return allowed_operators[op_type](operand)
            else:
                raise ValueError(f"Unsupported expression type: {type(node).__name__}")

        return _eval_node(tree)

    async def _get_current_weather(
        self,
        location: str,
        unit: str = "celsius",
    ) -> dict[str, Any]:
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
