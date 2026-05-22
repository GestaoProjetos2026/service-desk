from typing import Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.model import Ticket
from app.modules.tickets.schema import TicketCreate, TicketUpdate


class TicketService:
    def __init__(self, session: Session) -> None:
        self._repo = TicketRepository(session)

    def create_ticket(self, data: TicketCreate) -> Ticket:
        return self._repo.create(data)

    def get_ticket(self, ticket_id: UUID) -> Ticket | None:
        # repository handles the DB fetch
        return self._repo.get_by_id(ticket_id)

    def list_tickets(self, skip: int = 0, limit: int = 50) -> Tuple[int, list[Ticket]]:
        return self._repo.list_all(skip=skip, limit=limit)

    def update_ticket(self, ticket_id: UUID, data: TicketUpdate) -> Ticket | None:
        ticket = self._repo.get_by_id(ticket_id)
        if ticket is None:
            return None
        return self._repo.update(ticket, data)
