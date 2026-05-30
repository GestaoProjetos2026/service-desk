# Documentação de API para Módulos (Integração)

Este documento serve como referência central para integração de outros módulos e aplicações com o **Core Engine & Auth**.
Ele define os padrões de resposta, o guia de autenticação M2M e documenta detalhadamente as rotas expostas pela API.

## 1. Visão Geral

- **Base URL:** `http://api.core-engine.40.82.176.176.nip.io/v1`
- **Autenticação:** A maioria das rotas exige um token JWT no cabeçalho `Authorization: Bearer <token>`.
- Existem dois tipos principais de tokens:
  - `user_access`: para usuários humanos (carrega `roles` e `perms`).
  - `integration_access`: para aplicações M2M (carrega `scopes`).

---

## 2. Padrão de Respostas e Erros

Todas as respostas da API seguem um formato de envelope padronizado.

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z",
  "path": "/v1/recurso"
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "CÓDIGO_DO_ERRO",
    "message": "Mensagem descritiva"
  },
  "timestamp": "2026-04-15T10:00:00.000Z",
  "path": "/v1/recurso"
}
```
*Consulte o arquivo `INTEGRATION_API_CONTRACT.md` para a lista completa de códigos de erro e referências de exceção.*

---

## 3. Guia de Integração M2M (Machine-to-Machine)

Se o seu módulo ou aplicação precisa se comunicar de forma autônoma (sem interação humana) com o Core Auth, você deve usar o fluxo `client_credentials`.

1. **Pré-requisitos:** Solicite ao administrador um `client_id`, `client_secret` e confirme os escopos disponíveis para sua integração.
2. **Obter Token:**
```bash
curl -X POST http://api.core-engine.40.82.176.176.nip.io/v1/integration/token \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "client_credentials",
    "clientId": "seu_client_id",
    "clientSecret": "seu_client_secret",
    "scope": "users:read roles:read"
  }'
```
*(A aplicação também suporta o fluxo padrão OAuth 2.0 via `POST /v1/oauth/token` com `application/x-www-form-urlencoded`).*

3. **Usar o Token:** Adicione o `access_token` retornado no cabeçalho de todas as suas chamadas autenticadas: `Authorization: Bearer <token>`.

*Veja mais detalhes completos sobre escopos, validação e segurança em `M2M_INTEGRATION_GUIDE.md`.*

---

## 4. Rotas da API e Payloads

Abaixo estão documentadas as principais rotas para consumo e integração por outras aplicações.

### 4.1. Health & Status

#### `GET /v1/health`
Retorna o status do serviço.
- **Payload (Request):** Nenhum
- **Sucesso (200):**
```json
{ "status": "ok" }
```

### 4.2. Autenticação (Auth)

#### `POST /v1/auth/login`
Autentica um usuário humano com e-mail e senha.
- **Payload (Request):**
```json
{
  "email": "usuario@empresa.com",
  "password": "Senha@Forte123"
}
```
- **Sucesso (200):** Retorna `accessToken`, `refreshToken`, `tokenType` (Bearer) e `expiresIn`.

#### `POST /v1/auth/refresh`
Gera novos tokens a partir de um refresh token válido e revoga o antigo (obrigatório).
- **Payload (Request):**
```json
{
  "refreshToken": "eyJhbGci..."
}
```
- **Sucesso (200):** Novos tokens no `data`.
- **Falha Notável (401):** Retorna `AUTH_REFRESH_REUSED` caso tente usar um token já invalidado.

#### `GET /v1/auth/me`
Retorna os dados do usuário autenticado (exige `user_access` token).
- **Sucesso (200):** Retorna UUID, email, `roles` e `perms`.

### 4.3. Usuários (Users)

#### `GET /v1/users`
Lista usuários do sistema com suporte à paginação (exige token com permissão `users:read`).
- **Query Params:** `email` (filtro opcional parcial), `status` (ACTIVE/INACTIVE), `page` (default: 1), `limit` (default: 20).
- **Sucesso (200):** Retorna um array `items`, `total`, `page` e `limit`.

#### `POST /v1/users`
Cria um novo usuário (exige token com permissão `users:write`).
- **Payload (Request):**
```json
{
  "email": "novo@empresa.com",
  "name": "Nome do Usuário",
  "password": "Senha@Forte123"
}
```
- **Sucesso (201):** Retorna as informações do usuário recém-criado.

#### `GET /v1/users/{id}`
Obtém detalhes de um usuário específico via UUID (exige token com permissão `users:read`).

#### `PATCH /v1/users/{id}`
Atualiza dados de um usuário existente.
- **Payload (Request):**
```json
{
  "name": "Novo Nome",
  "email": "novo.email@empresa.com"
}
```

#### `PATCH /v1/users/{id}/status`
Ativa ou inativa um usuário (RN01 - usuário inativo não loga).
- **Payload (Request):**
```json
{
  "status": "INACTIVE" // ou "ACTIVE"
}
```

### 4.4. Perfis e Permissões

#### `GET /v1/roles`
Lista os perfis de acesso cadastrados na aplicação.

#### `POST /v1/roles`
Cria um novo perfil (Role).
- **Payload (Request):**
```json
{
  "name": "manager",
  "description": "Descrição do perfil de acesso"
}
```

#### `GET /v1/permissions`
Lista permissões globais do sistema.

#### `POST /v1/permissions`
Cria uma nova permissão estruturada base.
- **Payload (Request):**
```json
{
  "code": "orders:read",
  "description": "Acesso de leitura na listagem de pedidos"
}
```

---
*Para ver a estrutura completa da API, casos de falha adicionais e a especificação OpenAPI técnica oficial, consulte o arquivo `openapi.yaml` ou acesse `GET /v1/docs` no ambiente de desenvolvimento para visualizar o Swagger UI.*
