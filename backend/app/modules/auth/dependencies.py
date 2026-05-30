"""
Dependências FastAPI para autenticação.

`get_current_user` lê o `Authorization: Bearer <token>` e devolve o
`UserProfile` consultando o Core Engine. Pode ser usado nas rotas que
precisarem proteger endpoints futuramente — por enquanto é opcional para
não quebrar a UX atual do frontend (que ainda autentica via mock).
"""

from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from app.modules.auth.service import AuthService
from providers.auth.models import UserProfile


def get_auth_service() -> AuthService:
    return AuthService()


async def get_current_user(
    authorization: str | None = Header(default=None),
    service: AuthService = Depends(get_auth_service),
) -> UserProfile:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso ausente ou inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso vazio",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await service.me(token)
