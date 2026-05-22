from time import sleep
from uuid import uuid4

from app.modules.tickets.model import TicketStatus
from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.schema import TicketCreate, TicketUpdate


def make_ticket_data(title: str, description: str) -> TicketCreate:
    return TicketCreate(title=title, description=description)


def test_create_ticket_persists_and_returns_entity(session):
    repository = TicketRepository(session)

    ticket = repository.create(make_ticket_data("Printer issue", "Printer stopped working today"))

    assert ticket.id is not None
    assert ticket.title == "Printer issue"
    assert ticket.status == TicketStatus.pending
    assert repository.get_by_id(ticket.id) is not None


def test_get_by_id_delegates_to_session(session):
    repository = TicketRepository(session)
    created = repository.create(make_ticket_data("Portal issue", "Portal screen keeps freezing"))

    result = repository.get_by_id(created.id)

    assert result is not None
    assert result.id == created.id


def test_list_all_returns_total_and_items(session):
    repository = TicketRepository(session)
    older = repository.create(make_ticket_data("Older ticket", "First issue description"))
    sleep(1)
    newer = repository.create(make_ticket_data("Newer ticket", "Second issue description"))
    total, result_items = repository.list_all(skip=0, limit=10)

    assert total == 2
    assert [item.id for item in result_items] == [newer.id, older.id]


def test_create_converts_uuid_fields_to_string(session):
    repository = TicketRepository(session)
    user_id = uuid4()

    ticket = repository.create(
        TicketCreate(
            title="Access issue",
            description="User cannot access the internal portal",
            user_id=user_id,
        )
    )

    assert ticket.user_id == str(user_id)


def test_update_sets_closed_at_when_status_changes_to_done(session):
    repository = TicketRepository(session)
    ticket = repository.create(make_ticket_data("Close ticket", "Needs to be closed properly"))

    updated = repository.update(ticket, TicketUpdate(status=TicketStatus.done))
    reloaded = repository.get_by_id(ticket.id)

    assert updated.status == TicketStatus.done
    assert updated.closed_at is not None
    assert reloaded is not None
    assert reloaded.closed_at is not None


def test_update_keeps_closed_at_none_for_non_done_status(session):
    repository = TicketRepository(session)
    ticket = repository.create(make_ticket_data("Keep open", "Ticket should remain active"))

    updated = repository.update(ticket, TicketUpdate(status=TicketStatus.in_process))

    assert updated.status == TicketStatus.in_process
    assert updated.closed_at is None