from datetime import UTC, datetime
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.modules.tickets.model import TicketPriority, TicketStatus
from app.modules.tickets.routes import get_controller, router


def make_ticket_response():
    return {
        "id": str(uuid4()),
        "title": "VPN issue",
        "description": "Remote employee cannot connect to the VPN",
        "status": TicketStatus.pending,
        "priority": TicketPriority.normal,
        "user_id": None,
        "client_id": None,
        "assigned_to": None,
        "updated_by": None,
        "category": "network",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
        "closed_at": None,
    }


class StubController:
    def list_tickets(self, skip: int = 0, limit: int = 50):
        return {"total": 1, "items": [make_ticket_response()]}

    def get_ticket(self, ticket_id):
        response = make_ticket_response()
        response["id"] = str(ticket_id)
        return response

    def create_ticket(self, data):
        response = make_ticket_response()
        response["title"] = data.title
        response["description"] = data.description
        return response

    def update_ticket(self, ticket_id, data):
        response = make_ticket_response()
        response["id"] = str(ticket_id)
        response["category"] = data.category
        return response


def create_test_client():
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_controller] = lambda: StubController()
    return TestClient(app)


def test_list_tickets_route_returns_ticket_list():
    client = create_test_client()

    response = client.get("/tickets")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1


def test_create_ticket_route_returns_201():
    client = create_test_client()

    response = client.post(
        "/tickets",
        json={
            "title": "VPN issue",
            "description": "Remote employee cannot connect to the VPN",
            "category": "network",
        },
    )

    assert response.status_code == 201
    assert response.json()["title"] == "VPN issue"


def test_update_ticket_route_returns_updated_payload():
    client = create_test_client()
    ticket_id = uuid4()

    response = client.patch(f"/tickets/{ticket_id}", json={"category": "hardware"})

    assert response.status_code == 200
    assert response.json()["category"] == "hardware"