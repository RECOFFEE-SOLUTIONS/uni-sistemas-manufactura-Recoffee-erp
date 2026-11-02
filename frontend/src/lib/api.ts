import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true, // Habilita transporte de Cookies HttpOnly Seguras (recoffee_jwt)
});

// Request Interceptor: Inyectar Authorization Bearer token desde localStorage si existe
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("recoffee_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = "Bearer " + token;
    }
  }
  return config;
});

// Función de limpieza de estado de sesión en cliente
export function clearClientAuthState() {
  if (typeof window !== "undefined") {
    document.cookie = "recoffee_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_must_change=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    localStorage.removeItem("recoffee_user_profile");
    localStorage.removeItem("recoffee_must_change_pwd");
    localStorage.removeItem("recoffee_token");
    localStorage.removeItem("recoffee_user");
    sessionStorage.clear();
  }
}

// Response Interceptor: NO desloguear agresivamente si falla /api/auth/me
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || "";

      // Solo desloguear si es 401 explícito en operaciones del sistema (excluyendo login, public-key y me)
      if (status === 401) {
        if (typeof window !== "undefined") {
          const isAuthEndpoint =
            url.includes("/api/auth/login") ||
            url.includes("/api/auth/public-key") ||
            url.includes("/api/auth/me");

          if (!isAuthEndpoint) {
            clearClientAuthState();
            if (!window.location.pathname.startsWith("/login")) {
              window.location.href = "/login?session_expired=true";
            }
          }
        }
      }

      if (status === 429) {
        console.warn("[RateLimiter] 429 Too Many Requests detectado en:", url);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
