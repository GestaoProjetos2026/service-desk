# Instruções de Execução — Service Desk

> Esta página cobre **dois caminhos**: rodar a aplicação **sem Docker** (Backend FastAPI + Frontend React rodando direto no host) ou **com Docker Compose** (tudo orquestrado).
>
> A stack real é **PostgreSQL 16** + **FastAPI** + **React (Vite)**.

---

## 🚀 Rodando SEM Docker (modo desenvolvimento)

Você precisa de **três processos** rodando simultaneamente: PostgreSQL, Backend (FastAPI) e Frontend (Vite). Use **três terminais separados**.

### Pré-requisitos

- **Python 3.11+** ([download](https://www.python.org/downloads/))
- **Node.js 18+** e **npm** ([download](https://nodejs.org/))
- **PostgreSQL 16** rodando localmente (ou em container individual — veja [opção alternativa](#opção-alternativa-postgresql-em-container-isolado))

---

### 1) Banco de dados PostgreSQL

Crie o banco e o usuário (no `psql` ou pgAdmin):

```sql
CREATE USER user_service_desk WITH PASSWORD 'SenhaService123!';
CREATE DATABASE infra_banco OWNER user_service_desk;
GRANT ALL PRIVILEGES ON DATABASE infra_banco TO user_service_desk;
```

#### Opção alternativa: PostgreSQL em container isolado

Se preferir não instalar o Postgres no host:

```powershell
docker run -d --name service-desk-postgres `
  -e POSTGRES_DB=infra_banco `
  -e POSTGRES_USER=user_service_desk `
  -e POSTGRES_PASSWORD=SenhaService123! `
  -p 5432:5432 `
  postgres:16-alpine
```

---

### 2) Backend (FastAPI)

**Terminal 1** — na pasta `backend/`:

```powershell
cd backend

# 2.1 Criar e ativar virtualenv
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate   # Linux/Mac

# 2.2 Instalar dependências
python -m pip install -U pip
python -m pip install -r requirements.txt
```

**Criar arquivo `backend/.env`** (na pasta `backend/`):

```env
DATABASE_URL=postgresql://user_service_desk:SenhaService123!@localhost:5432/infra_banco
APP_ENV=development
APP_DEBUG=true
APP_NAME=service-desk
API_PREFIX=/api/v1

# Integrações externas (preencha conforme seu ambiente)
CORE_ENGINE_URL=http://api.core-engine.40.82.176.176.nip.io
FISCAL_FINANCE_URL=http://localhost:5000
FISC_API_KEY=FISC-PUBLIC-2026-SQUAD4
INTEGRATION_TIMEOUT=5.0
```

**Aplicar migrations (Alembic)**:

```powershell
python -m alembic upgrade head
```

**Iniciar a API**:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verifique:
- Health: <http://127.0.0.1:8000/health> → `{"status":"ok","db":"connected"}`
- Swagger: <http://127.0.0.1:8000/docs> (disponível porque `APP_DEBUG=true`)

---

### 3) Frontend (React + Vite)

**Terminal 2** — na pasta `frontend/`:

```powershell
cd frontend

# 3.1 Instalar dependências (primeira vez)
npm install

# 3.2 Subir o Vite dev server (HMR ativo)
npm run dev
```

Acesse: <http://localhost:5173>

> 💡 O backend precisa estar rodando na porta `8000` para que as chamadas do frontend (`/api/v1/integration/fiscal/cashflow` etc.) funcionem. Caso queira mudar a URL da API, crie um arquivo `frontend/.env` com `VITE_API_BASE_URL=http://localhost:8000/api/v1`.

---

### 4) Comandos úteis (sem Docker)

| Tarefa | Comando |
|---|---|
| Status do banco (qual revisão Alembic está aplicada) | `python -m alembic current` |
| Desfazer última migration | `python -m alembic downgrade -1` |
| Gerar nova migration (autogenerate) | `python -m alembic revision --autogenerate -m "descricao"` |
| Rodar testes do backend | `pytest tests/ -v` |
| Build de produção do frontend | `npm run build` (gera `frontend/dist/`) |

### 5) Troubleshooting (sem Docker)

- **`ModuleNotFoundError: app`** → certifique-se de estar dentro de `backend/` ao rodar `uvicorn app.main:app`.
- **`connection refused` no PostgreSQL** → confirme que o Postgres está rodando (`docker ps` ou `Get-Service postgresql*`) e que `DATABASE_URL` aponta para `localhost:5432`.
- **`python` não reconhecido** → use `py` no Windows, ou ative a virtualenv.
- **CORS no navegador** → quando o módulo `auth/` e o middleware CORS forem adicionados (ver [integration-plan.md](integration-plan.md)), o backend liberará `http://localhost:5173`. Até lá, as chamadas a `/api/v1/...` no `App.jsx` funcionam pois o Vite dev server proxia/relaxa por padrão em dev.
- **Porta 8000 ou 5173 ocupada** → mude com `--port 8001` (uvicorn) ou `npm run dev -- --port 5174` (vite).

---

## 🐳 Rodando COM Docker

### Pré-requisitos

- **Docker Desktop**: [instale aqui](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (já vem com Docker Desktop)

### Configuração

1. Crie o arquivo `backend/.env` (use o **host do serviço** no lugar de `localhost`):

   ```env
   DATABASE_URL=postgresql://user_service_desk:SenhaService123!@postgres:5432/infra_banco
   APP_ENV=development
   APP_DEBUG=true
   APP_NAME=service-desk
   API_PREFIX=/api/v1
   CORE_ENGINE_URL=http://api.core-engine.40.82.176.176.nip.io
   FISCAL_FINANCE_URL=http://host.docker.internal:5000
   FISC_API_KEY=FISC-PUBLIC-2026-SQUAD4
   INTEGRATION_TIMEOUT=5.0
   ```

   > O `docker-compose.yml` já sobrescreve `DATABASE_URL` para apontar ao serviço `postgres`.

2. (Opcional) Variáveis na raiz (`.env`) para customizar nome/senha usados pelo Compose: `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

### Executar

1. **Build das imagens** (primeira vez ou após mudar dependências):
   ```powershell
   docker-compose build
   ```

2. **Iniciar todos os serviços**:
   ```powershell
   docker-compose up
   ```

   Fluxo orquestrado:
   - `postgres` sobe e aguarda `pg_isready` (health check)
   - `migration` roda `python -m alembic upgrade head` e **encerra com sucesso**
   - `api` inicia (FastAPI + Uvicorn na porta 8000)
   - `frontend` inicia o Nginx servindo o build de produção (porta 80)

3. **Acessos**:
   - Frontend: <http://localhost>
   - API health: <http://localhost:8000/health>
   - Swagger: <http://localhost:8000/docs>

### Logs

```powershell
docker-compose logs -f               # todos
docker-compose logs -f api           # apenas backend
docker-compose logs -f frontend      # apenas frontend
docker-compose logs migration        # migrations (execução única)
docker-compose logs -f postgres      # banco
```

### Parar

```powershell
docker-compose stop                  # para sem remover
docker-compose down                  # remove containers (mantém volume do banco)
docker-compose down -v               # remove TUDO, inclusive dados do PostgreSQL
```

### Operações úteis

- **Gerar nova migration**:
   ```powershell
   docker-compose run --rm migration python -m alembic revision --autogenerate -m "descricao"
   ```

- **Shell no container da API**:
   ```powershell
   docker-compose exec api sh
   ```

- **Conectar ao Postgres**:
   ```powershell
   docker-compose exec postgres psql -U user_service_desk -d infra_banco
   ```

### Arquitetura do Compose

| Serviço | Porta | Depende de | Função |
|---|---|---|---|
| `postgres` | 5432 | — | PostgreSQL 16 com volume persistente `postgres_data` |
| `migration` | — | `postgres` (healthy) | Roda `alembic upgrade head` e encerra |
| `api` | 8000 | `migration` (completed) | FastAPI + Uvicorn |
| `frontend` | 80 | — | Build Vite servido por Nginx |

> **Importante:** o serviço `migration` usa `entrypoint: ["python", "-m", "alembic", "upgrade", "head"]` para sobrescrever o `ENTRYPOINT` da imagem (que também subiria o Uvicorn). Sem isso, o container nunca terminaria e o `api` ficaria esperando para sempre.

### Troubleshooting

- **`api` não sobe** — confira `docker-compose logs migration`: precisa ter saído com código 0.
- **Porta 5432 / 8000 / 80 já em uso** — ajuste o mapeamento em `docker-compose.yml` (ex.: `"5433:5432"`).
- **Frontend chama API mas falha** — o frontend serve em `:80` e tenta `/api/v1/...`. Para apontar para outra origem, defina `VITE_API_BASE_URL=http://localhost:8000/api/v1` no momento do build do frontend.
- **Resetar tudo do zero**:
   ```powershell
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```

