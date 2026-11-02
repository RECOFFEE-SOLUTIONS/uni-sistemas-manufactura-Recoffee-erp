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
  // Inicialización síncrona inmediata desde localStorage para que los roles estén disponibles al instante
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      return authService.getUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
      try {
        const freshUser = await authService.getMe();
        if (freshUser) {
          setUser(freshUser);
        }
      } catch (err) {
        console.info("[AuthContext] Sesión local conservada:", err);
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
