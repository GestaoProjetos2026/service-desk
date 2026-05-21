from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.config.database import get_session
from app.modules.sla.controller import SlaController
from app.modules.sla.schema import SlaStatusResponse, SlaViolationAlert
from app.modules.tickets.model import Ticket, TicketPriority

router = APIRouter(prefix="/sla", tags=["SLA"])


def get_controller(session=Depends(get_session)) -> SlaController:
    return SlaController(session)


# ── SLA Status ───────────────────────────────────────────────────────────


@router.get("/status/{ticket_id}", response_model=SlaStatusResponse)
def get_ticket_sla_status(
    ticket_id: UUID,
    session=Depends(get_session),
    controller: SlaController = Depends(get_controller),
):
    """
    Get current SLA status for a ticket.
    
    Returns:
    - status: Overall SLA status (on_track, at_risk, violated, paused)
    - first_response_deadline: When first response is due
    - resolution_deadline: When ticket must be resolved
    - Remaining hours for each SLA goal
    - List of any violations
    """
    ticket = session.get(Ticket, str(ticket_id))
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return controller.get_ticket_sla_status(ticket)


# ── SLA Violations & Alerts ───────────────────────────────────────────────────────────


@router.get("/violations/{ticket_id}")
def check_ticket_violations(
    ticket_id: UUID,
    session=Depends(get_session),
    controller: SlaController = Depends(get_controller),
):
    """
    Check and return SLA violations for a specific ticket.
    
    Returns list of violations if any are found (first_response or resolution).
    """
    ticket = session.get(Ticket, str(ticket_id))
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return controller.check_ticket_violations(ticket)


@router.get("/summary/priority/{priority}")
def get_priority_sla_summary(
    priority: TicketPriority,
    controller: SlaController = Depends(get_controller),
):
    """
    Get SLA compliance summary for all tickets with a given priority.
    
    Returns:
    - total_tickets: Total number of tickets for this priority
    - on_track: Tickets meeting SLA
    - at_risk: Tickets approaching deadline
    - violated: Tickets that missed SLA
    - compliance_percentage: Percentage of tickets within SLA
    """
    return controller.get_priority_sla_summary(priority)

