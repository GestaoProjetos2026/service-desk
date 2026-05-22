from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.modules.sla.model import SlaStatus
from app.modules.tickets.model import TicketPriority


# ── Response Schemas ───────────────────────────────────────────────────────────


class SlaStatusResponse(BaseModel):
    """Current SLA status for a ticket"""
    ticket_id: UUID
    priority: TicketPriority
    status: SlaStatus
    first_response_deadline: datetime
    first_response_status: str  # "met", "at_risk", "violated"
    first_response_remaining_hours: Optional[float]
    resolution_deadline: datetime
    resolution_status: str  # "met", "at_risk", "violated"
    resolution_remaining_hours: Optional[float]
    is_paused: bool
    violations: list[str] = []  # List of violation descriptions
    created_at: datetime
    updated_at: datetime


class SlaViolationAlert(BaseModel):
    """Alert for an SLA violation"""
    ticket_id: UUID
    priority: TicketPriority
    violation_type: str  # "first_response" or "resolution"
    expected_at: datetime
    violated_at: datetime
    hours_overdue: int
    message: str

