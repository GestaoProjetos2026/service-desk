"""
Clientes HTTP para integração com squads externas.

- CoreEngineClient  → valida usuários e tokens via core-engine
- FiscalFinanceClient → consulta produtos e estoque via fiscal-finance

URLs internas Kubernetes:
  http://<service>.<namespace>.svc.cluster.local:<porta>
"""

import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ── URLs internas (Kubernetes) ─────────────────────────────────────────────────
# Formato: http://<nome-do-service>.<namespace>.svc.cluster.local:<porta>
# Ajuste os namespaces caso sejam diferentes no seu cluster.

CORE_ENGINE_BASE_URL = os.getenv(
    "CORE_ENGINE_URL",
    "http://backend-svc.core-engine.svc.cluster.local:3000",
)

FISCAL_FINANCE_BASE_URL = os.getenv(
    "FISCAL_FINANCE_URL",
    "http://backend-svc.fiscal-finance.svc.cluster.local:5000",
)

# API Key autorizada pelo squad FISC para o squad Service-Desk
FISC_API_KEY = os.getenv("FISC_API_KEY", "FISC-PUBLIC-2026-SQUAD4")

# Timeout padrão para chamadas inter-squads (segundos)
HTTP_TIMEOUT = float(os.getenv("INTEGRATION_TIMEOUT", "5.0"))


# ─────────────────────────────────────────────────────────────────────────────
# Core Engine Client
# ─────────────────────────────────────────────────────────────────────────────

class CoreEngineClient:
    """
    Integração com o Core Engine (NestJS, porta 3000).

    Endpoints utilizados:
      POST /v1/integration/token  → obter token M2M
      GET  /v1/users/:id          → validar se usuário existe
    """

    def __init__(self) -> None:
        self.base_url = CORE_ENGINE_BASE_URL.rstrip("/")
        self._token: Optional[str] = None

    # ── Token M2M ──────────────────────────────────────────────────────────

    def _obter_token(self) -> Optional[str]:
        """
        Obtém token M2M via client_credentials.
        As credenciais são configuradas via variáveis de ambiente:
          CORE_ENGINE_CLIENT_ID / CORE_ENGINE_CLIENT_SECRET
        """
        client_id = os.getenv("CORE_ENGINE_CLIENT_ID", "")
        client_secret = os.getenv("CORE_ENGINE_CLIENT_SECRET", "")

        if not client_id or not client_secret:
            logger.warning(
                "[CoreEngine] CORE_ENGINE_CLIENT_ID ou CORE_ENGINE_CLIENT_SECRET "
                "não configurados. Integração de autenticação desabilitada."
            )
            return None

        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.post(
                    f"{self.base_url}/v1/integration/token",
                    json={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "grant_type": "client_credentials",
                    },
                )
            resp.raise_for_status()
            data = resp.json()
            token = data.get("data", {}).get("access_token")
            logger.info("[CoreEngine] Token M2M obtido com sucesso.")
            return token
        except httpx.HTTPStatusError as exc:
            logger.error("[CoreEngine] Erro ao obter token: %s – %s", exc.response.status_code, exc.response.text)
            return None
        except httpx.RequestError as exc:
            logger.error("[CoreEngine] Falha de conexão ao obter token: %s", exc)
            return None

    def _headers(self) -> dict:
        if not self._token:
            self._token = self._obter_token()
        if self._token:
            return {"Authorization": f"Bearer {self._token}"}
        return {}

    # ── Validação de usuário ────────────────────────────────────────────────

    def validar_usuario(self, user_id: str) -> dict:
        """
        Verifica se um usuário existe no Core Engine.

        Retorna:
          {"valido": True,  "usuario": {...}}   → usuário encontrado
          {"valido": False, "erro": "..."}      → não encontrado ou erro
        """
        if not user_id:
            return {"valido": False, "erro": "user_id não informado"}

        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(
                    f"{self.base_url}/v1/users/{user_id}",
                    headers=self._headers(),
                )

            if resp.status_code == 200:
                logger.info("[CoreEngine] Usuário %s validado.", user_id)
                return {"valido": True, "usuario": resp.json()}

            if resp.status_code == 404:
                return {"valido": False, "erro": f"Usuário {user_id} não encontrado no Core Engine"}

            if resp.status_code == 401:
                # Token expirado → tenta renovar uma vez
                self._token = self._obter_token()
                with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                    resp2 = http.get(
                        f"{self.base_url}/v1/users/{user_id}",
                        headers=self._headers(),
                    )
                if resp2.status_code == 200:
                    return {"valido": True, "usuario": resp2.json()}
                return {"valido": False, "erro": f"Não autorizado ao consultar usuário (status {resp2.status_code})"}

            return {"valido": False, "erro": f"Core Engine retornou status {resp.status_code}"}

        except httpx.RequestError as exc:
            logger.error("[CoreEngine] Falha ao validar usuário %s: %s", user_id, exc)
            return {"valido": False, "erro": f"Core Engine indisponível: {exc}"}

    # ── Health check ────────────────────────────────────────────────────────

    def health(self) -> dict:
        """Verifica se o Core Engine está acessível."""
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT) as http:
                resp = http.get(f"{self.base_url}/v1/health")  # corrigido: era /health
            return {"status": "ok" if resp.status_code == 200 else "degraded", "code": resp.status_code}
        except httpx.RequestError as exc:
            return {"status": "unreachable", "erro": str(exc)}


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


# ─────────────────────────────────────────────────────────────────────────────
# Singletons (instâncias reutilizáveis)
# ─────────────────────────────────────────────────────────────────────────────

core_engine_client = CoreEngineClient()
fiscal_finance_client = FiscalFinanceClient()
