from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.ticket_messages.schema import TicketMessageResponse
from app.modules.tickets.model import TicketPriority, TicketStatus


# ── Request Schemas ────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    status: TicketStatus = TicketStatus.pending
    priority: TicketPriority = TicketPriority.normal
    user_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    category: Optional[str] = Field(default=None, max_length=100)


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, min_length=10)
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    category: Optional[str] = Field(default=None, max_length=100)


class TicketMessageCreate(BaseModel):
    author_id: Optional[UUID] = None
    message: str = Field(min_length=1)
    is_internal: bool = False


# ── Response Schemas ───────────────────────────────────────────────────────────

class TicketResponse(BaseModel):
    id: UUID
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    user_id: Optional[UUID]
    client_id: Optional[UUID]
    assigned_to: Optional[UUID]
    updated_by: Optional[UUID]
    category: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TicketListResponse(BaseModel):
    total: int
    items: list[TicketResponse]


class TicketMessageListResponse(BaseModel):
    total: int
    items: list[TicketMessageResponse]
