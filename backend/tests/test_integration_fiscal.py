"""
Testes de integração — Service Desk → Fiscal Finance

Como rodar:
  # Com o cluster acessível (URL externa):
  FISCAL_FINANCE_URL=https://api.fiscal-finance.40.82.176.176.nip.io \
  FISC_API_KEY=FISC-PUBLIC-2026-SQUAD4 \
  pytest backend/tests/test_integration_fiscal.py -v

  # Com mock (sem cluster):
  pytest backend/tests/test_integration_fiscal.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SKU_VALIDO = "PROD-001"
SKU_INVALIDO = "SKU-NAO-EXISTE-99999"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers de mock
# ─────────────────────────────────────────────────────────────────────────────

def _mock_produto_ok(sku):
    return {
        "sucesso": True,
        "produto": {
            "sku": sku,
            "nome": "Produto Teste",
            "preco_base": 10.0,
            "aliquota_imposto": 0.12,
            "saldo_estoque": 50,
        },
    }

def _mock_estoque_ok(sku):
    return {
        "sucesso": True,
        "estoque": {
            "sku": sku,
            "nome": "Produto Teste",
            "saldo_atual": 50,
            "ultima_movimentacao": "2026-05-01T10:00:00",
        },
    }

def _mock_resumo_ok():
    return {
        "sucesso": True,
        "resumo": {
            "saldo_atual": 1520.00,
            "total_entradas": 3500.00,
            "total_despesas": 1980.00,
            "total_impostos": 420.00,
        },
    }

def _mock_historico_ok(sku):
    return {
        "sucesso": True,
        "historico": {
            "sku": sku,
            "nome": "Produto Teste",
            "historico": [
                {"tipo": "entrada", "quantidade": 100, "motivo": "Compra", "data_mov": "2026-04-01"},
                {"tipo": "saida",   "quantidade": 50,  "motivo": "Venda",  "data_mov": "2026-05-01"},
            ],
        },
    }

def _mock_nao_encontrado(campo="erro"):
    return {"sucesso": False, campo: "Produto não encontrado"}

def _mock_health_ok():
    return {"status": "ok", "code": 200}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/integration/health
# ─────────────────────────────────────────────────────────────────────────────

class TestIntegrationHealth:
    def test_health_ok(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.health",
            return_value=_mock_health_ok(),
        ):
            resp = client.get("/api/v1/integration/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["service_desk"] == "ok"
        assert body["overall"] == "ok"
        assert body["integrations"]["fiscal_finance"]["status"] == "ok"

    def test_health_degraded(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.health",
            return_value={"status": "unreachable", "erro": "conexão recusada"},
        ):
            resp = client.get("/api/v1/integration/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["overall"] == "degraded"


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/integration/fiscal/products/{sku}
# ─────────────────────────────────────────────────────────────────────────────

class TestFiscalProducts:
    def test_produto_encontrado(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.consultar_produto",
            return_value=_mock_produto_ok(SKU_VALIDO),
        ):
            resp = client.get(f"/api/v1/integration/fiscal/products/{SKU_VALIDO}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "encontrado"
        assert body["sku"] == SKU_VALIDO
        assert "produto" in body

    def test_produto_nao_encontrado(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.consultar_produto",
            return_value=_mock_nao_encontrado(),
        ):
            resp = client.get(f"/api/v1/integration/fiscal/products/{SKU_INVALIDO}")
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/integration/fiscal/stock/{sku}
# ─────────────────────────────────────────────────────────────────────────────

class TestFiscalStock:
    def test_estoque_encontrado(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.consultar_estoque",
            return_value=_mock_estoque_ok(SKU_VALIDO),
        ):
            resp = client.get(f"/api/v1/integration/fiscal/stock/{SKU_VALIDO}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "encontrado"
        assert "estoque" in body

    def test_estoque_nao_encontrado(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.consultar_estoque",
            return_value=_mock_nao_encontrado(),
        ):
            resp = client.get(f"/api/v1/integration/fiscal/stock/{SKU_INVALIDO}")
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/integration/fiscal/cashflow
# ─────────────────────────────────────────────────────────────────────────────

class TestFiscalCashflow:
    def test_resumo_ok(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.resumo_financeiro",
            return_value=_mock_resumo_ok(),
        ):
            resp = client.get("/api/v1/integration/fiscal/cashflow")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "resumo" in body

    def test_resumo_indisponivel(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.resumo_financeiro",
            return_value={"sucesso": False, "erro": "Fiscal Finance indisponível"},
        ):
            resp = client.get("/api/v1/integration/fiscal/cashflow")
        assert resp.status_code == 502


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/integration/fiscal/history/{sku}
# ─────────────────────────────────────────────────────────────────────────────

class TestFiscalHistory:
    def test_historico_encontrado(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.consultar_historico",
            return_value=_mock_historico_ok(SKU_VALIDO),
        ):
            resp = client.get(f"/api/v1/integration/fiscal/history/{SKU_VALIDO}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "encontrado"
        assert "historico" in body

    def test_historico_nao_encontrado(self):
        with patch(
            "app.modules.integration.routes.fiscal_finance_client.consultar_historico",
            return_value=_mock_nao_encontrado(),
        ):
            resp = client.get(f"/api/v1/integration/fiscal/history/{SKU_INVALIDO}")
        assert resp.status_code == 404