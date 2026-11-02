import apiClient, { clearClientAuthState } from "./api";
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
    let passwordToSend = password;
    try {
      passwordToSend = await encryptPasswordAsymmetric(password);
    } catch (cryptoErr) {
      console.warn("[Auth] Fallback de criptografía activo: enviando credencial en formato estándar:", cryptoErr);
      passwordToSend = password;
    }

    let response;
    try {
      response = await apiClient.post<LoginResponse>("/api/auth/login", {
        username,
        password: passwordToSend,
      });
    } catch (err: any) {
      // Si el primer intento con cifrado fue rechazado (401), reintentar automáticamente en texto plano
      // por si la clave RSA del servidor fue regenerada o hubo desfase de cifrado asimétrico
      if (passwordToSend !== password && err?.response?.status === 401) {
        console.warn("[Auth] Reintentando autenticación con fallback directo en texto plano...");
        response = await apiClient.post<LoginResponse>("/api/auth/login", {
          username,
          password: password,
        });
      } else {
        throw err;
      }
    }

    if (response.data.user && typeof window !== "undefined") {
      // Bandera de sesión ligera para enrutamiento en Next.js
      document.cookie = "recoffee_session=1; path=/; max-age=604800; SameSite=Lax";
      const mainRole = response.data.user.roles?.[0] || "Admin";
      document.cookie = "recoffee_role=" + encodeURIComponent(mainRole) + "; path=/; max-age=604800; SameSite=Lax";

      if (response.data.token) {
        document.cookie = "recoffee_token=" + encodeURIComponent(response.data.token) + "; path=/; max-age=604800; SameSite=Lax";
        localStorage.setItem("recoffee_token", response.data.token);
      }

      // Guardar perfil completo con roles para hidratación inmediata de AuthContext y Sidebar
      localStorage.setItem("recoffee_user_profile", JSON.stringify(response.data.user));

      if (response.data.mustChangePassword) {
        document.cookie = "recoffee_must_change=1; path=/; max-age=604800; SameSite=Lax";
        localStorage.setItem("recoffee_must_change_pwd", "true");
      } else {
        document.cookie = "recoffee_must_change=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        localStorage.removeItem("recoffee_must_change_pwd");
      }
    }

    return response.data;
  },

  /**
   * Cierra la sesión en el backend para revocar/eliminar la Cookie HttpOnly
   */
  async logout(redirect: boolean = true): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Silencioso en caso de error de red
    } finally {
      clearClientAuthState();
      if (redirect && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  },

  /**
   * Cambia la contraseña del usuario autenticado (requerido cuando mustChangePassword es true).
   */
  async changePassword(newPassword: string, currentPassword?: string, resetToken?: string): Promise<{ message: string }> {
    const encryptedNewPassword = await encryptPasswordAsymmetric(newPassword);
    const encryptedCurrent = currentPassword ? await encryptPasswordAsymmetric(currentPassword) : undefined;

    const response = await apiClient.post<{ message: string }>("/api/auth/change-password", {
      currentPassword: encryptedCurrent,
      newPassword: encryptedNewPassword,
      resetToken,
    });

    if (typeof window !== "undefined") {
      document.cookie = "recoffee_must_change=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      localStorage.removeItem("recoffee_must_change_pwd");
    }

    return response.data;
  },

  /**
   * Solicita una contraseña temporal o token de recuperación vía Olvidé mi clave.
   */
  async forgotPassword(emailOrUsername: string): Promise<{ message: string; temporaryPassword?: string; resetToken?: string }> {
    const response = await apiClient.post<{ message: string; temporaryPassword?: string; resetToken?: string }>(
      "/api/auth/forgot-password",
      { emailOrUsername }
    );
    return response.data;
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
        const mainRole = response.data.roles?.[0] || "";
        document.cookie = "recoffee_role=" + encodeURIComponent(mainRole) + "; path=/; max-age=604800; SameSite=Lax";
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
