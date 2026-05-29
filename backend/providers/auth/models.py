"""
Pydantic models (request/response) for the Core Engine Auth provider.
Based on: http://api.core-engine.40.82.176.176.nip.io/v1/docs
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    refresh_token: str


# ---------------------------------------------------------------------------
# Response models — sem alias_generator para que o FastAPI serialize
# com snake_case, compatível com o frontend.
# A conversão camelCase → snake_case é feita pelo client via _normalize().
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: Optional[int] = None


class UserProfile(BaseModel):
    """Perfil de usuário tolerante a variações do Core Engine.

    Apenas `id` é obrigatório — qualquer outro campo pode estar ausente
    dependendo do endpoint (ex.: `/auth/me` pode retornar apenas `user_id`).
    Use `EmailStr` apenas quando o valor for não-vazio; aceitamos `str` cru
    para evitar 500 em respostas mínimas do provider.
    """

    model_config = ConfigDict(extra="ignore")

    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = []
    perms: List[str] = []
    status: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AuthEnvelope(BaseModel):
    """Standard response envelope returned by the Core Engine API."""
    success: bool
    data: dict = {}
    timestamp: str
    path: str
