"""
Testes do módulo `app.modules.auth` — fachada sobre o provider Core Engine.

Não dependem do PostgreSQL nem do Core Engine real: o `AuthService` é
substituído por um stub via `app.dependency_overrides`.
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.service import AuthService
from providers.auth.models import TokenResponse, UserProfile


class _StubAuthService(AuthService):
    """Implementa as mesmas assinaturas do AuthService, sem httpx."""

    def __init__(self) -> None:  # type: ignore[override]
        self.calls: list[tuple[str, tuple[Any, ...]]] = []

    async def login(self, email: str, password: str) -> TokenResponse:  # type: ignore[override]
        self.calls.append(("login", (email, password)))
        if password == "valid":
            return TokenResponse(access_token="acc-123", refresh_token="ref-456", token_type="Bearer")
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="invalid credentials")

    async def register(self, name: str, email: str, password: str) -> UserProfile:  # type: ignore[override]
        self.calls.append(("register", (name, email, password)))
        return UserProfile(id="u-1", name=name, email=email, roles=["user"], perms=[])

    async def refresh(self, refresh_token: str) -> TokenResponse:  # type: ignore[override]
        self.calls.append(("refresh", (refresh_token,)))
        return TokenResponse(access_token="acc-new", refresh_token=refresh_token)

    async def me(self, access_token: str) -> UserProfile:  # type: ignore[override]
        self.calls.append(("me", (access_token,)))
        if access_token == "acc-123":
            return UserProfile(id="u-1", name="Diego", email="diego@x.com", roles=["user"], perms=[])
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="invalid token")

    async def close(self) -> None:  # type: ignore[override]
        return None


@pytest.fixture
def stub_service() -> _StubAuthService:
    return _StubAuthService()


@pytest.fixture
def auth_client(stub_service: _StubAuthService) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_auth_service] = lambda: stub_service
    return TestClient(app)


# ─────────────────────── /auth/login ───────────────────────


def test_login_success(auth_client: TestClient, stub_service: _StubAuthService) -> None:
    resp = auth_client.post("/api/v1/auth/login", json={"email": "u@x.com", "password": "valid"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"] == "acc-123"
    assert body["refresh_token"] == "ref-456"
    assert body["token_type"] == "Bearer"
    assert ("login", ("u@x.com", "valid")) in stub_service.calls


def test_login_invalid_credentials(auth_client: TestClient) -> None:
    resp = auth_client.post("/api/v1/auth/login", json={"email": "u@x.com", "password": "wrong"})
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()


def test_login_bad_payload(auth_client: TestClient) -> None:
    # email inválido → 422 do pydantic
    resp = auth_client.post("/api/v1/auth/login", json={"email": "not-an-email", "password": "x"})
    assert resp.status_code == 422


# ─────────────────────── /auth/register ───────────────────────


def test_register_success(auth_client: TestClient) -> None:
    resp = auth_client.post(
        "/api/v1/auth/register",
        json={"name": "Ana", "email": "ana@x.com", "password": "secret"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == "u-1"
    assert body["name"] == "Ana"
    assert body["email"] == "ana@x.com"


# ─────────────────────── /auth/refresh ───────────────────────


def test_refresh_success(auth_client: TestClient) -> None:
    resp = auth_client.post("/api/v1/auth/refresh", json={"refresh_token": "ref-456"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"] == "acc-new"
    assert body["refresh_token"] == "ref-456"


# ─────────────────────── /auth/me ───────────────────────


def test_me_requires_authorization(auth_client: TestClient) -> None:
    resp = auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.headers.get("www-authenticate") == "Bearer"


def test_me_rejects_non_bearer(auth_client: TestClient) -> None:
    resp = auth_client.get("/api/v1/auth/me", headers={"Authorization": "Basic abc"})
    assert resp.status_code == 401


def test_me_success(auth_client: TestClient) -> None:
    resp = auth_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer acc-123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "u-1"
    assert body["email"] == "diego@x.com"


def test_me_invalid_token(auth_client: TestClient) -> None:
    resp = auth_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer wrong"})
    assert resp.status_code == 401


# ─────────────────────── /auth/logout ───────────────────────


def test_logout_without_token(auth_client: TestClient) -> None:
    resp = auth_client.post("/api/v1/auth/logout")
    assert resp.status_code == 401


def test_logout_with_token(auth_client: TestClient) -> None:
    resp = auth_client.post("/api/v1/auth/logout", headers={"Authorization": "Bearer acc-123"})
    assert resp.status_code == 204
    assert resp.content == b""
