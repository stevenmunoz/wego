"""Vector store implementations for RAG."""

import json
from typing import Any, Dict, List, Optional

import httpx

from src.core.logging import get_logger

logger = get_logger(__name__)


class ChromaDBVectorStore:
    """ChromaDB vector store implementation."""

    def __init__(self, host: str = "localhost", port: int = 8000, collection_name: str = "documents") -> None:
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.base_url = f"http://{host}:{port}/api/v1"

    async def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> None:
        """Add documents to ChromaDB."""
        if not ids:
            ids = [str(i) for i in range(len(documents))]

        if not metadatas:
            metadatas = [{} for _ in documents]

        payload = {
            "documents": documents,
            "metadatas": metadatas,
            "ids": ids,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/collections/{self.collection_name}/add",
                json=payload,
            )
            response.raise_for_status()

        logger.info(f"Added {len(documents)} documents to ChromaDB")

    async def search(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar documents in ChromaDB."""
        payload = {
            "query_texts": [query],
            "n_results": k,
        }

        if filter:
            payload["where"] = filter

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/collections/{self.collection_name}/query",
                json=payload,
            )
            response.raise_for_status()

        data = response.json()
        results = []

        if data.get("documents") and data["documents"][0]:
            for i, doc in enumerate(data["documents"][0]):
                results.append({
                    "content": doc,
                    "metadata": data["metadatas"][0][i] if data.get("metadatas") else {},
                    "score": data["distances"][0][i] if data.get("distances") else 0.0,
                })

        logger.info(f"Found {len(results)} similar documents")
        return results


class PineconeVectorStore:
    """Pinecone vector store implementation."""

    def __init__(self, api_key: str, environment: str, index_name: str) -> None:
        self.api_key = api_key
        self.environment = environment
        self.index_name = index_name

    async def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> None:
        """Add documents to Pinecone (requires embedding generation)."""
        # Note: This is a simplified version. In production, you'd:
        # 1. Generate embeddings using an embedding model
        # 2. Upsert to Pinecone with those embeddings
        logger.info(f"Would add {len(documents)} documents to Pinecone")
        pass

    async def search(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search Pinecone (requires embedding generation)."""
        # Note: This is a simplified version. In production, you'd:
        # 1. Generate query embedding
        # 2. Query Pinecone with that embedding
        logger.info(f"Would search Pinecone for: {query}")
        return []


class InMemoryVectorStore:
    """In-memory vector store for development/testing."""

    def __init__(self) -> None:
        self.documents: List[Dict[str, Any]] = []

    async def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> None:
        """Add documents to in-memory store."""
        if not metadatas:
            metadatas = [{} for _ in documents]

        if not ids:
            ids = [str(len(self.documents) + i) for i in range(len(documents))]

        for i, doc in enumerate(documents):
            self.documents.append({
                "id": ids[i],
                "content": doc,
                "metadata": metadatas[i],
            })

        logger.info(f"Added {len(documents)} documents to in-memory store")

    async def search(
        self,
        query: str,
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Simple keyword search in in-memory store."""
        query_lower = query.lower()
        results = []

        for doc in self.documents:
            # Simple keyword matching
            if query_lower in doc["content"].lower():
                results.append({
                    "content": doc["content"],
                    "metadata": doc["metadata"],
                    "score": 1.0,  # Simplified scoring
                })

        # Return top k results
        return results[:k]
