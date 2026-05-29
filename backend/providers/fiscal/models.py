"""
Pydantic models (request/response) for the Fiscal Finance provider.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class Product(BaseModel):
    sku: str
    name: Optional[str] = None
    price: Optional[float] = None
    tax_rate: Optional[float] = None
    stock: Optional[int] = None


class Stock(BaseModel):
    sku: str
    quantity: int
    updated_at: Optional[str] = None


class CashflowSummary(BaseModel):
    balance: Optional[float] = None
    income: Optional[float] = None
    expenses: Optional[float] = None
    taxes: Optional[float] = None


class FiscalEnvelope(BaseModel):
    """Standard response envelope returned by the Fiscal Finance API."""
    success: bool
    data: dict = {}
    timestamp: Optional[str] = None
    path: Optional[str] = None
