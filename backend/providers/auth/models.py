"""
Pydantic models (request/response) for the Core Engine Auth provider.
Based on: http://api.core-engine.40.82.176.176.nip.io/v1/docs
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, EmailStr


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
    refresh_token: str


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"


class UserProfile(BaseModel):
    id: str
    name: str
    email: EmailStr
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
