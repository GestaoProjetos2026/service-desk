import pytest
from uuid import uuid4
from app.modules.tickets.model import Ticket, TicketStatus, TicketPriority

def test_get_ticket_sla_status(client, session):
    ticket = Ticket(
        id=str(uuid4()),
        title="API Ticket",
        description="API Desc",
        status=TicketStatus.in_process,
        priority=TicketPriority.normal
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    response = client.get(f"/sla/status/{ticket.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["ticket_id"] == ticket.id
    assert data["status"] == "on_track"

def test_get_priority_sla_summary(client, session):
    ticket = Ticket(
        id=str(uuid4()),
        title="API Ticket 2",
        description="API Desc",
        status=TicketStatus.done,
        priority=TicketPriority.low
    )
    session.add(ticket)
    session.commit()
    
    response = client.get("/sla/summary/priority/low")
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] == "low"
    assert data["total_tickets"] >= 1
