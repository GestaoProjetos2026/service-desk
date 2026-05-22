from uuid import UUID

from fastapi import HTTPException, status

from app.modules.tickets.service import TicketService
from app.modules.tickets.schema import TicketCreate, TicketUpdate


class TicketController:
    def __init__(self, session) -> None:
        self.service = TicketService(session)

    def list_tickets(self, skip: int = 0, limit: int = 50):
        total, items = self.service.list_tickets(skip=skip, limit=limit)
        return {"total": total, "items": items}

    def get_ticket(self, ticket_id: UUID):
        ticket = self.service.get_ticket(ticket_id)
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        return ticket

    def create_ticket(self, data: TicketCreate):
        return self.service.create_ticket(data)

    def update_ticket(self, ticket_id: UUID, data: TicketUpdate):
        ticket = self.service.update_ticket(ticket_id, data)
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        return ticket
