from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.ticket_messages.model import TicketMessage
from app.modules.ticket_messages.schema import TicketMessageCreate

UUID_FIELDS = {"author_id", "ticket_id"}


def serialize_identifiers(values: dict) -> dict:
    serialized = values.copy()
    for field in UUID_FIELDS:
        if isinstance(serialized.get(field), UUID):
            serialized[field] = str(serialized[field])
    return serialized


class TicketMessageRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, data: TicketMessageCreate) -> TicketMessage:
        message = TicketMessage(**serialize_identifiers(data.model_dump()))
        self._session.add(message)
        self._session.commit()
        self._session.refresh(message)
        return message

    def list_by_ticket(self, ticket_id: UUID, skip: int = 0, limit: int = 50) -> tuple[int, list[TicketMessage]]:
        stmt = select(TicketMessage).where(
            TicketMessage.ticket_id == str(ticket_id)
        ).order_by(TicketMessage.created_at.desc())
        
        total = self._session.scalar(
            select(func.count()).select_from(TicketMessage).where(
                TicketMessage.ticket_id == str(ticket_id)
            )
        ) or 0
        
        result = self._session.scalars(
            stmt.offset(skip).limit(limit)
        )
        messages = result.all()
        return int(total), messages

    def delete(self, message_id: UUID) -> bool:
        message = self._session.get(TicketMessage, str(message_id))
        if message is None:
            return False
        self._session.delete(message)
        self._session.commit()
        return True
