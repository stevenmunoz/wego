"""Firebase configuration and client management."""

import os

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import AsyncClient

from src.core.config import settings

# Global Firebase app instance
_firebase_app: firebase_admin.App | None = None
_firestore_client: AsyncClient | None = None


def initialize_firebase() -> None:
    """
    Initialize Firebase Admin SDK.

    This should be called once at application startup.
    """
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        return

    # Initialize Firebase
    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        # Production: Use service account credentials
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        _firebase_app = firebase_admin.initialize_app(
            cred,
            {
                "projectId": settings.FIREBASE_PROJECT_ID,
            },
        )
    elif settings.USE_FIREBASE_EMULATOR:
        # Development: Use Firebase emulator
        os.environ["FIRESTORE_EMULATOR_HOST"] = (
            f"{settings.FIREBASE_EMULATOR_HOST}:{settings.FIREBASE_EMULATOR_PORT}"
        )
        _firebase_app = firebase_admin.initialize_app(
            options={
                "projectId": settings.FIREBASE_PROJECT_ID,
            }
        )
    else:
        # Use application default credentials (GCP environment)
        _firebase_app = firebase_admin.initialize_app(
            options={
                "projectId": settings.FIREBASE_PROJECT_ID,
            }
        )

    # Initialize Firestore client
    _firestore_client = firestore.AsyncClient()


def get_firestore() -> AsyncClient:
    """
    Get Firestore async client.

    Returns:
        AsyncClient: Firestore async client

    Raises:
        RuntimeError: If Firebase has not been initialized
    """
    if _firestore_client is None:
        raise RuntimeError(
            "Firebase has not been initialized. "
            "Call initialize_firebase() at application startup."
        )
    return _firestore_client


async def get_db() -> AsyncClient:
    """
    Get database client (alias for get_firestore for compatibility).

    Returns:
        AsyncClient: Firestore async client
    """
    return get_firestore()


async def close_firebase() -> None:
    """
    Close Firebase connections.

    This should be called at application shutdown.
    """
    global _firebase_app, _firestore_client

    if _firestore_client is not None:
        _firestore_client.close()
        _firestore_client = None

    if _firebase_app is not None:
        firebase_admin.delete_app(_firebase_app)
        _firebase_app = None
