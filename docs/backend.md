Projeto Service-Desk — Arquitetura backend
=========================================

Visão geral
-----------

O backend é organizado em camadas claras: configuração, banco de dados, módulos (cada domínio em sua pasta), modelos/ORM, esquemas (validação/serialização), repositórios (acesso a dados), serviços (regras de negócio), controllers (adaptação para HTTP) e rotas (endpoints FastAPI). Migrações ficam em `alembic/`.

Principais pastas e arquivos
----------------------------

- `app/main.py`: cria a aplicação FastAPI, registra rotas e define endpoints gerais (ex: `/health`). Ponto de entrada do app.
- `app/config/config.py`: configurações da aplicação (variáveis de ambiente, settings).
- `app/config/database.py`: cria o `engine`, a `Base` declarativa do SQLAlchemy 2.0 e fornece a dependência `get_session()` usada nas rotas para obter uma sessão por requisição.
- `alembic/`: configura migrações do banco de dados (versions, env.py, script template).

Módulo de tickets (app/modules/tickets)
--------------------------------------

Estrutura e responsabilidades dos arquivos dentro do módulo:

- `model.py`
  - Define as entidades persistidas através do ORM do `SQLAlchemy 2.0` (`Ticket`, `TicketMessage`).
  - Contém enums (`TicketStatus`, `TicketPriority`) e colunas com `Field` (p.ex. `created_at`, `updated_at`, `closed_at`).

- `schema.py`
  - Schemas Pydantic para requisições e respostas:
    - `TicketCreate`, `TicketUpdate`, `TicketMessageCreate` (validação de input)
    - `TicketResponse`, `TicketMessageResponse`, `TicketListResponse` (serialização de saída)
  - `model_config = {"from_attributes": True}` permite criar respostas a partir de objetos ORM.

- `repository.py`
  - Responsável por toda comunicação direta com o banco (CRUD usando `sqlalchemy.orm.Session`).
  - Ex.: `create()`, `get_by_id()`, `list_all()`, `update()`, `delete()`.
  - Deve conter apenas operações de persistência e consultas (sem lógica de negócio complexa).

- `service.py` (camada de serviço)
  - Encapsula regras de negócio e orquestra chamadas aos repositórios.
  - Ex.: `create_ticket()`, `get_ticket()`, `list_tickets()`, `update_ticket()`.
  - Mantém a lógica reutilizável e testável fora de controllers/rotas.

- `controller.py` (adaptação HTTP)
  - Usa o serviço para executar operações e lança erros HTTP apropriados (por exemplo `HTTPException(404)` quando não encontrado).
  - Facilita o uso nas rotas através de dependências (recebe `session` e instancia o `TicketService`).

- `routes.py`
  - Define o `APIRouter` do FastAPI com endpoints REST do recurso `tickets`.
  - Exemplo de rotas implementadas:
    - `GET /tickets` → lista paginada (responde com `TicketListResponse`)
    - `GET /tickets/{ticket_id}` → obtém um ticket (`TicketResponse`)
    - `POST /tickets` → cria ticket (status 201)
    - `PATCH /tickets/{ticket_id}` → atualiza parcialmente um ticket
  - As rotas usam `Depends(get_session)` para obter a sessão e injetam o `TicketController`.

Fluxo de uma requisição (ex.: criar ticket)
------------------------------------------

1. O cliente faz `POST /tickets` com payload válido.
2. A rota valida o body contra `TicketCreate` (Pydantic).
3. A rota injeta a dependência `get_session()` e instancia `TicketController`.
4. `TicketController.create_ticket()` chama `TicketService.create_ticket()`.
5. `TicketService` delega para `TicketRepository.create()` para persistir o ticket.
6. O repositório usa a `Session` do SQLAlchemy para adicionar/commitar/refresh e retorna o objeto `Ticket`.
7. A resposta é serializada usando `TicketResponse` (graças a `from_attributes`).

Boas práticas adotadas
----------------------

- Separação de responsabilidades: acesso a dados (repository) vs regras de negócio (service) vs adaptação HTTP (controller) vs definição de rotas.
- Schemas Pydantic para validação e segurança dos dados de entrada/saída.
- Uso de dependências FastAPI (`get_session`) para ciclo de vida da sessão DB por requisição.
- Migrations gerenciadas por Alembic (diretório `alembic/versions`).

Onde modificar para adicionar novas features
------------------------------------------

- Novos campos persistidos: atualizar `model.py` + gerar migração Alembic.
- Regras de negócio: implementar em `service.py`.
- Requisições/respostas: atualizar/adiar novos `schema.py`.
- Endpoints: adicionar em `routes.py` e, se necessário, adaptar o `controller.py`.

Observações finais
------------------

Esta organização facilita testes unitários (mockar `TicketRepository` ou `Session`), manutenção e reuso de lógica de negócio entre rotas, CLI ou workers. Para registrar o router no app principal verifique `app/main.py` e adicione `app.include_router(...)` importando `router` de `app.modules.tickets.routes`.
