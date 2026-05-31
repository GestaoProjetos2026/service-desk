from uuid import UUID

from fastapi import HTTPException, status

from app.modules.sla.service import SlaService
from app.modules.tickets.model import Ticket, TicketPriority


class SlaController:
    def __init__(self, session) -> None:
        self.service = SlaService(session)

    def get_ticket_sla_status(self, ticket: Ticket):
        """Get current SLA status for a ticket"""
        try:
            return self.service.calculate_sla_status(ticket)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def check_ticket_violations(self, ticket: Ticket):
        """Check and return SLA violations for a ticket"""
        violations = self.service.check_violations(ticket)
        return {
            "ticket_id": ticket.id,
            "violations_found": len(violations),
            "violations": violations,
        }

    def get_priority_sla_summary(self, priority: TicketPriority):
        """Get SLA compliance summary for all tickets with a given priority"""
        return self.service.get_sla_summary_for_priority(priority)

    def scan_all_open_violations(self):
        """Varre todos os tickets abertos e retorna alertas de SLA"""
        alerts = self.service.scan_all_open_violations()
        return {
            "violations_found": len(alerts),
            "alerts": alerts,
        }

    def get_global_dashboard(self):
        """Snapshot global de compliance de SLA, agregado por prioridade"""
        return self.service.get_global_dashboard()

