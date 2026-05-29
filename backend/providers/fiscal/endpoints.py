"""
Endpoint constants for the Fiscal Finance API.
Base URL: configured via FISCAL_FINANCE_URL env var (settings.fiscal_finance_url)
"""

from app.config.config import settings

BASE_URL = settings.fiscal_finance_url.rstrip("/") + "/v1"

# ----- Products -----
PRODUCT_GET = f"{BASE_URL}/public/fisc/products/{{sku}}"   # GET — product by SKU

# ----- Stock -----
STOCK_GET = f"{BASE_URL}/public/fisc/stock/{{sku}}"        # GET — stock balance by SKU

# ----- Cashflow -----
CASHFLOW_SUMMARY = f"{BASE_URL}/public/fisc/cashflow/summary"  # GET — financial summary
