"""Firebase configuration and client management."""

import os
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

from src.core.config import settings


class _EmulatorCredentials(credentials.Base):
    """Mock credentials for Firebase Emulator - no real auth needed."""

    def get_access_token(self):
        """Return a mock access token."""
        return credentials.AccessTokenInfo("mock-token", None)

    def get_credential(self):
        """Return None as no real credential is needed for emulator."""
        return None

# Global Firebase app instance
_firebase_app: firebase_admin.App | None = None
_firestore_client: Any = None  # firestore.AsyncClient type


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
        # Production/Local dev: Use service account credentials
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        _firebase_app = firebase_admin.initialize_app(
            cred,
            {
                "projectId": settings.FIREBASE_PROJECT_ID,
            },
        )
    elif settings.USE_FIREBASE_EMULATOR:
        # Development/Testing: Use Firebase emulator with mock credentials
        os.environ["FIRESTORE_EMULATOR_HOST"] = (
            f"{settings.FIREBASE_EMULATOR_HOST}:{settings.FIREBASE_EMULATOR_PORT}"
        )
        # Use mock credentials for emulator - no real auth needed
        # The emulator doesn't validate credentials
        _firebase_app = firebase_admin.initialize_app(
            credential=_EmulatorCredentials(),
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

    # Initialize Firestore client using Firebase Admin SDK credentials
    _firestore_client = firestore.client(app=_firebase_app)


def get_firestore() -> Any:
    """
    Get Firestore client.

    Returns:
        Firestore client instance

    Raises:
        RuntimeError: If Firebase has not been initialized
    """
    if _firestore_client is None:
        raise RuntimeError(
            "Firebase has not been initialized. "
            "Call initialize_firebase() at application startup."
        )
    return _firestore_client


async def get_db() -> Any:
    """
    Get database client (alias for get_firestore for compatibility).

    Returns:
        Firestore client instance
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
