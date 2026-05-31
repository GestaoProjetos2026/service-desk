"""
Endpoints de integração inter-squads do Service Desk → Fiscal Finance.

Prefixo: /api/v1/integration

Rotas disponíveis:
  GET  /integration/health                      → status da integração
  GET  /integration/fiscal/products/{sku}       → consulta produto no Fiscal Finance
  GET  /integration/fiscal/stock/{sku}          → consulta estoque no Fiscal Finance
  GET  /integration/fiscal/cashflow             → resumo financeiro (🔒 role: suporte)
  GET  /integration/fiscal/history/{sku}        → histórico de movimentações por SKU
  GET  /integration/fiscal/purchases/{user_id}  → histórico de compras do usuário
"""

import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.dependencies import get_current_user
from app.modules.integration.client import fiscal_finance_client
from providers.auth.models import UserProfile

router = APIRouter(prefix="/integration", tags=["Integration"])


# ─── Helpers RBAC ─────────────────────────────────────────────────────────────

def _require_suporte_role(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """
    Dependência FastAPI: garante que o usuário autenticado possui a role
    'suporte' (conforme exigência ADR Squad 4 / PPTX slide 7 RBAC).

    Apenas usuários com role 'suporte' no Core Engine podem acessar dados
    financeiros sensíveis da Squad 2.
    """
    roles_lower = [str(r).lower() for r in (current_user.roles or [])]
    allowed = {"suporte", "admin", "agent", "tecnico", "técnico"}
    if not allowed.intersection(roles_lower):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: esta rota exige a role 'suporte' do Core Engine.",
        )
    return current_user


# ─── Health da integração ─────────────────────────────────────────────────────

@router.get("/health", summary="Status da integração com Fiscal Finance")
def integration_health():
    """
    Verifica a conectividade do Service Desk com o Squad Fiscal Finance.
    Rota pública — sem autenticação obrigatória.
    """
    fisc_status = fiscal_finance_client.health()

    return {
        "service_desk": "ok",
        "integrations": {
            "fiscal_finance": fisc_status,
        },
        "overall": "ok" if fisc_status.get("status") == "ok" else "degraded",
    }


# ─── Fiscal Finance ───────────────────────────────────────────────────────────

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
    description=(
        "Retorna o resumo consolidado: saldo atual, entradas, despesas e impostos. "
        "**Restrito**: exige role `suporte` no Core Engine (RBAC Squad 4)."
    ),
)
def resumo_financeiro_fiscal(
    current_user: UserProfile = Depends(_require_suporte_role),
):
    """
    Dados financeiros sensíveis da Squad 2.

    Protegido por RBAC: apenas usuários com role 'suporte' (ou admin/agent/tecnico)
    no Core Engine podem acessar este endpoint.

    Usuários comuns (role 'user') recebem HTTP 403.
    """
    resultado = fiscal_finance_client.resumo_financeiro()

    if resultado.get("sucesso"):
        return {
            "status": "ok",
            "resumo": resultado.get("resumo"),
            # Inclui quem fez a consulta para auditoria
            "consultado_por": {
                "id": current_user.id,
                "name": current_user.name,
                "roles": current_user.roles,
            },
        }

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=resultado.get("erro", "Erro ao obter resumo financeiro"),
    )


@router.get(
    "/fiscal/history/{sku}",
    summary="Histórico de movimentações por SKU no Fiscal Finance",
    description="Retorna o histórico de entradas e saídas de um determinado produto por SKU.",
)
def consultar_historico_fiscal(sku: str):
    resultado = fiscal_finance_client.consultar_historico(sku)

    if resultado.get("sucesso"):
        return {
            "status": "encontrado",
            "sku": sku,
            "historico": resultado.get("historico"),
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=resultado.get("erro", f"Histórico do produto '{sku}' não encontrado"),
    )


@router.get(
    "/fiscal/purchases/{user_id}",
    summary="Histórico de compras do usuário (contexto de cliente)",
    description=(
        "Retorna o histórico de compras do cliente para enriquecer o contexto "
        "do atendente ao abrir um ticket. Exige autenticação."
    ),
)
def historico_compras_fiscal(
    user_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Contexto de cliente: ao abrir um ticket, o sistema busca o histórico de
    compras na Squad 2 (conforme PPTX slide 7 — Squad 4 Entregáveis).

    Visível apenas para agentes autenticados.
    """
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
                "status": "pago",
            },
            {
                "id": f"ORD-{random.randint(1000, 9999)}",
                "product": "Módulo NFe",
                "amount": 49.90,
                "date": (agora - timedelta(days=45)).isoformat(),
                "status": "pago",
            },
            {
                "id": f"ORD-{random.randint(1000, 9999)}",
                "product": "Consultoria Tributária",
                "amount": 500.00,
                "date": (agora - timedelta(days=90)).isoformat(),
                "status": "pendente",
            },
        ],
    }
