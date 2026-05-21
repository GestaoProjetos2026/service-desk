# Instruções básicas

## 1) Preparar ambiente

1. Abra terminal no projeto:
   - `cd .\Service-Desk`
2. Crie e ative virtualenv (Windows PowerShell):
   - `python -m venv .venv`
   - `.venv\Scripts\Activate.ps1`
3. Instale dependências:
   - `py -m pip install -U pip`
   - `py -m pip install -r requirements.txt`

## 2) Configurar banco de dados

- Verifique se existe `.env` na raiz. Se não existir, crie copiando `.env.example`:
  - `copy .env.example .env` (PowerShell)
  - `cp .env.example .env` (Linux/Mac)
- No `.env`, preencha as variáveis:
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_NAME=service_desk`
  - `DB_USER=user`
  - `DB_PASSWORD=pass`
- Não é necessário editar `app/config/config.py`, ele lê `.env` automaticamente.

## 3) Rodar Alembic (sincronizar DB)

1. Gerar migration (nova mudança de modelo):
   - `python -m alembic revision --autogenerate -m "Create tables"`
2. Aplicar migration:
   - `python -m alembic upgrade head`

⚠️ Observação: se `python -m alembic` não funcionar, verifique se o ambiente está ativado e se `alembic` está instalado (`pip install alembic`).

## 4) Iniciar aplicação

1. Executar main via uvicorn (preferido):
     - `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

2. Executar diretamente via módulo `main.py` (só para teste rápido):
   - `python -m app.main`

3. Verifique saúde:
   - `http://127.0.0.1:8000/health`

4. Documentação Swagger (debug):
   - `http://127.0.0.1:8000/docs`

5. Se não tiver instalado `uvicorn`, instale com:
   - `pip install uvicorn[standard]` ou
   - `.venv\Scripts\python.exe -m pip install uvicorn[standard]`

## 5) Dicas rápidas

- Para ver status do banco:
  - `python -m alembic current`
- Para desfazer migration:
  - `python -m alembic downgrade -1`
- Caso o terminal não reconheça o comando python:
  - `Troque por "py" somente`

## 6) Rodando com Docker

### Pré-requisitos

- **Docker**: [instale aqui](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: geralmente vem com Docker Desktop

### Configuração

1. Copie `.env.example` para `.env` (se não existir):
   - `copy .env.example .env` (PowerShell)
   - `cp .env.example .env` (Linux/Mac)

2. (Opcional) Customize as variáveis em `.env`:
   - `DB_HOST=mysql` (nome do serviço Docker, não localhost)
   - `DB_USER`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`, etc.

### Executar com Docker Compose

1. **Build das imagens** (primeira vez ou após mudança de dependências):
   ```powershell
   docker-compose build
   ```

2. **Iniciar todos os serviços** (MySQL → Migration → API):
   ```powershell
   docker-compose up
   ```
   - MySQL inicia primeiro e aguarda estar saudável
   - Migration roda automaticamente (Alembic `upgrade head`)
   - API inicia após migrations completarem

3. **Verificar saúde da API**:
   ```
   http://localhost:8000/health
   ```
   - Esperado: `{"status":"ok","db":"connected"}`

4. **Acessar documentação Swagger**:
   ```
   http://localhost:8000/docs
   ```

### Logs e Debugging

- **Ver todos os logs em tempo real**:
  ```powershell
  docker-compose logs -f
  ```

- **Ver logs apenas da migração**:
  ```powershell
  docker-compose logs migration
  ```

- **Ver logs apenas da API**:
  ```powershell
  docker-compose logs api
  ```

- **Ver logs apenas do MySQL**:
  ```powershell
  docker-compose logs mysql
  ```

### Parar os containers

```powershell
# Parar (containers permanecem)
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar, remover containers e volumes (remove dados do banco)
docker-compose down -v
```

### Operações úteis

- **Rodar uma migração específica**:
  ```powershell
  docker-compose run migration python -m alembic upgrade head
  ```

- **Gerar uma nova migração**:
  ```powershell
  docker-compose run migration python -m alembic revision --autogenerate -m "Sua descrição"
  ```

- **Executar comandos no container da API**:
  ```powershell
  docker-compose exec api bash
  ```

- **Executar comandos no MySQL**:
  ```powershell
  docker-compose exec mysql mysql -u service_user -p service_desk
  ```

### Arquitetura

O `docker-compose.yml` define 3 serviços coordenados:

1. **mysql** (porta 3306)
   - Aguarda estar saudável antes do próximo serviço
   - Dados persistidos em volume `mysql_data`

2. **migration** (Alembic)
   - Depende de: mysql (service_healthy)
   - Roda `python -m alembic upgrade head`
   - Encerra após conclusão

3. **api** (porta 8000)
   - Depende de: migration (service_completed_successfully)
   - FastAPI com Uvicorn
   - Restart automático se falhar

### Troubleshooting

- **"service_completed_successfully" error**: Certifique-se de que o container `migration` completou com sucesso. Verifique logs com `docker-compose logs migration`

- **Porta 3306 já em uso**: Mude em `docker-compose.yml` a porta de `3306:3306` para `3307:3306`

- **Conexão recusada no banco**: Aguarde alguns segundos, o healthcheck MySQL pode levar um tempo

- **Remover tudo e começar do zero**:
  ```powershell
  docker-compose down -v
  docker-compose build --no-cache
  docker-compose up
  ```

