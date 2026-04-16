"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, ApiError } from "@/lib/api/client";
import { clearSession, getStoredToken, getStoredUser, storeSession } from "@/lib/auth/session";
import { User } from "@/types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(() => Boolean(getStoredToken()));

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setIsBootstrapping(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await api.me(token);
      setUser(me);
      storeSession(token, me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      throw error;
    }
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });
    storeSession(response.access_token, response.user);
    setToken(response.access_token);
    setUser(response.user);
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    api
      .me(token)
      .then((me) => {
        if (cancelled) {
          return;
        }
        setUser(me);
        storeSession(token, me);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        logout();
      })
      .finally(() => {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isBootstrapping,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshUser,
    }),
    [token, user, isBootstrapping, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
