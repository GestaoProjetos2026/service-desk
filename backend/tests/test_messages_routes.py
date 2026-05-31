from datetime import UTC, datetime
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.modules.tickets.message_routes import get_controller, router


def make_message_response(ticket_id=None):
    return {
        "id": str(uuid4()),
        "ticket_id": str(ticket_id or uuid4()),
        "author_id": None,
        "message": "I need help with the VPN connection",
        "is_internal": False,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }


class StubController:
    def list_messages(self, ticket_id, skip=0, limit=50):
        return {"total": 1, "items": [make_message_response(ticket_id)]}

    def get_message(self, ticket_id, message_id):
        response = make_message_response(ticket_id)
        response["id"] = str(message_id)
        return response

    def create_message(self, ticket_id, data):
        response = make_message_response(ticket_id)
        response["message"] = data.message
        return response

    def delete_message(self, ticket_id, message_id):
        return None


def create_test_client():
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_controller] = lambda: StubController()
    return TestClient(app)


def test_list_messages_route_returns_message_list():
    client = create_test_client()
    ticket_id = uuid4()

    response = client.get(f"/tickets/{ticket_id}/messages")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1


def test_create_message_route_returns_201():
    client = create_test_client()
    ticket_id = uuid4()

    response = client.post(
        f"/tickets/{ticket_id}/messages",
        json={"message": "Please check the server logs"},
    )

    assert response.status_code == 201
    assert response.json()["message"] == "Please check the server logs"


def test_get_message_route_returns_message():
    client = create_test_client()
    ticket_id = uuid4()
    message_id = uuid4()

    response = client.get(f"/tickets/{ticket_id}/messages/{message_id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(message_id)


def test_delete_message_route_returns_204():
    client = create_test_client()
    ticket_id = uuid4()
    message_id = uuid4()

    response = client.delete(f"/tickets/{ticket_id}/messages/{message_id}")

    assert response.status_code == 204


def test_create_message_with_author_route():
    client = create_test_client()
    ticket_id = uuid4()
    author_id = uuid4()

    response = client.post(
        f"/tickets/{ticket_id}/messages",
        json={
            "message": "Internal note about the issue",
            "author_id": str(author_id),
            "is_internal": True,
        },
    )

    assert response.status_code == 201


def test_list_messages_with_pagination_params():
    client = create_test_client()
    ticket_id = uuid4()

    response = client.get(f"/tickets/{ticket_id}/messages?skip=5&limit=10")

    assert response.status_code == 200
    body = response.json()
    assert "total" in body
    assert "items" in body
