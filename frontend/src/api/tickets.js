/**
 * Wrappers para as rotas /api/v1/tickets do backend.
 *
 * O backend usa UUID e nomes "description"/"category"/"created_at", enquanto
 * a UI atual trabalha com "desc"/"cat"/"created" e um id curto exibido.
 * As funções `toUi`/`toApi` traduzem entre os dois formatos sem vazar
 * detalhes do schema para o restante da aplicação.
 */

import { api } from "./client.js";

const STATUSES = new Set(["pending", "in_process", "done", "canceled"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);

function shortId(uuid) {
  if (!uuid) return "SD-???";
  const head = String(uuid).replace(/-/g, "").slice(0, 6).toUpperCase();
  return `SD-${head}`;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

/** Backend → shape consumido pela UI. */
export function toUi(t, currentUserName = "") {
  return {
    id:        shortId(t.id),
    uuid:      t.id,
    title:     t.title,
    desc:      t.description,
    status:    t.status,
    priority:  t.priority,
    cat:       t.category || "other",
    user:      currentUserName || "—",
    user_id:   t.user_id,
    created:   formatDate(t.created_at),
    created_at:t.created_at,
    msgs:      [],
  };
}

/** Shape da UI → payload aceito pelo POST /tickets. */
export function toApi(form, currentUserId) {
  const payload = {
    title:       form.title,
    description: form.desc || form.description || "",
    status:      STATUSES.has(form.status)     ? form.status   : "pending",
    priority:    PRIORITIES.has(form.priority) ? form.priority : "normal",
    category:    form.cat || form.category || null,
  };
  if (isUuid(currentUserId)) payload.user_id = currentUserId;
  return payload;
}

export async function listTickets({ skip = 0, limit = 50 } = {}) {
  return api.get(`/tickets?skip=${skip}&limit=${limit}`);
}

export async function createTicket(payload) {
  return api.post("/tickets", payload);
}

export async function updateTicket(uuid, patch) {
  return api.patch(`/tickets/${uuid}`, patch);
}
