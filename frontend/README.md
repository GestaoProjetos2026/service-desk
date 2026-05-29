# Conexus — Service Desk (Frontend)

Interface web do módulo de Service Desk do ERP Conexus. Construída em React + Vite, seguindo o Design System dark-first definido pelo Comitê UX/UI (ADR-001).

---

## Stack

- **React 18** com hooks (`useState`, `useEffect`, `useRef`, `createContext`)
- **Vite 5** como bundler e dev server
- **Recharts** para gráficos (`LineChart`, `BarChart`, `PieChart`)
- **Inter** (Google Fonts) como fonte oficial
- CSS-in-JS via `style` props com tokens centralizados no objeto `T`

---

## Estrutura

```
frontend/
├── index.html          # Entry point — tokens CSS globais, fonte Inter
├── src/
│   ├── main.jsx        # Monta o React na div#root
│   └── App.jsx         # Toda a aplicação (componentes, lógica, mock data)
├── package.json
├── vite.config.js
└── Dockerfile
```

---

## Rodando localmente

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:5173`

**Contas demo (enquanto o backend não estiver integrado):**

| Perfil | E-mail | Senha |
|---|---|---|
| Técnico / Agente | alex@conexus.io | 123 |
| Usuário / Cliente | diego@empresa.com | 123 |

---

## Integração com o Backend

O frontend está preparado para consumir a API REST do backend. Toda a lógica de dados está centralizada em mock data com comentários `// TODO` sinalizando exatamente onde cada chamada deve ser feita.

### Base URL

Configure a variável de ambiente:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Use `import.meta.env.VITE_API_BASE_URL` nas chamadas fetch.

---

### Endpoints esperados

A tabela abaixo lista todos os pontos de integração identificados no código, na ordem em que devem ser implementados.

#### Autenticação

| Método | Rota | Descrição | Localização no código |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Autentica usuário e retorna token + perfil | `Login` → função `handle()` |

**Body esperado:**
```json
{ "email": "string", "password": "string" }
```

**Resposta esperada:**
```json
{
  "token": "string",
  "user": {
    "name": "string",
    "email": "string",
    "role": "agent | user",
    "avatar": "string"
  }
}
```

---

#### Tickets

| Método | Rota | Descrição | Localização no código |
|---|---|---|---|
| GET | `/api/v1/tickets` | Lista todos os tickets (agente) | `App` → inicialização de `tickets` |
| GET | `/api/v1/tickets?user_id=` | Lista tickets do usuário autenticado | `DashboardUser`, `TicketsUser` |
| POST | `/api/v1/tickets` | Cria novo ticket | `NovoTicketModal` → `submit()` e `App` → `handleCreate()` |
| PATCH | `/api/v1/tickets/:id` | Atualiza status do ticket | `TicketsBoard` → `move()` |

**Body POST `/api/v1/tickets`:**
```json
{
  "title": "string",
  "desc": "string",
  "priority": "low | normal | high | urgent",
  "cat": "account | billing | mobile | reports | dashboard | other"
}
```

**Body PATCH `/api/v1/tickets/:id`:**
```json
{ "status": "pending | in_process | done | canceled" }
```

**Schema de ticket esperado na resposta:**
```json
{
  "id": "SD-101",
  "title": "string",
  "desc": "string",
  "status": "pending | in_process | done | canceled",
  "priority": "low | normal | high | urgent",
  "cat": "string",
  "user": "string",
  "created": "dd/mm/yyyy",
  "msgs": []
}
```

---

#### Mensagens de Ticket

| Método | Rota | Descrição | Localização no código |
|---|---|---|---|
| GET | `/api/v1/tickets/:id/messages` | Lista mensagens de um ticket | `Mensagens` → carregamento do chat ativo |
| POST | `/api/v1/tickets/:id/messages` | Envia nova mensagem | `Mensagens` → função `send()` |

**Body POST:**
```json
{ "text": "string" }
```

**Schema de mensagem:**
```json
{
  "id": 1,
  "author": "string",
  "role": "agent | user",
  "text": "string",
  "time": "string"
}
```

---

#### Base de Conhecimento (KB)

| Método | Rota | Descrição | Localização no código |
|---|---|---|---|
| GET | `/api/v1/kb` | Lista artigos | `KnowledgeBase` → inicialização |
| POST | `/api/v1/kb` | Cria novo artigo (somente agente) | `KnowledgeBase` → `addArticle()` |
| POST | `/api/v1/kb/:id/helpful` | Marca artigo como útil | `KnowledgeBase` → `markHelpful()` |

**Body POST `/api/v1/kb`:**
```json
{
  "title": "string",
  "cat": "string",
  "content": "string",
  "ticket": "string (id do ticket de origem, opcional)"
}
```

---

### Como substituir os mocks

Cada bloco de dado falso no código tem um comentário explicando a substituição. Exemplo:

```js
// Antes (mock)
// TODO: GET /api/v1/tickets
const TICKETS_INIT = [ ... ];

// Depois (integrado)
const [tickets, setTickets] = useState([]);

useEffect(() => {
  fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/tickets`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setTickets(data));
}, []);
```

O mesmo padrão se aplica a todos os outros endpoints.

---

### Autenticação com token

Após o login, armazene o token retornado e inclua em todas as requisições:

```js
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
}
```

---

## Design System

Todas as cores, espaçamentos e bordas seguem os tokens definidos no ADR-001 do Comitê UX/UI. O objeto `T` no topo de `App.jsx` é a única fonte de verdade visual do frontend — nunca use valores hardcoded fora dele.

Referência: `docs/ADR/Padronizacao.md`

---

## Build para produção

```bash
npm run build
```

O output vai para `dist/`. O `nginx.conf` já está configurado para servir o build com fallback para `index.html` (necessário para SPA).