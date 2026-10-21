import apiClient from "./api";
import { LoginResponse, User } from "@/types";
import { encryptPasswordAsymmetric } from "./crypto";

export const authService = {
  /**
   * Inicia sesión encriptando asimétricamente la contraseña en el cliente.
   * El token JWT se almacena exclusivamente en una Cookie HttpOnly del navegador,
   * sin tocar LocalStorage ni SessionStorage.
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const encryptedPassword = await encryptPasswordAsymmetric(password);

    const response = await apiClient.post<LoginResponse>("/api/auth/login", {
      username,
      password: encryptedPassword,
    });

    if (response.data.user && typeof window !== "undefined") {
      // Guardar únicamente perfil no sensible para hidratación de interfaz
      localStorage.setItem("recoffee_user_profile", JSON.stringify(response.data.user));
    }

    return response.data;
  },

  /**
   * Cierra la sesión en el backend para revocar/eliminar la Cookie HttpOnly
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Silencioso en caso de error de red
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("recoffee_user_profile");
        // Asegurar limpieza de legacy keys si existían
        localStorage.removeItem("recoffee_token");
        localStorage.removeItem("recoffee_user");
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }
  },

  getUser(): User | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recoffee_user_profile");
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
        localStorage.setItem("recoffee_user_profile", JSON.stringify(response.data));
      }
      return response.data;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getUser();
  },
};
