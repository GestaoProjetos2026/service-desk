from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.ticket_messages.model import TicketMessage
from app.modules.tickets.schema import TicketMessageCreate
from app.modules.tickets.repository import serialize_identifiers


class MessageRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, ticket_id: UUID, data: TicketMessageCreate) -> TicketMessage:
        values = serialize_identifiers(data.model_dump())
        values["ticket_id"] = str(ticket_id)
        message = TicketMessage(**values)
        self._session.add(message)
        self._session.commit()
        self._session.refresh(message)
        return message

    def get_by_id(self, message_id: UUID) -> Optional[TicketMessage]:
        return self._session.get(TicketMessage, str(message_id))

    def list_by_ticket(
        self, ticket_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[int, list[TicketMessage]]:
        base = select(TicketMessage).where(TicketMessage.ticket_id == str(ticket_id))
        total = (
            self._session.scalar(
                select(func.count()).select_from(base.subquery())
            )
            or 0
        )
        items = self._session.scalars(
            base.order_by(TicketMessage.created_at.asc()).offset(skip).limit(limit)
        ).all()
        return int(total), items

    def delete(self, message: TicketMessage) -> None:
        self._session.delete(message)
        self._session.commit()
