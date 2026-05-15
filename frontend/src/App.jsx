import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── TEMA ─────────────────────────────────────────────────────────────────────
const C_DARK = {
  bg: "#0b0f1a", card: "#131929", cardHover: "#182035", border: "#1e2d47",
  accent: "#3b82f6", accentDim: "rgba(59,130,246,.15)", text: "#e2e8f0",
  sub: "#94a3b8", muted: "#4a5568", success: "#22c55e",
  successDim: "rgba(34,197,94,.12)", warning: "#f59e0b",
  warningDim: "rgba(245,158,11,.12)", danger: "#ef4444",
  dangerDim: "rgba(239,68,68,.12)", purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,.12)", input: "#090d17",
};
const C_LIGHT = {
  bg: "#f0f4f8", card: "#ffffff", cardHover: "#f8fafc", border: "#dde3ed",
  accent: "#3b82f6", accentDim: "rgba(59,130,246,.12)", text: "#1a2035",
  sub: "#4a5568", muted: "#8a99b0", success: "#16a34a",
  successDim: "rgba(22,163,74,.1)", warning: "#d97706",
  warningDim: "rgba(217,119,6,.1)", danger: "#dc2626",
  dangerDim: "rgba(220,38,38,.1)", purple: "#7c3aed",
  purpleDim: "rgba(124,58,237,.1)", input: "#f5f7fa",
};
// Sidebar sempre escuro independente do tema
const SIDEBAR = {
  bg: "#0f1420", border: "#1e2d47", text: "#e2e8f0",
  muted: "#4a5568", sub: "#94a3b8", accent: "#3b82f6",
};

const ThemeCtx = createContext({ theme: "dark", C: C_DARK });
const useTheme = () => useContext(ThemeCtx);

// ─── STATUS / PRIORIDADE ──────────────────────────────────────────────────────
const S = {
  pending:    { label: "Aberto",       color: "#22c55e", bg: "rgba(34,197,94,.12)"   },
  in_process: { label: "Em andamento", color: "#f59e0b", bg: "rgba(245,158,11,.12)"  },
  done:       { label: "Resolvido",    color: "#3b82f6", bg: "rgba(59,130,246,.15)"  },
  canceled:   { label: "Cancelado",    color: "#ef4444", bg: "rgba(239,68,68,.12)"   },
};
const P = {
  low:    { label: "↓ Baixa",   color: "#4a5568" },
  normal: { label: "= Normal",  color: "#3b82f6" },
  high:   { label: "↑ Alta",    color: "#f59e0b" },
  urgent: { label: "⊕ Urgente", color: "#ef4444" },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: substituir por chamadas à API REST quando o backend estiver pronto
// Exemplo: const tickets = await fetch('/api/tickets').then(r => r.json())

const TICKETS_INIT = [
  {
    id: "SD-101", title: "Cannot log in from mobile app",
    desc: "Keeps saying invalid credentials on iPhone 14.",
    status: "in_process", priority: "high", cat: "mobile",
    user: "Diego Ramos", created: "07/05/2026",
    msgs: [
      { id: 1, author: "Diego Ramos",  role: "user",  text: "Hi! Still can't log in on my iPhone.",                     time: "2h atrás"   },
      { id: 2, author: "Alex Morgan",  role: "agent", text: "Reproduzido. Estou abrindo um fix. Rastreando em SD-101.", time: "1h atrás"   },
      { id: 3, author: "Diego Ramos",  role: "user",  text: "Ótimo, obrigado pelo retorno!",                            time: "50min atrás" },
    ],
  },
  { id: "SD-102", title: "Export to CSV missing columns",   desc: "The exported file is missing the 'category' column.", status: "pending",    priority: "normal", cat: "reports",    user: "Diego Ramos",   created: "08/05/2026", msgs: [] },
  {
    id: "SD-103", title: "Billing invoice shows wrong VAT", desc: "VAT should be 20% but showing 12%.",
    status: "in_process", priority: "urgent", cat: "billing", user: "Patricia Silva", created: "06/05/2026",
    msgs: [
      { id: 1, author: "Patricia Silva", role: "user",  text: "A nota fiscal está com alíquota errada.",            time: "3h atrás" },
      { id: 2, author: "Alex Morgan",    role: "agent", text: "Estamos verificando com a equipe fiscal.",           time: "2h atrás" },
    ],
  },
  { id: "SD-104", title: "Add SSO via Okta",                desc: "Need Okta SAML integration.",          status: "pending",    priority: "low",    cat: "enterprise", user: "Carlos Mota",   created: "09/05/2026", msgs: [] },
  {
    id: "SD-145", title: "Dashboard charts not loading",    desc: "Charts show blank after last update.",
    status: "done", priority: "high", cat: "dashboard", user: "Diego Ramos", created: "05/05/2026",
    msgs: [
      { id: 1, author: "Diego Ramos", role: "user",  text: "Os gráficos sumiram após a atualização.", time: "ontem" },
      { id: 2, author: "Alex Morgan", role: "agent", text: "Corrigido! Era um problema de cache.",    time: "ontem" },
    ],
  },
  {
    id: "SD-150", title: "Password reset email not arriving", desc: "Reset link never arrives.",
    status: "done", priority: "normal", cat: "account", user: "Patricia Silva", created: "04/05/2026",
    msgs: [
      { id: 1, author: "Patricia Silva", role: "user",  text: "Não estou recebendo o email de reset.", time: "2 dias atrás" },
      { id: 2, author: "Alex Morgan",    role: "agent", text: "Resolvido — era um filtro de spam.",    time: "2 dias atrás" },
    ],
  },
];

const KB_INIT = [
  { id: "KB-01", title: "Como redefinir sua senha",              cat: "account",   views: 234, helpful: 47, ticket: "SD-150", content: "1. Acesse a tela de login.\n2. Clique em 'Esqueci minha senha'.\n3. Digite seu e-mail.\n4. Verifique a caixa de entrada e a pasta de spam.\n5. Clique no link recebido em até 30 minutos.\n\nSe não receber, verifique filtros de spam ou entre em contato." },
  { id: "KB-02", title: "Problema com login no app mobile",      cat: "mobile",    views: 189, helpful: 39, ticket: "SD-101", content: "Causas comuns:\n• Versão desatualizada do app\n• Cache corrompido\n• Senha expirada\n\nSolução:\n1. Atualize o aplicativo na loja.\n2. Limpe o cache do app.\n3. Tente redefinir a senha.\n4. Reinstale o app se necessário." },
  { id: "KB-03", title: "Exportação de CSV — colunas faltando",  cat: "reports",   views: 98,  helpful: 21, ticket: "SD-102", content: "O problema ocorre quando há filtros ativos na listagem.\n\nSolução:\n1. Remova todos os filtros antes de exportar.\n2. Selecione 'Todas as colunas' nas opções de exportação.\n3. Se o problema persistir, tente o formato XLSX." },
  { id: "KB-04", title: "Gráficos do dashboard em branco",       cat: "dashboard", views: 156, helpful: 33, ticket: "SD-145", content: "Causa: problema de cache após atualizações do sistema.\n\nSolução imediata:\n1. Pressione Ctrl+Shift+R (hard refresh).\n2. Limpe o cache do navegador.\n3. Acesse em aba anônima para confirmar.\n\nSe persistir, entre em contato." },
];

const CHURN_DATA = {
  monthly: [
    { mes: "Jan", churn: 4.2, retencao: 95.8, tickets: 12, resolvidos: 11 },
    { mes: "Fev", churn: 3.8, retencao: 96.2, tickets: 15, resolvidos: 14 },
    { mes: "Mar", churn: 5.1, retencao: 94.9, tickets: 22, resolvidos: 18 },
    { mes: "Abr", churn: 4.7, retencao: 95.3, tickets: 19, resolvidos: 17 },
    { mes: "Mai", churn: 3.2, retencao: 96.8, tickets: 14, resolvidos: 14 },
  ],
  risco: [
    { name: "Alto risco",  value: 8,  color: "#ef4444" },
    { name: "Médio risco", value: 23, color: "#f59e0b" },
    { name: "Baixo risco", value: 69, color: "#22c55e" },
  ],
  clientes: [
    { nome: "Patricia Silva", tickets: 4, abertos: 2, ultimo: "3 dias",  risco: "alto",  score: 82 },
    { nome: "Carlos Mota",    tickets: 2, abertos: 1, ultimo: "7 dias",  risco: "medio", score: 61 },
    { nome: "Diego Ramos",    tickets: 3, abertos: 1, ultimo: "1 dia",   risco: "baixo", score: 34 },
    { nome: "Ana Ferreira",   tickets: 1, abertos: 0, ultimo: "15 dias", risco: "medio", score: 55 },
    { nome: "Bruno Castro",   tickets: 5, abertos: 3, ultimo: "1 dia",   risco: "alto",  score: 91 },
  ],
  motivos: [
    { motivo: "Tickets sem resposta",   count: 6 },
    { motivo: "Tempo de resolução",     count: 9 },
    { motivo: "Múltiplas reaberturas",  count: 4 },
    { motivo: "Feedback negativo",      count: 3 },
    { motivo: "Inatividade prolongada", count: 5 },
  ],
};

const USERS_DB = {
  agent: { name: "Alex Morgan",  email: "alex@helpdesk.io",  role: "agent", avatar: "AM" },
  user:  { name: "Diego Ramos",  email: "diego@empresa.com", role: "user",  avatar: "DR" },
};

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const m = S[status] || S.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
};

const RiscoBadge = ({ risco }) => {
  const map = {
    alto:  { color: "#ef4444", bg: "rgba(239,68,68,.12)",  label: "Alto"  },
    medio: { color: "#f59e0b", bg: "rgba(245,158,11,.12)", label: "Médio" },
    baixo: { color: "#22c55e", bg: "rgba(34,197,94,.12)",  label: "Baixo" },
  };
  const m = map[risco] || map.baixo;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
};

const Avatar = ({ label, size = 32, bg = "#3b82f6" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.34, fontWeight: 700, color: "#fff", fontFamily: "monospace",
  }}>{label}</div>
);

const Btn = ({ children, variant = "primary", full, style: s = {}, ...props }) => {
  const { C } = useTheme();
  const v = {
    primary: { background: C.accent,      color: "#fff",    border: "none"                          },
    ghost:   { background: "transparent", color: C.sub,     border: `1px solid ${C.border}`         },
    soft:    { background: C.accentDim,   color: C.accent,  border: "none"                          },
    danger:  { background: C.dangerDim,   color: C.danger,  border: "none"                          },
  };
  return (
    <button {...props} style={{
      ...v[variant], borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 600,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      gap: 6, transition: "opacity .15s", width: full ? "100%" : undefined, fontFamily: "inherit", ...s,
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {children}
    </button>
  );
};

const useInputStyle = () => {
  const { C } = useTheme();
  return {
    background: C.input, border: `1px solid ${C.border}`, borderRadius: 9,
    padding: "10px 14px", color: C.text, fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color .2s, background .2s",
  };
};

const Input = (props) => {
  const { C } = useTheme();
  const iStyle = useInputStyle();
  return (
    <input {...props} style={{ ...iStyle, ...props.style }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e  => e.target.style.borderColor = C.border} />
  );
};

const Textarea = (props) => {
  const { C } = useTheme();
  const iStyle = useInputStyle();
  return (
    <textarea {...props} style={{ ...iStyle, resize: "vertical", minHeight: 90, ...props.style }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e  => e.target.style.borderColor = C.border} />
  );
};

const Select = ({ children, ...props }) => {
  const iStyle = useInputStyle();
  return <select {...props} style={{ ...iStyle, cursor: "pointer" }}>{children}</select>;
};

const Field = ({ label, children, error }) => {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{label}</label>}
      {children}
      {error && <span style={{ fontSize: 11, color: C.danger }}>{error}</span>}
    </div>
  );
};

const StatCard = ({ label, value, color, icon, sub }) => {
  const { C } = useTheme();
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "20px 24px", display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", transition: "background .2s, border-color .2s",
    }}>
      <div>
        <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{label}</div>
        <div style={{ color: color || C.text, fontSize: 30, fontWeight: 700, marginTop: 6 }}>{value}</div>
        {sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 22, opacity: .7 }}>{icon}</span>
    </div>
  );
};

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
const ThemeToggle = ({ theme, toggle }) => {
  const isDark = theme === "dark";
  return (
    <button onClick={toggle} style={{
      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
      background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)",
      border: `1px solid ${isDark ? "#1e2d47" : "#dde3ed"}`,
      borderRadius: 20, padding: "5px 12px 5px 8px", transition: "all .2s",
    }}>
      <span style={{ fontSize: 14 }}>{isDark ? "🌙" : "☀️"}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#94a3b8" : "#4a5568" }}>
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, theme, toggle }) {
  const { C } = useTheme();
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setErr(""); setLoading(true);
    // TODO: substituir por POST /api/auth/login
    setTimeout(() => {
      if (email === "alex@helpdesk.io"  && pass === "123") return onLogin("agent");
      if (email === "diego@empresa.com" && pass === "123") return onLogin("user");
      setErr("E-mail ou senha inválidos."); setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif",
      transition: "background .2s",
    }}>
      <div style={{ position: "fixed", top: 16, right: 16 }}>
        <ThemeToggle theme={theme} toggle={toggle} />
      </div>
      <div style={{ width: 400 }}>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
          padding: 42, display: "flex", flexDirection: "column", gap: 28,
          transition: "background .2s, border-color .2s",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎧</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 22 }}>Service Desk</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Portal de Suporte — ERP Modular</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="E-mail">
              <Input type="email" placeholder="seu@email.com"
                value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} />
            </Field>
            <Field label="Senha">
              <Input type="password" placeholder="••••••••"
                value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && handle()} />
            </Field>
            {err && (
              <div style={{ background: C.dangerDim, border: `1px solid rgba(239,68,68,.25)`, borderRadius: 8, padding: "10px 14px", color: C.danger, fontSize: 13 }}>
                {err}
              </div>
            )}
            <Btn full onClick={handle} style={{ padding: "12px 0", fontSize: 14, marginTop: 4 }}>
              {loading ? "Entrando..." : "Entrar"}
            </Btn>
          </div>

          <div style={{ background: C.input, borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, transition: "background .2s" }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>CONTAS DEMO</div>
            {[
              ["Técnico (Alex)",  "alex@helpdesk.io",  "123"],
              ["Usuário (Diego)", "diego@empresa.com", "123"],
            ].map(([role, em, pw]) => (
              <div key={em} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.sub, fontSize: 12 }}>{role}</span>
                <span style={{ color: C.accent, fontSize: 11, fontFamily: "monospace" }}>{em} / {pw}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_AGENT = [
  { key: "dashboard", icon: "⊞", label: "Dashboard" },
  { key: "tickets",   icon: "🎫", label: "Tickets"   },
  { key: "messages",  icon: "💬", label: "Mensagens" },
  { key: "knowledge", icon: "📚", label: "Base KB"   },
  { key: "churn",     icon: "📊", label: "Churn"     },
  { key: "settings",  icon: "⚙",  label: "Config"    },
];
const NAV_USER = [
  { key: "dashboard", icon: "⊞", label: "Início"    },
  { key: "tickets",   icon: "🎫", label: "Tickets"   },
  { key: "messages",  icon: "💬", label: "Mensagens" },
  { key: "knowledge", icon: "📚", label: "Base KB"   },
  { key: "settings",  icon: "⚙",  label: "Config"    },
];

function Sidebar({ role, page, setPage, user, onLogout }) {
  const nav = role === "agent" ? NAV_AGENT : NAV_USER;
  return (
    // Sidebar sempre com cores fixas escuras — não afetado pelo tema
    <div style={{ width: 112, background: SIDEBAR.bg, display: "flex", flexDirection: "column", borderRight: `1px solid ${SIDEBAR.border}`, flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "18px 8px 14px", borderBottom: `1px solid ${SIDEBAR.border}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: SIDEBAR.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎧</div>
        <div style={{ color: SIDEBAR.text, fontSize: 11, fontWeight: 700 }}>Helpdesk</div>
        <div style={{ color: SIDEBAR.muted, fontSize: 9 }}>Service Desk</div>
      </div>

      <div style={{ padding: "8px 0 2px 10px", color: SIDEBAR.muted, fontSize: 9, fontWeight: 700, letterSpacing: 1, marginTop: 8 }}>MENU</div>

      {nav.map(n => {
        const active = page === n.key;
        return (
          <button key={n.key} onClick={() => setPage(n.key)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "10px 4px", border: "none", cursor: "pointer",
            background: active ? "rgba(59,130,246,.12)" : "transparent",
            borderLeft: active ? `3px solid ${SIDEBAR.accent}` : "3px solid transparent",
            color: active ? SIDEBAR.text : SIDEBAR.muted, transition: "all .15s",
          }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{n.label}</span>
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <div style={{ padding: "12px 8px", borderTop: `1px solid ${SIDEBAR.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Avatar label={user.avatar} size={28} bg={role === "agent" ? "#7c3aed" : SIDEBAR.accent} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: SIDEBAR.text, fontSize: 10, fontWeight: 600 }}>{user.name.split(" ")[0]}</div>
          <div style={{ color: SIDEBAR.muted, fontSize: 9, textTransform: "uppercase" }}>{role}</div>
        </div>
        <button onClick={onLogout} title="Sair" style={{ background: "none", border: "none", color: SIDEBAR.muted, cursor: "pointer", fontSize: 14 }}>⇥</button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, onNew, theme, toggle }) {
  const { C } = useTheme();
  return (
    <div style={{
      height: 52, borderBottom: `1px solid ${C.border}`, display: "flex",
      alignItems: "center", padding: "0 22px", gap: 12, flexShrink: 0,
      background: C.card, transition: "background .2s, border-color .2s",
    }}>
      <span style={{ color: C.muted, fontSize: 13 }}>⊟</span>
      <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{title}</span>
      <div style={{ flex: 1 }} />
      <ThemeToggle theme={theme} toggle={toggle} />
      {onNew && <Btn onClick={onNew} style={{ padding: "7px 14px", fontSize: 12 }}>+ Novo ticket</Btn>}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.muted, fontSize: 12, transition: "background .2s" }}>
        🔍 Buscar...
      </div>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13, cursor: "pointer" }}>🔔</div>
    </div>
  );
}

// ─── MODAL NOVO TICKET ────────────────────────────────────────────────────────
function NovoTicketModal({ onClose, onCreate }) {
  const { C } = useTheme();
  const [f, setF]     = useState({ title: "", desc: "", priority: "normal", cat: "" });
  const [err, setErr] = useState({});
  const [ok, setOk]   = useState(false);
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErr(e => ({ ...e, [k]: "" })); };

  const submit = () => {
    const e = {};
    if (!f.title.trim()) e.title = "Obrigatório";
    if (!f.desc.trim())  e.desc  = "Obrigatório";
    if (Object.keys(e).length) return setErr(e);
    // TODO: POST /api/tickets com { title, desc, priority, cat }
    onCreate(f); setOk(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 36, width: 500, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 30px 70px rgba(0,0,0,.6)", transition: "background .2s" }}>
        {!ok ? <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 18 }}>Abrir novo chamado</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Descreva o problema com detalhes.</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          <Field label="Título *" error={err.title}>
            <Input placeholder="Ex: Não consigo acessar o aplicativo" value={f.title} onChange={e => set("title", e.target.value)} />
          </Field>
          <Field label="Descrição *" error={err.desc}>
            <Textarea placeholder="Descreva o problema, quando começou, o que já tentou..." value={f.desc} onChange={e => set("desc", e.target.value)} style={{ minHeight: 110 }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Prioridade">
              <Select value={f.priority} onChange={e => set("priority", e.target.value)}>
                <option value="low">↓ Baixa</option>
                <option value="normal">= Normal</option>
                <option value="high">↑ Alta</option>
                <option value="urgent">⊕ Urgente</option>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select value={f.cat} onChange={e => set("cat", e.target.value)}>
                <option value="">Selecione...</option>
                <option value="account">Conta / Acesso</option>
                <option value="billing">Financeiro</option>
                <option value="mobile">App Mobile</option>
                <option value="reports">Relatórios</option>
                <option value="dashboard">Dashboard</option>
                <option value="other">Outro</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn onClick={submit}>Enviar chamado</Btn>
          </div>
        </> : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 20, marginTop: 16 }}>Chamado aberto!</div>
            <div style={{ color: C.muted, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
              Sua solicitação foi registrada.<br />Nossa equipe responderá em breve.
            </div>
            <Btn onClick={onClose} style={{ margin: "22px auto 0" }}>Fechar</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD AGENTE ─────────────────────────────────────────────────────────
function DashboardAgent({ tickets, setPage, setActiveTicket }) {
  const { C } = useTheme();
  const open   = tickets.filter(t => t.status === "pending").length;
  const inprog = tickets.filter(t => t.status === "in_process").length;
  const done   = tickets.filter(t => t.status === "done").length;
  const urgent = tickets.filter(t => t.priority === "urgent").length;

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ color: C.text, fontSize: 24, fontWeight: 700 }}>Bom dia, Alex 👋</div>
        <div style={{ color: C.muted, fontSize: 13 }}>Veja o que está acontecendo no seu service desk hoje.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <StatCard label="ABERTOS"      value={open}   color={C.success} icon="📬" />
        <StatCard label="EM ANDAMENTO" value={inprog} color={C.warning} icon="🔄" />
        <StatCard label="RESOLVIDOS"   value={done}   color={C.accent}  icon="✅" />
        <StatCard label="URGENTES"     value={urgent} color={C.danger}  icon="⚠️" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "background .2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>Atividade recente</div>
            <button onClick={() => setPage("tickets")} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer" }}>Ver todos →</button>
          </div>
          {tickets.map(t => (
            <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("tickets"); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 8, cursor: "pointer", borderBottom: `1px solid ${C.border}`, transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(128,128,128,.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ color: C.muted, fontSize: 11, minWidth: 52, fontFamily: "monospace" }}>{t.id}</span>
              <span style={{ color: C.text, fontSize: 13, flex: 1 }}>{t.title}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>{t.user}</span>
              <Badge status={t.status} />
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "background .2s" }}>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Conversas ativas</div>
          {tickets.filter(t => t.msgs.length > 0).map(t => (
            <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("messages"); }}
              style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{t.msgs.length} mensagens · {t.user} · {t.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD USUÁRIO — botão único no Topbar ────────────────────────────────
function DashboardUser({ user, tickets, setPage, setActiveTicket }) {
  const { C } = useTheme();
  const mine = tickets.filter(t => t.user === user.name);

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ color: C.text, fontSize: 24, fontWeight: 700 }}>Olá, {user.name.split(" ")[0]} 👋</div>
        <div style={{ color: C.muted, fontSize: 13 }}>Acompanhe seus chamados de suporte.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <StatCard label="ABERTOS"      value={mine.filter(t => t.status === "pending").length}    color={C.success} icon="📬" />
        <StatCard label="EM ANDAMENTO" value={mine.filter(t => t.status === "in_process").length} color={C.warning} icon="🔄" />
        <StatCard label="RESOLVIDOS"   value={mine.filter(t => t.status === "done").length}       color={C.accent}  icon="✅" />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "background .2s" }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Meus tickets</div>
        {mine.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>
            <div style={{ fontSize: 36 }}>🎫</div>
            <div style={{ marginTop: 10 }}>Nenhum ticket ainda. Use o botão "+" no topo para abrir um chamado.</div>
          </div>
        ) : mine.map(t => (
          <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("messages"); }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderRadius: 8, cursor: "pointer", borderBottom: `1px solid ${C.border}`, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(128,128,128,.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ color: C.muted, fontSize: 11, minWidth: 52, fontFamily: "monospace" }}>{t.id}</span>
            <span style={{ color: C.text, fontSize: 13, flex: 1 }}>{t.title}</span>
            <Badge status={t.status} />
            {t.msgs.length > 0 && <span style={{ color: C.muted, fontSize: 11 }}>💬 {t.msgs.length}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TICKETS BOARD (AGENTE) ───────────────────────────────────────────────────
function TicketsBoard({ tickets, setTickets, activeTicket, setActiveTicket, setPage }) {
  const { C } = useTheme();
  const cols = ["pending", "in_process", "done", "canceled"];
  const colLabel = { pending: "ABERTO", in_process: "EM ANDAMENTO", done: "RESOLVIDO", canceled: "CANCELADO" };
  const move = (id, st) => setTickets(ts => ts.map(t => t.id === id ? { ...t, status: st } : t));
  // TODO: PATCH /api/tickets/:id { status }

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 18 }}>Board de Tickets</div>
        <div style={{ color: C.muted, fontSize: 12 }}>{tickets.length} tickets no pipeline</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {cols.map(col => {
          const m = S[col]; const list = tickets.filter(t => t.status === col);
          return (
            <div key={col}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: m.color }} />
                <span style={{ color: C.sub, fontSize: 11, fontWeight: 700 }}>{colLabel[col]}</span>
                <span style={{ marginLeft: "auto", background: C.border, color: C.muted, borderRadius: 10, fontSize: 10, padding: "1px 7px" }}>{list.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {list.map(t => (
                  <div key={t.id}
                    style={{ background: C.card, border: `1px solid ${activeTicket === t.id ? C.accent : C.border}`, borderRadius: 10, padding: 14, cursor: "pointer", transition: "border-color .15s, background .2s" }}
                    onClick={() => setActiveTicket(activeTicket === t.id ? null : t.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: C.muted, fontSize: 10, fontFamily: "monospace" }}>{t.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: P[t.priority]?.color }}>{P[t.priority]?.label}</span>
                    </div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{t.title}</div>
                    {t.cat && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: C.accentDim, color: C.accent }}>{t.cat}</span>}
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>{t.user}</div>
                    {t.msgs.length > 0 && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>💬 {t.msgs.length}</div>}
                    {activeTicket === t.id && (
                      <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {cols.filter(c => c !== col).map(c => (
                          <button key={c} onClick={e => { e.stopPropagation(); move(t.id, c); }}
                            style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, cursor: "pointer", background: S[c].bg, color: S[c].color, border: "none" }}>
                            → {S[c].label}
                          </button>
                        ))}
                        <button onClick={e => { e.stopPropagation(); setPage("messages"); }}
                          style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, cursor: "pointer", background: C.accentDim, color: C.accent, border: "none" }}>
                          💬 Chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TICKETS LISTA (USUÁRIO) ──────────────────────────────────────────────────
function TicketsUser({ tickets, user, setActiveTicket, setPage }) {
  const { C } = useTheme();
  const [filtro, setFiltro] = useState("todos");
  const mine = tickets.filter(t => t.user === user.name);
  const list = filtro === "todos" ? mine : mine.filter(t => t.status === filtro);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 18 }}>Meus Tickets</div>
        <div style={{ color: C.muted, fontSize: 13 }}>{mine.length} chamado(s) · use o botão "+" no topo para abrir um novo</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["todos", "Todos"], ["pending", "Abertos"], ["in_process", "Em andamento"], ["done", "Resolvidos"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all .15s",
            background: filtro === k ? C.accent : "rgba(128,128,128,.1)",
            color: filtro === k ? "#fff" : C.muted,
          }}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
          <div style={{ fontSize: 40 }}>🎫</div>
          <div style={{ marginTop: 12 }}>Nenhum ticket encontrado.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(t => (
            <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("messages"); }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "border-color .15s, transform .1s, background .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ color: C.muted, fontSize: 11, minWidth: 52, fontFamily: "monospace" }}>{t.id}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                  {t.cat && <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{t.cat} · {t.created}</div>}
                </div>
                <Badge status={t.status} />
                {t.msgs.length > 0 && <span style={{ color: C.muted, fontSize: 12 }}>💬 {t.msgs.length}</span>}
                <span style={{ color: C.accent, fontSize: 12 }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MENSAGENS / CHAT ─────────────────────────────────────────────────────────
function Mensagens({ tickets, setTickets, user, role, activeId, setActiveId }) {
  const { C } = useTheme();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const myTickets = role === "user" ? tickets.filter(t => t.user === user.name) : tickets;
  const active = myTickets.find(t => t.id === activeId) || myTickets[0];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.msgs?.length]);

  const send = () => {
    if (!input.trim() || !active) return;
    const msg = { id: Date.now(), author: user.name, role, text: input.trim(), time: "agora" };
    // TODO: POST /api/tickets/:id/messages { text }
    setTickets(ts => ts.map(t => t.id === active.id ? { ...t, msgs: [...t.msgs, msg] } : t));
    setInput("");
    if (role === "user") {
      setTimeout(() => {
        const auto = { id: Date.now() + 1, author: "Alex Morgan", role: "agent", text: "Recebi sua mensagem! Estou verificando e retorno em breve 👍", time: "agora" };
        setTickets(ts => ts.map(t => t.id === active.id ? { ...t, msgs: [...t.msgs, msg, auto] } : t));
      }, 1600);
    }
  };

  const iStyle = { background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 16px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", flex: 1, transition: "border-color .2s, background .2s" };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Lista de conversas */}
      <div style={{ width: 250, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, color: C.text, fontWeight: 600, fontSize: 14 }}>Conversas</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {myTickets.map(t => {
            const last = t.msgs[t.msgs.length - 1];
            const isA = active?.id === t.id;
            return (
              <div key={t.id} onClick={() => setActiveId(t.id)}
                style={{ padding: "13px 16px", cursor: "pointer", background: isA ? "rgba(59,130,246,.1)" : "transparent", borderLeft: isA ? `3px solid ${C.accent}` : "3px solid transparent", borderBottom: `1px solid ${C.border}`, transition: "background .15s" }}
                onMouseEnter={e => !isA && (e.currentTarget.style.background = "rgba(128,128,128,.04)")}
                onMouseLeave={e => !isA && (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: isA ? C.text : C.sub, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{t.title}</span>
                  <span style={{ color: C.muted, fontSize: 10 }}>{last?.time || ""}</span>
                </div>
                <div style={{ color: C.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>
                  {last ? `${last.author}: ${last.text}` : "Sem mensagens"}
                </div>
                <Badge status={t.status} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Área de chat */}
      {active ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{active.title}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{active.id} · {active.user} · {active.created}</div>
            </div>
            <Badge status={active.status} />
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 10px", display: "flex", flexDirection: "column", gap: 18 }}>
            {active.msgs.length === 0
              ? <div style={{ textAlign: "center", color: C.muted, marginTop: 60 }}>
                  <div style={{ fontSize: 36 }}>💬</div>
                  <div style={{ marginTop: 10, fontSize: 14 }}>Nenhuma mensagem ainda. Comece a conversa!</div>
                </div>
              : active.msgs.map(m => {
                  const isMe = m.author === user.name;
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                      <Avatar label={m.author.split(" ").map(w => w[0]).join("")} size={28} bg={m.role === "agent" ? "#7c3aed" : C.accent} />
                      <div style={{ maxWidth: "65%" }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, textAlign: isMe ? "right" : "left" }}>
                          {isMe ? "Você" : m.author} · {m.time}
                        </div>
                        <div style={{
                          background: isMe ? C.accent : C.card,
                          border: `1px solid ${isMe ? C.accent : C.border}`,
                          borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          padding: "10px 16px", color: isMe ? "#fff" : C.text, fontSize: 14, lineHeight: 1.55,
                          transition: "background .2s",
                        }}>
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Escreva uma mensagem..." style={iStyle}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e  => e.target.style.borderColor = C.border} />
            <button onClick={send} style={{ width: 40, height: 40, borderRadius: 10, background: C.accent, border: "none", cursor: "pointer", fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>→</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>Selecione uma conversa</div>
      )}
    </div>
  );
}

// ─── BASE DE CONHECIMENTO ─────────────────────────────────────────────────────
function KnowledgeBase({ role, tickets }) {
  const { C } = useTheme();
  const [articles, setArticles] = useState(KB_INIT);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [catFilter, setCat]     = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: "", cat: "", content: "", ticket: "" });
  const [formErr, setFormErr]   = useState({});

  const cats = ["todos", "account", "mobile", "billing", "reports", "dashboard"];

  const filtered = articles.filter(a => {
    const matchS = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchC = catFilter === "todos" || a.cat === catFilter;
    return matchS && matchC;
  });

  const markHelpful = (id) => {
    // TODO: POST /api/kb/:id/helpful
    setArticles(as => as.map(a => a.id === id ? { ...a, helpful: a.helpful + 1 } : a));
  };

  // CORRIGIDO: validação, id único e abre artigo após criação
  const addArticle = () => {
    const e = {};
    if (!form.title.trim())   e.title   = "Obrigatório";
    if (!form.content.trim()) e.content = "Obrigatório";
    if (Object.keys(e).length) return setFormErr(e);

    const newA = {
      id:      `KB-${String(articles.length + 1).padStart(2, "0")}`,
      title:   form.title.trim(),
      cat:     form.cat || "other",
      views:   0,
      helpful: 0,
      ticket:  form.ticket,
      content: form.content.trim(),
    };
    // TODO: POST /api/kb com newA
    setArticles(as => [newA, ...as]);
    setSelected(newA); // abre o artigo recém-criado
    setForm({ title: "", cat: "", content: "", ticket: "" });
    setFormErr({});
    setShowForm(false);
  };

  const iStyle = { background: C.input, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 12px", color: C.text, fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s, background .2s" };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Lista de artigos */}
      <div style={{ width: 300, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Base de Conhecimento</div>
            {role === "agent" && (
              <button onClick={() => { setShowForm(!showForm); setFormErr({}); }}
                style={{ background: C.accentDim, color: C.accent, border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                {showForm ? "✕ Fechar" : "+ Artigo"}
              </button>
            )}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar artigos..." style={iStyle}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none",
                background: catFilter === c ? C.accent : "rgba(128,128,128,.1)",
                color: catFilter === c ? "#fff" : C.muted,
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Formulário novo artigo */}
        {showForm && role === "agent" && (
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: C.input, display: "flex", flexDirection: "column", gap: 10, transition: "background .2s" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <input placeholder="Título do artigo *" value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErr(v => ({ ...v, title: "" })); }}
                style={{ ...iStyle, borderColor: formErr.title ? C.danger : C.border }}
                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = formErr.title ? C.danger : C.border} />
              {formErr.title && <span style={{ fontSize: 11, color: C.danger }}>{formErr.title}</span>}
            </div>
            <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))} style={{ ...iStyle, cursor: "pointer" }}>
              <option value="">Categoria...</option>
              {["account", "mobile", "billing", "reports", "dashboard", "other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.ticket} onChange={e => setForm(f => ({ ...f, ticket: e.target.value }))} style={{ ...iStyle, cursor: "pointer" }}>
              <option value="">Ticket origem (opcional)</option>
              {tickets.filter(t => t.status === "done").map(t => <option key={t.id} value={t.id}>{t.id} — {t.title.slice(0, 30)}</option>)}
            </select>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <textarea placeholder="Conteúdo do artigo *" value={form.content}
                onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setFormErr(v => ({ ...v, content: "" })); }}
                style={{ ...iStyle, minHeight: 90, resize: "vertical", borderColor: formErr.content ? C.danger : C.border }}
                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = formErr.content ? C.danger : C.border} />
              {formErr.content && <span style={{ fontSize: 11, color: C.danger }}>{formErr.content}</span>}
            </div>
            <Btn onClick={addArticle} full>Publicar artigo</Btn>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0
            ? <div style={{ padding: 24, color: C.muted, textAlign: "center", fontSize: 13 }}>Nenhum artigo encontrado.</div>
            : filtered.map(a => (
              <div key={a.id} onClick={() => setSelected(a)}
                style={{ padding: "14px 16px", cursor: "pointer", background: selected?.id === a.id ? "rgba(59,130,246,.1)" : "transparent", borderLeft: selected?.id === a.id ? `3px solid ${C.accent}` : "3px solid transparent", borderBottom: `1px solid ${C.border}`, transition: "background .15s" }}
                onMouseEnter={e => selected?.id !== a.id && (e.currentTarget.style.background = "rgba(128,128,128,.04)")}
                onMouseLeave={e => selected?.id !== a.id && (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: C.accentDim, color: C.accent }}>{a.cat}</span>
                  <span style={{ color: C.muted, fontSize: 10 }}>{a.id}</span>
                </div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{a.title}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: C.muted, fontSize: 11 }}>👁 {a.views}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>👍 {a.helpful}</span>
                  {a.ticket && <span style={{ color: C.muted, fontSize: 11 }}>🎫 {a.ticket}</span>}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Conteúdo do artigo */}
      {selected ? (
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: C.accentDim, color: C.accent }}>{selected.cat}</span>
              <span style={{ color: C.muted, fontSize: 12 }}>{selected.id}</span>
              {selected.ticket && <span style={{ color: C.muted, fontSize: 12 }}>· Origem: {selected.ticket}</span>}
            </div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{selected.title}</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted, fontSize: 12 }}>👁 {selected.views} visualizações</span>
              <span style={{ color: C.muted, fontSize: 12 }}>👍 {selected.helpful} acharam útil</span>
            </div>
            <div style={{ color: C.text, fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-line" }}>{selected.content}</div>
            <div style={{ marginTop: 36, padding: "20px 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, transition: "background .2s" }}>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 12 }}>Este artigo foi útil para você?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="soft" onClick={() => markHelpful(selected.id)}>👍 Sim, ajudou!</Btn>
                <Btn variant="ghost">👎 Não resolveu</Btn>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: C.muted }}>
          <div style={{ fontSize: 48 }}>📚</div>
          <div style={{ fontSize: 15 }}>Selecione um artigo para ler</div>
          <div style={{ fontSize: 13 }}>A base de conhecimento reúne soluções dos tickets resolvidos.</div>
        </div>
      )}
    </div>
  );
}

// ─── ANÁLISE DE CHURN ─────────────────────────────────────────────────────────
function ChurnAnalysis({ tickets }) {
  const { C } = useTheme();
  const [tab, setTab] = useState("visao");
  const tooltipStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };
  const tickStyle    = { fill: C.muted, fontSize: 11 };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 20 }}>Análise de Churn</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Identifique clientes em risco com base nos dados de tickets e atendimento.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="CHURN MÉDIO (MÊS)"   value="4.2%"  color={C.warning} icon="📉" sub="↑ vs mês anterior" />
        <StatCard label="CLIENTES EM RISCO"    value="8"     color={C.danger}  icon="⚠️" sub="alto risco" />
        <StatCard label="TAXA DE RETENÇÃO"     value="95.8%" color={C.success} icon="🔒" sub="média mensal" />
        <StatCard label="SEM RESPOSTA (48H)"   value="3"     color={C.danger}  icon="📭" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["visao", "Visão Geral"], ["clientes", "Clientes em Risco"], ["motivos", "Principais Motivos"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all .15s",
            background: tab === k ? C.accent : "rgba(128,128,128,.1)",
            color: tab === k ? "#fff" : C.muted,
          }}>{l}</button>
        ))}
      </div>

      {tab === "visao" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { title: "Taxa de Churn Mensal (%)", chart: <LineChart data={CHURN_DATA.monthly}><XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} /><YAxis tick={tickStyle} axisLine={false} tickLine={false} domain={[0, 8]} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="churn" stroke={C.warning} strokeWidth={2.5} dot={{ fill: C.warning, r: 4 }} name="Churn %" /></LineChart> },
            { title: "Distribuição de Risco (%)", chart: <PieChart><Pie data={CHURN_DATA.risco} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name">{CHURN_DATA.risco.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12, color: C.sub }} /></PieChart> },
            { title: "Tickets Abertos vs Resolvidos", chart: <BarChart data={CHURN_DATA.monthly} barGap={4}><XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} /><YAxis tick={tickStyle} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="tickets" fill={C.danger} radius={[4, 4, 0, 0]} name="Abertos" /><Bar dataKey="resolvidos" fill={C.success} radius={[4, 4, 0, 0]} name="Resolvidos" /><Legend wrapperStyle={{ fontSize: 12, color: C.sub }} /></BarChart> },
            { title: "Taxa de Retenção Mensal (%)", chart: <LineChart data={CHURN_DATA.monthly}><XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} /><YAxis tick={tickStyle} axisLine={false} tickLine={false} domain={[92, 100]} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="retencao" stroke={C.success} strokeWidth={2.5} dot={{ fill: C.success, r: 4 }} name="Retenção %" /></LineChart> },
          ].map(({ title, chart }, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "background .2s" }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 18 }}>{title}</div>
              <ResponsiveContainer width="100%" height={200}>{chart}</ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {tab === "clientes" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", transition: "background .2s" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: .5 }}>
            <span>CLIENTE</span><span>TICKETS</span><span>ABERTOS</span><span>ÚLT. CONTATO</span><span>RISCO</span><span>SCORE</span>
          </div>
          {CHURN_DATA.clientes.map((c, i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", alignItems: "center", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(128,128,128,.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar label={c.nome.split(" ").map(w => w[0]).join("")} size={28} bg={c.risco === "alto" ? C.danger : c.risco === "medio" ? C.warning : C.success} />
                <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{c.nome}</span>
              </div>
              <span style={{ color: C.sub, fontSize: 13 }}>{c.tickets}</span>
              <span style={{ color: c.abertos > 0 ? C.danger : C.success, fontSize: 13 }}>{c.abertos}</span>
              <span style={{ color: C.sub, fontSize: 13 }}>{c.ultimo}</span>
              <RiscoBadge risco={c.risco} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.score}%`, borderRadius: 4, background: c.score >= 75 ? C.danger : c.score >= 50 ? C.warning : C.success }} />
                </div>
                <span style={{ color: C.sub, fontSize: 11, minWidth: 28 }}>{c.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "motivos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "background .2s" }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Principais causas de risco</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CHURN_DATA.motivos} layout="vertical">
                <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="motivo" tick={{ fill: C.sub, fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={C.accent} radius={[0, 4, 4, 0]} name="Casos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "background .2s" }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Recomendações de ação</div>
            {[
              { icon: "⚡", color: C.danger,  title: "Urgente — Bruno Castro",   desc: "5 tickets abertos. Ligar em até 24h." },
              { icon: "⚡", color: C.danger,  title: "Urgente — Patricia Silva", desc: "4 tickets, 2 sem resposta há 3 dias." },
              { icon: "⚠️", color: C.warning, title: "Atenção — Carlos Mota",    desc: "Score 61%. Acompanhar resolução." },
              { icon: "✅", color: C.success, title: "Estável — Diego Ramos",    desc: "Score baixo. Manter atendimento." },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <div>
                  <div style={{ color: r.color, fontSize: 13, fontWeight: 600 }}>{r.title}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ user, role }) {
  const { C } = useTheme();
  return (
    <div style={{ padding: 28 }}>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Configurações</div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Perfil e preferências.</div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, maxWidth: 440, transition: "background .2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
          <Avatar label={user.avatar} size={52} bg={role === "agent" ? "#7c3aed" : C.accent} />
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{user.name}</div>
            <div style={{ color: C.muted, fontSize: 13 }}>{user.email}</div>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, marginTop: 6, display: "inline-block", background: role === "agent" ? C.purpleDim : C.accentDim, color: role === "agent" ? C.purple : C.accent, fontWeight: 600 }}>
              {role === "agent" ? "Técnico / Agente" : "Usuário / Cliente"}
            </span>
          </div>
        </div>
        {[["Nome", user.name], ["E-mail", user.email], ["Papel", role === "agent" ? "Agente de Suporte" : "Cliente"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            <span style={{ color: C.muted, fontSize: 13, minWidth: 90 }}>{k}</span>
            <span style={{ color: C.text, fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole]                   = useState(null);
  const [page, setPage]                   = useState("dashboard");
  const [tickets, setTickets]             = useState(TICKETS_INIT);
  const [activeTicket, setActiveTicket]   = useState("SD-101");
  const [showNew, setShowNew]             = useState(false);
  const [theme, setTheme]                 = useState("dark");

  const C = theme === "dark" ? C_DARK : C_LIGHT;

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  const user = role ? USERS_DB[role] : null;

  const handleCreate = (form) => {
    const t = {
      id:      `SD-${Math.floor(200 + Math.random() * 800)}`,
      title:   form.title,
      desc:    form.desc,
      status:  "pending",
      priority: form.priority,
      cat:     form.cat,
      user:    user.name,
      created: new Date().toLocaleDateString("pt-BR"),
      msgs:    [],
    };
    // TODO: POST /api/tickets com o objeto acima
    setTickets(ts => [t, ...ts]);
    setActiveTicket(t.id);
  };

  const PAGE_TITLE = {
    dashboard: "Dashboard", tickets: "Tickets", messages: "Mensagens",
    knowledge: "Base de Conhecimento", churn: "Análise de Churn", settings: "Configurações",
  };

  const showNewBtn = page === "dashboard" || page === "tickets";

  if (!role) {
    return (
      <ThemeCtx.Provider value={{ theme, C }}>
        <Login onLogin={r => { setRole(r); setPage("dashboard"); }} theme={theme} toggle={toggle} />
      </ThemeCtx.Provider>
    );
  }

  return (
    <ThemeCtx.Provider value={{ theme, C }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',sans-serif", overflow: "hidden", transition: "background .2s, color .2s" }}>

        <Sidebar role={role} page={page} setPage={setPage} user={user}
          onLogout={() => { setRole(null); setPage("dashboard"); }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar title={PAGE_TITLE[page]} onNew={showNewBtn ? () => setShowNew(true) : undefined} theme={theme} toggle={toggle} />

          <div style={{ flex: 1, overflowY: ["messages", "knowledge", "churn"].includes(page) ? "hidden" : "auto" }}>
            {page === "dashboard" && role === "agent" && <DashboardAgent tickets={tickets} setPage={setPage} setActiveTicket={setActiveTicket} />}
            {page === "dashboard" && role === "user"  && <DashboardUser  user={user} tickets={tickets} setPage={setPage} setActiveTicket={setActiveTicket} />}

            {page === "tickets"   && role === "agent" && <TicketsBoard tickets={tickets} setTickets={setTickets} activeTicket={activeTicket} setActiveTicket={setActiveTicket} setPage={setPage} />}
            {page === "tickets"   && role === "user"  && <TicketsUser  tickets={tickets} user={user} setActiveTicket={setActiveTicket} setPage={setPage} />}

            {page === "messages"  && <Mensagens  tickets={tickets} setTickets={setTickets} user={user} role={role} activeId={activeTicket} setActiveId={setActiveTicket} />}
            {page === "knowledge" && <KnowledgeBase role={role} tickets={tickets} />}
            {page === "churn"     && role === "agent" && <ChurnAnalysis tickets={tickets} />}
            {page === "settings"  && <Settings user={user} role={role} />}
          </div>
        </div>

        {showNew && (
          <NovoTicketModal
            onClose={() => setShowNew(false)}
            onCreate={form => { handleCreate(form); setShowNew(false); }}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}