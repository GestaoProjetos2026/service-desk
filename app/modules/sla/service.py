from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.modules.sla.model import SlaStatus, SLA_POLICIES, utc_now
from app.modules.sla.schema import SlaStatusResponse, SlaViolationAlert
from app.modules.ticket_messages.model import TicketMessage
from app.modules.tickets.model import Ticket, TicketStatus


class SlaService:
    """Service for calculating and monitoring SLA status based on existing ticket data"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_first_response_time(self, ticket: Ticket) -> Optional[datetime]:
        """
        Get the timestamp of the first response from support staff.
        
        A response is the first message with is_internal=False (visible to client)
        created after the ticket was created.
        """
        first_response = self._session.scalar(
            select(TicketMessage)
            .where(
                and_(
                    TicketMessage.ticket_id == ticket.id,
                    TicketMessage.is_internal == False,
                    TicketMessage.created_at > ticket.created_at,
                )
            )
            .order_by(TicketMessage.created_at.asc())
        )
        return first_response.created_at if first_response else None

    def calculate_sla_status(self, ticket: Ticket) -> SlaStatusResponse:
        """
        Calculate SLA status for a ticket based on:
        - RBN-003: First response deadline (created_at + hours)
        - RBN-004: Resolution deadline (created_at + hours)
        - RBN-005: SLA paused for certain statuses
        
        Uses actual support staff responses from ticket messages.
        """
        policy = SLA_POLICIES.get(ticket.priority)
        if not policy:
            raise ValueError(f"No SLA policy found for priority {ticket.priority}")

        now = utc_now()

        # Calculate deadlines
        first_response_deadline = ticket.created_at + timedelta(hours=policy.first_response_hours)
        resolution_deadline = ticket.created_at + timedelta(hours=policy.resolution_hours)

        # Get actual first response time from messages
        first_response_time = self._get_first_response_time(ticket)
        violations = []

        # ─────── First Response SLA ───────
        if first_response_time:
            # Response has been given
            if first_response_time <= first_response_deadline:
                first_response_status = "met"
            else:
                first_response_status = "violated"
                hours_overdue = int((first_response_time - first_response_deadline).total_seconds() / 3600)
                violations.append(
                    f"First response violated by {hours_overdue} hours "
                    f"(responded at {first_response_time}, deadline was {first_response_deadline})"
                )
            first_response_remaining = None
        else:
            # No response yet
            if now > first_response_deadline:
                first_response_status = "violated"
                hours_overdue = int((now - first_response_deadline).total_seconds() / 3600)
                violations.append(
                    f"First response SLA violated - "
                    f"{hours_overdue} hours overdue (deadline: {first_response_deadline})"
                )
                first_response_remaining = None
            else:
                remaining_hours = (first_response_deadline - now).total_seconds() / 3600
                if remaining_hours <= 1:  # Less than 1h
                    first_response_status = "at_risk"
                else:
                    first_response_status = "on_track"
                first_response_remaining = remaining_hours

        # ─────── Resolution SLA ───────
        if ticket.status == TicketStatus.done:
            # Ticket is resolved
            resolved_at = ticket.closed_at if ticket.closed_at else ticket.updated_at
            if resolved_at <= resolution_deadline:
                resolution_status = "met"
            else:
                resolution_status = "violated"
                hours_overdue = int((resolved_at - resolution_deadline).total_seconds() / 3600)
                violations.append(
                    f"Resolution violated by {hours_overdue} hours "
                    f"(resolved at {resolved_at}, deadline was {resolution_deadline})"
                )
            resolution_remaining = None
        else:
            # Not resolved yet
            if now > resolution_deadline:
                resolution_status = "violated"
                hours_overdue = int((now - resolution_deadline).total_seconds() / 3600)
                violations.append(
                    f"Resolution SLA violated - "
                    f"{hours_overdue} hours overdue (deadline: {resolution_deadline})"
                )
                resolution_remaining = None
            else:
                remaining_hours = (resolution_deadline - now).total_seconds() / 3600
                if remaining_hours <= 1:  # Less than 1h
                    resolution_status = "at_risk"
                else:
                    resolution_status = "on_track"
                resolution_remaining = remaining_hours

        # ─────── Overall Status ───────
        is_paused = ticket.status in (TicketStatus.pending, TicketStatus.canceled)

        if first_response_status == "violated" or resolution_status == "violated":
            overall_status = SlaStatus.violated
        elif first_response_status == "at_risk" or resolution_status == "at_risk":
            overall_status = SlaStatus.at_risk
        elif is_paused:
            overall_status = SlaStatus.paused
        else:
            overall_status = SlaStatus.on_track

        return SlaStatusResponse(
            ticket_id=UUID(ticket.id),
            priority=ticket.priority,
            status=overall_status,
            first_response_deadline=first_response_deadline,
            first_response_status=first_response_status,
            first_response_remaining_hours=first_response_remaining,
            resolution_deadline=resolution_deadline,
            resolution_status=resolution_status,
            resolution_remaining_hours=resolution_remaining,
            is_paused=is_paused,
            violations=violations,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        )

    def check_violations(self, ticket: Ticket) -> list[SlaViolationAlert]:
        """
        Check if ticket has violated SLA and return violation alerts.
        """
        policy = SLA_POLICIES.get(ticket.priority)
        if not policy:
            return []

        violations = []
        now = utc_now()

        first_response_deadline = ticket.created_at + timedelta(hours=policy.first_response_hours)
        resolution_deadline = ticket.created_at + timedelta(hours=policy.resolution_hours)

        # ─────── Check First Response Violation ───────
        first_response_time = self._get_first_response_time(ticket)
        if first_response_time is None and now > first_response_deadline:
            hours_overdue = int((now - first_response_deadline).total_seconds() / 3600)
            violations.append(
                SlaViolationAlert(
                    ticket_id=UUID(ticket.id),
                    priority=ticket.priority,
                    violation_type="first_response",
                    expected_at=first_response_deadline,
                    violated_at=now,
                    hours_overdue=hours_overdue,
                    message=f"🔴 Ticket #{ticket.id[:8]} - First response SLA violated "
                    f"({hours_overdue}h overdue) - Priority: {ticket.priority}",
                )
            )
        elif first_response_time and first_response_time > first_response_deadline:
            hours_overdue = int((first_response_time - first_response_deadline).total_seconds() / 3600)
            violations.append(
                SlaViolationAlert(
                    ticket_id=UUID(ticket.id),
                    priority=ticket.priority,
                    violation_type="first_response",
                    expected_at=first_response_deadline,
                    violated_at=first_response_time,
                    hours_overdue=hours_overdue,
                    message=f"🔴 Ticket #{ticket.id[:8]} - First response SLA violated "
                    f"({hours_overdue}h overdue) - Priority: {ticket.priority}",
                )
            )

        # ─────── Check Resolution Violation ───────
        if ticket.status != TicketStatus.done and now > resolution_deadline:
            hours_overdue = int((now - resolution_deadline).total_seconds() / 3600)
            violations.append(
                SlaViolationAlert(
                    ticket_id=UUID(ticket.id),
                    priority=ticket.priority,
                    violation_type="resolution",
                    expected_at=resolution_deadline,
                    violated_at=now,
                    hours_overdue=hours_overdue,
                    message=f"🔴 Ticket #{ticket.id[:8]} - Resolution SLA violated "
                    f"({hours_overdue}h overdue) - Priority: {ticket.priority}",
                )
            )
        elif ticket.status == TicketStatus.done:
            resolved_at = ticket.closed_at if ticket.closed_at else ticket.updated_at
            if resolved_at > resolution_deadline:
                hours_overdue = int((resolved_at - resolution_deadline).total_seconds() / 3600)
                violations.append(
                    SlaViolationAlert(
                        ticket_id=UUID(ticket.id),
                        priority=ticket.priority,
                        violation_type="resolution",
                        expected_at=resolution_deadline,
                        violated_at=resolved_at,
                        hours_overdue=hours_overdue,
                        message=f"🔴 Ticket #{ticket.id[:8]} - Resolution SLA violated "
                        f"({hours_overdue}h overdue) - Priority: {ticket.priority}",
                    )
                )

        return violations

    def get_sla_summary_for_priority(self, priority):
        """Get SLA summary for all tickets with a given priority"""
        tickets = self._session.scalars(
            select(Ticket).where(Ticket.priority == priority)
        ).all()
        
        total_tickets = len(tickets)
        violations = 0
        at_risk = 0
        on_track = 0
        paused = 0

        for ticket in tickets:
            status = self.calculate_sla_status(ticket)
            if status.status == SlaStatus.violated:
                violations += 1
            elif status.status == SlaStatus.at_risk:
                at_risk += 1
            elif status.status == SlaStatus.paused:
                paused += 1
            else:
                on_track += 1

        return {
            "priority": priority,
            "total_tickets": total_tickets,
            "on_track": on_track,
            "at_risk": at_risk,
            "violated": violations,
            "paused": paused,
            "compliance_percentage": (on_track / total_tickets * 100) if total_tickets > 0 else 0,
        }

