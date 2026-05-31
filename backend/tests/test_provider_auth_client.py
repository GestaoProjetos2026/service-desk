"""
Testes do `providers.auth.client.AuthClient` — valida a normalização de
camelCase → snake_case e o parsing defensivo das respostas do Core Engine,
sem depender de rede real (usa `httpx.MockTransport`).
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Callable

import httpx
import pytest

from providers.auth.client import (
    AuthClient,
    AuthClientError,
    _normalize,
    _parse_user,
)
from providers.auth.models import TokenResponse, UserProfile


def _run(coro):
    """Executa uma coroutine — evita dependência de pytest-asyncio."""
    return asyncio.new_event_loop().run_until_complete(coro)


# ─────────────────────── helpers ───────────────────────

def _mock_client(handler: Callable[[httpx.Request], httpx.Response]) -> AuthClient:
    """Cria um AuthClient cujo httpx usa um MockTransport custom."""
    client = AuthClient()
    # Substitui o AsyncClient interno por um com MockTransport
    client._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return client


def _envelope(data: dict, status_code: int = 200) -> httpx.Response:
    body = {
        "success": status_code < 400,
        "data": data,
        "timestamp": "2026-05-29T00:00:00Z",
        "path": "/v1/auth/x",
    }
    return httpx.Response(status_code, json=body)


# ─────────────────────── _normalize ───────────────────────

def test_normalize_camel_to_snake() -> None:
    assert _normalize({"accessToken": "abc"}) == {"access_token": "abc"}
    assert _normalize({"refreshToken": "x", "expiresIn": 900}) == {
        "refresh_token": "x",
        "expires_in": 900,
    }


def test_normalize_strips_leading_underscore() -> None:
    assert _normalize({"_id": "u1"}) == {"id": "u1"}


def test_normalize_preserves_snake() -> None:
    assert _normalize({"access_token": "x", "user_id": "u"}) == {
        "access_token": "x",
        "user_id": "u",
    }


def test_normalize_non_dict_returns_empty() -> None:
    assert _normalize("not a dict") == {}  # type: ignore[arg-type]
    assert _normalize(None) == {}  # type: ignore[arg-type]


# ─────────────────────── _parse_user ───────────────────────

def test_parse_user_direct_camel() -> None:
    out = _parse_user({"id": "u1", "name": "Ana", "email": "a@x.com"})
    assert out["id"] == "u1"
    assert out["name"] == "Ana"
    assert out["email"] == "a@x.com"


def test_parse_user_unwraps_user_envelope() -> None:
    out = _parse_user({"user": {"id": "u1", "name": "Ana", "email": "a@x.com"}})
    assert out["id"] == "u1"
    assert out["email"] == "a@x.com"


def test_parse_user_id_aliases() -> None:
    out = _parse_user({"userId": "u1", "name": "Ana", "email": "a@x.com"})
    assert out["id"] == "u1"


def test_parse_user_full_name_alias() -> None:
    out = _parse_user({"id": "u1", "fullName": "Ana Silva", "email": "a@x.com"})
    assert out["name"] == "Ana Silva"


def test_parse_user_email_address_alias() -> None:
    out = _parse_user({"id": "u1", "name": "Ana", "emailAddress": "a@x.com"})
    assert out["email"] == "a@x.com"


def test_parse_user_int_id_stringified() -> None:
    out = _parse_user({"id": 42, "name": "Ana", "email": "a@x.com"})
    assert out["id"] == "42"


# ─────────────────────── AuthClient.login ───────────────────────

def test_login_parses_camel_response() -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        assert req.method == "POST"
        body = json.loads(req.content)
        assert body["email"] == "u@x.com"
        assert body["password"] == "secret"
        return _envelope({
            "accessToken": "acc-x",
            "refreshToken": "ref-x",
            "tokenType": "Bearer",
            "expiresIn": 900,
        })

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.login("u@x.com", "secret")
        finally:
            await client.close()

    tokens = _run(_go())
    assert isinstance(tokens, TokenResponse)
    assert tokens.access_token == "acc-x"
    assert tokens.refresh_token == "ref-x"
    assert tokens.token_type == "Bearer"
    assert tokens.expires_in == 900


def test_login_raises_on_error_envelope() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            401,
            json={
                "success": False,
                "error": {"code": "AUTH_INVALID_CREDENTIALS", "message": "bad creds"},
            },
        )

    client = _mock_client(handler)

    async def _go():
        try:
            await client.login("u@x.com", "wrong")
        finally:
            await client.close()

    with pytest.raises(AuthClientError) as exc:
        _run(_go())
    assert exc.value.status_code == 401
    assert exc.value.code == "AUTH_INVALID_CREDENTIALS"


# ─────────────────────── AuthClient.me ───────────────────────

def test_me_parses_camel_user() -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        assert req.headers.get("authorization") == "Bearer acc-x"
        return _envelope({
            "id": "u-1",
            "name": "Diego",
            "email": "diego@x.com",
            "roles": ["user"],
            "perms": [],
            "createdAt": "2026-01-01T00:00:00Z",
            "updatedAt": "2026-01-02T00:00:00Z",
            "extraIgnored": "whatever",  # campo desconhecido — deve ser ignorado
        })

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.me("acc-x")
        finally:
            await client.close()

    profile = _run(_go())
    assert isinstance(profile, UserProfile)
    assert profile.id == "u-1"
    assert profile.email == "diego@x.com"
    assert profile.created_at == "2026-01-01T00:00:00Z"


def test_me_handles_user_envelope_and_aliases() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return _envelope({
            "user": {
                "userId": 7,
                "fullName": "Diego",
                "emailAddress": "diego@x.com",
                "roles": ["user"],
            }
        })

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.me("token")
        finally:
            await client.close()

    profile = _run(_go())
    assert profile.id == "7"
    assert profile.name == "Diego"
    assert profile.email == "diego@x.com"


# ─────────────────────── AuthClient.register ───────────────────────

def test_register_parses_response() -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        body = json.loads(req.content)
        assert body == {"name": "Ana", "email": "ana@x.com", "password": "Abc@1234"}
        return _envelope(
            {"id": "u-2", "name": "Ana", "email": "ana@x.com", "roles": []},
            status_code=201,
        )

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.register("Ana", "ana@x.com", "Abc@1234")
        finally:
            await client.close()

    profile = _run(_go())
    assert profile.id == "u-2"
    assert profile.email == "ana@x.com"


# ─────────────────────── AuthClient.refresh ───────────────────────

def test_refresh_sends_camel_payload_and_parses_camel_response() -> None:
    def handler(req: httpx.Request) -> httpx.Response:
        body = json.loads(req.content)
        # RefreshRequest tem alias_generator=to_camel → deve enviar `refreshToken`
        assert body == {"refreshToken": "ref-1"}
        return _envelope({"accessToken": "acc-new", "refreshToken": "ref-2"})

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.refresh("ref-1")
        finally:
            await client.close()

    tokens = _run(_go())
    assert tokens.access_token == "acc-new"
    assert tokens.refresh_token == "ref-2"


# ─────────────────────── AuthClient.me (enriquecimento) ───────────────────────

def test_me_with_only_user_id_enriches_via_users_endpoint() -> None:
    """Quando /auth/me devolve só `user_id`, o cliente deve completar
    o perfil via GET /users/{id} sem propagar erro caso falhe."""
    calls = {"me": 0, "users": 0}

    def handler(req: httpx.Request) -> httpx.Response:
        if req.url.path.endswith("/auth/me"):
            calls["me"] += 1
            return _envelope({"user_id": "88ab2eb0-7730-449b-be16-4b6dd405c166"})
        if "/users/" in req.url.path:
            calls["users"] += 1
            return _envelope({
                "id": "88ab2eb0-7730-449b-be16-4b6dd405c166",
                "name": "Diego",
                "email": "diego@x.com",
                "roles": ["user"],
            })
        return httpx.Response(404)

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.me("tok")
        finally:
            await client.close()

    profile = _run(_go())
    assert calls == {"me": 1, "users": 1}
    assert profile.id == "88ab2eb0-7730-449b-be16-4b6dd405c166"
    assert profile.name == "Diego"
    assert profile.email == "diego@x.com"


def test_me_with_only_user_id_tolerates_users_endpoint_failure() -> None:
    """Se /users/{id} falhar, devolve o perfil mínimo sem 500."""
    def handler(req: httpx.Request) -> httpx.Response:
        if req.url.path.endswith("/auth/me"):
            return _envelope({"user_id": "u-123"})
        return httpx.Response(
            500,
            json={"success": False, "error": {"code": "BOOM", "message": "x"}},
        )

    client = _mock_client(handler)

    async def _go():
        try:
            return await client.me("tok")
        finally:
            await client.close()

    profile = _run(_go())
    assert profile.id == "u-123"
    assert profile.name is None
    assert profile.email is None
