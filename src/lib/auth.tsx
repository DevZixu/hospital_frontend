"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiGet,
  apiPost,
  clearTokens,
  readTokens,
  writeTokens,
} from "./api";
import type { AuthTokens, Role, User } from "./types";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
}

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (): Promise<User | null> => {
    try {
      const me = await apiGet<User>("/auth/me");
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = readTokens();
    if (!stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    setTokens(stored);
    loadUser().finally(() => setLoading(false));
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<LoginResponse>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
    writeTokens(res.tokens);
    setTokens(res.tokens);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiPost("/auth/register", payload, { auth: false });
  }, []);

  const logout = useCallback(async () => {
    const current = readTokens();
    try {
      await apiPost("/auth/logout", { refreshToken: current?.refreshToken }, { auth: false });
    } catch {
      // ignore network errors on logout
    }
    clearTokens();
    setTokens(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => loadUser(), [loadUser]);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, tokens, loading, login, register, logout, refreshUser, hasRole }),
    [user, tokens, loading, login, register, logout, refreshUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
