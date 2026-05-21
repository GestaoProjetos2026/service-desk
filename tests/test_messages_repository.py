from time import sleep
from uuid import uuid4

from app.modules.tickets.message_repository import MessageRepository
from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.schema import TicketCreate, TicketMessageCreate


def _create_ticket(session, title="Test ticket", description="Ticket for message tests"):
    repo = TicketRepository(session)
    return repo.create(TicketCreate(title=title, description=description))


def _make_message_data(message="Hello, I need help with this issue"):
    return TicketMessageCreate(message=message)


def test_create_message_persists_and_returns_entity(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)

    msg = repo.create(ticket.id, _make_message_data("First message on ticket"))

    assert msg.id is not None
    assert msg.ticket_id == ticket.id
    assert msg.message == "First message on ticket"
    assert msg.is_internal is False
    assert repo.get_by_id(msg.id) is not None


def test_create_message_with_author_id(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)
    author = uuid4()

    msg = repo.create(
        ticket.id,
        TicketMessageCreate(message="Message with author", author_id=author),
    )

    assert msg.author_id == str(author)


def test_create_internal_message(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)

    msg = repo.create(
        ticket.id,
        TicketMessageCreate(message="Internal note for team only", is_internal=True),
    )

    assert msg.is_internal is True


def test_list_by_ticket_returns_messages_ordered_by_created_at(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)

    first = repo.create(ticket.id, _make_message_data("First message"))
    sleep(1)
    second = repo.create(ticket.id, _make_message_data("Second message"))

    total, items = repo.list_by_ticket(ticket.id, skip=0, limit=50)

    assert total == 2
    assert [item.id for item in items] == [first.id, second.id]


def test_list_by_ticket_returns_empty_for_unknown_ticket(session):
    repo = MessageRepository(session)

    total, items = repo.list_by_ticket(uuid4(), skip=0, limit=50)

    assert total == 0
    assert items == []


def test_list_by_ticket_does_not_include_other_ticket_messages(session):
    ticket_a = _create_ticket(session, title="Ticket A", description="First ticket for isolation test")
    ticket_b = _create_ticket(session, title="Ticket B", description="Second ticket for isolation test")
    repo = MessageRepository(session)

    repo.create(ticket_a.id, _make_message_data("Message on A"))
    repo.create(ticket_b.id, _make_message_data("Message on B"))

    total, items = repo.list_by_ticket(ticket_a.id)

    assert total == 1
    assert items[0].message == "Message on A"


def test_get_by_id_returns_message(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)
    created = repo.create(ticket.id, _make_message_data("Lookup message"))

    result = repo.get_by_id(created.id)

    assert result is not None
    assert result.id == created.id
    assert result.message == "Lookup message"


def test_get_by_id_returns_none_for_unknown(session):
    repo = MessageRepository(session)

    result = repo.get_by_id(uuid4())

    assert result is None


def test_delete_removes_message(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)
    msg = repo.create(ticket.id, _make_message_data("To be deleted"))

    repo.delete(msg)

    assert repo.get_by_id(msg.id) is None


def test_list_by_ticket_pagination(session):
    ticket = _create_ticket(session)
    repo = MessageRepository(session)

    for i in range(5):
        sleep(1)
        repo.create(ticket.id, _make_message_data(f"Message {i+1}"))

    total, page = repo.list_by_ticket(ticket.id, skip=2, limit=2)

    assert total == 5
    assert len(page) == 2
    assert page[0].message == "Message 3"
    assert page[1].message == "Message 4"
