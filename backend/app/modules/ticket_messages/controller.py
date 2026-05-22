from uuid import UUID

from fastapi import HTTPException, status

from app.modules.ticket_messages.service import TicketMessageService
from app.modules.ticket_messages.schema import TicketMessageCreate


class TicketMessageController:
    def __init__(self, session) -> None:
        self.service = TicketMessageService(session)

    def create_message(self, data: TicketMessageCreate):
        return self.service.create_message(data)

    def list_by_ticket(self, ticket_id: UUID, skip: int = 0, limit: int = 50):
        total, items = self.service.list_by_ticket(ticket_id, skip=skip, limit=limit)
        return {"total": total, "items": items}

    def delete_message(self, message_id: UUID):
        success = self.service.delete_message(message_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        return {"detail": "Message deleted successfully"}
