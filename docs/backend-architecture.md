# 🏗️ Arquitetura do Backend — Service Desk

> Documentação técnica da estrutura, bibliotecas, banco de dados e funcionamento do backend da aplicação Service Desk.

---

## 📦 Stack & Bibliotecas

| Biblioteca | Versão | Função |
|---|---|---|
| **FastAPI** | 0.135.2 | Framework web principal (API REST) |
| **Uvicorn** | 0.30.6 | Servidor ASGI para rodar a aplicação |
| **SQLAlchemy** | 2.0.48 | ORM para mapeamento e acesso ao banco de dados |
| **psycopg2-binary** | 2.9.9 | Driver de conexão com PostgreSQL |
| **Alembic** | 1.13.3 | Ferramenta de migrations do banco de dados |
| **python-dotenv** | 1.0.1 | Carregamento de variáveis de ambiente via `.env` |
| **pydantic-settings** | 2.5.2 | Gerenciamento de configurações tipadas com Pydantic |
| **pytest** | 8.3.3 | Framework de testes automatizados |
| **httpx** | 0.27.2 | Cliente HTTP assíncrono usado nos testes de integração |

---

## 🗄️ Banco de Dados

- **SGBD:** PostgreSQL
- **Driver:** psycopg2 (`postgresql+psycopg2://`)
- **ORM:** SQLAlchemy 2.x (modo moderno com `Mapped` / `mapped_column`)
- **Migrations:** Alembic

### Tabelas

#### `tickets`
Principal entidade da aplicação. Representa um chamado de suporte.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `CHAR(36)` | UUID (PK) |
| `title` | `VARCHAR(255)` | Título do chamado |
| `description` | `TEXT` | Descrição detalhada |
| `status` | `ENUM` | `pending`, `in_process`, `done`, `canceled` |
| `priority` | `ENUM` | `low`, `normal`, `high`, `urgent` |
| `user_id` | `CHAR(36)` | ID do usuário que abriu o chamado |
| `client_id` | `CHAR(36)` | ID do cliente relacionado |
| `assigned_to` | `CHAR(36)` | ID do atendente responsável |
| `updated_by` | `CHAR(36)` | ID de quem fez a última atualização |
| `category` | `VARCHAR(100)` | Categoria do chamado |
| `closed_at` | `TIMESTAMP` | Data/hora de fechamento |
| `created_at` | `TIMESTAMP` | Data/hora de criação |
| `updated_at` | `TIMESTAMP` | Data/hora da última atualização |

#### `ticket_messages`
Mensagens vinculadas a um ticket (histórico de atendimento).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `CHAR(36)` | UUID (PK) |
| `ticket_id` | `CHAR(36)` | FK → `tickets.id` (CASCADE DELETE) |
| `author_id` | `CHAR(36)` | ID de quem enviou a mensagem |
| `message` | `TEXT` | Conteúdo da mensagem |
| `is_internal` | `BOOLEAN` | Se é uma nota interna (não visível ao cliente) |
| `created_at` | `TIMESTAMP` | Data/hora de criação |
| `updated_at` | `TIMESTAMP` | Data/hora da última atualização |

---

## ⚙️ Configuração

As configurações são carregadas via **pydantic-settings** a partir de um arquivo `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
APP_ENV=development
APP_DEBUG=false
APP_NAME=service-desk
API_PREFIX=/api/v1

# Integrações externas
CORE_ENGINE_URL=...
FISCAL_FINANCE_URL=...
FISC_API_KEY=...
```

A URL é fornecida diretamente via `DATABASE_URL`. O `database.py` normaliza automaticamente `postgresql://` para `postgresql+psycopg2://` antes de criar a engine.

---

## 🗂️ Estrutura de Pastas

```
backend/
├── alembic/                   # Migrations do banco de dados
│   ├── env.py                 # Configuração do Alembic
│   ├── script.py.mako         # Template de migration
│   └── versions/
│       └── 0001_initial_schema.py  # Migration inicial (tickets + ticket_messages)
│
├── app/
│   ├── main.py                # Ponto de entrada — cria a instância FastAPI
│   ├── config/
│   │   ├── config.py          # Settings (pydantic-settings + .env)
│   │   └── database.py        # Engine, SessionLocal, Base, get_session()
│   │
│   └── modules/               # Módulos de domínio (feature-based)
│       ├── tickets/           # Módulo de Tickets
│       ├── ticket_messages/   # Módulo de Mensagens de Tickets
│       ├── sla/               # Módulo de SLA
│       └── knowledge_base/    # Módulo de Base de Conhecimento
│
├── tests/                     # Testes automatizados (pytest + httpx)
├── Dockerfile
├── requirements.txt
└── alembic.ini
```

---

## 🧩 Módulos

Cada módulo segue a mesma arquitetura em camadas:

```
módulo/
├── model.py        # Modelo SQLAlchemy (tabela no banco)
├── schema.py       # Schemas Pydantic (request/response)
├── repository.py   # Acesso direto ao banco (queries SQL via ORM)
├── service.py      # Regras de negócio
├── controller.py   # Orquestra service + repository, trata erros HTTP
└── routes.py       # Define os endpoints FastAPI (APIRouter)
```

### 🎫 tickets
CRUD completo de chamados de suporte.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/tickets` | Lista tickets (paginado) |
| `GET` | `/tickets/{id}` | Busca ticket por ID |
| `POST` | `/tickets` | Cria novo ticket |
| `PATCH` | `/tickets/{id}` | Atualiza ticket |

### 💬 ticket_messages
Mensagens associadas a um ticket.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/messages?ticket_id=...` | Lista mensagens de um ticket |
| `POST` | `/messages` | Cria nova mensagem |
| `DELETE` | `/messages/{id}` | Remove mensagem |

### 📊 sla
Cálculo e monitoramento de SLA por prioridade.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/sla/status/{ticket_id}` | Status de SLA do ticket |
| `GET` | `/sla/violations/{ticket_id}` | Violações de SLA de um ticket |
| `GET` | `/sla/summary/priority/{priority}` | Resumo de conformidade de SLA por prioridade |

**Políticas de SLA por prioridade:**

| Prioridade | 1ª Resposta | Resolução |
|---|---|---|
| `low` | 72h | 92h |
| `normal` | 24h | 48h |
| `high` | 2h | 24h |
| `urgent` | 1h | 4h |

Estados possíveis de SLA: `on_track`, `at_risk`, `violated`, `paused`.

### 📚 knowledge_base
Base de conhecimento com artigos de suporte.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/knowledge-base` | Lista artigos (paginado) |

---

## 🔄 Fluxo de uma Requisição

```
Cliente HTTP
    │
    ▼
FastAPI Router (routes.py)
    │  valida schema Pydantic
    ▼
Controller (controller.py)
    │  orquestra lógica, lança HTTPException
    ▼
Service (service.py)
    │  regras de negócio
    ▼
Repository (repository.py)
    │  queries via SQLAlchemy ORM
    ▼
Banco de Dados PostgreSQL
```

---

## 🧪 Testes

Os testes ficam em `backend/tests/` e utilizam **pytest** + **httpx** (TestClient do FastAPI).

| Arquivo | Cobertura |
|---|---|
| `conftest.py` | Fixtures compartilhadas (sessão de teste, app) |
| `test_tickets_repository.py` | Testes do repositório de tickets |
| `test_tickets_service.py` | Testes das regras de negócio de tickets |
| `test_tickets_controller.py` | Testes do controller de tickets |
| `test_tickets_routes.py` | Testes dos endpoints HTTP de tickets |
| `test_tickets_integration.py` | Testes de integração end-to-end |
| `test_messages_repository.py` | Testes do repositório de mensagens |
| `test_messages_routes.py` | Testes dos endpoints HTTP de mensagens |

Para rodar os testes:
```bash
cd backend
pytest tests/ -v
```

---

## 🐳 Docker

O backend possui um `Dockerfile` próprio e é orquestrado via `docker-compose.yml` na raiz do projeto. O serviço expõe a API via Uvicorn e se conecta ao PostgreSQL configurado via variáveis de ambiente.

### Health Check
```
GET /health
```
Retorna `{"status": "ok", "db": "connected"}` se o banco estiver acessível.

---

## 🔒 Segurança & Boas Práticas

- IDs são **UUIDs v4** (`CHAR(36)`) gerados automaticamente no Python.
- A documentação interativa (`/docs`, `/redoc`) só é exposta quando `APP_DEBUG=true`.
- ENUMs de status e prioridade são **tipos nativos do PostgreSQL** (`ticketstatus`, `ticketpriority`), criados/removidos explicitamente nas migrations.
- O campo `updated_at` é atualizado pelo ORM via `onupdate=utc_now` (PostgreSQL não suporta `ON UPDATE CURRENT_TIMESTAMP`).
- O pool de conexões usa `pool_pre_ping=True` e `pool_recycle=3600` para evitar conexões stale.
- Deleção de mensagens respeita **CASCADE DELETE** a partir do ticket pai.
