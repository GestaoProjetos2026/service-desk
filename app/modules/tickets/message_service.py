from typing import Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.tickets.message_repository import MessageRepository
from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.model import Ticket
from app.modules.ticket_messages.model import TicketMessage
from app.modules.tickets.schema import TicketMessageCreate


class MessageService:
    def __init__(self, session: Session) -> None:
        self._repo = MessageRepository(session)
        self._ticket_repo = TicketRepository(session)

    def get_ticket(self, ticket_id: UUID) -> Ticket | None:
        return self._ticket_repo.get_by_id(ticket_id)

    def create_message(self, ticket_id: UUID, data: TicketMessageCreate) -> TicketMessage:
        return self._repo.create(ticket_id, data)

    def list_messages(
        self, ticket_id: UUID, skip: int = 0, limit: int = 50
    ) -> Tuple[int, list[TicketMessage]]:
        return self._repo.list_by_ticket(ticket_id, skip=skip, limit=limit)

    def get_message(self, message_id: UUID) -> TicketMessage | None:
        return self._repo.get_by_id(message_id)

    def delete_message(self, message_id: UUID) -> bool:
        message = self._repo.get_by_id(message_id)
        if message is None:
            return False
        self._repo.delete(message)
        return True
