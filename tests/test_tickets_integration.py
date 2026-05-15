from uuid import uuid4


def create_ticket(client, title: str, description: str, category: str = "network"):
    response = client.post(
        "/tickets",
        json={
            "title": title,
            "description": description,
            "category": category,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_health_endpoint_uses_test_database(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "connected"}


def test_create_and_get_ticket_end_to_end(client):
    created = create_ticket(
        client,
        title="VPN issue",
        description="Remote employee cannot connect to the VPN server",
    )

    response = client.get(f"/tickets/{created['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["title"] == "VPN issue"
    assert body["category"] == "network"


def test_list_tickets_returns_created_records(client):
    first = create_ticket(
        client,
        title="Printer issue",
        description="Office printer stopped responding during the morning",
        category="hardware",
    )
    import time
    time.sleep(1)
    
    second = create_ticket(
        client,
        title="Email issue",
        description="Mailbox synchronization has been failing since yesterday",
        category="software",
    )

    response = client.get("/tickets")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    returned_ids = [item["id"] for item in body["items"]]
    assert returned_ids == [second["id"], first["id"]]


def test_update_ticket_marks_done_and_sets_closed_at(client):
    created = create_ticket(
        client,
        title="Access issue",
        description="User cannot access the internal administrative portal",
    )

    response = client.patch(
        f"/tickets/{created['id']}",
        json={"status": "done", "category": "access"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "done"
    assert body["category"] == "access"
    assert body["closed_at"] is not None


def test_get_missing_ticket_returns_404(client):
    response = client.get(f"/tickets/{uuid4()}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Ticket not found"}