"""
Cliente HTTP para integração com o Squad Fiscal Finance.

FiscalFinanceClient → consulta produtos, estoque e resumo financeiro
via Fiscal Finance (Flask, porta 5000).

URL interna Kubernetes:
  http://backend-svc.fiscal-finance.svc.cluster.local:5000
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

# ── URL interna (Kubernetes) ───────────────────────────────────────────────────
FISCAL_FINANCE_BASE_URL = os.getenv(
    "FISCAL_FINANCE_URL",
    "http://backend-svc.fiscal-finance.svc.cluster.local:5000",
)

# API Key autorizada pelo Squad FISC para o Squad Service-Desk
FISC_API_KEY = os.getenv("FISC_API_KEY", "FISC-PUBLIC-2026-SQUAD4")

# Timeout padrão para chamadas inter-squads (segundos)
HTTP_TIMEOUT = float(os.getenv("INTEGRATION_TIMEOUT", "5.0"))


# ─────────────────────────────────────────────────────────────────────────────
# Fiscal Finance Client
# ─────────────────────────────────────────────────────────────────────────────

class FiscalFinanceClient:
    """
    Integração com o Fiscal Finance (Flask, porta 5000).

    Endpoints utilizados:
      GET /v1/public/fisc/products/<sku>       → dados do produto
      GET /v1/public/fisc/stock/<sku>          → saldo de estoque
      GET /v1/public/fisc/cashflow/summary     → resumo financeiro
      GET /v1/public/fisc/history/<sku>        → histórico de movimentações
    """

    def __init__(self) -> None:
        self.base_url = FISCAL_FINANCE_BASE_URL.rstrip("/")

    def _headers(self) -> dict:
        return {"X-API-KEY": FISC_API_KEY}

    # ── Produtos ────────────────────────────────────────────────────────────

    def consultar_produto(self, sku: str) -> dict:
        """
        Consulta dados de um produto por SKU.

        Retorna:
          {"sucesso": True,  "produto": {...}}
          {"sucesso": False, "erro": "..."}
        """
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(
                    f"{self.base_url}/v1/public/fisc/products/{sku}",
                    headers=self._headers(),
                )

            if resp.status_code == 200:
                data = resp.json()
                logger.info("[FiscalFinance] Produto %s consultado com sucesso.", sku)
                return {"sucesso": True, "produto": data.get("data", data)}

            if resp.status_code == 404:
                return {"sucesso": False, "erro": f"Produto com SKU '{sku}' não encontrado no Fiscal Finance"}

            if resp.status_code == 403:
                return {"sucesso": False, "erro": "API Key inválida ou sem permissão no Fiscal Finance"}

            return {"sucesso": False, "erro": f"Fiscal Finance retornou status {resp.status_code}"}

        except httpx.RequestError as exc:
            logger.error("[FiscalFinance] Falha ao consultar produto %s: %s", sku, exc)
            return {"sucesso": False, "erro": f"Fiscal Finance indisponível: {exc}"}

    # ── Estoque ─────────────────────────────────────────────────────────────

    def consultar_estoque(self, sku: str) -> dict:
        """
        Consulta saldo de estoque de um produto por SKU.

        Retorna:
          {"sucesso": True,  "estoque": {...}}
          {"sucesso": False, "erro": "..."}
        """
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(
                    f"{self.base_url}/v1/public/fisc/stock/{sku}",
                    headers=self._headers(),
                )

            if resp.status_code == 200:
                data = resp.json()
                logger.info("[FiscalFinance] Estoque de %s consultado com sucesso.", sku)
                return {"sucesso": True, "estoque": data.get("data", data)}

            if resp.status_code == 404:
                return {"sucesso": False, "erro": f"Produto com SKU '{sku}' não encontrado no estoque"}

            if resp.status_code == 403:
                return {"sucesso": False, "erro": "API Key inválida ou sem permissão no Fiscal Finance"}

            return {"sucesso": False, "erro": f"Fiscal Finance retornou status {resp.status_code}"}

        except httpx.RequestError as exc:
            logger.error("[FiscalFinance] Falha ao consultar estoque %s: %s", sku, exc)
            return {"sucesso": False, "erro": f"Fiscal Finance indisponível: {exc}"}

    # ── Resumo financeiro ───────────────────────────────────────────────────

    def resumo_financeiro(self) -> dict:
        """
        Obtém o resumo financeiro consolidado.

        Retorna:
          {"sucesso": True,  "resumo": {...}}
          {"sucesso": False, "erro": "..."}
        """
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(
                    f"{self.base_url}/v1/public/fisc/cashflow/summary",
                    headers=self._headers(),
                )

            if resp.status_code == 200:
                data = resp.json()
                logger.info("[FiscalFinance] Resumo financeiro obtido com sucesso.")
                return {"sucesso": True, "resumo": data.get("data", data)}

            if resp.status_code == 403:
                return {"sucesso": False, "erro": "API Key inválida ou sem permissão no Fiscal Finance"}

            return {"sucesso": False, "erro": f"Fiscal Finance retornou status {resp.status_code}"}

        except httpx.RequestError as exc:
            logger.error("[FiscalFinance] Falha ao obter resumo financeiro: %s", exc)
            return {"sucesso": False, "erro": f"Fiscal Finance indisponível: {exc}"}

    # ── Histórico de movimentações ──────────────────────────────────────────

    def consultar_historico(self, sku: str) -> dict:
        """
        Consulta o histórico de movimentações de um produto por SKU.

        Retorna:
          {"sucesso": True,  "historico": {...}}
          {"sucesso": False, "erro": "..."}
        """
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(
                    f"{self.base_url}/v1/public/fisc/history/{sku}",
                    headers=self._headers(),
                )

            if resp.status_code == 200:
                data = resp.json()
                logger.info("[FiscalFinance] Histórico de %s consultado com sucesso.", sku)
                return {"sucesso": True, "historico": data.get("data", data)}

            if resp.status_code == 404:
                return {"sucesso": False, "erro": f"Produto com SKU '{sku}' não encontrado"}

            if resp.status_code == 403:
                return {"sucesso": False, "erro": "API Key inválida ou sem permissão no Fiscal Finance"}

            return {"sucesso": False, "erro": f"Fiscal Finance retornou status {resp.status_code}"}

        except httpx.RequestError as exc:
            logger.error("[FiscalFinance] Falha ao consultar histórico %s: %s", sku, exc)
            return {"sucesso": False, "erro": f"Fiscal Finance indisponível: {exc}"}

    # ── Health check ────────────────────────────────────────────────────────

    def health(self) -> dict:
        """Verifica se o Fiscal Finance está acessível."""
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(
                    f"{self.base_url}/v1/public/fisc/cashflow/summary",
                    headers=self._headers(),
                )
            return {"status": "ok" if resp.status_code == 200 else "degraded", "code": resp.status_code}
        except httpx.RequestError as exc:
            return {"status": "unreachable", "erro": str(exc)}


fiscal_finance_client = FiscalFinanceClient()