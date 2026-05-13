import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { loginApi, registerApi, type LoginResponse } from "@/lib/api";

/* ---------- types ---------- */

interface AuthUser {
  id?: number;
  email?: string;
  full_name?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

/* ---------- context ---------- */

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // corrupt data — ignore
      }
    }
    setLoading(false);
  }, []);

  const persist = (data: LoginResponse) => {
    setToken(data.access_token);
    setUser(data.user as AuthUser);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);
      persist(data);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData: Record<string, unknown>) => {
    try {
      const data = await registerApi(userData);
      persist(data);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
