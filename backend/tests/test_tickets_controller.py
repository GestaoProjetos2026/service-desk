from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException, status

from app.modules.tickets.controller import TicketController
from app.modules.tickets.schema import TicketCreate, TicketUpdate


def test_list_tickets_returns_wrapped_response(session):
    controller = TicketController(session)
    ticket = SimpleNamespace(id=uuid4())
    controller.service = Mock()
    controller.service.list_tickets.return_value = (1, [ticket])

    result = controller.list_tickets(skip=5, limit=10)

    assert result == {"total": 1, "items": [ticket]}
    controller.service.list_tickets.assert_called_once_with(skip=5, limit=10)


def test_get_ticket_raises_404_when_not_found(session):
    controller = TicketController(session)
    controller.service = Mock()
    controller.service.get_ticket.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        controller.get_ticket(uuid4())

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Ticket not found"


def test_update_ticket_delegates_and_returns_ticket(session):
    controller = TicketController(session)
    controller.service = Mock()
    ticket_id = uuid4()
    payload = TicketUpdate(category="network")
    expected = object()
    controller.service.update_ticket.return_value = expected

    result = controller.update_ticket(ticket_id, payload)

    assert result is expected
    controller.service.update_ticket.assert_called_once_with(ticket_id, payload)


def test_create_ticket_delegates_to_service(session):
    controller = TicketController(session)
    controller.service = Mock()
    payload = TicketCreate(title="Email failure", description="Mailbox is not synchronizing correctly")
    expected = object()
    controller.service.create_ticket.return_value = expected

    result = controller.create_ticket(payload)

    assert result is expected
    controller.service.create_ticket.assert_called_once_with(payload)