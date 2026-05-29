# 🖥️ Arquitetura do Frontend — Service Desk

> Documentação técnica da estrutura, bibliotecas, componentes e funcionamento do frontend da aplicação Conexus Service Desk.

---

## 📦 Stack & Bibliotecas

| Biblioteca | Versão | Função |
|---|---|---|
| **React** | 18.3.1 | Biblioteca de UI (componentes funcionais + hooks) |
| **ReactDOM** | 18.3.1 | Renderização no DOM via `createRoot` |
| **Vite** | 5.4.21 | Bundler e servidor de desenvolvimento |
| **@vitejs/plugin-react** | 4.7.0 | Suporte a JSX e Fast Refresh no Vite |
| **Recharts** | 2.15.4 | Gráficos declarativos (linha, barra, pizza) |

Sem CSS framework, sem biblioteca de roteamento — estilos são inline via design tokens e a navegação é gerenciada por `useState`.

---

## 🗂️ Estrutura de Arquivos

```
frontend/
├── index.html          # Entry point HTML; carrega Inter (Google Fonts) e variáveis CSS
├── vite.config.js      # Configuração do Vite (plugin React)
├── package.json        # Dependências e scripts
├── nginx.conf          # Configuração Nginx para SPA (serve index.html em qualquer rota)
├── Dockerfile          # Build de produção: Vite build → Nginx
└── src/
    ├── main.jsx        # Monta <App /> em #root via ReactDOM.createRoot
    └── App.jsx         # Toda a aplicação (componentes, estado, dados)
```

> A aplicação é intencionalmente **single-file** (`App.jsx`): todos os componentes, design tokens, dados mock e lógica de estado estão neste arquivo. O arquivo importa `createContext` e `useContext` do React (preparado para extração em `AuthContext`). A divisão em módulos (`api/`, `context/`, `hooks/`) está planejada para as próximas sprints conforme descrito em [integration-plan.md](integration-plan.md).

---

## 🎨 Design Tokens

Definidos no objeto `T` no topo de `App.jsx`. Centralizam toda a paleta de cores da aplicação:

| Grupo | Exemplos de tokens |
|---|---|
| **Backgrounds** | `bgApp`, `bgSidebar`, `bgSurface`, `bgInput`, `bgHover` |
| **Bordas** | `borderSubtle`, `borderDefault`, `borderStrong` |
| **Brand** | `brand` (#0466c8), `brandHover`, `brandActive`, `brandMuted` |
| **Texto** | `textPrimary`, `textSecondary`, `textMuted`, `textDisabled` |
| **Status** | `success`, `warning`, `danger`, `info` (cada um com variante `Muted` e `Border`) |
| **Sombras** | `shadowSm`, `shadowMd`, `shadowLg` |

As mesmas primitivas de cor também são expostas como variáveis CSS em `index.html` (prefixo `--smart-blue`, `--prussian-blue`, etc.) para uso em estilos globais.

---

## 🧩 Componentes

### Primitivos UI

| Componente | Descrição |
|---|---|
| `Badge` | Pílula colorida de status (`pending`, `in_process`, `done`, `canceled`) |
| `RiscoBadge` | Pílula de risco de churn (`alto`, `medio`, `baixo`) |
| `Avatar` | Círculo com iniciais do usuário |
| `Icon` | Objeto com SVGs inline para cada ícone da UI (sem dependência externa) |
| `ConexusLogo` | SVG do logotipo hexagonal "Conexus" |
| `Btn` | Botão com variantes: `primary`, `secondary`, `ghost`, `soft`, `danger` |
| `Input` | Campo de texto estilizado |
| `Textarea` | Área de texto estilizada |
| `Select` | Seletor estilizado |
| `Field` | Wrapper de campo com label e mensagem de erro |
| `Card` | Container com fundo elevado e borda sutil |
| `MetricCard` | Card de KPI com label, valor e ícone colorido |
| `TicketFiscalPanel` | Painel de integração com Fiscal Finance: exibe saldo, entradas e impostos via `GET /api/v1/integration/fiscal/cashflow` com fallback para dados em cache |

### Funções de Integração (Fiscal Finance)

| Função | Descrição |
|---|---|
| `buscarHistoricoFiscal(sku)` | Chama `GET /api/v1/integration/fiscal/history/{sku}` — retorna histórico de movimentações por SKU |
| `buscarResumoFinanceiro()` | Chama `GET /api/v1/integration/fiscal/cashflow` — retorna saldo, entradas e impostos; em caso de falha, retorna dados de fallback offline |

### Estrutura da Aplicação

| Componente | Descrição |
|---|---|
| `Login` | Tela de login com formulário de e-mail + senha; inclui atalhos de contas demo para testes; a validação ainda é local (mock) com `// TODO: POST /api/v1/auth/login` |
| `Sidebar` | Navegação lateral com itens condicionais por papel |
| `Topbar` | Cabeçalho com título da página, campo de busca, sino de notificações e botão "Novo Ticket" |
| `NovoTicketModal` | Modal de criação de ticket com formulário validado; `// TODO: POST /api/v1/tickets` |

### Views (Páginas)

| Componente | Página (`key`) | Perfis | Descrição |
|---|---|---|---|
| `DashboardAgent` | `dashboard` | `agent` | KPIs globais, gráfico de tickets por status e atalhos rápidos |
| `DashboardUser` | `dashboard` | `user` | Resumo dos tickets do usuário e atalhos |
| `TicketsBoard` | `tickets` | `agent` | Lista completa de tickets com painel de detalhes e atualização de status |
| `TicketsUser` | `tickets` | `user` | Lista filtrada pelos tickets do usuário logado |
| `Mensagens` | `messages` | ambos | Thread de mensagens por ticket; suporte a notas internas (agente) |
| `KnowledgeBase` | `knowledge` | ambos | Artigos da base de conhecimento com busca, votos e vinculação a tickets |
| `ChurnAnalysis` | `churn` | `agent` | Gráficos de churn/retenção (Recharts), tabela de risco por cliente |
| `Settings` | `settings` | ambos | Configurações de perfil e preferências (protótipo) |

---

## 🔄 Gerenciamento de Estado

Toda a lógica de estado reside no componente raiz `App` e é propagada via props:

```
App (estado global)
├── role          — perfil autenticado ("agent" | "user" | null)
├── page          — página ativa (chave de navegação)
├── tickets       — lista de tickets (CRUD em memória)
├── activeTicket  — ID do ticket selecionado
└── showNew       — visibilidade do modal de criação
```

Não há Context API nem Redux ativos — `createContext` e `useContext` já estão importados em `App.jsx`, mas a extração para `AuthContext` ainda não foi realizada. Está planejada para o Sprint 1 da integração (ver [integration-plan.md](integration-plan.md)).

---

## 👥 Controle de Acesso por Papel

Dois papéis são suportados. O login é feito via formulário de e-mail + senha — a validação ainda ocorre localmente contra `USERS_DB` (mock), mas a tela já está pronta para conectar ao `POST /api/v1/auth/login`:

| Papel | Credenciais demo | Acesso exclusivo |
|---|---|---|
| `agent` | `alex@conexus.io` / `123` (Alex Morgan, `AM`) | `ChurnAnalysis`, `TicketsBoard`, `DashboardAgent` |
| `user` | `diego@empresa.com` / `123` (Diego Ramos, `DR`) | `TicketsUser`, `DashboardUser` |

A navegação lateral (`Sidebar`) exibe itens diferentes conforme o papel (`NAV_AGENT` vs `NAV_USER`). A view renderizada também é condicional por papel na `App`.

---

## 📊 Dados Mock e Integrações Reais

A maioria dos dados ainda usa constantes definidas em `App.jsx`. Os pontos de integração real já implementados e os que ainda aguardam substituição:

| Constante / Função | Conteúdo | Status |
|---|---|---|
| `TICKETS_INIT` | 6 tickets de exemplo com mensagens | Mock — `// TODO: GET /api/v1/tickets` |
| `KB_INIT` | 4 artigos da base de conhecimento | Mock — `// TODO: GET /api/v1/knowledge-base` |
| `CHURN_DATA` | Dados mensais de churn, risco e motivos | Mock — sem endpoint analítico previsto |
| `USERS_DB` | Usuários mock por papel | Mock — `// TODO: GET /api/v1/auth/me` |
| `buscarResumoFinanceiro()` | Saldo, entradas e impostos | **Integrado** → `GET /api/v1/integration/fiscal/cashflow` (com fallback offline) |
| `buscarHistoricoFiscal(sku)` | Histórico de movimentações | **Integrado** → `GET /api/v1/integration/fiscal/history/{sku}` |

---

## 🔄 Fluxo de Navegação

```
Login (seleção de papel)
    │
    ▼
App (estado + layout)
    ├── Sidebar (nav por papel)
    ├── Topbar (título + ação)
    └── Área de conteúdo
            ├── page === "dashboard"  → DashboardAgent | DashboardUser
            ├── page === "tickets"    → TicketsBoard   | TicketsUser
            ├── page === "messages"   → Mensagens
            ├── page === "knowledge"  → KnowledgeBase
            ├── page === "churn"      → ChurnAnalysis (agent only)
            └── page === "settings"  → Settings
```

---

## 🐳 Docker & Produção

O Dockerfile executa dois estágios:

1. **Build** — instala dependências e executa `vite build`, gerando a pasta `dist/`
2. **Serve** — copia `dist/` para uma imagem Nginx que serve o SPA

O `nginx.conf` usa `try_files $uri $uri/ /index.html` para garantir que o roteamento client-side funcione corretamente em refresh ou acesso direto por URL.

Para desenvolvimento local:
```bash
cd frontend
npm install
npm run dev      # Vite dev server com HMR
```

Para build de produção:
```bash
npm run build    # Gera dist/
```
