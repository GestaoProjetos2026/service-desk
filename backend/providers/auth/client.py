"""
HTTP client for the Core Engine Auth API.

Usage example:
    from backend.providers.auth.client import AuthClient

    client = AuthClient()
    tokens = await client.login("user@email.com", "secret")
    profile = await client.me(tokens.access_token)
"""

from __future__ import annotations

import httpx
from typing import Optional

from . import endpoints
from .models import (
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    TokenResponse,
    UserProfile,
)


class AuthClientError(Exception):
    """Raised when the Core Engine API returns a non-2xx response."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(f"[{status_code}] {code}: {message}")


def _raise_for_error(response: httpx.Response) -> None:
    """Parse the standard error envelope and raise AuthClientError if needed."""
    if response.is_error:
        try:
            body = response.json()
            error = body.get("error", {})
            raise AuthClientError(
                status_code=response.status_code,
                code=error.get("code", "UNKNOWN"),
                message=error.get("message", response.text),
            )
        except (ValueError, KeyError):
            raise AuthClientError(
                status_code=response.status_code,
                code="UNKNOWN",
                message=response.text,
            )


class AuthClient:
    """Async HTTP client for the Core Engine & Auth API."""

    def __init__(self, timeout: float = 10.0) -> None:
        self._client = httpx.AsyncClient(timeout=timeout)

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    async def login(self, email: str, password: str) -> TokenResponse:
        """POST /v1/auth/login — obtain access + refresh tokens."""
        payload = LoginRequest(email=email, password=password)
        response = await self._client.post(
            endpoints.AUTH_LOGIN,
            json=payload.model_dump(),
        )
        _raise_for_error(response)
        data = response.json().get("data", {})
        return TokenResponse(**data)

    async def register(self, name: str, email: str, password: str) -> UserProfile:
        """POST /v1/auth/register — register a new user."""
        payload = RegisterRequest(name=name, email=email, password=password)
        response = await self._client.post(
            endpoints.AUTH_REGISTER,
            json=payload.model_dump(),
        )
        _raise_for_error(response)
        data = response.json().get("data", {})
        return UserProfile(**data)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """POST /v1/auth/refresh — get a new access token."""
        payload = RefreshRequest(refresh_token=refresh_token)
        response = await self._client.post(
            endpoints.AUTH_REFRESH,
            json=payload.model_dump(),
        )
        _raise_for_error(response)
        data = response.json().get("data", {})
        return TokenResponse(**data)

    async def me(self, access_token: str) -> UserProfile:
        """GET /v1/auth/me — retrieve the current user profile."""
        response = await self._client.get(
            endpoints.AUTH_ME,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        _raise_for_error(response)
        data = response.json().get("data", {})
        return UserProfile(**data)

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    async def get_user(self, user_id: str, access_token: str) -> UserProfile:
        """GET /v1/users/{id} — retrieve a user by ID."""
        url = endpoints.USERS_GET.format(id=user_id)
        response = await self._client.get(
            url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        _raise_for_error(response)
        data = response.json().get("data", {})
        return UserProfile(**data)

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    async def health(self) -> dict:
        """GET /v1/health — service health check."""
        response = await self._client.get(endpoints.HEALTH)
        _raise_for_error(response)
        return response.json()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "AuthClient":
        return self

    async def __aexit__(self, *args) -> None:
        await self.close()
