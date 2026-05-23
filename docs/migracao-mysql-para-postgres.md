# 🐘 Migração de MySQL → PostgreSQL

> Guia técnico passo a passo para migrar o backend do **Service Desk** do MySQL para o PostgreSQL, mantendo todos os módulos funcionando normalmente.
> Escopo: **apenas ORM, driver, configuração e migrations**. A arquitetura em camadas (routes / controller / service / repository) **não muda**.

---

## 🎯 Resumo da Migração

| Item | Antes (MySQL) | Depois (PostgreSQL) |
|---|---|---|
| Driver | `pymysql` | `psycopg2-binary` (ou `psycopg[binary]` v3) |
| Dialeto SQLAlchemy | `mysql+pymysql` | `postgresql+psycopg2` |
| Porta padrão | `3306` | `5432` |
| Tipo de UUID | `CHAR(36)` | `UUID` nativo (`postgresql.UUID`) |
| Tipo Boolean | `BOOLEAN` (TINYINT) | `BOOLEAN` nativo |
| Enum | `ENUM(...)` inline | Tipo `ENUM` separado (criado/dropado explicitamente) |
| Auto-update timestamp | `ON UPDATE CURRENT_TIMESTAMP` | **Não existe** — usar `onupdate=` no ORM ou trigger |
| Driver dep extra | `cryptography` (TLS MySQL) | ❌ não necessário |

---

## 1️⃣ `requirements.txt`

**Remover:**
```
pymysql==1.1.1
cryptography==43.0.1
```

**Adicionar:**
```
psycopg2-binary==2.9.9
```

> 💡 Alternativa moderna: `psycopg[binary]==3.2.3` (psycopg v3). Se usar, o dialeto vira `postgresql+psycopg`.

Arquivo final esperado:
```
fastapi==0.135.2
uvicorn[standard]==0.30.6
sqlalchemy==2.0.48
psycopg2-binary==2.9.9
alembic==1.13.3
python-dotenv==1.0.1
pydantic-settings==2.5.2
pytest==8.3.3
httpx==0.27.2
```

---

## 2️⃣ `app/config/config.py`

Atualizar a porta padrão e a URL de conexão:

```python
class Settings(BaseSettings):
    # ...
    db_host: str
    db_port: int = 5432          # ← era 3306
    db_name: str
    db_user: str
    db_password: str

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )
```

> Se usar psycopg v3, troque o dialeto para `postgresql+psycopg`.

---

## 3️⃣ `app/config/database.py`

Nenhuma mudança estrutural — o SQLAlchemy abstrai o dialeto. O `create_engine(settings.database_url, ...)` já vai funcionar com Postgres.

Opcional (recomendado): ajuste o `pool_size` para cargas maiores:
```python
engine = create_engine(
    settings.database_url,
    echo=settings.app_debug,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
)
```

---

## 4️⃣ `.env`

Atualizar a porta:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_desk
DB_USER=service_user
DB_PASSWORD=service_pass
```

---

## 5️⃣ Models (`app/modules/*/model.py`)

### 5.1 Tickets — `app/modules/tickets/model.py`

**Antes:**
```python
from sqlalchemy import BOOLEAN, CHAR, Enum as SqlEnum, ForeignKey, String, Text, TIMESTAMP

class Ticket(Base):
    id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=lambda: str(uuid4()))
    # ...
    user_id: Mapped[Optional[str]] = mapped_column(CHAR(36), nullable=True, index=True)
```

**Depois (UUID nativo do Postgres):**
```python
from sqlalchemy import Enum as SqlEnum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import TIMESTAMP, Boolean
from uuid import UUID as PyUUID, uuid4

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        SqlEnum(TicketStatus, name="ticketstatus", values_callable=enum_values),
        default=TicketStatus.pending, nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        SqlEnum(TicketPriority, name="ticketpriority", values_callable=enum_values),
        default=TicketPriority.normal, nullable=False,
    )
    user_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    client_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    assigned_to: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    updated_by: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default=utc_now, onupdate=utc_now, nullable=False,
    )
```

### 5.2 Ticket Messages — `app/modules/ticket_messages/model.py`

```python
from sqlalchemy import ForeignKey, Text, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID
from uuid import UUID as PyUUID, uuid4

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    ticket_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    author_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default=utc_now, onupdate=utc_now, nullable=False,
    )
```

> ⚠️ **Mudança importante:** `BOOLEAN` → `Boolean` (classe SQLAlchemy genérica). No MySQL ele virava `TINYINT(1)`, no Postgres vira `BOOLEAN` nativo.

### 5.3 Alternativa minimalista (sem mexer em UUID)
Se quiser **alteração mínima**, é possível manter `CHAR(36)` e tudo funciona no Postgres. Apenas troque:
- `BOOLEAN` → `Boolean`
- Remova `ON UPDATE CURRENT_TIMESTAMP` das migrations (o `onupdate=utc_now` do ORM já cobre).

Essa é a rota mais segura se você quer **zero alteração em repository/service/controller/schema**.

---

## 6️⃣ Schemas (`app/modules/*/schema.py`)

✅ **Nenhuma alteração obrigatória.**

Os schemas Pydantic já tratam IDs como `UUID` (do `uuid` padrão). Se você migrar para `UUID nativo` no model, o Pydantic continuará serializando como string. Garanta no schema:

```python
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class TicketResponse(BaseModel):
    id: UUID
    # ...
    model_config = ConfigDict(from_attributes=True)
```

---

## 7️⃣ Repository / Service / Controller / Routes

✅ **Nenhuma alteração necessária.**

Toda a lógica usa SQLAlchemy ORM (`session.execute(select(...))`, `session.get(Ticket, id)`, etc.), que é agnóstico ao SGBD.

> ⚠️ Verifique apenas se algum repositório usa **SQL bruto com sintaxe específica do MySQL** (ex.: `LIMIT x, y`, `IFNULL`, crases ``` ` ```). No projeto atual isso **não ocorre**.

---

## 8️⃣ Alembic — Migrations

### 8.1 `alembic/env.py`
✅ Nenhuma alteração — ele lê `settings.database_url` automaticamente.

### 8.2 Migration inicial — `alembic/versions/0001_initial_schema.py`

A migration atual usa sintaxe específica do MySQL. Substitua por:

```python
"""Initial schema - tickets and ticket_messages (PostgreSQL)"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ENUMs precisam ser criados ANTES de serem usados no Postgres
    ticket_status = postgresql.ENUM(
        'pending', 'in_process', 'done', 'canceled',
        name='ticketstatus',
    )
    ticket_priority = postgresql.ENUM(
        'low', 'normal', 'high', 'urgent',
        name='ticketpriority',
    )
    ticket_status.create(op.get_bind(), checkfirst=True)
    ticket_priority.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'tickets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', ticket_status, nullable=False, server_default='pending'),
        sa.Column('priority', ticket_priority, nullable=False, server_default='normal'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('closed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_tickets_user_id', 'tickets', ['user_id'])
    op.create_index('ix_tickets_client_id', 'tickets', ['client_id'])
    op.create_index('ix_tickets_assigned_to', 'tickets', ['assigned_to'])
    op.create_index('ix_tickets_updated_by', 'tickets', ['updated_by'])

    op.create_table(
        'ticket_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('ticket_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE', name='fk_tm_ticket'),
    )
    op.create_index('ix_ticket_messages_ticket_id', 'ticket_messages', ['ticket_id'])
    op.create_index('ix_ticket_messages_author_id', 'ticket_messages', ['author_id'])


def downgrade() -> None:
    op.drop_index('ix_ticket_messages_author_id', table_name='ticket_messages')
    op.drop_index('ix_ticket_messages_ticket_id', table_name='ticket_messages')
    op.drop_table('ticket_messages')
    op.drop_index('ix_tickets_updated_by', table_name='tickets')
    op.drop_index('ix_tickets_assigned_to', table_name='tickets')
    op.drop_index('ix_tickets_client_id', table_name='tickets')
    op.drop_index('ix_tickets_user_id', table_name='tickets')
    op.drop_table('tickets')
    postgresql.ENUM(name='ticketpriority').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='ticketstatus').drop(op.get_bind(), checkfirst=True)
```

> 🔑 **Diferenças críticas em relação à versão MySQL:**
> - ENUMs são tipos de primeira classe no Postgres — precisam ser **criados antes** e **dropados depois** explicitamente.
> - `CHAR(36)` vira `UUID`.
> - Removido `ON UPDATE CURRENT_TIMESTAMP` (não existe no Postgres). O `onupdate=utc_now` no model cuida disso.
> - `server_default=sa.text('0')` para booleano vira `server_default=sa.text('false')`.

### 8.3 (Opcional) Regenerar com autogenerate
Se preferir, apague a migration antiga e gere uma nova:
```bash
# Apague o banco Postgres antes (drop database e create database)
alembic revision --autogenerate -m "initial schema postgres"
alembic upgrade head
```

---

## 9️⃣ `docker-compose.yml`

Substituir o serviço `mysql` por `postgres`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: service-desk-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-service_desk}
      POSTGRES_USER: ${DB_USER:-service_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-service_pass}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-service_user} -d ${DB_NAME:-service_desk}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - service-desk-network

  migration:
    # ...
    environment:
      DB_HOST: postgres        # ← era "mysql"
      DB_PORT: 5432            # ← era 3306
      # ... resto igual
    depends_on:
      postgres:
        condition: service_healthy

  api:
    # ...
    environment:
      DB_HOST: postgres        # ← era "mysql"
      DB_PORT: 5432            # ← era 3306
      # ... resto igual

volumes:
  postgres_data:               # ← era mysql_data
    driver: local
```

---

## 🔟 `backend/Dockerfile`

Se o Dockerfile instala libs de sistema para MySQL, troque por libs de Postgres. Geralmente `psycopg2-binary` já inclui binários, mas se usar `psycopg2` (não-binary):

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*
```

Com `psycopg2-binary` **isso não é necessário**.

---

## 1️⃣1️⃣ Testes (`backend/tests/`)

✅ Nenhuma alteração de código.

Se os testes usam um banco SQLite em memória via fixture, continuam funcionando. Se apontam para o MySQL via `.env.test`, basta trocar a URL para Postgres.

Confirme em `conftest.py` se há alguma config específica.

---

## ✅ Checklist Final

- [ ] `requirements.txt`: remover `pymysql` + `cryptography`, adicionar `psycopg2-binary`
- [ ] `app/config/config.py`: porta padrão `5432` + URL `postgresql+psycopg2://...`
- [ ] `.env`: atualizar `DB_PORT=5432`
- [ ] Models: `BOOLEAN` → `Boolean`; (opcional) `CHAR(36)` → `UUID`
- [ ] Migration `0001_initial_schema.py`: reescrever para Postgres (ENUMs explícitos + UUID + sem `ON UPDATE`)
- [ ] `docker-compose.yml`: substituir serviço `mysql` por `postgres`, volume e healthcheck
- [ ] `Dockerfile`: (se aplicável) ajustar libs de sistema
- [ ] Recriar volume do banco: `docker compose down -v && docker compose up -d`
- [ ] Rodar `alembic upgrade head`
- [ ] Rodar testes: `pytest tests/ -v`
- [ ] Validar `/health` → `{"status":"ok","db":"connected"}`

---

## 🚀 Comandos para Aplicar a Migração

```powershell
# 1. Atualizar dependências
cd backend
pip install -r requirements.txt

# 2. Subir Postgres + aplicar migrations
cd ..
docker compose down -v
docker compose up -d postgres
docker compose run --rm migration

# 3. Subir API
docker compose up -d api

# 4. Validar
curl http://localhost:8000/health
```

---

## 📋 Migração de Dados (caso já tenha dados em produção)

Se já existirem dados em MySQL, use uma das opções:

1. **`pgloader`** — ferramenta dedicada de migração MySQL → Postgres:
   ```bash
   pgloader mysql://user:pass@localhost/service_desk postgresql://user:pass@localhost/service_desk
   ```
2. Exportar via `mysqldump --compatible=postgresql` e ajustar manualmente.
3. Script Python custom usando SQLAlchemy lendo do MySQL e escrevendo no Postgres.

> Para **ambientes de desenvolvimento**, simplesmente rode as migrations do zero — não há necessidade de migrar dados.
