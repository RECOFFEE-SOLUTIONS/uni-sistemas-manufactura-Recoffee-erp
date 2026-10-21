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

// Función de limpieza de estado de sesión en cliente
export function clearClientAuthState() {
  if (typeof window !== "undefined") {
    // Limpieza exhaustiva de cookies de sesión
    document.cookie = "recoffee_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_must_change=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "recoffee_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    // Limpieza de almacenamiento local y de sesión
    localStorage.removeItem("recoffee_user_profile");
    localStorage.removeItem("recoffee_must_change_pwd");
    localStorage.removeItem("recoffee_token");
    localStorage.removeItem("recoffee_user");
    sessionStorage.clear();
  }
}

// Response Interceptor: Manejo estricto de 401 (Unauthorized) y 429 (Too Many Requests)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || "";

      // Intercepción 401 Unauthorized desde el dashboard o cualquier endpoint protegido
      if (status === 401) {
        if (typeof window !== "undefined") {
          const isLoginEndpoint = url.includes("/api/auth/login") || url.includes("/api/auth/public-key");

          // Si el fallo de 401 no proviene de intentar loguearse (sino de operar el sistema o me)
          if (!isLoginEndpoint) {
            clearClientAuthState();

            if (!window.location.pathname.startsWith("/login")) {
              window.location.href = "/login?session_expired=true";
            }
          }
        }
      }

      // Intercepción 429 Too Many Requests (Rate Limiter activo en backend)
      if (status === 429) {
        console.warn("[RateLimiter] 429 Too Many Requests detectado en llamada API:", url);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
