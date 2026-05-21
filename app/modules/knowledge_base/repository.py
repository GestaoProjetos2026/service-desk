from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.tickets.model import Ticket
from app.modules.ticket_messages.model import TicketMessage


class KnowledgeBaseRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_all(self, skip: int = 0, limit: int = 50) -> tuple[int, list[dict]]:
        """Get all tickets with their last message."""
        # Count total tickets
        total = self._session.scalar(select(func.count()).select_from(Ticket)) or 0

        # Get tickets ordered by creation date
        tickets = self._session.scalars(
            select(Ticket).order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
        ).all()

        # Build result with last message for each ticket
        result = []
        for ticket in tickets:
            last_message = self._session.scalar(
                select(TicketMessage)
                .where(TicketMessage.ticket_id == ticket.id)
                .order_by(TicketMessage.created_at.desc())
                .limit(1)
            )

            result.append({
                "ticket_id": ticket.id,
                "title": ticket.title,
                "description": ticket.description,
                "last_message": last_message.message if last_message else None,
                "created_at": ticket.created_at,
            })

        return int(total), result
