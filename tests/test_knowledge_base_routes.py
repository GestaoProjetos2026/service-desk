import pytest
from app.modules.tickets.model import Ticket, TicketStatus, TicketPriority
from app.modules.ticket_messages.model import TicketMessage

def test_list_knowledge_base(client, session):
    # Setup data
    ticket = Ticket(
        title="KB API Ticket",
        description="KB Description",
        status=TicketStatus.done,
        priority=TicketPriority.normal
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    msg = TicketMessage(
        ticket_id=ticket.id,
        message="Message from API"
    )
    session.add(msg)
    session.commit()

    response = client.get("/knowledge-base")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "KB API Ticket"
    assert data["items"][0]["last_message"] == "Message from API"
