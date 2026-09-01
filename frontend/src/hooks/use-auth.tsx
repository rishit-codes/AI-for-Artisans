import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { loginApi, registerApi, logoutAllDevicesApi, type LoginResponse } from "@/lib/api";

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
  logoutAllDevices: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
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

  // A 401 from any API call (including a token revoked server-side by
  // logoutAllDevices, possibly from a different tab) clears localStorage in
  // handleResponse — this mirrors that into React state so the UI actually
  // reflects it instead of still looking logged in.
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
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

  const logoutAllDevices = useCallback(async () => {
    try {
      await logoutAllDevicesApi();
    } finally {
      // Revoke server-side first so other devices' tokens actually stop working;
      // clear local state regardless of whether that call succeeded.
      logout();
    }
  }, [logout]);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, logoutAllDevices, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
