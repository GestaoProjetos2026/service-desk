/**
 * Cliente HTTP central para o backend Service Desk.
 *
 * Lê a base da API em ordem:
 *   1. import.meta.env.VITE_API_BASE   (build/dev do Vite)
 *   2. "/api/v1"                       (default — atende dev com proxy e prod com nginx)
 *
 * Injeta automaticamente o `Authorization: Bearer <token>` quando o token
 * estiver salvo em localStorage("sd:token"). Lança `ApiError` em respostas
 * não-2xx para o chamador tratar.
 */

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "/api/v1";

const TOKEN_KEY = "sd:token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors (SSR/private mode) */
  }
}

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const url = `${API_BASE}${path}`;
  const finalHeaders = { Accept: "application/json", ...headers };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(0, `Falha de rede: ${err.message}`, null);
  }

  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      (data && (data.detail || data.message || data.error)) ||
      response.statusText ||
      `HTTP ${response.status}`;
    throw new ApiError(response.status, typeof message === "string" ? message : JSON.stringify(message), data);
  }

  return data;
}

export const api = {
  get:  (path, opts)        => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts)  => request(path, { ...opts, method: "POST", body }),
  put:  (path, body, opts)  => request(path, { ...opts, method: "PUT",  body }),
  patch:(path, body, opts)  => request(path, { ...opts, method: "PATCH", body }),
  del:  (path, opts)        => request(path, { ...opts, method: "DELETE" }),
};

export default api;
