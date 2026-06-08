"""Common/shared Pydantic schemas."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class PaginatedParams(BaseModel):
    page: int = 1
    per_page: int = 20
    search: str | None = None
