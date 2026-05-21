import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import MagicMock
from app.modules.sla.service import SlaService
from app.modules.tickets.model import Ticket, TicketStatus, TicketPriority
from app.modules.sla.model import SlaStatus

def test_calculate_sla_status(session):
    service = SlaService(session)
    ticket = Ticket(
        id=str(uuid4()),
        title="Test Ticket",
        description="Test Desc",
        status=TicketStatus.pending,
        priority=TicketPriority.urgent,
        created_at=datetime.utcnow()
    )
    
    # urgent policy: 2h first response, 12h resolution
    # Should be paused because status is pending
    status_resp = service.calculate_sla_status(ticket)
    
    assert status_resp.ticket_id == uuid4(ticket.id) if isinstance(ticket.id, str) else ticket.id
    assert status_resp.status == SlaStatus.paused
    assert status_resp.is_paused == True
    
    # If we change to in_process, it should be on_track or at_risk depending on time
    ticket.status = TicketStatus.in_process
    status_resp = service.calculate_sla_status(ticket)
    
    assert status_resp.status == SlaStatus.on_track
    assert status_resp.is_paused == False
