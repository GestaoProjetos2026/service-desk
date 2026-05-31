"""
Rotas de autenticação — fachada do Service Desk sobre o Core Engine Auth.

Prefixo (com api_prefix): /api/v1/auth

Rotas:
  POST /auth/login     → autentica e devolve tokens
  POST /auth/register  → registra novo usuário
  POST /auth/refresh   → renova access token
  POST /auth/logout    → encerra sessão (best-effort, server stateless)
  GET  /auth/me        → retorna perfil do usuário autenticado
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.modules.auth.dependencies import get_auth_service, get_current_user
from app.modules.auth.schema import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserProfile,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse, summary="Login com e-mail e senha")
async def login(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.login(payload.email, payload.password)


@router.post(
    "/register",
    response_model=UserProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Registra um novo usuário",
)
async def register(
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> UserProfile:
    return await service.register(payload.name, payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse, summary="Renova o access token")
async def refresh(
    payload: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.refresh(payload.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerra a sessão (client deve descartar o token)",
)
async def logout(
    authorization: str | None = Header(default=None),
):
    """
    O Core Engine não expõe um endpoint stateful de logout. Esta rota
    apenas confirma o encerramento — o cliente deve descartar o token.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ausente",
        )
    return None


@router.get("/me", response_model=UserProfile, summary="Perfil do usuário autenticado")
async def me(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    return current_user
