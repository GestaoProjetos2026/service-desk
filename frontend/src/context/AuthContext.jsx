import { createContext, useContext, useState, useCallback } from "react";
import * as authApi from "../api/auth.js";
import { setToken } from "../api/client.js";

/**
 * AuthContext — estado global de autenticação.
 *
 * Compatível com a UX atual: o componente Login continua aceitando as
 * contas demo via fallback local. Quando o backend está disponível, a
 * tentativa real é feita primeiro.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, name, email, roles, perms }
  const [role, setRole] = useState(null);   // "agent" | "user" — derivado das roles do Core ou do mock

  const loginReal = useCallback(async (email, password) => {
    await authApi.login(email, password);
    const profile = await authApi.me();
    setUser(profile);
    const inferred = inferRole(profile);
    setRole(inferred);
    return { profile, role: inferred };
  }, []);

  const loginMock = useCallback((mockUser, mockRole) => {
    setUser(mockUser);
    setRole(mockRole);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loginReal, loginMock, logout, setRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

/**
 * Mapeia as roles do Core Engine para os perfis internos do Service Desk.
 * - "agent"/"admin"/"support" → agent
 * - qualquer outra              → user
 */
function inferRole(profile) {
  const roles = (profile && profile.roles) || [];
  const agentRoles = ["agent", "admin", "support", "tecnico", "técnico"];
  return roles.some((r) => agentRoles.includes(String(r).toLowerCase())) ? "agent" : "user";
}
