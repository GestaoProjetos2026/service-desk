from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.tickets.model import Ticket, TicketStatus, utc_now
from app.modules.tickets.schema import TicketCreate, TicketUpdate

from fastapi import HTTPException, status

UUID_FIELDS = {"user_id", "client_id", "assigned_to", "updated_by", "ticket_id", "author_id"}
ALLOWED_TRANSITIONS = {
    TicketStatus.pending: {TicketStatus.in_process, TicketStatus.done, TicketStatus.canceled},
    TicketStatus.in_process: {TicketStatus.done, TicketStatus.canceled},
    TicketStatus.done: set(),
    TicketStatus.canceled: set(),
}

def serialize_identifiers(values: dict) -> dict:
    serialized = values.copy()
    for field in UUID_FIELDS:
        if isinstance(serialized.get(field), UUID):
            serialized[field] = str(serialized[field])
    return serialized


class TicketRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, data: TicketCreate) -> Ticket:
        ticket = Ticket(**serialize_identifiers(data.model_dump()))
        self._session.add(ticket)
        self._session.commit()
        self._session.refresh(ticket)
        return ticket

    def get_by_id(self, ticket_id: UUID) -> Optional[Ticket]:
        return self._session.get(Ticket, str(ticket_id))

    def list_all(self, skip: int = 0, limit: int = 50) -> tuple[int, list[Ticket]]:
        total = self._session.scalar(select(func.count()).select_from(Ticket)) or 0
        result = self._session.scalars(
            select(Ticket).order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
        )
        tickets = result.all()
        return int(total), tickets

    def update(self, ticket: Ticket, data: TicketUpdate) -> Ticket:
        update_data = serialize_identifiers(data.model_dump(exclude_unset=True))

        new_status = update_data.get("status")

        if new_status and new_status != ticket.status:
            
            allowed = ALLOWED_TRANSITIONS.get(ticket.status, set())

            if new_status not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Transição inválida: {ticket.status} → {new_status}")
            
        if new_status == TicketStatus.done and ticket.status != TicketStatus.done:
            update_data["closed_at"] = utc_now()

        for field, value in update_data.items():
            setattr(ticket, field, value)

        self._session.add(ticket)
        self._session.commit()
        self._session.refresh(ticket)

        return ticket

    def delete(self, ticket: Ticket) -> None:
        self._session.delete(ticket)
        self._session.commit()
