from fastapi import HTTPException, status

class ArtisanNotFoundError(HTTPException):
    def __init__(self, detail: str = "Artisan not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ArtisanForbiddenError(HTTPException):
    def __init__(self, detail: str = "Not authorized to access this resource"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ArtisanConflictError(HTTPException):
    def __init__(self, detail: str = "Conflict error"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class InvalidCredentialsError(HTTPException):
    def __init__(self, detail: str = "Invalid email or password"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
