"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { LoginResponse, User } from "@/types";
import { authService } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
      try {
        // Valida la sesión activa a través de la Cookie HttpOnly segura en backend
        const freshUser = await authService.getMe();
        if (freshUser) {
          setUser(freshUser);
        } else {
          // Si el backend no validó la cookie, resetear estado en cliente sin redirigir de inmediato
          authService.logout(false);
          setUser(null);
        }
      } catch {
        // 401: la sesión HttpOnly no está activa
        authService.logout(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.login(username, password);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout(true);
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await authService.getMe();
    if (u) {
      setUser(u);
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
