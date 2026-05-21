from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import BOOLEAN, CHAR, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid4()))
    ticket_id: Mapped[str] = mapped_column(
        CHAR(36),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[str | None] = mapped_column(CHAR(36), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )
