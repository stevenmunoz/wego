"""Custom exception hierarchy for the application."""


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str = "An error occurred", status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ValidationException(AppException):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation error") -> None:
        super().__init__(message=message, status_code=422)


class NotFoundException(AppException):
    """Raised when a resource is not found."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message=message, status_code=404)


class UnauthorizedException(AppException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message=message, status_code=401)


class ForbiddenException(AppException):
    """Raised when user lacks permission."""

    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message=message, status_code=403)


class ConflictException(AppException):
    """Raised when a resource conflict occurs."""

    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(message=message, status_code=409)


class DatabaseException(AppException):
    """Raised when database operations fail."""

    def __init__(self, message: str = "Database error") -> None:
        super().__init__(message=message, status_code=500)


class ExternalServiceException(AppException):
    """Raised when external service calls fail."""

    def __init__(self, message: str = "External service error") -> None:
        super().__init__(message=message, status_code=502)
