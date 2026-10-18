import apiClient from "./api";
import { LoginResponse, User } from "@/types";

function setCookie(name: string, val: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(val)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", {
      username,
      password,
    });
    if (response.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("recoffee_token", response.data.token);
        localStorage.setItem("recoffee_user", JSON.stringify(response.data.user));
        setCookie("recoffee_token", response.data.token, 7);
      }
    }
    return response.data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("recoffee_token");
      localStorage.removeItem("recoffee_user");
      deleteCookie("recoffee_token");
      window.location.href = "/login";
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recoffee_token") || getCookie("recoffee_token");
    }
    return null;
  },

  getUser(): User | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recoffee_user");
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  async getMe(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>("/api/auth/me");
      if (response.data && typeof window !== "undefined") {
        localStorage.setItem("recoffee_user", JSON.stringify(response.data));
      }
      return response.data;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
