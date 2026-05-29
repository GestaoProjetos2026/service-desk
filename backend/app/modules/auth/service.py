"""
Service layer do módulo `auth`.

Encapsula o `AuthClient` (provider) para que rotas e dependências fiquem
desacopladas de detalhes HTTP. Traduz `AuthClientError` em `HTTPException`.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from providers.auth import AuthClient, AuthClientError
from providers.auth.models import TokenResponse, UserProfile


class AuthService:
    def __init__(self, client: AuthClient | None = None) -> None:
        # Permitir injeção do client (facilita testes com mock)
        self._client = client or AuthClient()

    async def login(self, email: str, password: str) -> TokenResponse:
        try:
            return await self._client.login(email, password)
        except AuthClientError as exc:
            raise _translate(exc)

    async def register(self, name: str, email: str, password: str) -> UserProfile:
        try:
            return await self._client.register(name, email, password)
        except AuthClientError as exc:
            raise _translate(exc)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            return await self._client.refresh(refresh_token)
        except AuthClientError as exc:
            raise _translate(exc)

    async def me(self, access_token: str) -> UserProfile:
        try:
            return await self._client.me(access_token)
        except AuthClientError as exc:
            raise _translate(exc)

    async def close(self) -> None:
        await self._client.close()


def _translate(exc: AuthClientError) -> HTTPException:
    """Mapeia erros do provider para HTTPException FastAPI."""
    code = exc.status_code
    # Normaliza códigos comuns; demais propagam o status original
    if code in (400, 401, 403, 404, 409, 422):
        return HTTPException(status_code=code, detail=exc.message)
    if code >= 500:
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Core Engine indisponível: {exc.message}",
        )
    return HTTPException(status_code=code, detail=exc.message)
