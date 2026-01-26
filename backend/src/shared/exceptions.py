from fastapi import HTTPException, status


class APIException(HTTPException):
    """Base API exception class"""
    def __init__(self, detail: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(APIException):
    def __init__(self, resource: str, identifier: int | str):
        detail = f"{resource} with ID {identifier} not found"
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedError(APIException):
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(detail=message, status_code=status.HTTP_401_UNAUTHORIZED)
        self.headers = {"WWW-Authenticate": "Bearer"}


class BadRequestError(APIException):
    def __init__(self, message: str):
        super().__init__(detail=message, status_code=status.HTTP_400_BAD_REQUEST)


class ProcessingError(APIException):
    def __init__(self, message: str):
        super().__init__(detail=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ConflictError(APIException):
    """409 Conflict errors"""
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


class InternalServerError(APIException):
    """500 Internal Server errors"""
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(detail=detail, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Receipt-specific exceptions
class ReceiptProcessingError(ProcessingError):
    """Receipt processing validation errors"""
    def __init__(self, detail: str):
        super().__init__(f"Receipt processing failed: {detail}")


class ReceiptNotFoundError(NotFoundError):
    """Receipt not found error"""
    def __init__(self, receipt_id: int):
        super().__init__("Receipt", receipt_id)


# Expense-specific exceptions
class ExpenseNotFoundError(NotFoundError):
    """Expense not found error"""
    def __init__(self, expense_id: int):
        super().__init__("Expense", expense_id)


# File upload exceptions
class InvalidFileTypeError(BadRequestError):
    """Invalid file type error"""
    def __init__(self, file_type: str, allowed_types: list[str]):
        detail = f"File type '{file_type}' not allowed. Allowed types: {', '.join(allowed_types)}"
        super().__init__(detail)


class FileTooLargeError(BadRequestError):
    """File too large error"""
    def __init__(self, file_size: int, max_size: int):
        detail = f"File size {file_size} bytes exceeds maximum {max_size} bytes"
        super().__init__(detail)


# Rate limiting exceptions
class RateLimitExceededError(APIException):
    """Rate limit exceeded error"""
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(detail=detail, status_code=status.HTTP_429_TOO_MANY_REQUESTS)


