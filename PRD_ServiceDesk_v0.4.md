# Documento de Requisitos do Produto (PRD) - Release Notes & Atualizações

Versão: 0.2 (Atualização de Entregas)

Data: 14/05/2026

Proprietários do Produto: Squad 4 - Yuri Santos, Gabriele Silva, Pedro Nunes, Sergio Escudeiro, Arthur Silles.

Team Lead: Pedro Nunes

-----------------
## Resumo Executivo
- **Objetivo da atualização:** Detalhar a entrega do ambiente de *Staging* (Azure VM), estabilização do CI/CD com GitHub Actions e a integração consolidada de front-end, testes e documentação de API construídas ao longo das últimas Sprints.
- **Visão de sucesso alcançada:** O pipeline de integração está 100% verde (aprovado nos testes automatizados) e o CD está aprovisionando a infraestrutura completa de API e Frontend na Azure de forma resiliente usando Docker.

---
## 1. Visão Geral das Entregas (Escopo Concluído)
Este documento sintetiza os últimos esforços de desenvolvimento que consolidam a Fase 2 do Service Desk. As entregas orbitaram na construção de interface, cobertura de testes para os novos fluxos de mensagens, documentação OpenAPI e, finalmente, o orquestramento de *Deploy*.

---
## 2. Detalhamento de Ajustes e Branchs Recentes

### 2.1 Branch: `/task/455-serv-35-deploy-do-frontend-demo` (Seção Atual)
**Foco:** Automatização do Deploy na máquina virtual Azure via SSH & CI/CD.
*   **Pipeline Resiliente:** Escrito um script `deploy.yml` idempotente, capaz de clonar ou atualizar (`git pull`) o repositório na Azure dinamicamente baseado na branch `develop`.
*   **Ambiente de Staging (Docker):** Criado serviço `frontend` no `docker-compose.yml` para expor na porta 80 e leitura inteligente de `.env.staging` para evitar conflito com credenciais de produção.
*   **Correção de Build Frontend:** Adicionadas regras rígidas no `frontend/.dockerignore` e raiz para evitar que arquivos compilados do Windows poluissem o container Linux (corrigido o `sh: vite: Permission denied`).
*   **Bugs de Integração e Testes (Python/MySQL):**
    *   Corrigidos problemas de importação (`ModuleNotFoundError`) devido a mudanças na organização de `app/modules/ticket_messages`.
    *   Corrigidos testes de paginação do banco corrigindo colisão de `TIMESTAMP` no MySQL (ajuste do `sleep(0.01)` para `sleep(1)`).
    *   Permitida a transição direta de status `pending` para `done` nos testes E2E.
*   **Timeout & OOM Killer:** Ajustado `command_timeout: 30m` no GitHub Actions para dar tempo do Vite compilar os assets na Azure VM.
*   **Solução de Conflito Alembic:** Realizado o reset do volume de banco de dados (`docker compose down -v`) para permitir que o Alembic rode suas migrações livre de cache de instâncias prévias.

### 2.2 Branch: `/task/402-serv-33-construção-do-frontend`
**Foco:** Construção da interface visual consumidora da API.
*   `feat: construção do frontend service desk`: Criação de todo o esqueleto SPA (Single Page Application) em Node.js (Vite/React).
*   `chore: mover frontend para pasta dedicada`: Isolamento do código-fonte do Frontend para uma subpasta `frontend/`, desacoplando a camada visual da camada backend FastAPI, facilitando builds em multi-stage (Node.js -> Nginx) no Docker.

### 2.3 Branch: `/task/400-serv-31-testes-dos-endpoints-de-mensagens`
**Foco:** Cobertura de Qualidade (QA) para o módulo de mensagens.
*   `feat: add messages_routes/message_repository`: Criação das rotas e das operações diretas com o banco de dados que validam se as mensagens estão sendo gravadas e lidas em ordem cronológica e presas a uma Thread de Ticket válida.
*   Consolidação da cobertura de testes para bater 100% nas novas controllers de `ticket_messages`.

### 2.4 Branch: `/task/457-serv-37-documentação-da-api`
**Foco:** Documentação técnica voltada ao Dev.
*   `docs: added API reference doc markdown`: Geração de um arquivo Markdown de referência descrevendo as capacidades da API, consolidando e complementando o Swagger nativo da ferramenta (`/docs`).

---
## 3. Fluxo de Operação e Lançamento (Go-Live Staging)
O sistema foi colocado em *Staging* seguindo o fluxo de:
1.  *Commit/Push* em `develop` aciona o *GitHub Actions*.
2.  A *Action* roda `python -m pytest` isolado. Se passar, segue para deploy.
3.  Acesso SSH à Azure VM é estabelecido. O código é atualizado (`git reset --hard`).
4.  É realizado `docker compose build && docker compose up -d`.
5.  O serviço de `mysql` sobe; o container de `migration` roda o `alembic` de forma efêmera; e finalmente o `api` (FastAPI - porta 8000) e `frontend` (Nginx - porta 80) ficam operacionais e saudáveis.

---
## 4. Próximos Passos (Next Steps)
- Homologação final do ambiente de *Staging* por usuários.
- Implementação de lógica background para verificação de SLAs.
- Merge de todas as features concluídas e validadas para a branch `main` e disparo do mesmo fluxo de pipeline, agora com as variáveis de `production`.
