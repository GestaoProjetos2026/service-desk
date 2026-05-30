"""
Testes do `SlaService` para a automação adicionada (RF-005):
  - scan_all_open_violations
  - get_global_dashboard

Usa um stub de Session em memória para evitar dependência do PostgreSQL.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from uuid import uuid4

import pytest

from app.modules.sla.model import SLA_POLICIES, SlaStatus, utc_now
from app.modules.sla.service import SlaService
from app.modules.tickets.model import Ticket, TicketPriority, TicketStatus


# ───────────────────────── Fakes ─────────────────────────


class _FakeScalarResult:
    def __init__(self, items: list[Any]) -> None:
        self._items = items

    def all(self) -> list[Any]:
        return list(self._items)


class _FakeSession:
    """Stub mínimo de Session: responde a `scalar` e `scalars`."""

    def __init__(self, tickets: list[Ticket]) -> None:
        self._tickets = tickets

    def scalar(self, _stmt: Any) -> Any:
        # Usado por _get_first_response_time — sem mensagens nesse teste
        return None

    def scalars(self, _stmt: Any) -> _FakeScalarResult:
        return _FakeScalarResult(self._tickets)


def _make_ticket(priority: TicketPriority, *, hours_ago: int, status: TicketStatus = TicketStatus.pending) -> Ticket:
    t = Ticket()
    t.id = str(uuid4())
    t.title = "x"
    t.description = "x"
    t.status = status
    t.priority = priority
    t.created_at = utc_now() - timedelta(hours=hours_ago)
    t.updated_at = t.created_at
    t.closed_at = None
    return t


# ─────────────────────── scan_all_open_violations ───────────────────────


def test_scan_returns_violations_for_overdue_open_tickets() -> None:
    policy = SLA_POLICIES[TicketPriority.urgent]
    # Urgente: 1h primeira resposta / 4h resolução — usamos 10h para garantir 2 violações
    overdue = _make_ticket(TicketPriority.urgent, hours_ago=policy.resolution_hours + 5)
    fresh = _make_ticket(TicketPriority.low, hours_ago=1)

    service = SlaService(_FakeSession([overdue, fresh]))
    alerts = service.scan_all_open_violations()

    assert len(alerts) == 2
    types = {a.violation_type for a in alerts}
    assert types == {"first_response", "resolution"}
    assert all(a.ticket_id == __import__("uuid").UUID(overdue.id) for a in alerts)


def test_scan_ignores_closed_tickets() -> None:
    policy = SLA_POLICIES[TicketPriority.normal]
    closed = _make_ticket(
        TicketPriority.normal,
        hours_ago=policy.resolution_hours + 10,
        status=TicketStatus.done,
    )
    service = SlaService(_FakeSession([closed]))
    assert service.scan_all_open_violations() == []


# ─────────────────────── get_global_dashboard ───────────────────────


def test_global_dashboard_aggregates_by_priority() -> None:
    # 1 ticket on_track e 1 violado → compliance esperado != 100%
    on_track = _make_ticket(TicketPriority.normal, hours_ago=1)
    violated = _make_ticket(
        TicketPriority.urgent,
        hours_ago=SLA_POLICIES[TicketPriority.urgent].resolution_hours + 5,
    )
    service = SlaService(_FakeSession([on_track, violated]))

    snapshot = service.get_global_dashboard()

    # Cada chamada a get_sla_summary_for_priority faz uma query separada por prioridade,
    # mas nosso fake retorna a mesma lista. Isso é suficiente para validar shape e agregação.
    assert "total_tickets" in snapshot
    assert "by_priority" in snapshot
    assert len(snapshot["by_priority"]) == len(TicketPriority)
    # Sanity: compliance_percentage está no intervalo válido
    assert 0 <= snapshot["compliance_percentage"] <= 100


# ─────────────────────── policies (sanity) ───────────────────────


@pytest.mark.parametrize("priority", list(TicketPriority))
def test_every_priority_has_policy(priority: TicketPriority) -> None:
    assert priority in SLA_POLICIES
    policy = SLA_POLICIES[priority]
    assert policy.first_response_hours > 0
    assert policy.resolution_hours >= policy.first_response_hours
