from unittest.mock import Mock
from uuid import uuid4

from app.modules.tickets.service import TicketService
from app.modules.tickets.schema import TicketCreate, TicketUpdate


def test_get_ticket_returns_none_when_repository_has_no_match(session):
    service = TicketService(session)
    service._repo = Mock()
    service._repo.get_by_id.return_value = None

    result = service.get_ticket(uuid4())

    assert result is None
    service._repo.get_by_id.assert_called_once()


def test_update_ticket_returns_none_when_ticket_does_not_exist(session):
    service = TicketService(session)
    service._repo = Mock()
    service._repo.get_by_id.return_value = None

    result = service.update_ticket(uuid4(), TicketUpdate(title="Updated title"))

    assert result is None
    service._repo.update.assert_not_called()


def test_create_ticket_delegates_to_repository(session):
    service = TicketService(session)
    service._repo = Mock()
    payload = TicketCreate(title="Access issue", description="User cannot access the portal")
    expected = object()
    service._repo.create.return_value = expected

    result = service.create_ticket(payload)

    assert result is expected
    service._repo.create.assert_called_once_with(payload)