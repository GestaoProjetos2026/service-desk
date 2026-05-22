from uuid import UUID

from fastapi import HTTPException, status

from app.modules.tickets.message_service import MessageService
from app.modules.tickets.schema import TicketMessageCreate


class MessageController:
    def __init__(self, session) -> None:
        self.service = MessageService(session)

    def create_message(self, ticket_id: UUID, data: TicketMessageCreate):
        ticket = self.service.get_ticket(ticket_id)
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
            )
        return self.service.create_message(ticket_id, data)

    def list_messages(self, ticket_id: UUID, skip: int = 0, limit: int = 50):
        ticket = self.service.get_ticket(ticket_id)
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
            )
        total, items = self.service.list_messages(ticket_id, skip=skip, limit=limit)
        return {"total": total, "items": items}

    def get_message(self, ticket_id: UUID, message_id: UUID):
        ticket = self.service.get_ticket(ticket_id)
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
            )
        message = self.service.get_message(message_id)
        if message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
            )
        return message

    def delete_message(self, ticket_id: UUID, message_id: UUID):
        ticket = self.service.get_ticket(ticket_id)
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
            )
        deleted = self.service.delete_message(message_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
            )
