# PRD – Service Desk

**Versão:** 0.3
**Data:** 08/05/2026
**Sprint:** 05 – Mensagens & Deploy
**Squad 4:** Yuri Santos (183775) · Gabriele Silva (220060) · Pedro Nunes (219672) · Sergio Escudeiro (156753) · Arthur Silles (216395)

---

## Status do Sprint 05 — Concluído

| ID       | Tarefa                                              | Status | Responsável      |
|----------|-----------------------------------------------------|--------|------------------|
| SERV-32  | Criar script de deploy GitHub Actions (TP04)        | ✅ Done | Pedro Paulo   |
| SERV-30  | Implementar endpoints de mensagens do ticket        | ✅ Done | Athur Silles   |
| SERV-29  | Corrigir bug da migration do Alembic                | ✅ Done | Gabriele Silva |
| SERV-13  | Configuração do Ambiente de Homologação (Staging)   | ✅ Done | Pedro Paulo  |

---

## 1. Resumo Executivo

- **Objetivo:** entregar um microserviço de Service Desk focado na comunicação cliente-SaaS.
- **Problema:** falta de um backend de tickets leve e documentado para devs consumidores de API.
- **Visão de sucesso:** API de tickets aceita e utilizada por times de desenvolvimento, com documentação clara em `/docs` (Swagger) e coleção Postman disponível.
- **Status MVP:** endpoints CRUD de tickets e mensagens implementados e implantados em staging.
- **Infra:** ambiente de homologação configurado na Azure com deploy automatizado via GitHub Actions.

---

## 2. Metas e Critérios de Sucesso

- **Meta 1 (CONCLUÍDA):** MVP da API disponibilizado com endpoints de criação, leitura, atualização e mensagens de ticket.
- **Meta 2 (CONCLUÍDA):** documentação completa em FastAPI/Swagger disponível em `/docs`.
- **Meta 3 (CONCLUÍDA):** ambiente de staging configurado com pipeline de deploy automático no GitHub Actions.
- **KPI – Tempo de criação de ticket:** <10s.
- **KPI – Taxa de sucesso das requisições:** ≥97%.

---

## 3. Escopo

### Incluído — Fase 1 (MVP Entregue)

- Endpoints CRUD de tickets: `GET /tickets`, `GET /tickets/{id}`, `POST /tickets`, `PATCH /tickets/{id}`.
- Endpoints de mensagens: `GET /messages?ticket_id=`, `POST /messages`, `DELETE /messages/{id}`.
- Endpoint de Knowledge Base: `GET /knowledge-base` (listagem de tickets resolvidos como base de conhecimento).
- Banco de dados MySQL com tabelas `tickets` e `ticket_messages` (relação 1:N via FK com CASCADE).
- Migrações gerenciadas pelo Alembic (migration consolidada `0001_initial_schema`).
- Documentação FastAPI/Swagger em `/docs`.
- Pipeline CI (GitHub Actions) com testes automatizados em MySQL 8.0.
- Pipeline CD com deploy automático na Azure VPS via SSH para staging (branch `develop`) e produção (branch `main`).
- Ambiente de homologação (Staging) configurado na Azure.
- Containerização com Docker e Docker Compose.

### Excluído desta fase

- UI de atendimento (apenas API).
- Regras de SLA automatizadas com cálculo em tempo real (definidas, pendentes de implementação).
- Integração com canais externos (e-mail, chat).
- Análise de churn e métricas avançadas.

---

## 4. Arquitetura e Implementação

### 4.1 Stack Tecnológica

| Camada         | Tecnologia                  | Versão / Detalhe         |
|----------------|-----------------------------|--------------------------|
| Backend        | Python + FastAPI            | FastAPI 0.135.2          |
| ORM            | SQLAlchemy                  | 2.0.48                   |
| Banco de Dados | MySQL                       | 8.0                      |
| Migrações      | Alembic                     | 1.13.3                   |
| Servidor ASGI  | Uvicorn                     | 0.30.6 (standard)        |
| Testes         | Pytest + HTTPX              | 8.3.3 / 0.27.2           |
| Containerização| Docker + Compose            | —                        |
| CI/CD          | GitHub Actions              | Azure VPS (SSH)          |
| Validação      | Pydantic + pydantic-settings| 2.5.2                    |

### 4.2 Estrutura de Módulos

- `app/modules/tickets/` — model, schema, repository, service, controller, routes.
- `app/modules/ticket_messages/` — model, schema, repository, service, controller, routes.
- `app/modules/knowledge_base/` — schema, repository, service, controller, routes (view agregada).
- `app/config/` — `config.py` (pydantic-settings), `database.py` (engine/session SQLAlchemy).
- `alembic/versions/` — `0001_initial_schema.py` (schema consolidado, substitui migrações conflitantes anteriores).

### 4.3 Fluxo de Requisição

```
Cliente HTTP → FastAPI Router → Controller → Service → Repository → MySQL
```

---

## 5. Endpoints Implementados

| Método | Rota                   | Descrição                                        | Status HTTP    |
|--------|------------------------|--------------------------------------------------|----------------|
| GET    | /health                | Healthcheck com verificação de banco             | 200            |
| GET    | /tickets               | Listar tickets (paginado: skip/limit)            | 200            |
| GET    | /tickets/{id}          | Buscar ticket por ID (UUID)                      | 200 / 404      |
| POST   | /tickets               | Criar novo ticket                                | 201            |
| PATCH  | /tickets/{id}          | Atualizar ticket (status, prioridade etc.)       | 200 / 400 / 404|
| GET    | /messages              | Listar mensagens por ticket_id (query param)     | 200            |
| POST   | /messages              | Criar mensagem em ticket                         | 201            |
| DELETE | /messages/{id}         | Deletar mensagem                                 | 204            |
| GET    | /knowledge-base        | Listar base de conhecimento (tickets resolvidos) | 200            |
| GET    | /docs                  | Swagger UI (modo debug)                          | —              |
| GET    | /redoc                 | ReDoc UI (modo debug)                            | —              |

---

## 6. Modelo de Dados

### Tabela: tickets

| Coluna      | Tipo          | Nullable | Observação                              |
|-------------|---------------|----------|-----------------------------------------|
| id          | CHAR(36)      | NOT NULL | UUID v4, PK                             |
| title       | VARCHAR(255)  | NOT NULL | Título do ticket                        |
| description | TEXT          | NOT NULL | Descrição completa                      |
| status      | ENUM          | NOT NULL | pending \| in_process \| done \| canceled |
| priority    | ENUM          | NOT NULL | low \| normal \| high \| urgent         |
| user_id     | CHAR(36)      | NULL     | ID do usuário solicitante               |
| client_id   | CHAR(36)      | NULL     | ID do cliente (tenant)                  |
| assigned_to | CHAR(36)      | NULL     | ID do atendente responsável             |
| updated_by  | CHAR(36)      | NULL     | Último usuário a atualizar              |
| category    | VARCHAR(100)  | NULL     | Categoria do ticket                     |
| closed_at   | TIMESTAMP     | NULL     | Preenchido ao fechar                    |
| created_at  | TIMESTAMP     | NOT NULL | Gerado automaticamente (UTC)            |
| updated_at  | TIMESTAMP     | NOT NULL | Atualizado automaticamente (UTC)        |

### Tabela: ticket_messages

| Coluna      | Tipo      | Nullable | Observação                            |
|-------------|-----------|----------|---------------------------------------|
| id          | CHAR(36)  | NOT NULL | UUID v4, PK                           |
| ticket_id   | CHAR(36)  | NOT NULL | FK → tickets.id (CASCADE DELETE)      |
| author_id   | CHAR(36)  | NULL     | ID do autor da mensagem               |
| message     | TEXT      | NOT NULL | Conteúdo da mensagem                  |
| is_internal | BOOLEAN   | NOT NULL | False = visível ao cliente            |
| created_at  | TIMESTAMP | NOT NULL | Gerado automaticamente (UTC)          |
| updated_at  | TIMESTAMP | NOT NULL | Atualizado automaticamente (UTC)      |

---

## 7. Requisitos Funcionais

| Código  | Título               | Status                        |
|---------|----------------------|-------------------------------|
| RF-001  | CRUD de Ticket       | ✅ Implementado                |
| RF-002  | Mensagens em Ticket  | ✅ Implementado                |
| RF-003  | Status do Ticket     | ✅ Implementado                |
| RF-004  | Documentação de API  | ✅ Implementado                |
| RF-005  | SLA                  | 📋 Definido / Pendente automação |
| RF-006  | Knowledge Base       | ✅ Implementado                |
| RF-007  | Pipeline CI/CD       | ✅ Implementado                |
| RF-008  | Healthcheck          | ✅ Implementado                |

**RF-001 — CRUD de Ticket**
`POST /tickets`, `GET /tickets`, `GET /tickets/{id}`, `PATCH /tickets/{id}` — retornam 200/201 com schema validado.

**RF-002 — Mensagens em Ticket**
`POST /messages`, `GET /messages?ticket_id=`, `DELETE /messages/{id}` — mensagem persistida em `ticket_messages` com `ticket_id` correto e integridade referencial (CASCADE).

**RF-003 — Status do Ticket**
Enum: `pending | in_process | done | canceled`. Status inválido rejeitado com HTTP 400. Transições inválidas bloqueadas na camada de serviço.

**RF-004 — Documentação de API**
Swagger UI disponível em `/docs` e ReDoc em `/redoc` (modo debug). Coleção Postman disponibilizada.

**RF-005 — SLA**
Políticas documentadas em `docs/`. Implementação automática de cálculo e alertas pendente para próximo sprint.

**RF-006 — Knowledge Base**
`GET /knowledge-base` retorna tickets resolvidos como base de conhecimento, com paginação (skip/limit).

**RF-007 — Pipeline CI/CD**
`ci.yml`: testes automáticos em PR para main/develop. `deploy.yml`: deploy automático para staging (develop) e produção (main) via SSH na Azure.

**RF-008 — Healthcheck**
`GET /health` verifica conexão com banco MySQL; retorna `{status: ok, db: connected}` ou HTTP 503.

---

## 8. Requisitos Não Funcionais

- **Performance:** resposta ≤1s para operações básicas.
- **Segurança:** obrigatoriedade de token no header (tratada por gateway externo).
- **Disponibilidade:** target 99,5%.
- **Escalabilidade:** serviço stateless — pronto para escalabilidade horizontal.
- **Usabilidade:** API com validações consistentes, erros legíveis e documentação Swagger.
- **Testabilidade:** suite de testes automatizados com Pytest + HTTPX integrada ao CI.
- **Portabilidade:** containerizado com Docker; executa identicamente em dev, staging e produção.

---

## 9. Regras de Negócio

- **RBN-001:** Ticket pode ser criado sem mensagens iniciais.
- **RBN-002:** Mensagens de ticket têm relação 1:N com tickets (FK com CASCADE DELETE).
- **RBN-003:** SLA de primeira resposta — todo ticket deve receber interação dentro do tempo definido para sua prioridade.
- **RBN-004:** SLA de resolução — todo ticket deve ser resolvido dentro do tempo máximo definido para prioridade.
- **RBN-005:** Pausa de SLA — quando ticket em status `aguardando_cliente`, contagem é pausada.
- **RBN-006:** Violação de SLA — ticket fora do SLA se ultrapassar limites definidos.
- **RBN-007:** Mensagem com `is_internal=true` não é visível ao cliente final.
- **RBN-008:** Deleção de ticket remove mensagens associadas em cascata (`ondelete='CASCADE'`).

---

## 10. Fluxo de Estados do Ticket

```
PENDING → IN_PROCESS → DONE
                  ↘
               CANCELED
```

- **PENDING:** ticket aberto, aguardando atribuição.
- **IN_PROCESS:** analista trabalhando.
- **DONE:** ticket resolvido e fechado.
- **CANCELED:** ticket cancelado.

---

## 11. SLA (Service Level Agreement)

| Prioridade | 1ª Resposta | Resolução |
|------------|-------------|-----------|
| low        | 72 horas    | 92 horas  |
| normal     | 24 horas    | 48 horas  |
| high       | 2 horas     | 24 horas  |
| urgent     | 1 hora      | 4 horas   |

- SLA iniciado no momento de criação do ticket (`created_at`).
- Contagem pausada quando `status = aguardando_cliente`.
- SLA finalizado quando `status = done` ou `canceled`.
- Monitoramento: % tickets dentro do SLA, % fora, tempo médio de 1ª resposta, tempo médio de resolução.

---

## 12. Infraestrutura & CI/CD

### 12.1 Pipelines GitHub Actions

- **ci.yml** — disparado em Pull Requests para main/develop. Sobe MySQL 8.0, instala dependências Python 3.11, executa pytest.
- **deploy.yml** — disparado em push para `develop` (→ staging) e `main` (→ produção). Conecta à Azure VPS via SSH, faz git pull, copia `.env` correto, rebuild do Docker Compose.
- **deploy-gabriele.yml** — pipeline de deploy alternativo para ambiente pessoal de desenvolvimento.

### 12.2 Ambientes

| Ambiente              | Branch     | Arquivo .env    | Destino                  |
|-----------------------|------------|-----------------|--------------------------|
| Desenvolvimento       | feature/*  | .env (local)    | localhost                |
| Staging / Homologação | develop    | .env.staging    | Azure VPS /staging       |
| Produção              | main       | .env.production | Azure VPS /production    |

---

## 13. Cobertura de Testes

- `tests/test_tickets_controller.py` — testes unitários do controller de tickets.
- `tests/test_tickets_service.py` — testes unitários da camada de serviço.
- `tests/test_tickets_repository.py` — testes unitários do repositório.
- `tests/test_tickets_routes.py` — testes de rotas HTTP (FastAPI TestClient).
- `tests/test_tickets_integration.py` — testes de integração end-to-end.
- `tests/conftest.py` — fixtures compartilhadas (banco de testes, sessão).
- CI executa todos os testes automaticamente em cada PR contra main/develop.

---

## 14. Cronograma e Marcos

| Sprint       | Marco                                                                 | Status         |
|--------------|-----------------------------------------------------------------------|----------------|
| Sprint 02–03 | Definição de requisitos, arquitetura e setup inicial                  | ✅ Concluído   |
| Sprint 04    | CRUD de tickets, Alembic, Docker, Swagger, testes básicos             | ✅ Concluído   |
| Sprint 05    | Endpoints de mensagens, correção migration, deploy staging, CI/CD     | ✅ Concluído   |
| Sprint 06+   | Automação SLA, integração com Auth (Core Engine), métricas            | 🔜 Planejado   |

---

## 15. Riscos e Mitigações

- **Risco 1 – Atraso na infra:** mitigado com dev local + mock. Ambiente de staging entregue no Sprint 05.
- **Risco 2 – Gaps na documentação:** mitigado com Swagger automático via FastAPI e revisões de sprint.
- **Risco 3 – Conflito de migrações Alembic:** resolvido no Sprint 05 com consolidação em `0001_initial_schema`.
- **Risco 4 – Implementação de SLA:** políticas definidas; automação planejada para Sprint 06+.

---

## 16. Glossário

- **Ticket:** solicitação registrada de atendimento.
- **Ticket Message:** entrada de conversa vinculada a um ticket (thread).
- **SLA:** acordo de nível de serviço — tempo máximo para resposta e resolução.
- **Knowledge Base:** repositório de tickets resolvidos usados como referência futura.
- **is_internal:** flag booleana que indica mensagem visível apenas para atendentes.
- **Staging:** ambiente de homologação que espelha produção para validação antes do deploy.
- **UUID:** identificador único universal (formato CHAR(36)) usado como PK de todas as entidades.
