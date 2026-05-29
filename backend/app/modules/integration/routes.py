"""
Endpoints de integração inter-squads do Service Desk → Fiscal Finance.

Prefixo: /api/v1/integration

Rotas disponíveis:
  GET  /integration/health                      → status da integração
  GET  /integration/fiscal/products/{sku}       → consulta produto no Fiscal Finance
  GET  /integration/fiscal/stock/{sku}          → consulta estoque no Fiscal Finance
  GET  /integration/fiscal/cashflow             → resumo financeiro do Fiscal Finance
  GET  /integration/fiscal/history/{sku}        → histórico de movimentações por SKU
"""

import random
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status

from app.modules.integration.client import fiscal_finance_client

router = APIRouter(prefix="/integration", tags=["Integration"])


# ── Health da integração ──────────────────────────────────────────────────────

@router.get("/health", summary="Status da integração com Fiscal Finance")
def integration_health():
    """
    Verifica a conectividade do Service Desk com o Squad Fiscal Finance.
    """
    fisc_status = fiscal_finance_client.health()

    return {
        "service_desk": "ok",
        "integrations": {
            "fiscal_finance": fisc_status,
        },
        "overall": "ok" if fisc_status.get("status") == "ok" else "degraded",
    }


# ── Fiscal Finance ────────────────────────────────────────────────────────────

@router.get(
    "/fiscal/products/{sku}",
    summary="Consulta produto por SKU no Fiscal Finance",
    description=(
        "Retorna os dados básicos de um produto (nome, preço, alíquota de imposto "
        "e saldo de estoque) diretamente do Squad Fiscal Finance."
    ),
)
def consultar_produto_fiscal(sku: str):
    resultado = fiscal_finance_client.consultar_produto(sku)

    if resultado.get("sucesso"):
        return {
            "status": "encontrado",
            "sku": sku,
            "produto": resultado.get("produto"),
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=resultado.get("erro", f"Produto '{sku}' não encontrado"),
    )


@router.get(
    "/fiscal/stock/{sku}",
    summary="Consulta saldo de estoque por SKU no Fiscal Finance",
    description="Retorna o saldo de estoque atual de um produto.",
)
def consultar_estoque_fiscal(sku: str):
    resultado = fiscal_finance_client.consultar_estoque(sku)

    if resultado.get("sucesso"):
        return {
            "status": "encontrado",
            "sku": sku,
            "estoque": resultado.get("estoque"),
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=resultado.get("erro", f"Estoque do produto '{sku}' não encontrado"),
    )


@router.get(
    "/fiscal/cashflow",
    summary="Resumo financeiro do Fiscal Finance",
    description="Retorna o resumo consolidado: saldo atual, entradas, despesas e impostos.",
)
def resumo_financeiro_fiscal():
    resultado = fiscal_finance_client.resumo_financeiro()

    if resultado.get("sucesso"):
        return {
            "status": "ok",
            "resumo": resultado.get("resumo"),
        }

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=resultado.get("erro", "Erro ao obter resumo financeiro"),
    )

@router.get(
    "/fiscal/purchases/{user_id}",
    summary="Histórico de compras do usuário",
    description="Retorna um mock de histórico de compras para contexto de cliente na visão do agente."
)
def historico_compras_fiscal(user_id: str):
    agora = datetime.now()
    return {
        "status": "ok",
        "user_id": user_id,
        "purchases": [
            {
                "id": f"ORD-{random.randint(1000, 9999)}",
                "product": "Assinatura Mensal - Fiscal",
                "amount": 199.90,
                "date": (agora - timedelta(days=15)).isoformat(),
                "status": "pago"
            },
            {
                "id": f"ORD-{random.randint(1000, 9999)}",
                "product": "Módulo NFe",
                "amount": 49.90,
                "date": (agora - timedelta(days=45)).isoformat(),
                "status": "pago"
            },
            {
                "id": f"ORD-{random.randint(1000, 9999)}",
                "product": "Consultoria Tributária",
                "amount": 500.00,
                "date": (agora - timedelta(days=90)).isoformat(),
                "status": "pendente"
            }
        ]
    }
