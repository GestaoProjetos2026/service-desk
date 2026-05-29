"""
HTTP client for the Fiscal Finance API.

Usage example:
    from backend.providers.fiscal.client import FiscalClient

    client = FiscalClient()
    product = await client.get_product("SKU-001")
    stock   = await client.get_stock("SKU-001")
    summary = await client.cashflow_summary()
"""

from __future__ import annotations

import httpx

from app.config.config import settings
from . import endpoints
from .models import Product, Stock, CashflowSummary


class FiscalClientError(Exception):
    """Raised when the Fiscal Finance API returns a non-2xx response."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(f"[{status_code}] {code}: {message}")


def _raise_for_error(response: httpx.Response) -> None:
    """Parse the standard error envelope and raise FiscalClientError if needed."""
    if response.is_error:
        try:
            body = response.json()
            error = body.get("error", {}) if isinstance(body, dict) else {}
            raise FiscalClientError(
                status_code=response.status_code,
                code=error.get("code", "UNKNOWN"),
                message=error.get("message", response.text),
            )
        except (ValueError, KeyError):
            raise FiscalClientError(
                status_code=response.status_code,
                code="UNKNOWN",
                message=response.text,
            )


class FiscalClient:
    """Async HTTP client for the Fiscal Finance API."""

    def __init__(self, timeout: float = 10.0, api_key: str | None = None) -> None:
        self._client = httpx.AsyncClient(timeout=timeout)
        self._api_key = api_key or settings.fisc_api_key

    def _headers(self) -> dict:
        return {"X-API-KEY": self._api_key}

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------

    async def get_product(self, sku: str) -> Product:
        """GET /v1/public/fisc/products/{sku} — retrieve a product by SKU."""
        url = endpoints.PRODUCT_GET.format(sku=sku)
        response = await self._client.get(url, headers=self._headers())
        _raise_for_error(response)
        data = response.json().get("data", response.json())
        return Product(**data)

    # ------------------------------------------------------------------
    # Stock
    # ------------------------------------------------------------------

    async def get_stock(self, sku: str) -> Stock:
        """GET /v1/public/fisc/stock/{sku} — retrieve stock balance by SKU."""
        url = endpoints.STOCK_GET.format(sku=sku)
        response = await self._client.get(url, headers=self._headers())
        _raise_for_error(response)
        data = response.json().get("data", response.json())
        return Stock(**data)

    # ------------------------------------------------------------------
    # Cashflow
    # ------------------------------------------------------------------

    async def cashflow_summary(self) -> CashflowSummary:
        """GET /v1/public/fisc/cashflow/summary — consolidated financial summary."""
        response = await self._client.get(
            endpoints.CASHFLOW_SUMMARY,
            headers=self._headers(),
        )
        _raise_for_error(response)
        data = response.json().get("data", response.json())
        return CashflowSummary(**data)

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    async def health(self) -> dict:
        """Probe Fiscal Finance availability via the cashflow endpoint."""
        try:
            response = await self._client.get(
                endpoints.CASHFLOW_SUMMARY,
                headers=self._headers(),
            )
            return {
                "status": "ok" if response.status_code == 200 else "degraded",
                "code": response.status_code,
            }
        except httpx.RequestError as exc:
            return {"status": "unreachable", "erro": str(exc)}

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "FiscalClient":
        return self

    async def __aexit__(self, *args) -> None:
        await self.close()
