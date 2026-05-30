/**
 * Wrappers para as rotas /api/v1/auth/* expostas pelo backend.
 * Cada função propaga `ApiError` para o chamador decidir o que fazer.
 */

import { api, setToken } from "./client.js";

export async function login(email, password) {
  const tokens = await api.post("/auth/login", { email, password }, { auth: false });
  if (tokens && tokens.access_token) setToken(tokens.access_token);
  return tokens;
}

export async function register(name, email, password) {
  return api.post("/auth/register", { name, email, password }, { auth: false });
}

export async function refresh(refreshToken) {
  const tokens = await api.post("/auth/refresh", { refresh_token: refreshToken }, { auth: false });
  if (tokens && tokens.access_token) setToken(tokens.access_token);
  return tokens;
}

export async function me() {
  return api.get("/auth/me");
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    /* logout é best-effort; sempre limpamos o token local */
  } finally {
    setToken(null);
  }
}
