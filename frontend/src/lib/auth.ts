import apiClient from "./api";
import { LoginResponse, User } from "@/types";

export const authService = {
  async login(username: string, password: string):Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", {
      username,
      password,
    });
    if (response.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("recoffee_token", response.data.token);
        localStorage.setItem("recoffee_user", JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("recoffee_token");
      localStorage.removeItem("recoffee_user");
      window.location.href = "/login";
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("recoffee_token");
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
