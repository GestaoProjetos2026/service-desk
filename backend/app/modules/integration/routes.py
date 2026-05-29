"""
Endpoints de integração inter-squads do Service Desk.

Prefixo: /api/v1/integration

Rotas disponíveis:
  GET  /integration/health                      → status das integrações
  GET  /integration/core-engine/users/{user_id} → valida usuário no Core Engine
  GET  /integration/fiscal/products/{sku}       → consulta produto no Fiscal Finance
  GET  /integration/fiscal/stock/{sku}          → consulta estoque no Fiscal Finance
  GET  /integration/fiscal/cashflow             → resumo financeiro do Fiscal Finance
"""

import random
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status

from app.modules.integration.client import core_engine_client, fiscal_finance_client

router = APIRouter(prefix="/integration", tags=["Integration"])


# ── Health geral das integrações ──────────────────────────────────────────────

@router.get("/health", summary="Status das integrações externas")
def integration_health():
    """
    Verifica a conectividade do Service Desk com as squads externas:
    - Core Engine (NestJS)
    - Fiscal Finance (Flask)
    """
    core_status = core_engine_client.health()
    fisc_status = fiscal_finance_client.health()

    tudo_ok = (
        core_status.get("status") == "ok"
        and fisc_status.get("status") == "ok"
    )

    return {
        "service_desk": "ok",
        "integrations": {
            "core_engine": core_status,
            "fiscal_finance": fisc_status,
        },
        "overall": "ok" if tudo_ok else "degraded",
    }


# ── Core Engine ───────────────────────────────────────────────────────────────

@router.get(
    "/core-engine/users/{user_id}",
    summary="Valida usuário no Core Engine",
    description=(
        "Consulta o Core Engine para verificar se um usuário existe. "
        "Útil para validar user_id antes de criar ou atribuir um ticket."
    ),
)
def validar_usuario_core_engine(user_id: str):
    """
    Retorna os dados do usuário se ele existir no Core Engine,
    ou 404 se não for encontrado.
    """
    resultado = core_engine_client.validar_usuario(user_id)

    if resultado.get("valido"):
        return {
            "status": "encontrado",
            "user_id": user_id,
            "usuario": resultado.get("usuario"),
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=resultado.get("erro", "Usuário não encontrado no Core Engine"),
    )


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
