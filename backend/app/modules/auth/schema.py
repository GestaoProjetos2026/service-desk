"""
Schemas (request/response) expostos pelas rotas /api/v1/auth/*.

Reaproveitam os modelos do provider para evitar duplicação e mantêm o
contrato externo simples e estável.
"""

from __future__ import annotations

from providers.auth.models import (
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    TokenResponse,
    UserProfile,
)

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "RefreshRequest",
    "TokenResponse",
    "UserProfile",
]
