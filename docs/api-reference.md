# Guia Técnico de API — Service Desk

**Versão:** 1.0
**Data:** 2026-05-15
**Projeto:** Service Desk
**Público-alvo:** Desenvolvedores e equipes de integração

---

## Sumário

1. Visão Geral
2. Convenções e Padrões
3. Autenticação
4. Códigos de Status HTTP
5. Tipos e Enumerações
6. Recursos da API
   - 6.1 Health Check
   - 6.2 Tickets
   - 6.3 Mensagens de Ticket
   - 6.4 Base de Conhecimento
7. Considerações Gerais

---

## 1. Visão Geral

A API do Service Desk é uma API REST construída com FastAPI. Ela expõe os recursos necessários para criar e gerenciar tickets de suporte, registrar mensagens em cada ticket e consultar a base de conhecimento formada por tickets resolvidos.

Toda comunicação é feita via HTTP, utilizando JSON como formato de troca de dados.

| Propriedade | Valor |
|---|---|
| Base URL | `http://<host>/api/v1` |
| Protocolo | HTTP / HTTPS |
| Formato de dados | JSON |
| Encoding | UTF-8 |
| Documentação interativa | `GET /docs` *(somente com APP_DEBUG=true)* |

---

## 2. Convenções e Padrões

### Identificadores

Todos os recursos utilizam identificadores no formato **UUID v4**, representados como strings no padrão `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.

Exemplo: `550e8400-e29b-41d4-a716-446655440000`

### Datas e Horários

Todas as datas são retornadas em **UTC** no formato ISO 8601:

```
YYYY-MM-DDTHH:MM:SS
```

Exemplo: `2026-05-15T10:00:00`

### Paginação

Todos os endpoints de listagem suportam paginação via query parameters:

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `skip` | integer | `0` | Número de registros a ignorar (offset) |
| `limit` | integer | `50` | Número máximo de registros retornados |

A resposta de listagens sempre inclui o campo `total` com a contagem total de registros, independente da paginação aplicada.

### Erros de Validação

Quando os dados enviados na requisição não passam nas validações, a API retorna `422 Unprocessable Entity` com detalhes dos campos com erro, seguindo o padrão do FastAPI/Pydantic.

---

## 3. Autenticação

A versão atual da API **não implementa autenticação**. Todos os endpoints são públicos e acessíveis sem credenciais.

Autenticação via JWT ou API Key está prevista para versões futuras. Quando implementada, será necessário enviar o token no header de todas as requisições:

```
Authorization: Bearer <token>
```

---

## 4. Códigos de Status HTTP

| Código | Significado | Quando ocorre |
|---|---|---|
| `200 OK` | Sucesso | Consulta ou atualização bem-sucedida |
| `201 Created` | Recurso criado | Criação de ticket ou mensagem |
| `204 No Content` | Sucesso sem corpo | Exclusão de mensagem |
| `404 Not Found` | Não encontrado | Recurso não existe |
| `422 Unprocessable Entity` | Erro de validação | Dados inválidos na requisição |
| `503 Service Unavailable` | Serviço indisponível | Banco de dados inacessível |

---

## 5. Tipos e Enumerações

### TicketStatus

Representa o estado atual de um ticket no fluxo de atendimento.

| Valor | Descrição |
|---|---|
| `pending` | Aguardando atendimento |
| `in_process` | Em atendimento |
| `done` | Concluído |
| `canceled` | Cancelado |

### TicketPriority

Representa o nível de urgência atribuído ao ticket.

| Valor | Descrição |
|---|---|
| `low` | Baixa prioridade |
| `normal` | Prioridade normal *(padrão)* |
| `high` | Alta prioridade |
| `urgent` | Urgente |

---

## 6. Recursos da API

### 6.1 Health Check

Endpoint utilizado para verificar se a API e o banco de dados estão operacionais. Recomendado para monitoramento e health probes em ambientes containerizados.

**Endpoint:** `GET /health`

**Resposta de sucesso — 200 OK**

```json
{
  "status": "ok",
  "db": "connected"
}
```

**Resposta de erro — 503 Service Unavailable**

```json
{
  "detail": "database unavailable: ..."
}
```

---

### 6.2 Tickets

O recurso de tickets representa as solicitações de suporte abertas por usuários ou clientes. Cada ticket possui título, descrição, status, prioridade e pode ser atribuído a um agente.

#### 6.2.1 Listar Tickets

Retorna a lista paginada de todos os tickets cadastrados.

**Endpoint:** `GET /api/v1/tickets`

**Query Parameters**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `skip` | integer | `0` | Registros a pular |
| `limit` | integer | `50` | Máximo de registros retornados |

**Resposta — 200 OK**

```json
{
  "total": 2,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Impressora não funciona",
      "description": "A impressora do setor financeiro parou de responder.",
      "status": "pending",
      "priority": "normal",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "client_id": null,
      "assigned_to": null,
      "updated_by": null,
      "category": "hardware",
      "created_at": "2026-05-15T10:00:00",
      "updated_at": "2026-05-15T10:00:00",
      "closed_at": null
    }
  ]
}
```

#### 6.2.2 Obter Ticket por ID

Retorna os dados completos de um ticket específico.

**Endpoint:** `GET /api/v1/tickets/{ticket_id}`

**Path Parameters**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket |

**Resposta — 200 OK**

Retorna um objeto `TicketResponse` com a mesma estrutura exibida em 6.2.1.

**Resposta — 404 Not Found**

```json
{ "detail": "Ticket not found" }
```

#### 6.2.3 Criar Ticket

Cria um novo ticket de suporte.

**Endpoint:** `POST /api/v1/tickets`

**Campos do corpo da requisição**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `title` | string | Sim | 3 a 255 caracteres |
| `description` | string | Sim | Mínimo 10 caracteres |
| `status` | TicketStatus | Não | Padrão: `pending` |
| `priority` | TicketPriority | Não | Padrão: `normal` |
| `user_id` | UUID | Não | ID do usuário solicitante |
| `client_id` | UUID | Não | ID do cliente associado |
| `assigned_to` | UUID | Não | ID do agente responsável |
| `updated_by` | UUID | Não | ID de quem fez a última atualização |
| `category` | string | Não | Máximo 100 caracteres |

**Exemplo de requisição**

```json
{
  "title": "Sem acesso ao sistema",
  "description": "Usuário não consegue fazer login desde ontem.",
  "priority": "high",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "category": "acesso"
}
```

**Resposta — 201 Created**

Retorna o objeto `TicketResponse` com todos os campos do ticket criado, incluindo `id`, `created_at` e `updated_at` gerados pelo servidor.

#### 6.2.4 Atualizar Ticket

Atualiza parcialmente um ticket existente. Apenas os campos enviados serão modificados; campos ausentes permanecem inalterados.

**Endpoint:** `PATCH /api/v1/tickets/{ticket_id}`

**Path Parameters**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket |

**Campos do corpo da requisição** *(todos opcionais)*

| Campo | Tipo | Regras |
|---|---|---|
| `title` | string | 3 a 255 caracteres |
| `description` | string | Mínimo 10 caracteres |
| `status` | TicketStatus | Ver seção 5 |
| `priority` | TicketPriority | Ver seção 5 |
| `assigned_to` | UUID | ID do agente responsável |
| `updated_by` | UUID | ID de quem está atualizando |
| `category` | string | Máximo 100 caracteres |

**Exemplo de requisição**

```json
{
  "status": "in_process",
  "assigned_to": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "updated_by": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

**Resposta — 200 OK**

Retorna o objeto `TicketResponse` atualizado.

**Resposta — 404 Not Found**

```json
{ "detail": "Ticket not found" }
```

---

### 6.3 Mensagens de Ticket

Mensagens são registros de comunicação vinculados a um ticket. Podem ser públicas (visíveis ao solicitante) ou internas (visíveis apenas para a equipe de suporte).

Todas as rotas de mensagens são aninhadas sob o ticket correspondente:
`/api/v1/tickets/{ticket_id}/messages`

#### 6.3.1 Listar Mensagens de um Ticket

Retorna todas as mensagens associadas a um ticket, em ordem cronológica.

**Endpoint:** `GET /api/v1/tickets/{ticket_id}/messages`

**Path Parameters**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket |

**Query Parameters**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `skip` | integer | `0` | Registros a pular |
| `limit` | integer | `50` | Máximo de registros |

**Resposta — 200 OK**

```json
{
  "total": 1,
  "items": [
    {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
      "author_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "message": "Já tentei reiniciar e o problema persiste.",
      "is_internal": false,
      "created_at": "2026-05-15T10:05:00",
      "updated_at": "2026-05-15T10:05:00"
    }
  ]
}
```

#### 6.3.2 Obter Mensagem por ID

Retorna uma mensagem específica de um ticket.

**Endpoint:** `GET /api/v1/tickets/{ticket_id}/messages/{message_id}`

**Path Parameters**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket |
| `message_id` | UUID | ID da mensagem |

**Resposta — 200 OK**

Retorna um objeto `TicketMessageResponse` com a mesma estrutura exibida em 6.3.1.

#### 6.3.3 Criar Mensagem

Adiciona uma nova mensagem a um ticket.

**Endpoint:** `POST /api/v1/tickets/{ticket_id}/messages`

**Path Parameters**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket ao qual a mensagem será vinculada |

**Campos do corpo da requisição**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `author_id` | UUID | Não | ID do autor da mensagem |
| `message` | string | Sim | Mínimo 1 caractere |
| `is_internal` | boolean | Não | Padrão: `false`. Quando `true`, a mensagem é visível apenas para agentes internos |

**Exemplo de requisição**

```json
{
  "author_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "message": "Encaminhado para o time de infraestrutura.",
  "is_internal": true
}
```

**Resposta — 201 Created**

Retorna o objeto `TicketMessageResponse` com todos os campos da mensagem criada.

#### 6.3.4 Excluir Mensagem

Remove permanentemente uma mensagem de um ticket.

**Endpoint:** `DELETE /api/v1/tickets/{ticket_id}/messages/{message_id}`

**Path Parameters**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket |
| `message_id` | UUID | ID da mensagem a ser excluída |

**Resposta — 204 No Content**

Sem corpo na resposta. A ausência de erro indica que a exclusão foi bem-sucedida.

---

### 6.4 Base de Conhecimento

A base de conhecimento consolida tickets resolvidos como referência para a equipe de suporte. Os itens são derivados automaticamente dos tickets com status `done` e suas últimas mensagens.

#### 6.4.1 Listar Base de Conhecimento

Retorna a lista paginada de itens da base de conhecimento.

**Endpoint:** `GET /api/v1/knowledge-base`

**Query Parameters**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `skip` | integer | `0` | Registros a pular |
| `limit` | integer | `50` | Máximo de registros |

**Resposta — 200 OK**

```json
{
  "total": 1,
  "items": [
    {
      "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Impressora não funciona",
      "description": "A impressora do setor financeiro parou de responder.",
      "last_message": "Problema resolvido após atualização do driver.",
      "created_at": "2026-05-15T10:00:00"
    }
  ]
}
```

**Descrição dos campos**

| Campo | Tipo | Descrição |
|---|---|---|
| `ticket_id` | UUID | ID do ticket de origem |
| `title` | string | Título do ticket |
| `description` | string | Descrição original do problema |
| `last_message` | string ou null | Última mensagem registrada no ticket |
| `created_at` | datetime | Data de criação do ticket original |

---

## 7. Considerações Gerais

### Ambiente de Desenvolvimento

Em modo de desenvolvimento (`APP_DEBUG=true`), a documentação interativa Swagger UI está disponível em `/docs` e ReDoc em `/redoc`. Em produção, esses endpoints são desabilitados automaticamente.

### Evolução da API

A URL base `/api/v1` indica o versionamento da API. Alterações incompatíveis serão publicadas em novas versões (`/api/v2`, etc.), garantindo retrocompatibilidade.

### Integração com Banco de Dados

A API utiliza MySQL como banco de dados relacional, gerenciado via SQLAlchemy. As migrações de schema são controladas pelo Alembic. Em caso de indisponibilidade do banco, todos os endpoints retornarão `503 Service Unavailable`.
