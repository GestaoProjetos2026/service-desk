import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from fastapi import HTTPException
from app.modules.sla.controller import SlaController
from app.modules.tickets.model import Ticket, TicketPriority

def test_sla_controller_get_summary():
    mock_session = MagicMock()
    controller = SlaController(mock_session)
    controller.service = MagicMock()
    
    summary = {
        "priority": TicketPriority.urgent,
        "total_tickets": 10,
        "on_track": 8,
        "at_risk": 1,
        "violated": 1,
        "paused": 0,
        "compliance_percentage": 80.0
    }
    controller.service.get_sla_summary_for_priority.return_value = summary
    
    result = controller.get_priority_sla_summary(TicketPriority.urgent)
    assert result == summary
    controller.service.get_sla_summary_for_priority.assert_called_once_with(TicketPriority.urgent)
