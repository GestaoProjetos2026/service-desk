import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import * as authApi from "./api/auth.js";
import * as ticketsApi from "./api/tickets.js";
import { ApiError, getToken, API_BASE } from "./api/client.js";

// ─── DESIGN TOKENS (ADR Comitê UX/UI) ────────────────────────────────────────
const T = {
  // Backgrounds
  bgApp:         "#001233",
  bgSidebar:     "#001845",
  bgHeader:      "#001233",
  bgSurface:     "#0b1328",
  bgSurface2:    "#101a33",
  bgHover:       "#16213f",
  bgElevated:    "#111c36",
  bgInput:       "#070f22",
  // Borders
  borderSubtle:  "rgba(151,157,172,0.12)",
  borderDefault: "rgba(151,157,172,0.20)",
  borderStrong:  "rgba(151,157,172,0.32)",
  // Brand
  brand:         "#0466c8",
  brandHover:    "#0353a4",
  brandActive:   "#023e7d",
  brandMuted:    "rgba(4,102,200,0.16)",
  // Text
  textPrimary:   "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted:     "#979dac",
  textDisabled:  "#5c677d",
  // Status
  success:       "#22c55e",
  successMuted:  "rgba(34,197,94,0.14)",
  successBorder: "rgba(34,197,94,0.28)",
  warning:       "#f59e0b",
  warningMuted:  "rgba(245,158,11,0.14)",
  warningBorder: "rgba(245,158,11,0.28)",
  danger:        "#ef4444",
  dangerMuted:   "rgba(239,68,68,0.14)",
  dangerBorder:  "rgba(239,68,68,0.28)",
  info:          "#38bdf8",
  infoMuted:     "rgba(56,189,248,0.14)",
  infoBorder:    "rgba(56,189,248,0.28)",
  // Shadows
  shadowSm:      "0 1px 2px rgba(0,0,0,0.24)",
  shadowMd:      "0 8px 24px rgba(0,0,0,0.28)",
  shadowLg:      "0 16px 48px rgba(0,0,0,0.36)",
};

// ─── STATUS / PRIORIDADE ──────────────────────────────────────────────────────
const STATUS = {
  pending:    { label: "Aberto",       color: T.success, bg: T.successMuted, border: T.successBorder },
  in_process: { label: "Em andamento", color: T.warning, bg: T.warningMuted, border: T.warningBorder },
  done:       { label: "Resolvido",    color: T.info,    bg: T.infoMuted,    border: T.infoBorder    },
  canceled:   { label: "Cancelado",    color: T.danger,  bg: T.dangerMuted,  border: T.dangerBorder  },
};
const PRIORITY = {
  low:    { label: "Baixa",   color: T.textDisabled },
  normal: { label: "Normal",  color: T.brand        },
  high:   { label: "Alta",    color: T.warning      },
  urgent: { label: "Urgente", color: T.danger       },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: substituir por chamadas à API REST quando o backend estiver pronto
// Exemplo: const tickets = await fetch('/api/v1/tickets').then(r => r.json())
const TICKETS_INIT = [
  {
    id: "SD-101", title: "Falha de login no app mobile",
    desc: "Usuário relata 'credenciais inválidas' no iPhone 14.",
    status: "in_process", priority: "high", cat: "mobile",
    user: "Diego Ramos", created: "07/05/2026",
    msgs: [
      { id: 1, author: "Diego Ramos", role: "user",  text: "Ainda não consigo acessar pelo iPhone.",       time: "2h atrás"   },
      { id: 2, author: "Alex Morgan", role: "agent", text: "Reproduzi o erro. Abrindo fix — SD-101.",      time: "1h atrás"   },
      { id: 3, author: "Diego Ramos", role: "user",  text: "Ótimo, obrigado pelo retorno rápido!",         time: "50min atrás" },
    ],
  },
  { id: "SD-102", title: "Exportação CSV com colunas faltando", desc: "Coluna 'categoria' ausente no arquivo exportado.", status: "pending",    priority: "normal", cat: "reports",    user: "Diego Ramos",   created: "08/05/2026", msgs: [] },
  {
    id: "SD-103", title: "Nota fiscal com alíquota incorreta",  desc: "IVA exibido como 12% mas deveria ser 20%.",
    status: "in_process", priority: "urgent", cat: "billing", user: "Patricia Silva", created: "06/05/2026",
    msgs: [
      { id: 1, author: "Patricia Silva", role: "user",  text: "A nota fiscal está com alíquota errada.",   time: "3h atrás" },
      { id: 2, author: "Alex Morgan",    role: "agent", text: "Verificando com a equipe fiscal.",          time: "2h atrás" },
    ],
  },
  { id: "SD-104", title: "Integração SSO via Okta",             desc: "Necessidade de integração SAML com Okta.",       status: "pending",    priority: "low",    cat: "enterprise", user: "Carlos Mota",   created: "09/05/2026", msgs: [] },
  {
    id: "SD-145", title: "Gráficos do dashboard em branco",     desc: "Gráficos não carregam após última atualização.",
    status: "done", priority: "high", cat: "dashboard", user: "Diego Ramos", created: "05/05/2026",
    msgs: [
      { id: 1, author: "Diego Ramos", role: "user",  text: "Os gráficos sumiram após a atualização.", time: "ontem" },
      { id: 2, author: "Alex Morgan", role: "agent", text: "Corrigido — problema de cache.",          time: "ontem" },
    ],
  },
  {
    id: "SD-150", title: "Email de reset não chega",            desc: "Link de redefinição nunca é recebido.",
    status: "done", priority: "normal", cat: "account", user: "Patricia Silva", created: "04/05/2026",
    msgs: [
      { id: 1, author: "Patricia Silva", role: "user",  text: "Não recebo o email de reset.",       time: "2 dias atrás" },
      { id: 2, author: "Alex Morgan",    role: "agent", text: "Resolvido — era filtro de spam.",    time: "2 dias atrás" },
    ],
  },
];

const KB_INIT = [
  { id: "KB-01", title: "Como redefinir sua senha",             cat: "account",   views: 234, helpful: 47, ticket: "SD-150", content: "1. Acesse a tela de login.\n2. Clique em 'Esqueci minha senha'.\n3. Digite seu e-mail.\n4. Verifique a caixa de entrada e a pasta de spam.\n5. Clique no link em até 30 minutos.\n\nSe não receber, contate o suporte." },
  { id: "KB-02", title: "Problema de login no app mobile",      cat: "mobile",    views: 189, helpful: 39, ticket: "SD-101", content: "Causas comuns:\n• Versão desatualizada do app\n• Cache corrompido\n• Senha expirada\n\nSolução:\n1. Atualize o app na loja.\n2. Limpe o cache.\n3. Redefina a senha.\n4. Reinstale se necessário." },
  { id: "KB-03", title: "Exportação CSV — colunas faltando",    cat: "reports",   views: 98,  helpful: 21, ticket: "SD-102", content: "O problema ocorre com filtros ativos.\n\nSolução:\n1. Remova todos os filtros.\n2. Selecione 'Todas as colunas'.\n3. Se persistir, tente XLSX." },
  { id: "KB-04", title: "Gráficos do dashboard em branco",      cat: "dashboard", views: 156, helpful: 33, ticket: "SD-145", content: "Causa: cache desatualizado após updates.\n\nSolução:\n1. Ctrl+Shift+R (hard refresh).\n2. Limpe o cache do navegador.\n3. Tente aba anônima.\n\nSe persistir, entre em contato." },
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
    { name: "Alto risco",  value: 8,  color: T.danger  },
    { name: "Médio risco", value: 23, color: T.warning },
    { name: "Baixo risco", value: 69, color: T.success },
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
  agent: { id: "11111111-1111-1111-1111-111111111111", name: "Alex Morgan",  email: "alex@conexus.io",    role: "agent", avatar: "AM" },
  user:  { id: "22222222-2222-2222-2222-222222222222", name: "Diego Ramos",  email: "diego@empresa.com",  role: "user",  avatar: "DR" },
};
// ─── INTEGRAÇÃO FISCAL (Squad 2) ─────────────────────────────────────────────
// API_BASE importado de ./api/client.js

async function buscarHistoricoFiscal(sku) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/integration/fiscal/history/${sku}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function buscarResumoFinanceiro() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/integration/fiscal/cashflow`);
    if (!res.ok) throw new Error("Squad 2 indisponível");
    return await res.json();
  } catch (err) {
    // FALLBACK: Se a Squad 2 falhar, mostramos dados em cache/mock
    // Isso prova a resiliência do seu módulo (exigência do slide 3)
    console.warn("Usando Fallback para Squad 2:", err.message);
    return {
      resumo: {
        saldo: "R$ 45.200,00 (Offline)",
        entradas: "R$ 12.000,00",
        impostos: "R$ 2.400,00"
      }
    };
  }
}









// ─── PAINEL FISCAL NO TICKET (Squad 2) ───────────────────────────────────────
function TicketFiscalPanel() {
  const [fiscalData, setFiscalData]       = useState(null);
  const [loadingFiscal, setLoadingFiscal] = useState(true);

  useEffect(() => {
    buscarResumoFinanceiro().then(data => {
      setFiscalData(data);
      setLoadingFiscal(false);
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 700, color: T.textPrimary, fontSize: 13 }}>📊 Fiscal Finance</div>
      {loadingFiscal && <div style={{ color: T.textMuted, fontSize: 12 }}>Carregando...</div>}
      {fiscalData?.resumo && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <div style={{ fontSize: 12, color: T.textMuted }}>Saldo</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Entradas</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Impostos</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{fiscalData.resumo.saldo}</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{fiscalData.resumo.entradas}</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{fiscalData.resumo.impostos}</div>
        </div>
      )}
      {!fiscalData && !loadingFiscal && (
        <div style={{ color: T.danger, fontSize: 12 }}>Indisponível</div>
      )}
    </div>
  );
}

// ─── PRIMITIVOS UI ────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const m = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: 24,
      padding: "0 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
    }}>
      {m.label}
    </span>
  );
};

const RiscoBadge = ({ risco }) => {
  const map = {
    alto:  { color: T.danger,  bg: T.dangerMuted,  border: T.dangerBorder,  label: "Alto"  },
    medio: { color: T.warning, bg: T.warningMuted, border: T.warningBorder, label: "Médio" },
    baixo: { color: T.success, bg: T.successMuted, border: T.successBorder, label: "Baixo" },
  };
  const m = map[risco] || map.baixo;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: 24,
      padding: "0 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
    }}>{m.label}</span>
  );
};

const Avatar = ({ label, size = 32, bg = T.brand }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.34, fontWeight: 700, color: "#fff", letterSpacing: "0.01em",
  }}>{label}</div>
);

// Ícones SVG inline (sem dependência extra)
const Icon = {
  grid:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  ticket:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>,
  message:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  book:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chart:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  settings:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bell:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  search:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  send:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  close:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  thumbUp:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  thumbDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
  chevrRight:() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

// Logo Conexus — hexágono com "C"
const ConexusLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M20 2L35.98 11V29L20 38L4.02 29V11L20 2Z" fill={T.brand} />
    <path d="M26 14.5C24.5 13.2 22.8 12.5 21 12.5C17.1 12.5 14 15.6 14 19.5C14 23.4 17.1 26.5 21 26.5C22.8 26.5 24.5 25.8 26 24.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// Botão
const Btn = ({ children, variant = "primary", full, style: s = {}, ...props }) => {
  const variants = {
    primary:   { background: T.brand,       color: "#fff",          border: `1px solid ${T.brand}` },
    secondary: { background: T.bgSurface,   color: T.textPrimary,   border: `1px solid ${T.borderDefault}` },
    ghost:     { background: "transparent", color: T.textMuted,     border: `1px solid ${T.borderDefault}` },
    soft:      { background: T.brandMuted,  color: T.brand,         border: "1px solid transparent" },
    danger:    { background: T.dangerMuted, color: T.danger,        border: `1px solid ${T.dangerBorder}` },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button {...props} style={{
      ...v, borderRadius: 8, padding: "0 14px", height: 36, fontSize: 13, fontWeight: 600,
      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: 6, transition: "opacity 0.15s, background 0.15s", width: full ? "100%" : undefined,
      fontFamily: "inherit", flexShrink: 0, ...s,
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {children}
    </button>
  );
};

const inputBase = {
  height: 38, background: "#070f22",
  color: T.textPrimary, border: `1px solid ${T.borderSubtle}`,
  borderRadius: 8, padding: "0 12px", fontSize: 14, outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const Input = ({ style: s, ...props }) => (
  <input {...props} style={{ ...inputBase, ...s }}
    onFocus={e => e.target.style.borderColor = T.brand}
    onBlur={e  => e.target.style.borderColor = T.borderSubtle} />
);

const Textarea = ({ style: s, ...props }) => (
  <textarea {...props} style={{ ...inputBase, height: "auto", padding: "10px 12px", resize: "vertical", minHeight: 90, ...s }}
    onFocus={e => e.target.style.borderColor = T.brand}
    onBlur={e  => e.target.style.borderColor = T.borderSubtle} />
);

const Select = ({ children, style: s, ...props }) => (
  <select {...props} style={{ ...inputBase, cursor: "pointer", ...s }}>{children}</select>
);

const Field = ({ label, children, error }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{label}</label>}
    {children}
    {error && <span style={{ fontSize: 11, color: T.danger }}>{error}</span>}
  </div>
);

const Card = ({ children, style: s, ...props }) => (
  <div {...props} style={{
    background: T.bgSurface, border: `1px solid ${T.borderSubtle}`,
    borderRadius: 12, boxShadow: T.shadowSm, ...s,
  }}>
    {children}
  </div>
);

const MetricCard = ({ label, value, icon: IconComp, color }) => (
  <Card style={{ padding: 20 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMuted }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 10, color: color || T.textPrimary }}>{value}</div>
      </div>
      <div style={{ borderRadius: 10, padding: 10, background: color ? `${color}1a` : T.brandMuted, color: color || T.brand, border: `1px solid ${color ? `${color}30` : `${T.brand}30`}`, flexShrink: 0 }}>
        {IconComp && <IconComp />}
      </div>
    </div>
  </Card>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [pass2, setPass2]     = useState("");
  const [err, setErr]         = useState("");
  const [info, setInfo]       = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  // Mapeia roles do Core Engine → perfis internos do Service Desk
  const inferRole = (profile) => {
    const roles = (profile && profile.roles) || [];
    const agentRoles = ["agent", "admin", "support", "suporte", "tecnico", "técnico"];
    return roles.some((r) => agentRoles.includes(String(r).toLowerCase())) ? "agent" : "user";
  };

  const switchMode = (next) => {
    setMode(next); setErr(""); setInfo(""); setPass(""); setPass2("");
  };

  const doLogin = async (overrideEmail, overridePass) => {
    const em = overrideEmail ?? email;
    const pw = overridePass ?? pass;
    await authApi.login(em, pw);
    const profile = await authApi.me();
    return onLogin(inferRole(profile), profile);
  };

  const handleLogin = async () => {
    setErr(""); setInfo(""); setLoading(true);

    // 1) Tenta autenticação real contra /api/v1/auth/login
    try {
      await doLogin();
      setLoading(false);
      return;
    } catch (e) {
      // Só faz fallback se for erro de rede (backend offline) — credenciais
      // inválidas (401) devem mostrar erro normalmente.
      const isNetworkError = e instanceof ApiError && e.status === 0;
      if (e instanceof ApiError && !isNetworkError) {
        setErr(e.status === 401 || e.status === 403
          ? "E-mail ou senha inválidos."
          : `Erro ${e.status}: ${e.message}`);
        setLoading(false);
        return;
      }
      // 2) Fallback demo (mantém UX quando backend indisponível)
      if (email === "alex@conexus.io"   && pass === "123") {
        setLoading(false);
        return onLogin("agent", { id: "11111111-1111-1111-1111-111111111111", name: "Alex Morgan", email, roles: ["agent"] });
      }
      if (email === "diego@empresa.com" && pass === "123") {
        setLoading(false);
        return onLogin("user",  { id: "22222222-2222-2222-2222-222222222222", name: "Diego Ramos", email, roles: ["user"]  });
      }
      setErr("E-mail ou senha inválidos."); setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErr(""); setInfo("");
    // Validações de UX
    if (!name.trim())          { setErr("Informe seu nome.");                 return; }
    if (!email.trim())         { setErr("Informe um e-mail válido.");         return; }
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPassword.test(pass)) {
      setErr("A senha deve ter mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial (ex: Abc@1234).");
      return;
    }
    if (pass !== pass2)        { setErr("As senhas não coincidem.");          return; }

    setLoading(true);
    try {
      // 1) Cria conta via provider (POST /api/v1/auth/register → Core Engine)
      await authApi.register(name.trim(), email.trim(), pass);
      // 2) Faz login automático com as credenciais recém-criadas
      try {
        await doLogin(email.trim(), pass);
        // doLogin já chamou onLogin → componente vai desmontar
        return;
      } catch {
        // Cadastro deu certo mas login automático falhou — pede para o usuário entrar manualmente
        setInfo("Conta criada com sucesso! Faça login para continuar.");
        switchMode("login");
        setLoading(false);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409)      setErr("Já existe uma conta com este e-mail.");
        else if (e.status === 400) setErr("Senha não atende aos requisitos: mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.");
        else if (e.status === 422) setErr("Dados inválidos. Verifique e tente novamente.");
        else if (e.status === 0)   setErr("Backend indisponível. Tente novamente em instantes.");
        else                       setErr(`Erro ${e.status}: ${e.message}`);
      } else {
        setErr("Falha inesperada ao cadastrar.");
      }
      setLoading(false);
    }
  };

  const handle = () => (mode === "login" ? handleLogin() : handleRegister());

  return (
    <div style={{
      minHeight: "100vh", background: T.bgApp,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(4,102,200,0.12) 0%, transparent 70%)",
    }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <ConexusLogo size={48} />
          <div style={{ marginTop: 14, fontSize: 24, fontWeight: 700, color: T.textPrimary }}>Conexus</div>
          <div style={{ color: T.textMuted, fontSize: 14, marginTop: 4 }}>
            {mode === "login" ? "Service Desk — Portal de Suporte" : "Crie sua conta no Conexus"}
          </div>
        </div>

        <Card style={{ padding: 32 }}>
          {/* Tabs Login / Cadastro */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, background: T.bgInput, padding: 4, borderRadius: 10 }}>
            {[
              ["login",    "Entrar"],
              ["register", "Cadastrar-se"],
            ].map(([key, label]) => {
              const active = mode === key;
              return (
                <button key={key} onClick={() => switchMode(key)} disabled={loading}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer",
                    background: active ? T.brand : "transparent",
                    color: active ? "#fff" : T.textMuted,
                    fontSize: 13, fontWeight: 600, transition: "background 0.15s, color 0.15s",
                  }}>
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <Field label="Nome completo">
                <Input type="text" placeholder="Como podemos te chamar?"
                  value={name} onChange={e => { setName(e.target.value); setErr(""); }} />
              </Field>
            )}
            <Field label="E-mail">
              <Input type="email" placeholder="seu@email.com"
                value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} />
            </Field>
            <Field label="Senha">
              <div style={{ position: "relative" }}>
                <Input type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
                  onKeyDown={e => e.key === "Enter" && mode === "login" && handle()}
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: T.textMuted, padding: 0, lineHeight: 1,
                  }}
                  title={showPass ? "Ocultar senha" : "Mostrar senha"}>
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </Field>
            {mode === "register" && (
              <Field label="Confirmar senha">
                <div style={{ position: "relative" }}>
                  <Input type={showPass2 ? "text" : "password"} placeholder="••••••••"
                    value={pass2} onChange={e => { setPass2(e.target.value); setErr(""); }}
                    onKeyDown={e => e.key === "Enter" && handle()}
                    style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass2(v => !v)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: T.textMuted, padding: 0, lineHeight: 1,
                    }}
                    title={showPass2 ? "Ocultar senha" : "Mostrar senha"}>
                    {showPass2
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </Field>
            )}
            {info && (
              <div style={{ background: T.successMuted, border: `1px solid ${T.successBorder}`, borderRadius: 8, padding: "10px 14px", color: T.success, fontSize: 13 }}>
                {info}
              </div>
            )}
            {err && (
              <div style={{ background: T.dangerMuted, border: `1px solid ${T.dangerBorder}`, borderRadius: 8, padding: "10px 14px", color: T.danger, fontSize: 13 }}>
                {err}
              </div>
            )}
            <Btn full onClick={handle} disabled={loading} style={{ height: 42, fontSize: 14, marginTop: 4 }}>
              {loading
                ? (mode === "login" ? "Autenticando..." : "Criando conta...")
                : (mode === "login" ? "Entrar" : "Criar conta")}
            </Btn>
          </div>


        </Card>
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_AGENT = [
  { key: "dashboard", icon: Icon.grid,    label: "Dashboard" },
  { key: "tickets",   icon: Icon.ticket,  label: "Tickets"   },
  { key: "messages",  icon: Icon.message, label: "Mensagens" },
  { key: "knowledge", icon: Icon.book,    label: "Base KB"   },
  { key: "sla",       icon: Icon.chart,   label: "SLA"       },
  { key: "churn",     icon: Icon.chart,   label: "Churn"     },
  { key: "settings",  icon: Icon.settings,label: "Config"    },
];
const NAV_USER = [
  { key: "dashboard", icon: Icon.grid,    label: "Início"    },
  { key: "tickets",   icon: Icon.ticket,  label: "Tickets"   },
  { key: "messages",  icon: Icon.message, label: "Mensagens" },
  { key: "knowledge", icon: Icon.book,    label: "Base KB"   },
  { key: "settings",  icon: Icon.settings,label: "Config"    },
];

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ role, page, setPage, user, onLogout }) {
  const nav = role === "agent" ? NAV_AGENT : NAV_USER;
  return (
    <div style={{
      width: 240, background: T.bgSidebar, display: "flex", flexDirection: "column",
      borderRight: `1px solid ${T.borderSubtle}`, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
        <ConexusLogo size={32} />
        <div>
          <div style={{ color: T.textPrimary, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Conexus</div>
          <div style={{ color: T.textDisabled, fontSize: 11 }}>Service Desk</div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textDisabled, padding: "4px 10px 8px" }}>Menu</div>
        {nav.map(n => {
          const active = page === n.key;
          return (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? "rgba(4,102,200,0.16)" : "transparent",
              borderLeft: active ? `3px solid ${T.brand}` : "3px solid transparent",
              marginLeft: -3,
              color: active ? T.textPrimary : T.textMuted,
              fontSize: 13, fontWeight: active ? 600 : 400,
              transition: "all 0.15s", textAlign: "left", fontFamily: "inherit",
            }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = T.bgHover)}
              onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}>
              <span style={{ color: active ? T.brand : T.textMuted, display: "flex" }}>
                <n.icon />
              </span>
              {n.label}
            </button>
          );
        })}
      </div>

      {/* Perfil */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar label={user.avatar} size={32} bg={role === "agent" ? "#6d28d9" : T.brand} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name.split(" ")[0]}</div>
          <div style={{ color: T.textDisabled, fontSize: 11, textTransform: "capitalize" }}>{role === "agent" ? "Agente" : "Usuário"}</div>
        </div>
        <button onClick={onLogout} title="Sair" style={{
          background: "none", border: "none", color: T.textMuted, cursor: "pointer",
          padding: 4, borderRadius: 6, display: "flex", alignItems: "center",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.danger}
          onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
          <Icon.logout />
        </button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, onNew }) {
  return (
    <div style={{
      height: 56, borderBottom: `1px solid ${T.borderSubtle}`,
      display: "flex", alignItems: "center", padding: "0 24px", gap: 12, flexShrink: 0,
      background: T.bgHeader,
    }}>
      <span style={{ color: T.textPrimary, fontWeight: 600, fontSize: 16, flex: 1 }}>{title}</span>

      {/* Busca */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: T.bgSurface, border: `1px solid ${T.borderSubtle}`,
        borderRadius: 8, padding: "0 12px", height: 36, color: T.textDisabled, fontSize: 13, cursor: "text",
        transition: "border-color 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.borderDefault}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.borderSubtle}>
        <Icon.search />
        <span>Buscar...</span>
      </div>

      {/* Notificações */}
      <button style={{
        width: 36, height: 36, borderRadius: 8,
        background: T.bgSurface, border: `1px solid ${T.borderSubtle}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: T.textMuted, cursor: "pointer", transition: "all 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderDefault; e.currentTarget.style.color = T.textPrimary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderSubtle;  e.currentTarget.style.color = T.textMuted; }}>
        <Icon.bell />
      </button>

      {/* Novo Ticket */}
      {onNew && (
        <Btn onClick={onNew}>
          <Icon.plus /> Novo ticket
        </Btn>
      )}
    </div>
  );
}

// ─── MODAL NOVO TICKET ────────────────────────────────────────────────────────
function NovoTicketModal({ onClose, onCreate }) {
  const [f, setF]       = useState({ title: "", desc: "", priority: "normal", cat: "" });
  const [err, setErr]   = useState({});
  const [ok, setOk]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr]   = useState("");
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErr(e => ({ ...e, [k]: "" })); };

  const submit = async () => {
    const e = {};
    if (!f.title.trim())        e.title = "Campo obrigatório";
    if (f.title.trim().length < 3) e.title = "Mínimo 3 caracteres";
    if (!f.desc.trim())         e.desc  = "Campo obrigatório";
    if (f.desc.trim().length < 10) e.desc = "Mínimo 10 caracteres";
    if (Object.keys(e).length) return setErr(e);
    setLoading(true);
    setApiErr("");
    try {
      await onCreate(f);
      setOk(true);
    } catch(ex) {
      setApiErr(ex?.message || "Erro ao criar chamado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{
        background: T.bgElevated, border: `1px solid ${T.borderDefault}`,
        borderRadius: 16, padding: 32, width: 520,
        display: "flex", flexDirection: "column", gap: 20,
        boxShadow: T.shadowLg,
      }}>
        {!ok ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 18 }}>Abrir novo chamado</div>
                <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Descreva o problema com o máximo de detalhes.</div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", borderRadius: 6, padding: 4, display: "flex" }}>
                <Icon.close />
              </button>
            </div>
            <Field label="Título *" error={err.title}>
              <Input placeholder="Ex: Não consigo acessar o sistema" value={f.title} onChange={e => set("title", e.target.value)} />
            </Field>
            <Field label="Descrição *" error={err.desc}>
              <Textarea placeholder="Descreva o problema, quando começou, o que já tentou..." value={f.desc} onChange={e => set("desc", e.target.value)} style={{ minHeight: 110 }} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Prioridade">
                <Select value={f.priority} onChange={e => set("priority", e.target.value)}>
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
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
            {apiErr && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
                {apiErr}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
              <Btn onClick={submit} disabled={loading}>{loading ? "Enviando..." : "Enviar chamado"}</Btn>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.successMuted, border: `1px solid ${T.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 24, color: T.success }}>✓</div>
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 20, marginTop: 16 }}>Chamado aberto!</div>
            <div style={{ color: T.textMuted, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
              Sua solicitação foi registrada com sucesso.<br />Nossa equipe retornará em breve.
            </div>
            <Btn onClick={onClose} style={{ margin: "24px auto 0" }}>Fechar</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD AGENTE ─────────────────────────────────────────────────────────

// ─── PAINEL FINANCEIRO (Squad 4 RBAC) ────────────────────────────────────────
// Visível APENAS para usuários com role "suporte" no Core Engine (ADR Squad 4)
function FinancialDashboard({ user }) {
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    buscarResumoFinanceiro()
      .then(data => { setCashflow(data?.resumo || data); setLoading(false); })
      .catch(() => { setError("Erro ao carregar dados financeiros."); setLoading(false); });
  }, []);

  return (
    <Card style={{ padding: 22, marginBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>💰</span>
        <div style={{ fontWeight: 600, fontSize: 15, color: T.textPrimary }}>Painel Financeiro — Squad 2</div>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.brand, background: T.brandMuted, border: `1px solid ${T.brand}`, borderRadius: 4, padding: "2px 8px" }}>
          🔒 Restrito · Suporte
        </span>
      </div>
      {loading && <div style={{ color: T.textMuted, fontSize: 13 }}>Carregando dados fiscais...</div>}
      {error  && <div style={{ color: T.danger,   fontSize: 13 }}>{error}</div>}
      {cashflow && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[
            { label: "Saldo",     value: cashflow.saldo    || (cashflow.balance    != null ? `R$ ${Number(cashflow.balance).toLocaleString("pt-BR",{minimumFractionDigits:2})}` : "—"), color: T.success },
            { label: "Entradas",  value: cashflow.entradas || (cashflow.income     != null ? `R$ ${Number(cashflow.income).toLocaleString("pt-BR",{minimumFractionDigits:2})}`   : "—"), color: T.info    },
            { label: "Impostos",  value: cashflow.impostos || (cashflow.taxes      != null ? `R$ ${Number(cashflow.taxes).toLocaleString("pt-BR",{minimumFractionDigits:2})}`    : "—"), color: T.warning  },
            { label: "Despesas",  value: cashflow.despesas || (cashflow.expenses   != null ? `R$ ${Number(cashflow.expenses).toLocaleString("pt-BR",{minimumFractionDigits:2})}` : "—"), color: T.danger   },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.bgElevated, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.borderSubtle}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMuted, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── RBAC check: retorna true se o usuário tem role "suporte" no Core Engine ──
function hasSuporteRole(user) {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.some(r => String(r).toLowerCase() === "suporte");
}

function DashboardAgent({ tickets, setPage, setActiveTicket, user }) {
  const open   = tickets.filter(t => t.status === "pending").length;
  const inprog = tickets.filter(t => t.status === "in_process").length;
  const done   = tickets.filter(t => t.status === "done").length;
  const urgent = tickets.filter(t => t.priority === "urgent").length;

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary }}>Olá, {user?.name?.split(" ")[0]} 👋</h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Veja o que está acontecendo no seu service desk hoje.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <MetricCard label="Abertos"      value={open}   color={T.success} icon={() => <span style={{ fontSize: 18 }}>📬</span>} />
        <MetricCard label="Em andamento" value={inprog} color={T.warning} icon={() => <span style={{ fontSize: 18 }}>🔄</span>} />
        <MetricCard label="Resolvidos"   value={done}   color={T.info}    icon={() => <span style={{ fontSize: 18 }}>✅</span>} />
        <MetricCard label="Urgentes"     value={urgent} color={T.danger}  icon={() => <span style={{ fontSize: 18 }}>⚠️</span>} />
      </div>

      {hasSuporteRole(user) && <FinancialDashboard user={user} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.textPrimary }}>Atividade recente</div>
            <button onClick={() => setPage("tickets")} style={{ background: "none", border: "none", color: T.brand, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", fontWeight: 500 }}>
              Ver todos <Icon.chevrRight />
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ID", "Título", "Usuário", "Status"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMuted, textAlign: "left", padding: "0 12px 10px 0", borderBottom: `1px solid ${T.borderSubtle}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} onClick={() => { setActiveTicket(t.id); setPage("tickets"); }}
                  style={{ cursor: "pointer", borderBottom: `1px solid ${T.borderSubtle}` }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(151,157,172,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 12px 12px 0", color: T.textMuted, fontSize: 12, fontFamily: "monospace" }}>{t.id}</td>
                  <td style={{ padding: "12px 12px 12px 0", color: T.textSecondary, fontSize: 13 }}>{t.title}</td>
                  <td style={{ padding: "12px 12px 12px 0", color: T.textMuted, fontSize: 12 }}>{t.user}</td>
                  <td style={{ padding: "12px 0" }}><Badge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.textPrimary, marginBottom: 16 }}>Conversas ativas</div>
          {tickets.filter(t => t.msgs.length > 0).map(t => (
            <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("messages"); }}
              style={{ padding: "12px 0", borderBottom: `1px solid ${T.borderSubtle}`, cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div style={{ color: T.textSecondary, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
              <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>
                {t.msgs.length} mensagens · {t.user} · {t.id}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── DASHBOARD USUÁRIO ────────────────────────────────────────────────────────
function DashboardUser({ user, tickets, setPage, setActiveTicket }) {
  // Filtra por user_id (backend) OU por nome (fallback mock local)
  const mine = tickets.filter(t => t.user_id === user.id || t.user === user.name);

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary }}>Olá, {user.name.split(" ")[0]} 👋</h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Acompanhe seus chamados de suporte.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <MetricCard label="Abertos"      value={mine.filter(t => t.status === "pending").length}    color={T.success} icon={() => <span style={{ fontSize: 18 }}>📬</span>} />
        <MetricCard label="Em andamento" value={mine.filter(t => t.status === "in_process").length} color={T.warning} icon={() => <span style={{ fontSize: 18 }}>🔄</span>} />
        <MetricCard label="Resolvidos"   value={mine.filter(t => t.status === "done").length}       color={T.info}    icon={() => <span style={{ fontSize: 18 }}>✅</span>} />
      </div>

      <Card style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: T.textPrimary, marginBottom: 18 }}>Meus tickets</div>
        {mine.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎫</div>
            <div>Nenhum ticket ainda. Use o botão acima para abrir um chamado.</div>
          </div>
        ) : mine.map(t => (
          <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("messages"); }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 10px", borderRadius: 8, cursor: "pointer", borderBottom: `1px solid ${T.borderSubtle}`, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = T.bgHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ color: T.textDisabled, fontSize: 12, minWidth: 52, fontFamily: "monospace" }}>{t.id}</span>
            <span style={{ color: T.textSecondary, fontSize: 13, flex: 1 }}>{t.title}</span>
            <Badge status={t.status} />
            {t.msgs.length > 0 && <span style={{ color: T.textMuted, fontSize: 12 }}>💬 {t.msgs.length}</span>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── TICKETS BOARD (AGENTE) ───────────────────────────────────────────────────
function TicketsBoard({ tickets, setTickets, activeTicket, setActiveTicket, setPage }) {
  const cols = ["pending", "in_process", "done", "canceled"];
  const colLabel = { pending: "Aberto", in_process: "Em andamento", done: "Resolvido", canceled: "Cancelado" };
  const move = async (id, st) => {
    // BUG FIX: "id" aqui é sempre o UUID real (campo "id" do ticket mapeado
    // em loadTickets). Antes podia chegar o shortId, causando 404 no PATCH.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(id)) {
      console.error("move(): id não é um UUID válido:", id);
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/v1/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: st })
      });
      if (res.ok) {
        setTickets(ts => ts.map(t => t.id === id ? { ...t, status: st } : t));
      } else {
        console.error("Falha ao atualizar status:", res.status);
      }
    } catch(e) {
      console.error("Falha ao atualizar status:", e);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: T.textPrimary }}>Board de Tickets</div>
        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{tickets.length} tickets no pipeline</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {cols.map(col => {
          const m = STATUS[col]; const list = tickets.filter(t => t.status === col);
          return (
            <div key={col}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{colLabel[col]}</span>
                <span style={{ marginLeft: "auto", background: T.borderSubtle, color: T.textMuted, borderRadius: 999, fontSize: 10, padding: "2px 8px", fontWeight: 600 }}>{list.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {list.map(t => (
                  <div key={t.id}
                    style={{
                      background: T.bgSurface, border: `1px solid ${activeTicket === t.id ? T.brand : T.borderSubtle}`,
                      borderRadius: 10, padding: 14, cursor: "pointer",
                      transition: "border-color 0.15s", boxShadow: T.shadowSm,
                    }}
                    onClick={() => setActiveTicket(activeTicket === t.id ? null : t.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: T.textDisabled, fontSize: 11, fontFamily: "monospace" }}>{t.shortId || t.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY[t.priority]?.color }}>{PRIORITY[t.priority]?.label}</span>
                    </div>
                    <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{t.title}</div>
                    {t.cat && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: T.brandMuted, color: T.brand, fontWeight: 600 }}>{t.cat}</span>
                    )}
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 8 }}>{t.user}</div>
                    {t.msgs.length > 0 && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>💬 {t.msgs.length}</div>}
                    {activeTicket === t.id && (
                      <>

                        <div style={{ marginTop: 12, display: "flex", gap: 4, flexWrap: "wrap", borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 12 }}>
                          {cols.filter(c => c !== col).map(c => (
                            <button key={c} onClick={ev => { ev.stopPropagation(); move(t.id, c); }}
                              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, cursor: "pointer", background: STATUS[c].bg, color: STATUS[c].color, border: `1px solid ${STATUS[c].border}`, fontWeight: 600, fontFamily: "inherit" }}>
                              {STATUS[c].label}
                            </button>
                          ))}
                          <button onClick={ev => { ev.stopPropagation(); setPage("messages"); }}
                            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, cursor: "pointer", background: T.brandMuted, color: T.brand, border: "none", fontWeight: 600, fontFamily: "inherit" }}>
                            💬 Chat
                          </button>
                        </div>
                      </>
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
  const [filtro, setFiltro] = useState("todos");
  // Filtra por user_id (backend real) OU nome (fallback mock)
  const mine = tickets.filter(t => t.user_id === user.id || t.user === user.name);
  const list = filtro === "todos" ? mine : mine.filter(t => t.status === filtro);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: T.textPrimary }}>Meus Tickets</div>
        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{mine.length} chamado(s)</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["todos", "Todos"], ["pending", "Abertos"], ["in_process", "Em andamento"], ["done", "Resolvidos"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all 0.15s",
            background: filtro === k ? T.brand : T.bgSurface,
            color: filtro === k ? "#fff" : T.textMuted,
            fontFamily: "inherit",
          }}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
          <div>Nenhum ticket encontrado.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(t => (
            <div key={t.id} onClick={() => { setActiveTicket(t.id); setPage("messages"); }}
              style={{
                background: T.bgSurface, border: `1px solid ${T.borderSubtle}`,
                borderRadius: 10, padding: "14px 18px", cursor: "pointer",
                transition: "border-color 0.15s, transform 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderDefault; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderSubtle; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ color: T.textDisabled, fontSize: 11, minWidth: 52, fontFamily: "monospace" }}>{t.id}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  {t.cat && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>{t.cat} · {t.created}</div>}
                </div>
                <Badge status={t.status} />
                {t.msgs.length > 0 && <span style={{ color: T.textMuted, fontSize: 12 }}>💬 {t.msgs.length}</span>}
                <span style={{ color: T.textDisabled, display: "flex" }}><Icon.chevrRight /></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MENSAGENS ────────────────────────────────────────────────────────────────
function Mensagens({ tickets, setTickets, user, role, activeId, setActiveId }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  // BUG FIX: filtrar por user_id (UUID do backend) em vez de user.name.
  // Tickets criados pela API têm user_id preenchido mas o campo "user"
  // é apenas um nome resolvido localmente — pode não coincidir com user.name
  // de quem está logado, deixando a lista vazia para o usuário real.
  const myTickets = role === "user"
    ? tickets.filter(t => t.user_id === user.id || t.user === user.name)
    : tickets;
  const active = myTickets.find(t => t.id === activeId) || myTickets[0];

  // BUG FIX: quando a lista de tickets atualiza via polling e ainda não há
  // nenhum selecionado, seleciona automaticamente o primeiro da lista
  useEffect(() => {
    if (!activeId && myTickets.length > 0) {
      setActiveId(myTickets[0].id);
    }
  }, [myTickets.length]);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [fiscalData, setFiscalData] = useState(null);
  const [loadingFiscal, setLoadingFiscal] = useState(false);

  useEffect(() => {
    if (role === "agent") {
      setLoadingFiscal(true);
      buscarResumoFinanceiro()
        .then(data => {
          setFiscalData(data);
        })
        .catch(err => {
          console.error("Erro ao carregar dados fiscais em mensagens:", err);
        })
        .finally(() => {
          setLoadingFiscal(false);
        });
    }
  }, [role]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.msgs?.length]);

  const UUID_RE_MSG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Função reutilizável para buscar mensagens do ticket ativo
  const fetchMessages = (ticketId, token) => {
    if (!UUID_RE_MSG.test(ticketId)) return;
    fetch(`${API_BASE}/api/v1/messages?ticket_id=${ticketId}`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.items) {
          const fetchedMsgs = data.items.map(m => {
            const u = Object.values(USERS_DB).find(u => u.id === m.author_id);
            const authorName = u ? u.name : (m.author_id ? `Usuário ${m.author_id.slice(0,8)}` : "Usuário");
            const authorRole = u ? u.role : "user";
            return {
              id: m.id,
              author: authorName,
              role: authorRole,
              text: m.message,
              time: new Date(m.created_at).toLocaleTimeString("pt-BR")
            };
          });
          setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, msgs: fetchedMsgs } : t));
        }
      })
      .catch(e => console.error("Erro ao buscar mensagens:", e));
  };

  useEffect(() => {
    if (!active || !UUID_RE_MSG.test(active.id)) return;

    const token = getToken();

    // Busca imediata ao abrir o ticket
    fetchMessages(active.id, token);

    // Polling a cada 3 segundos para ambos os lados receberem mensagens
    // sem precisar recarregar a página
    const interval = setInterval(() => {
      fetchMessages(active.id, getToken());
    }, 3000);

    // Busca histórico de compras do cliente (apenas para agente)
    if (role === "agent" && active.user_id) {
      setLoadingPurchases(true);
      const token2 = getToken();
      fetch(`${API_BASE}/api/v1/integration/fiscal/purchases/${active.user_id}`, {
        headers: token2 ? { "Authorization": `Bearer ${token2}` } : {}
      })
        .then(r => r.json())
        .then(data => {
          setPurchases(data && data.purchases ? data.purchases : []);
        })
        .catch(e => console.error("Erro ao buscar compras:", e))
        .finally(() => setLoadingPurchases(false));
    }

    // Limpa o intervalo ao trocar de ticket ou desmontar
    return () => clearInterval(interval);
  }, [active?.id, role]);

  const send = async () => {
    if (!input.trim() || !active) return;

    // BUG FIX: garantir que o ticket tem UUID válido antes de enviar.
    // Se o "active" vier de dados mock (ex: id="SD-101"), a mensagem seria
    // enviada com ticket_id inválido e nunca apareceria para nenhum dos lados.
    const UUID_RE_SEND = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE_SEND.test(active.id)) {
      console.error("send(): ticket sem UUID válido — não é possível enviar mensagem:", active.id);
      return;
    }

    const msgText = input.trim();
    setInput("");
    
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE}/api/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ticket_id: active.id,
          // BUG FIX: author_id deve ser um UUID válido ou omitido.
          // user.id pode ser um ID demo ("11111111-...") mas sempre é UUID.
          author_id: user.id,
          message: msgText
        })
      });

      if (res.ok) {
        // Recarregar mensagens após envio bem-sucedido
        const r = await fetch(`${API_BASE}/api/v1/messages?ticket_id=${active.id}`, { headers });
        const data = await r.json();
        if (data && data.items) {
          const fetchedMsgs = data.items.map(m => {
            const u = Object.values(USERS_DB).find(u => u.id === m.author_id);
            const authorName = u ? u.name : (m.author_id ? `Usuário ${m.author_id.slice(0,8)}` : "Usuário");
            const authorRole = u ? u.role : "user";
            return {
              id: m.id,
              author: authorName,
              role: authorRole,
              text: m.message,
              time: new Date(m.created_at).toLocaleTimeString("pt-BR")
            };
          });
          setTickets(ts => ts.map(t => t.id === active.id ? { ...t, msgs: fetchedMsgs } : t));
        }
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("Erro ao enviar mensagem:", res.status, errBody);
      }
    } catch(e) {
      console.error("Falha ao enviar mensagem:", e);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Lista conversas */}
      <div style={{ width: 260, borderRight: `1px solid ${T.borderSubtle}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 600, color: T.textPrimary, fontSize: 14 }}>Conversas</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {myTickets.map(t => {
            const last = t.msgs[t.msgs.length - 1];
            const isA  = active?.id === t.id;
            return (
              <div key={t.id} onClick={() => setActiveId(t.id)}
                style={{
                  padding: "13px 18px", cursor: "pointer",
                  background: isA ? T.brandMuted : "transparent",
                  borderLeft: isA ? `3px solid ${T.brand}` : "3px solid transparent",
                  borderBottom: `1px solid ${T.borderSubtle}`, transition: "background 0.15s",
                }}
                onMouseEnter={e => !isA && (e.currentTarget.style.background = T.bgHover)}
                onMouseLeave={e => !isA && (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: isA ? T.textPrimary : T.textSecondary, fontSize: 13, fontWeight: isA ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{t.title}</span>
                  <span style={{ color: T.textDisabled, fontSize: 10, flexShrink: 0 }}>{last?.time || ""}</span>
                </div>
                <div style={{ color: T.textMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>
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
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 600, fontSize: 15 }}>{active.title}</div>
              <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{active.id} · {active.user} · {active.created}</div>
            </div>
            <Badge status={active.status} />
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 10px", display: "flex", flexDirection: "column", gap: 20 }}>
            {active.msgs.length === 0 ? (
              <div style={{ textAlign: "center", color: T.textMuted, marginTop: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 14 }}>Nenhuma mensagem ainda. Comece a conversa!</div>
              </div>
            ) : active.msgs.map(m => {
              const isMe = m.author === user.name;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                  <Avatar label={m.author.split(" ").map(w => w[0]).join("")} size={28}
                    bg={m.role === "agent" ? "#6d28d9" : T.brand} />
                  <div style={{ maxWidth: "65%" }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5, textAlign: isMe ? "right" : "left" }}>
                      {isMe ? "Você" : m.author} · {m.time}
                    </div>
                    <div style={{
                      background: isMe ? T.brand : T.bgSurface2,
                      border: `1px solid ${isMe ? T.brand : T.borderSubtle}`,
                      borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      padding: "10px 16px", color: isMe ? "#fff" : T.textSecondary,
                      fontSize: 14, lineHeight: 1.55,
                    }}>{m.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.borderSubtle}`, display: "flex", gap: 10, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Escreva uma mensagem..."
              style={{ ...inputBase, flex: 1 }}
              onFocus={e => e.target.style.borderColor = T.brand}
              onBlur={e  => e.target.style.borderColor = T.borderSubtle} />
            <button onClick={send} style={{
              width: 38, height: 38, borderRadius: 8, background: T.brand,
              border: "none", cursor: "pointer", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "opacity 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Icon.send />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted }}>
          Selecione uma conversa
        </div>
      )}

      {/* Contexto do Cliente */}
      {active && role === "agent" && (
        <div style={{ width: 300, borderLeft: `1px solid ${T.borderSubtle}`, display: "flex", flexDirection: "column", flexShrink: 0, background: T.bgSurface }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 600, color: T.textPrimary, fontSize: 14 }}>
            Contexto do Cliente
          </div>
          <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: T.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>Usuário</div>
              <div style={{ color: T.textPrimary, fontSize: 14, fontWeight: 500 }}>{active.user}</div>
              <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>ID: {active.user_id}</div>
            </div>
            
            <div style={{ color: T.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>Histórico de Compras</div>
            {loadingPurchases ? (
              <div style={{ fontSize: 12, color: T.textMuted }}>Carregando histórico...</div>
            ) : purchases.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textMuted }}>Nenhuma compra encontrada.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {purchases.map(p => (
                  <div key={p.id} style={{ border: `1px solid ${T.borderSubtle}`, borderRadius: 8, padding: 12, background: T.bgApp }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{p.product}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.success }}>R$ {p.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>{new Date(p.date).toLocaleDateString("pt-BR")}</span>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: p.status === "pago" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", color: p.status === "pago" ? T.success : T.warning, fontWeight: 600, textTransform: "uppercase" }}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BASE DE CONHECIMENTO ─────────────────────────────────────────────────────
function KnowledgeBase({ role, tickets }) {
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
    // TODO: POST /api/v1/kb/:id/helpful
    setArticles(as => as.map(a => a.id === id ? { ...a, helpful: a.helpful + 1 } : a));
  };

  const addArticle = () => {
    const e = {};
    if (!form.title.trim())   e.title   = "Obrigatório";
    if (!form.content.trim()) e.content = "Obrigatório";
    if (Object.keys(e).length) return setFormErr(e);
    const newA = {
      id: `KB-${String(articles.length + 1).padStart(2, "0")}`,
      title: form.title.trim(), cat: form.cat || "other",
      views: 0, helpful: 0, ticket: form.ticket, content: form.content.trim(),
    };
    // TODO: POST /api/v1/kb { ...newA }
    setArticles(as => [newA, ...as]);
    setSelected(newA);
    setForm({ title: "", cat: "", content: "", ticket: "" });
    setFormErr({});
    setShowForm(false);
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Lista */}
      <div style={{ width: 300, borderRight: `1px solid ${T.borderSubtle}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${T.borderSubtle}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: T.textPrimary, fontSize: 14 }}>Base de Conhecimento</div>
            {role === "agent" && (
              <Btn variant="soft" style={{ height: 28, fontSize: 11, padding: "0 10px" }}
                onClick={() => { setShowForm(!showForm); setFormErr({}); }}>
                {showForm ? "✕" : "+ Artigo"}
              </Btn>
            )}
          </div>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artigos..." style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none",
                background: catFilter === c ? T.brand : T.bgSurface,
                color: catFilter === c ? "#fff" : T.textMuted, fontFamily: "inherit",
              }}>{c}</button>
            ))}
          </div>
        </div>

        {showForm && role === "agent" && (
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.bgSurface2, display: "flex", flexDirection: "column", gap: 10 }}>
            <Field error={formErr.title}>
              <Input placeholder="Título do artigo *" value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErr(v => ({ ...v, title: "" })); }} />
            </Field>
            <Select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
              <option value="">Categoria...</option>
              {["account", "mobile", "billing", "reports", "dashboard", "other"].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={form.ticket} onChange={e => setForm(f => ({ ...f, ticket: e.target.value }))}>
              <option value="">Ticket origem (opcional)</option>
              {tickets.filter(t => t.status === "done").map(t => <option key={t.id} value={t.id}>{t.id} — {t.title.slice(0, 28)}</option>)}
            </Select>
            <Field error={formErr.content}>
              <Textarea placeholder="Conteúdo do artigo *" value={form.content}
                onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setFormErr(v => ({ ...v, content: "" })); }} />
            </Field>
            <Btn full onClick={addArticle}>Publicar artigo</Btn>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0
            ? <div style={{ padding: 24, color: T.textMuted, textAlign: "center", fontSize: 13 }}>Nenhum artigo encontrado.</div>
            : filtered.map(a => (
              <div key={a.id} onClick={() => setSelected(a)}
                style={{
                  padding: "14px 16px", cursor: "pointer",
                  background: selected?.id === a.id ? T.brandMuted : "transparent",
                  borderLeft: selected?.id === a.id ? `3px solid ${T.brand}` : "3px solid transparent",
                  borderBottom: `1px solid ${T.borderSubtle}`, transition: "background 0.15s",
                }}
                onMouseEnter={e => selected?.id !== a.id && (e.currentTarget.style.background = T.bgHover)}
                onMouseLeave={e => selected?.id !== a.id && (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: T.brandMuted, color: T.brand, fontWeight: 600 }}>{a.cat}</span>
                  <span style={{ color: T.textDisabled, fontSize: 10, fontFamily: "monospace" }}>{a.id}</span>
                  {a.ticket && <span style={{ color: T.textMuted, fontSize: 10 }}>· Origem: {a.ticket}</span>}
                </div>
                <div style={{ color: T.textSecondary, fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{a.title}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: T.textMuted, fontSize: 11 }}>👁 {a.views}</span>
                  <span style={{ color: T.textMuted, fontSize: 11 }}>👍 {a.helpful}</span>
                  {a.ticket && <span style={{ color: T.textMuted, fontSize: 11 }}>🎫 {a.ticket}</span>}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {selected ? (
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: T.brandMuted, color: T.brand, fontWeight: 600 }}>{selected.cat}</span>
              <span style={{ color: T.textDisabled, fontSize: 12, fontFamily: "monospace" }}>{selected.id}</span>
              {selected.ticket && <span style={{ color: T.textMuted, fontSize: 12 }}>· Origem: {selected.ticket}</span>}
            </div>
            <h3 style={{ color: T.textPrimary, fontWeight: 700, fontSize: 22, marginBottom: 10 }}>{selected.title}</h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${T.borderSubtle}` }}>
              <span style={{ color: T.textMuted, fontSize: 12 }}>👁 {selected.views} visualizações</span>
              <span style={{ color: T.textMuted, fontSize: 12 }}>👍 {selected.helpful} acharam útil</span>
            </div>
            <div style={{ color: T.textSecondary, fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-line" }}>{selected.content}</div>
            <div style={{ marginTop: 36, padding: "20px 24px", background: T.bgSurface2, border: `1px solid ${T.borderSubtle}`, borderRadius: 12 }}>
              <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>Este artigo foi útil para você?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="soft" onClick={() => markHelpful(selected.id)} style={{ gap: 6 }}>
                  <Icon.thumbUp /> Sim, ajudou!
                </Btn>
                <Btn variant="ghost" style={{ gap: 6 }}>
                  <Icon.thumbDown /> Não resolveu
                </Btn>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.textMuted }}>
          <div style={{ fontSize: 48 }}>📚</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Selecione um artigo para ler</div>
          <div style={{ fontSize: 13 }}>A base reúne soluções dos tickets resolvidos.</div>
        </div>
      )}
    </div>
  );
}

// ─── PAINEL SLA ──────────────────────────────────────────────────────────────
const SLA_POLICIES_FE = {
  urgent: { first_response_hours: 1,  resolution_hours: 4,  label: "Urgente" },
  high:   { first_response_hours: 4,  resolution_hours: 8,  label: "Alta"    },
  normal: { first_response_hours: 8,  resolution_hours: 24, label: "Normal"  },
  low:    { first_response_hours: 24, resolution_hours: 72, label: "Baixa"   },
};

function calcSlaStatus(ticket) {
  const policy = SLA_POLICIES_FE[ticket.priority];
  if (!policy) return null;
  const now = new Date();
  const created = new Date(ticket._created_iso || ticket.created);
  if (isNaN(created.getTime())) return null;

  const msPerHour = 3_600_000;
  const frDeadline = new Date(created.getTime() + policy.first_response_hours * msPerHour);
  const resDeadline = new Date(created.getTime() + policy.resolution_hours * msPerHour);

  const hasMsgs = ticket.msgs && ticket.msgs.length > 0;
  const isResolved = ticket.status === "done" || ticket.status === "canceled";

  // First response
  let frStatus;
  let frRemaining = null;
  if (hasMsgs) {
    frStatus = "met";
  } else if (now > frDeadline) {
    frStatus = "violated";
  } else {
    const rem = (frDeadline - now) / msPerHour;
    frStatus = rem <= 1 ? "at_risk" : "on_track";
    frRemaining = rem;
  }

  // Resolution
  let resStatus;
  let resRemaining = null;
  if (isResolved) {
    resStatus = "met";
  } else if (now > resDeadline) {
    resStatus = "violated";
  } else {
    const rem = (resDeadline - now) / msPerHour;
    resStatus = rem <= 1 ? "at_risk" : "on_track";
    resRemaining = rem;
  }

  let overall;
  if (frStatus === "violated" || resStatus === "violated") overall = "violated";
  else if (frStatus === "at_risk" || resStatus === "at_risk") overall = "at_risk";
  else if (frStatus === "met" && resStatus === "met") overall = "met";
  else overall = "on_track";

  return { frStatus, frRemaining, resStatus, resRemaining, overall, frDeadline, resDeadline, policy };
}

const SLA_COLORS = {
  on_track: T.success, met: T.info, at_risk: T.warning, violated: T.danger,
};
const SLA_LABELS = {
  on_track: "No prazo", met: "Cumprido", at_risk: "Em risco", violated: "Violado",
};

function SlaStatusBadge({ status }) {
  const color = SLA_COLORS[status] || T.textMuted;
  const label = SLA_LABELS[status] || status;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: 22,
      padding: "0 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      color, background: `${color}1a`, border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function SlaPanel({ tickets }) {
  const [tab, setTab] = useState("tickets");

  const withSla = tickets.map(t => ({ ...t, sla: calcSlaStatus(t) })).filter(t => t.sla);

  const violated  = withSla.filter(t => t.sla.overall === "violated").length;
  const atRisk    = withSla.filter(t => t.sla.overall === "at_risk").length;
  const onTrack   = withSla.filter(t => t.sla.overall === "on_track").length;
  const met       = withSla.filter(t => t.sla.overall === "met").length;
  const total     = withSla.length;
  const compliant = total > 0 ? Math.round(((onTrack + met) / total) * 100) : 0;

  // By priority summary
  const byPriority = Object.entries(SLA_POLICIES_FE).map(([prio, pol]) => {
    const group = withSla.filter(t => t.priority === prio);
    const ok = group.filter(t => t.sla.overall === "on_track" || t.sla.overall === "met").length;
    return { prio, label: pol.label, total: group.length, ok, violated: group.filter(t => t.sla.overall === "violated").length, atRisk: group.filter(t => t.sla.overall === "at_risk").length };
  }).filter(g => g.total > 0);

  const fmtHours = (h) => {
    if (h == null) return "—";
    if (h < 1) return `${Math.round(h * 60)}min`;
    return `${h.toFixed(1)}h`;
  };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: T.textPrimary }}>Painel de SLA</h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Acompanhe os acordos de nível de serviço por prioridade.</p>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Compliance"   value={`${compliant}%`} color={compliant >= 80 ? T.success : T.warning} icon={() => <span style={{ fontSize: 18 }}>📊</span>} />
        <MetricCard label="No prazo"     value={onTrack + met}   color={T.success} icon={() => <span style={{ fontSize: 18 }}>✅</span>} />
        <MetricCard label="Em risco"     value={atRisk}          color={T.warning} icon={() => <span style={{ fontSize: 18 }}>⚠️</span>} />
        <MetricCard label="Violados"     value={violated}        color={T.danger}  icon={() => <span style={{ fontSize: 18 }}>🔴</span>} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[["tickets", "Tickets"], ["prioridade", "Por Prioridade"], ["politicas", "Políticas"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all 0.15s",
            background: tab === k ? T.brand : T.bgSurface,
            color: tab === k ? "#fff" : T.textMuted, fontFamily: "inherit",
          }}>{l}</button>
        ))}
      </div>

      {tab === "tickets" && (
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "grid", gridTemplateColumns: "1fr 80px 100px 120px 120px 100px", gap: 8, color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {["Ticket", "Prioridade", "Status SLA", "1ª Resposta", "Resolução", "Restante"].map(h => <span key={h}>{h}</span>)}
          </div>
          {withSla.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Nenhum ticket com dados de SLA.</div>
          ) : withSla.sort((a, b) => {
            const order = { violated: 0, at_risk: 1, on_track: 2, met: 3 };
            return (order[a.sla.overall] ?? 4) - (order[b.sla.overall] ?? 4);
          }).map(t => (
            <div key={t.id} style={{ padding: "13px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "grid", gridTemplateColumns: "1fr 80px 100px 120px 120px 100px", gap: 8, alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(151,157,172,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{t.title}</div>
                <div style={{ color: T.textMuted, fontSize: 11, fontFamily: "monospace" }}>{t.id}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY[t.priority]?.color }}>{PRIORITY[t.priority]?.label}</span>
              <SlaStatusBadge status={t.sla.overall} />
              <SlaStatusBadge status={t.sla.frStatus} />
              <SlaStatusBadge status={t.sla.resStatus} />
              <span style={{ fontSize: 12, color: t.sla.resRemaining != null ? (t.sla.resRemaining <= 1 ? T.danger : T.textMuted) : T.textMuted }}>
                {t.sla.resRemaining != null ? fmtHours(t.sla.resRemaining) : (t.sla.resStatus === "met" ? "Resolvido" : "Vencido")}
              </span>
            </div>
          ))}
        </Card>
      )}

      {tab === "prioridade" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {byPriority.map(g => {
            const pct = g.total > 0 ? Math.round((g.ok / g.total) * 100) : 0;
            return (
              <Card key={g.prio} style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: PRIORITY[g.prio]?.color }}>{g.label}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{g.total} tickets</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: pct >= 80 ? T.success : pct >= 50 ? T.warning : T.danger }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: T.borderSubtle, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? T.success : pct >= 50 ? T.warning : T.danger, borderRadius: 4, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 12, color: T.success }}>✅ No prazo: {g.ok}</span>
                  <span style={{ fontSize: 12, color: T.warning }}>⚠️ Risco: {g.atRisk}</span>
                  <span style={{ fontSize: 12, color: T.danger }}>🔴 Violado: {g.violated}</span>
                </div>
              </Card>
            );
          })}
          {byPriority.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Nenhum dado disponível.</div>}
        </div>
      )}

      {tab === "politicas" && (
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 8, color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {["Prioridade", "1ª Resposta", "Resolução"].map(h => <span key={h}>{h}</span>)}
          </div>
          {Object.entries(SLA_POLICIES_FE).map(([prio, pol]) => (
            <div key={prio} style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: PRIORITY[prio]?.color }}>{pol.label}</span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{pol.first_response_hours}h</span>
                <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 6 }}>após abertura</span>
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{pol.resolution_hours}h</span>
                <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 6 }}>após abertura</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── ANÁLISE DE CHURN ─────────────────────────────────────────────────────────
function ChurnAnalysis({ tickets }) {
  const [tab, setTab] = useState("visao");
  const tooltipStyle = { background: T.bgElevated, border: `1px solid ${T.borderDefault}`, borderRadius: 8, fontSize: 12, color: T.textPrimary };
  const tickStyle    = { fill: T.textMuted, fontSize: 11 };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: T.textPrimary }}>Análise de Churn</h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Identifique clientes em risco com base nos dados de tickets e atendimento.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Churn médio (mês)"   value="4.2%"  color={T.warning} icon={() => <span style={{ fontSize: 18 }}>📉</span>} />
        <MetricCard label="Clientes em risco"    value="8"     color={T.danger}  icon={() => <span style={{ fontSize: 18 }}>⚠️</span>} />
        <MetricCard label="Taxa de retenção"     value="95.8%" color={T.success} icon={() => <span style={{ fontSize: 18 }}>🔒</span>} />
        <MetricCard label="Sem resposta (48h)"   value="3"     color={T.danger}  icon={() => <span style={{ fontSize: 18 }}>📭</span>} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[["visao", "Visão Geral"], ["clientes", "Clientes em Risco"], ["motivos", "Principais Motivos"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all 0.15s",
            background: tab === k ? T.brand : T.bgSurface,
            color: tab === k ? "#fff" : T.textMuted, fontFamily: "inherit",
          }}>{l}</button>
        ))}
      </div>

      {tab === "visao" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { title: "Taxa de Churn Mensal (%)", chart: <LineChart data={CHURN_DATA.monthly}><XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} /><YAxis tick={tickStyle} axisLine={false} tickLine={false} domain={[0, 8]} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="churn" stroke={T.warning} strokeWidth={2.5} dot={{ fill: T.warning, r: 4 }} name="Churn %" /></LineChart> },
            { title: "Distribuição de Risco (%)", chart: <PieChart><Pie data={CHURN_DATA.risco} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name">{CHURN_DATA.risco.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12, color: T.textMuted }} /></PieChart> },
            { title: "Tickets Abertos vs Resolvidos", chart: <BarChart data={CHURN_DATA.monthly} barGap={4}><XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} /><YAxis tick={tickStyle} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="tickets" fill={T.danger} radius={[4,4,0,0]} name="Abertos" /><Bar dataKey="resolvidos" fill={T.success} radius={[4,4,0,0]} name="Resolvidos" /><Legend wrapperStyle={{ fontSize: 12, color: T.textMuted }} /></BarChart> },
            { title: "Taxa de Retenção Mensal (%)", chart: <LineChart data={CHURN_DATA.monthly}><XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} /><YAxis tick={tickStyle} axisLine={false} tickLine={false} domain={[92, 100]} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="retencao" stroke={T.success} strokeWidth={2.5} dot={{ fill: T.success, r: 4 }} name="Retenção %" /></LineChart> },
          ].map(({ title, chart }, i) => (
            <Card key={i} style={{ padding: 22 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 18 }}>{title}</div>
              <ResponsiveContainer width="100%" height={200}>{chart}</ResponsiveContainer>
            </Card>
          ))}
        </div>
      )}

      {tab === "clientes" && (
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {["Cliente", "Tickets", "Abertos", "Últ. contato", "Risco", "Score"].map(h => <span key={h}>{h}</span>)}
          </div>
          {CHURN_DATA.clientes.map((c, i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(151,157,172,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar label={c.nome.split(" ").map(w => w[0]).join("")} size={28}
                  bg={c.risco === "alto" ? T.danger : c.risco === "medio" ? T.warning : T.success} />
                <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 500 }}>{c.nome}</span>
              </div>
              <span style={{ color: T.textSecondary, fontSize: 13 }}>{c.tickets}</span>
              <span style={{ color: c.abertos > 0 ? T.danger : T.success, fontSize: 13 }}>{c.abertos}</span>
              <span style={{ color: T.textSecondary, fontSize: 13 }}>{c.ultimo}</span>
              <RiscoBadge risco={c.risco} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: T.borderSubtle, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.score}%`, borderRadius: 4, background: c.score >= 75 ? T.danger : c.score >= 50 ? T.warning : T.success }} />
                </div>
                <span style={{ color: T.textMuted, fontSize: 11, minWidth: 28 }}>{c.score}%</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "motivos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 18 }}>Principais causas de risco</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CHURN_DATA.motivos} layout="vertical">
                <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="motivo" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={T.brand} radius={[0,4,4,0]} name="Casos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.textPrimary, marginBottom: 18 }}>Recomendações de ação</div>
            {[
              { color: T.danger,  title: "Urgente — Bruno Castro",   desc: "5 tickets abertos. Ligar em até 24h." },
              { color: T.danger,  title: "Urgente — Patricia Silva", desc: "4 tickets, 2 sem resposta há 3 dias." },
              { color: T.warning, title: "Atenção — Carlos Mota",    desc: "Score 61%. Acompanhar resolução." },
              { color: T.success, title: "Estável — Diego Ramos",    desc: "Score baixo. Manter atendimento." },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${T.borderSubtle}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ color: r.color, fontSize: 13, fontWeight: 600 }}>{r.title}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 3 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
function Settings({ user, role }) {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: T.textPrimary, marginBottom: 4 }}>Configurações</div>
      <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 24 }}>Perfil e preferências da conta.</div>
      <Card style={{ padding: 28, maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <Avatar label={user.avatar} size={52} bg={role === "agent" ? "#6d28d9" : T.brand} />
          <div>
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16 }}>{user.name}</div>
            <div style={{ color: T.textMuted, fontSize: 13 }}>{user.email}</div>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, marginTop: 8, display: "inline-block", background: role === "agent" ? "rgba(109,40,217,0.15)" : T.brandMuted, color: role === "agent" ? "#a78bfa" : T.brand, fontWeight: 600 }}>
              {role === "agent" ? "Técnico / Agente" : "Usuário / Cliente"}
            </span>
            {user.roles && user.roles.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {user.roles.map(r => (
                  <span key={r} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(4,102,200,0.12)", color: T.brand, fontWeight: 600, letterSpacing: "0.04em" }}>
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {[["Nome", user.name], ["E-mail", user.email], ["Papel", role === "agent" ? "Agente de Suporte" : "Cliente"], ["Roles (Core)", (user.roles && user.roles.length > 0) ? user.roles.join(", ") : "—"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", padding: "13px 0", borderBottom: `1px solid ${T.borderSubtle}`, alignItems: "center" }}>
            <span style={{ color: T.textMuted, fontSize: 13, minWidth: 90 }}>{k}</span>
            <span style={{ color: T.textSecondary, fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole]                 = useState(null);
  const [user, setUser]                 = useState(null);   // perfil real vindo de /auth/me
  const [page, setPage]                 = useState("dashboard");
  const [tickets, setTickets]           = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNew, setShowNew]           = useState(false);

  // Map auth/profile object -> local user shape used by the app
  const buildUserFromProfile = (profile, inferredRole) => {
    if (!profile) return null;
    // name pode vir vazio do Core Engine — usa email como fallback legível
    const displayName = profile.name || profile.full_name || profile.username
      || (profile.email ? profile.email.split("@")[0] : null)
      || (inferredRole === "agent" ? USERS_DB.agent.name : USERS_DB.user.name);
    const avatarSrc = profile.avatar
      ? String(profile.avatar).slice(0, 2).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();
    return {
      id: profile.id || (inferredRole === "agent" ? USERS_DB.agent.id : USERS_DB.user.id),
      name: displayName,
      email: profile.email || "",
      role: inferredRole,
      roles: profile.roles || [],
      avatar: avatarSrc,
    };
  };
  
  const loadTickets = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/v1/tickets`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Falha ao buscar tickets");
      const data = await res.json();
      const mapped = data.items.map(t => {
        const u = Object.values(USERS_DB).find(u => u.id === t.user_id);
        return {
          id: t.id,
          shortId: `SD-${String(t.id).replace(/-/g, "").slice(0, 6).toUpperCase()}`,
          title: t.title,
          desc: t.description,
          status: t.status,
          priority: t.priority,
          cat: t.category,
          user: u ? u.name : (t.user_id || "Usuário"),
          user_id: t.user_id || "",
          created: new Date(t.created_at).toLocaleDateString("pt-BR"),
          _created_iso: t.created_at,
          msgs: []
        };
      });

      // Só atualiza o estado se algo realmente mudou — evita re-render
      // desnecessário (e a tela piscando) a cada ciclo de polling.
      // Preserva também as msgs já carregadas em memória para cada ticket.
      setTickets(prev => {
        const prevMap = Object.fromEntries(prev.map(t => [t.id, t]));
        let changed = mapped.length !== prev.length;
        const merged = mapped.map(t => {
          const old = prevMap[t.id];
          if (!old) { changed = true; return t; }
          // Checa se algum campo relevante mudou (ignora msgs, que são geridas separado)
          const diff =
            old.title    !== t.title   ||
            old.status   !== t.status  ||
            old.priority !== t.priority||
            old.cat      !== t.cat     ||
            old.user_id  !== t.user_id;
          if (diff) changed = true;
          // Preserva as mensagens já em memória
          return diff ? { ...t, msgs: old.msgs } : old;
        });
        return changed ? merged : prev;
      });
    } catch (e) {
      console.error("Falha ao carregar tickets:", e);
    }
  };
  
  useEffect(() => {
    if (!role) return;

    // Carga inicial
    loadTickets();

    // BUG FIX: polling a cada 5s para atualizar a lista de tickets.
    // Sem isso, novos tickets criados pelo outro lado (agente ou usuário)
    // só aparecem após logout/login — o estado local nunca era atualizado.
    const ticketInterval = setInterval(() => {
      loadTickets();
    }, 5000);

    return () => clearInterval(ticketInterval);
  }, [role]);
  
  const handleCreate = async (form) => {
    // UUID regex — só manda user_id se for um UUID válido (evita 422/500 com "demo-agent" etc.)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeUuid = (id) => (id && UUID_RE.test(id) ? id : null);

    const payload = {
      title: form.title.trim(),
      description: form.desc.trim(),
      status: "pending",
      priority: form.priority || "normal",
      category: form.cat || null,
      // agente: client_id do form (se vier) ou null; usuário: próprio id se for UUID válido
      user_id: role === "agent" ? safeUuid(form.client_id) : safeUuid(user.id),
    };
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.detail || body?.message || `Erro ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    const novo = await res.json();
    await loadTickets();
    setActiveTicket(novo.id);
  };

  const PAGE_TITLE = {
    dashboard: "Dashboard", tickets: "Tickets", messages: "Mensagens",
    knowledge: "Base de Conhecimento", sla: "Painel de SLA", churn: "Análise de Churn", settings: "Configurações",
  };

  const showNewBtn = (page === "dashboard" || page === "tickets");

  if (!role || !user) {
    return (
      <Login
        onLogin={(r, profile) => {
          setRole(r);
          setUser(buildUserFromProfile(profile, r));
          setPage("dashboard");
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bgApp, color: T.textPrimary, fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      <Sidebar role={role} page={page} setPage={setPage} user={user}
        onLogout={() => { authApi.logout(); setRole(null); setUser(null); setPage("dashboard"); }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar title={PAGE_TITLE[page]} onNew={showNewBtn ? () => setShowNew(true) : undefined} />

        <div style={{ flex: 1, overflowY: ["messages", "knowledge", "churn", "sla"].includes(page) ? "hidden" : "auto", background: T.bgApp }}>
          {page === "dashboard" && role === "agent" && <DashboardAgent tickets={tickets} setPage={setPage} setActiveTicket={setActiveTicket} user={user} />}
          {page === "dashboard" && role === "user"  && <DashboardUser  user={user} tickets={tickets} setPage={setPage} setActiveTicket={setActiveTicket} />}
          {page === "tickets"   && role === "agent" && <TicketsBoard tickets={tickets} setTickets={setTickets} activeTicket={activeTicket} setActiveTicket={setActiveTicket} setPage={setPage} />}
          {page === "tickets"   && role === "user"  && <TicketsUser  tickets={tickets} user={user} setActiveTicket={setActiveTicket} setPage={setPage} />}
          {page === "messages"  && <Mensagens  tickets={tickets} setTickets={setTickets} user={user} role={role} activeId={activeTicket} setActiveId={setActiveTicket} />}
          {page === "knowledge" && <KnowledgeBase role={role} tickets={tickets} />}
          {page === "sla"       && role === "agent" && <SlaPanel tickets={tickets} />}
          {page === "churn"     && role === "agent" && <ChurnAnalysis tickets={tickets} />}
          {page === "settings"  && <Settings user={user} role={role} />}
        </div>
      </div>

      {showNew && (
        <NovoTicketModal
          onClose={() => setShowNew(false)}
          onCreate={async (form) => { await handleCreate(form); setShowNew(false); }} />
      )}
    </div>
  );
}