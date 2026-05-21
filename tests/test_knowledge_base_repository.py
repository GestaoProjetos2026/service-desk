import pytest
from app.modules.knowledge_base.repository import KnowledgeBaseRepository
from app.modules.tickets.model import Ticket, TicketStatus, TicketPriority
from app.modules.ticket_messages.model import TicketMessage

def test_knowledge_base_repository_get_all(session):
    repo = KnowledgeBaseRepository(session)
    
    # Assert initially empty
    total, result = repo.get_all()
    assert total == 0
    assert result == []

    # Create a ticket
    ticket = Ticket(
        title="KB Ticket 1",
        description="Description 1",
        status=TicketStatus.done,
        priority=TicketPriority.normal
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Create a message
    msg = TicketMessage(
        ticket_id=ticket.id,
        message="Last KB message"
    )
    session.add(msg)
    session.commit()
    
    # Test get_all
    total, result = repo.get_all()
    assert total == 1
    assert len(result) == 1
    assert result[0]["ticket_id"] == ticket.id
    assert result[0]["title"] == "KB Ticket 1"
    assert result[0]["last_message"] == "Last KB message"
