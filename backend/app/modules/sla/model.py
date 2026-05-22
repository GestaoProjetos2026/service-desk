from datetime import datetime, UTC
from enum import Enum
from typing import NamedTuple

from app.modules.tickets.model import TicketPriority


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class SlaStatus(str, Enum):
    on_track = "on_track"
    at_risk = "at_risk"
    violated = "violated"
    paused = "paused"


class SlaPolicy(NamedTuple):
    """SLA policy for a given priority level"""
    priority: TicketPriority
    first_response_hours: int
    resolution_hours: int


# SLA Policies defined by priority (from PRD)
SLA_POLICIES = {
    TicketPriority.low: SlaPolicy(
        priority=TicketPriority.low,
        first_response_hours=72,
        resolution_hours=92,
    ),
    TicketPriority.normal: SlaPolicy(
        priority=TicketPriority.normal,
        first_response_hours=24,
        resolution_hours=48,
    ),
    TicketPriority.high: SlaPolicy(
        priority=TicketPriority.high,
        first_response_hours=2,
        resolution_hours=24,
    ),
    TicketPriority.urgent: SlaPolicy(
        priority=TicketPriority.urgent,
        first_response_hours=1,
        resolution_hours=4,
    ),
}
