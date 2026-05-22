from datetime import UTC, datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlalchemy import BOOLEAN, CHAR, Enum as SqlEnum, ForeignKey, String, Text, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def enum_values(enum_class: type[Enum]) -> list[str]:
    return [member.value for member in enum_class]


class TicketStatus(str, Enum):
    pending = "pending"
    in_process = "in_process"
    done = "done"
    canceled = "canceled"


class TicketPriority(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        SqlEnum(TicketStatus, name="ticketstatus", values_callable=enum_values),
        default=TicketStatus.pending,
        nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        SqlEnum(TicketPriority, name="ticketpriority", values_callable=enum_values),
        default=TicketPriority.normal,
        nullable=False,
    )
    user_id: Mapped[Optional[str]] = mapped_column(CHAR(36), nullable=True, index=True)
    client_id: Mapped[Optional[str]] = mapped_column(CHAR(36), nullable=True, index=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(CHAR(36), nullable=True, index=True)
    updated_by: Mapped[Optional[str]] = mapped_column(CHAR(36), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

