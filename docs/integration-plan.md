# 🔗 Plano de Integração — Frontend ↔ Backend ↔ Core Auth

> Planejamento técnico para integrar o **frontend React** com a **API FastAPI** do Service Desk, delegando autenticação e gestão de usuários ao **Core Engine & Auth** (provider externo já mapeado em `backend/providers/auth/`).

---

## 0. Estado Atual (maio/2026)

Resumo do que já foi implementado no repositório e o que ainda está pendente:

| Componente | Item | Status |
|---|---|---|
| **Backend** | `providers/auth/` — `AuthClient`, endpoints, Pydantic models | ✅ Implementado |
| **Backend** | `providers/fiscal/` — `FiscalFinanceClient`, endpoints, models | ✅ Implementado |
| **Backend** | `modules/integration/` — rotas e client do Fiscal Finance | ✅ Implementado |
| **Backend** | `docker-compose.yml` — `entrypoint` do serviço `migration` corrigido | ✅ Corrigido |
| **Backend** | `modules/auth/` — schema, service, controller, routes, dependencies | ⏳ Pendente |
| **Backend** | CORS no `main.py` + `frontend_url` nas settings | ⏳ Pendente |
| **Backend** | `Depends(get_current_user)` nas rotas de tickets, messages, sla | ⏳ Pendente |
| **Frontend** | Tela de `Login` — formulário e-mail + senha (UI pronta) | ✅ Implementado |
| **Frontend** | `buscarResumoFinanceiro()` / `buscarHistoricoFiscal()` chamando API real | ✅ Implementado |
| **Frontend** | `TicketFiscalPanel` integrado ao `GET /api/v1/integration/fiscal/cashflow` | ✅ Implementado |
| **Frontend** | `createContext` / `useContext` importados em `App.jsx` | ✅ Preparado |
| **Frontend** | Conexão real do Login ao `POST /api/v1/auth/login` | ⏳ Pendente |
| **Frontend** | Extração de `api/`, `context/`, `hooks/` de `App.jsx` | ⏳ Pendente |
| **Frontend** | Substituição de `TICKETS_INIT`, `KB_INIT`, `USERS_DB` por chamadas à API | ⏳ Pendente |

---

## 1. Visão Geral

```
┌─────────────────┐     HTTP/JSON     ┌──────────────────┐    HTTPX (M2M+Bearer)    ┌──────────────────────┐
│  Frontend       │ ────────────────▶ │  Service Desk    │ ───────────────────────▶ │  Core Engine & Auth  │
│  (React + Vite) │ ◀──────────────── │  Backend (API)   │ ◀─────────────────────── │  (provider externo)  │
└─────────────────┘   JWT no header   └──────┬───────────┘                          └──────────────────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  PostgreSQL  │
                                      └──────────────┘
```

**Princípios:**
- O **frontend nunca chama o Core Auth diretamente**; toda comunicação passa pelo backend Service Desk.
- O backend Service Desk **não persiste senhas nem dados sensíveis de identidade**: ele apenas valida tokens e proxia chamadas para o `/auth`.
- Cada request autenticada carrega um JWT (`Authorization: Bearer <token>`); o backend valida via `GET /v1/auth/me`.
- Os dados próprios (tickets, mensagens, KB) continuam no PostgreSQL do Service Desk, **referenciando usuários por UUID** (`user_id`, `assigned_to`, etc.).

---

## 2. Arquitetura de Autenticação

### 2.1. Fluxo de Login
```
┌─────────┐   POST /api/v1/auth/login    ┌────────┐  POST /v1/auth/login   ┌──────────┐
│Frontend │ ───────────────────────────▶ │Backend │ ─────────────────────▶ │Core Auth │
│         │ ◀─────────────────────────── │        │ ◀───────────────────── │          │
└─────────┘   { accessToken, refresh }   └────────┘   tokens + envelope    └──────────┘
```

1. Usuário envia `email` + `password` para `POST /api/v1/auth/login` (backend Service Desk).
2. Backend chama `AuthClient.login()` (já implementado em `backend/providers/auth/client.py`).
3. Backend devolve `accessToken`, `refreshToken`, `expiresIn` ao frontend.
4. Frontend armazena tokens em `localStorage` (ou `sessionStorage`) e injeta `Authorization: Bearer <accessToken>` em todas as próximas chamadas.

### 2.2. Validação de Tokens em Rotas Protegidas
Toda rota protegida do backend usa uma dependência FastAPI `get_current_user` que:
1. Extrai o token do header `Authorization`.
2. Chama `AuthClient.me(token)` → `GET /v1/auth/me` para validar e obter o perfil.
3. Faz cache do resultado por um curto período (ex: 60s) para reduzir latência.
4. Injeta o `UserProfile` no controller, expondo `id`, `roles`, `perms`.

### 2.3. Autorização por Papel/Permissão
- O backend **não armazena roles localmente**: confia nos campos `roles` e `perms` retornados pelo Core Auth.
- Dependências adicionais (`require_role("agent")`, `require_perm("tickets:write")`) bloqueiam acesso a rotas sensíveis.

### 2.4. Refresh Automático no Frontend
- Interceptor HTTP detecta `401 AUTH_TOKEN_EXPIRED` → chama `POST /api/v1/auth/refresh` → reexecuta a request original.
- Se o refresh falhar, o frontend faz logout e redireciona para `Login`.

---

## 3. Mudanças no Backend

### 3.1. Novo módulo: `auth/` ⏳

> **Base já pronta:** `backend/providers/auth/` está **completamente implementado** — `AuthClient` (login, me, register, refresh, logout), todos os endpoints do Core Auth mapeados em `endpoints.py` e os Pydantic models (`LoginRequest`, `RegisterRequest`, `RefreshRequest`, `TokenResponse`, `UserProfile`) em `models.py`. O módulo `auth/` abaixo apenas consome esses providers.

Seguindo a estrutura padrão dos demais módulos (controller / service / routes / schema). **Não possui `model.py` nem `repository.py`** — toda persistência fica no Core Auth.

```
backend/app/modules/auth/
├── __init__.py
├── schema.py        # LoginIn, LoginOut, RefreshIn, MeOut (Pydantic)
├── service.py       # Orquestra chamadas ao AuthClient
├── controller.py    # Trata exceções (AuthClientError → HTTPException)
├── routes.py        # POST /auth/login, /auth/refresh, /auth/register, GET /auth/me
└── dependencies.py  # get_current_user, require_role, require_perm
```

#### Rotas expostas
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Proxy para Core Auth; devolve tokens |
| `POST` | `/api/v1/auth/register` | Cria usuário no Core Auth |
| `POST` | `/api/v1/auth/refresh` | Renova access token |
| `GET` | `/api/v1/auth/me` | Retorna perfil do usuário autenticado |
| `POST` | `/api/v1/auth/logout` | Invalida o refresh token no Core Auth (best-effort) |

### 3.2. Dependência `get_current_user`
Arquivo: `backend/app/modules/auth/dependencies.py`

```python
async def get_current_user(
    authorization: str = Header(...),
) -> UserProfile:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        async with AuthClient() as client:
            return await client.me(token)
    except AuthClientError as e:
        raise HTTPException(e.status_code, e.message)
```

### 3.3. Integração nos módulos existentes
Cada rota protegida passa a depender de `Depends(get_current_user)`:

| Módulo | Rota | Mudança |
|---|---|---|
| `tickets` | `POST /tickets` | Preenche `user_id` com `current_user.id` (não mais via body) |
| `tickets` | `PATCH /tickets/{id}` | Preenche `updated_by`; valida se é `agent` para mudar status |
| `tickets` | `GET /tickets` | Se `role == "user"`, filtra por `user_id == current_user.id` |
| `ticket_messages` | `POST /messages` | Preenche `author_id`; permite `is_internal` apenas para agentes |
| `ticket_messages` | `DELETE /messages/{id}` | Restringe a autor da mensagem ou agente |
| `sla/*` | todas | Restringe a `role == "agent"` |
| `knowledge_base` | `GET` | Pública (mantém aberta) |

### 3.4. CORS ⏳
Adicionar middleware no `app/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],   # ex: http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Nova variável em `.env`: `FRONTEND_URL=http://localhost:5173`.

### 3.5. Migrações de banco de dados
Qualquer alteração no esquema do PostgreSQL **deve ser feita via Alembic com `ALTER TABLE`**, nunca recriando tabelas ou editando diretamente o banco.

Exemplo de migration para adicionar uma coluna futura:
```python
# backend/alembic/versions/0002_add_assigned_role_to_tickets.py
def upgrade() -> None:
    op.add_column("tickets", sa.Column("assigned_role", sa.String(50), nullable=True))

def downgrade() -> None:
    op.drop_column("tickets", "assigned_role")
```

Regras:
- Um arquivo `alembic/versions/NNNN_descricao.py` por conjunto de mudanças relacionadas.
- Sempre implementar `downgrade()` para reverter com `alembic downgrade -1`.
- Nunca usar `op.drop_table` / `op.create_table` para modificar tabelas existentes — usar `op.add_column`, `op.drop_column`, `op.alter_column`, `op.create_index`, etc.
- Testar `upgrade` e `downgrade` antes de aplicar em produção.

### 3.6. Schemas Pydantic atualizados
- Remover campos `user_id`, `updated_by`, `author_id` dos schemas de **entrada** (`TicketCreate`, `TicketUpdate`, `TicketMessageCreate`); passar a ser preenchidos no controller a partir de `current_user`.
- Mantê-los nos schemas de **saída**.

### 3.7. Configurações novas ⏳
Adicionar em `backend/app/config/config.py`:
```python
frontend_url: str = "http://localhost:5173"
auth_cache_ttl_seconds: int = 60   # cache opcional de get_current_user
```

> `CORE_ENGINE_URL`, `FISCAL_FINANCE_URL`, `FISC_API_KEY` e `INTEGRATION_TIMEOUT` já estão presentes nas settings.

---

## 4. Mudanças no Frontend

### 4.1. Nova estrutura de pastas
Quebrando o `App.jsx` único conforme a integração avança:

```
frontend/src/
├── main.jsx
├── App.jsx                  # composição + router de página
├── api/
│   ├── client.js            # wrapper fetch com interceptor de token + refresh
│   ├── auth.js              # login(), register(), me(), refresh(), logout()
│   ├── tickets.js           # list/get/create/update tickets
│   ├── messages.js          # list/create/delete mensagens
│   ├── sla.js               # status/violations/summary
│   └── knowledgeBase.js     # list artigos
├── context/
│   └── AuthContext.jsx      # provê { user, tokens, login, logout } via Context
├── hooks/
│   ├── useAuth.js
│   └── useApi.js            # genérico para requests com loading/error
└── components/              # extrair componentes do App.jsx conforme necessidade
```

### 4.2. `api/client.js`
- Lê `accessToken` do `localStorage`.
- Injeta `Authorization: Bearer <token>`.
- Interceptor:
  - `401 AUTH_TOKEN_EXPIRED` → chama `refresh()` → repete a request.
  - Falha no refresh → limpa storage, redireciona para `Login`.
- Padroniza a leitura do envelope `{ success, data, error }`.

### 4.3. `AuthContext`
Substitui o atual `USERS_DB` mock e o estado `role` em `App.jsx`:
```jsx
const { user, isAuthenticated, login, logout } = useAuth();
const role = user?.roles?.includes("agent") ? "agent" : "user";
```

### 4.4. Tela de Login ⚠️ Parcialmente pronto
O formulário de e-mail + senha **já existe** em `App.jsx` com `// TODO: POST /api/v1/auth/login`. A UI está pronta; falta apenas conectar ao `api.auth.login(email, password)` real (após criar `api/auth.js` e `AuthContext`).

### 4.5. Substituição dos dados mock
| Mock atual | Substituição |
|---|---|
| `TICKETS_INIT` | `await api.tickets.list()` em `useEffect` |
| `KB_INIT` | `await api.knowledgeBase.list()` |
| `USERS_DB` | `AuthContext.user` (obtido de `/auth/me`) |
| `CHURN_DATA` | Permanece mock até existir endpoint analítico |

### 4.6. Variável de ambiente
Adicionar `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
Consumida em `api/client.js` via `import.meta.env.VITE_API_BASE_URL`.

---

## 5. Mapeamento Frontend → Backend

| Ação na UI | Chamada Frontend | Endpoint Backend | Chamada interna ao Core Auth |
|---|---|---|---|
| Login | `api.auth.login()` | `POST /api/v1/auth/login` | `POST /v1/auth/login` |
| Carregar perfil | `api.auth.me()` | `GET /api/v1/auth/me` | `GET /v1/auth/me` |
| Listar tickets | `api.tickets.list()` | `GET /api/v1/tickets` | `GET /v1/auth/me` (validação) |
| Criar ticket | `api.tickets.create()` | `POST /api/v1/tickets` | `GET /v1/auth/me` (validação) |
| Atualizar ticket | `api.tickets.update(id)` | `PATCH /api/v1/tickets/{id}` | idem |
| Enviar mensagem | `api.messages.create()` | `POST /api/v1/messages` | idem |
| Status SLA | `api.sla.status(id)` | `GET /api/v1/sla/status/{id}` | idem |
| Listar KB | `api.knowledgeBase.list()` | `GET /api/v1/knowledge-base` | — (pública) |

---

## 6. Tratamento de Erros

Backend retornará erros HTTP padronizados; o frontend deve mapear códigos para mensagens amigáveis:

| HTTP | Cenário | Comportamento Frontend |
|---|---|---|
| `401` | Token ausente/expirado | Tenta refresh; se falhar, redireciona p/ login |
| `403` | Sem permissão (`role`/`perm`) | Exibe banner "Acesso negado" |
| `404` | Recurso não encontrado | Exibe estado vazio |
| `422` | Erro de validação Pydantic | Destaca campos no formulário |
| `503` | Core Auth ou DB indisponível | Banner "Serviço temporariamente indisponível" |

---

## 7. Segurança

- **Tokens em `localStorage`**: aceitável para o protótipo; planejar migração para cookies `HttpOnly` em produção.
- **HTTPS obrigatório em produção** (ambos frontend e backend).
- **CORS restrito** ao domínio do frontend.
- Backend **nunca loga tokens** nem `password`.
- Validação de input via Pydantic em todas as rotas.
- `register` no frontend exige confirmação de senha + checagem de força mínima.

---

## 8. Ordem de Implementação (Sprints)

### ✅ Sprint 0 — Integração Fiscal Finance (concluído)
1. ✅ `providers/fiscal/` implementado (`FiscalFinanceClient`, endpoints, models).
2. ✅ `modules/integration/` com rotas `/integration/health`, `/fiscal/products/{sku}`, `/fiscal/stock/{sku}`, `/fiscal/cashflow`, `/fiscal/history/{sku}`.
3. ✅ Frontend: `buscarResumoFinanceiro()` e `buscarHistoricoFiscal(sku)` chamando API real com fallback offline.
4. ✅ Frontend: `TicketFiscalPanel` exibindo dados do Fiscal Finance.
5. ✅ `docker-compose.yml`: entrypoint do serviço `migration` corrigido — API agora sobe automaticamente.

### Sprint 1 — Fundação de Auth (próximo)
> `providers/auth/` já implementado — `AuthClient`, endpoints e models estão prontos.
1. Criar módulo `backend/app/modules/auth/` (schema, service, controller, routes, **dependencies**).
2. Adicionar CORS e `frontend_url` / `auth_cache_ttl_seconds` nas settings.
3. Criar `frontend/src/api/client.js` + `auth.js` + `AuthContext`.
4. Conectar a tela de `Login` (UI já pronta) ao `api.auth.login(email, password)`.
5. Validar fluxo login → `/auth/me` → logout.

### Sprint 2 — Proteção das Rotas Existentes
1. Adicionar `Depends(get_current_user)` em todas as rotas de `tickets`, `ticket_messages`, `sla`.
2. Remover campos de identidade dos schemas de entrada.
3. Aplicar filtros por papel (ex: usuário só vê seus tickets).
4. Atualizar testes (`pytest`) com fixture de token mock.

### Sprint 3 — Integração das Telas
1. Substituir `TICKETS_INIT` por `api.tickets.list()` nas views.
2. Substituir `KB_INIT` por `api.knowledgeBase.list()`.
3. Conectar `Mensagens` ao `POST /messages` e `GET /messages?ticket_id=`.
4. Implementar refresh token automático.

### Sprint 4 — Refinos & Observabilidade
1. Loading states e skeletons em todas as views.
2. Toast/banner de erro global.
3. Logging estruturado no backend (request_id + user_id).
4. Cache de `get_current_user` (TTL 60s) para reduzir chamadas ao Core Auth.

---

## 9. Testes

### Backend
- **Unit**: mockar `AuthClient` com `respx` ou `httpx.MockTransport`.
- **Integração**: usar fixture que injeta um `UserProfile` falso em `get_current_user` via dependency override do FastAPI.

```python
# tests/conftest.py
@pytest.fixture
def authed_client(client):
    fake_user = UserProfile(id="u-1", name="Test", email="t@t.com", roles=["agent"], perms=[])
    app.dependency_overrides[get_current_user] = lambda: fake_user
    yield client
    app.dependency_overrides.clear()
```

### Frontend
- Mock do `api/client.js` em testes de componente.
- Teste de fluxo login → carregamento de tickets com MSW (Mock Service Worker) — opcional.

---

## 10. Checklist de Entrega

**Infraestrutura & Integração Fiscal**
- [x] `providers/auth/` implementado (`AuthClient`, endpoints, models).
- [x] `providers/fiscal/` implementado (`FiscalFinanceClient`, endpoints, models).
- [x] Módulo `integration/` com rotas do Fiscal Finance.
- [x] `docker-compose.yml` — serviço `migration` corrigido (não bloqueia mais o `api`).
- [x] Frontend — integração Fiscal Finance com fallback offline.
- [x] Documentação `backend-architecture.md` e `frontend-architecture.md` atualizadas.

**Sprint 1 — Auth**
- [ ] Módulo `auth` criado no backend com proxy completo para Core Auth.
- [ ] Dependência `get_current_user` criada em `dependencies.py`.
- [ ] CORS configurado (`main.py` + `frontend_url` nas settings).
- [ ] `frontend/src/api/client.js` + `auth.js` + `AuthContext` criados.
- [ ] Login real funcional contra Core Auth (UI já pronta).
- [ ] Fluxo login → `/auth/me` → logout validado end-to-end.

**Sprint 2 — Proteção de Rotas**
- [ ] `Depends(get_current_user)` aplicado em todas as rotas protegidas.
- [ ] Schemas de entrada limpos (sem `user_id`/`author_id` vindo do cliente).
- [ ] Filtros por papel aplicados (usuário só vê seus tickets).
- [ ] Testes do backend atualizados com fixture de auth.

**Sprint 3 — Integração das Telas**
- [ ] Mocks `TICKETS_INIT`, `KB_INIT`, `USERS_DB` removidos.
- [ ] Frontend extraído em `api/`, `context/`, `hooks/`, `components/`.
- [ ] Refresh automático implementado.

**Sprint 4 — Refinos**
- [ ] Loading states e skeletons.
- [ ] Toast/banner de erro global.
- [ ] Logging estruturado no backend.
- [ ] `.env.example` atualizado em backend e frontend.

---

## 11. Referências
- [docs/API_FOR_OTHER_MODULES.md](API_FOR_OTHER_MODULES.md) — contrato da API do Core Auth
- [docs/backend-architecture.md](backend-architecture.md) — arquitetura atual do backend
- [docs/frontend-architecture.md](frontend-architecture.md) — arquitetura atual do frontend
- [backend/providers/auth/client.py](../backend/providers/auth/client.py) — cliente HTTP já implementado
- [backend/providers/auth/endpoints.py](../backend/providers/auth/endpoints.py) — endpoints do Core Auth
