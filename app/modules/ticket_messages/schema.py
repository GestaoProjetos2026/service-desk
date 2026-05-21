from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Request Schemas ────────────────────────────────────────────────────────────

class TicketMessageCreate(BaseModel):
    ticket_id: UUID
    author_id: Optional[UUID] = None
    message: str = Field(min_length=1)
    is_internal: bool = False


# ── Response Schemas ───────────────────────────────────────────────────────────

class TicketMessageResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    author_id: Optional[UUID]
    message: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketMessageListResponse(BaseModel):
    total: int
    items: list[TicketMessageResponse]
