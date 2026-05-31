from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.ticket_messages.service import TicketMessageService
from app.modules.ticket_messages.schema import TicketMessageCreate
from app.modules.tickets.repository import TicketRepository


class TicketMessageController:
    def __init__(self, session: Session) -> None:
        self.service = TicketMessageService(session)
        self._ticket_repo = TicketRepository(session)

    def create_message(self, data: TicketMessageCreate):
        # BUG FIX: valida existência do ticket antes de criar a mensagem.
        # Sem essa verificação, mensagens podiam ser gravadas com ticket_id
        # inválido (FK quebrada), nunca sendo encontradas na busca.
        ticket = self._ticket_repo.get_by_id(data.ticket_id)
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        return self.service.create_message(data)

    def list_by_ticket(self, ticket_id: UUID, skip: int = 0, limit: int = 50):
        total, items = self.service.list_by_ticket(ticket_id, skip=skip, limit=limit)
        return {"total": total, "items": items}

    def delete_message(self, message_id: UUID):
        success = self.service.delete_message(message_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )
        return {"detail": "Message deleted successfully"}
