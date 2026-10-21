import apiClient from "./api";
import { LoginResponse, User } from "@/types";
import { encryptPasswordAsymmetric } from "./crypto";

export const authService = {
  /**
   * Inicia sesión encriptando asimétricamente la contraseña en el cliente.
   * El token JWT se almacena exclusivamente en una Cookie HttpOnly del backend.
   * Se crea una bandera de sesión en el navegador ('recoffee_session') para que
   * el Middleware de Next.js permita el paso al panel principal.
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const encryptedPassword = await encryptPasswordAsymmetric(password);

    const response = await apiClient.post<LoginResponse>("/api/auth/login", {
      username,
      password: encryptedPassword,
    });

    if (response.data.user && typeof window !== "undefined") {
      // Bandera de sesión ligera para enrutamiento en Next.js
      document.cookie = "recoffee_session=1; path=/; max-age=604800; SameSite=Lax";
      // Guardar perfil no sensible para hidratación de interfaz
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
        document.cookie = "recoffee_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        localStorage.removeItem("recoffee_user_profile");
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
        document.cookie = "recoffee_session=1; path=/; max-age=604800; SameSite=Lax";
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
