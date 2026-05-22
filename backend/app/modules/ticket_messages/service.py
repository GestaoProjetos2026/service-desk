from typing import Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.ticket_messages.repository import TicketMessageRepository
from app.modules.ticket_messages.model import TicketMessage
from app.modules.ticket_messages.schema import TicketMessageCreate


class TicketMessageService:
    def __init__(self, session: Session) -> None:
        self._repo = TicketMessageRepository(session)

    def create_message(self, data: TicketMessageCreate) -> TicketMessage:
        return self._repo.create(data)

    def list_by_ticket(self, ticket_id: UUID, skip: int = 0, limit: int = 50) -> Tuple[int, list[TicketMessage]]:
        return self._repo.list_by_ticket(ticket_id, skip=skip, limit=limit)

    def delete_message(self, message_id: UUID) -> bool:
        return self._repo.delete(message_id)
