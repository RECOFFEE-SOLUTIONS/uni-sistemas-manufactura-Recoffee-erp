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

// Response Interceptor: Manejo de errores globales y expiración de sesión (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        const isAuthEndpoint =
          error.config?.url?.includes("/api/auth/login") ||
          error.config?.url?.includes("/api/auth/public-key") ||
          error.config?.url?.includes("/api/auth/me");
        if (!isAuthEndpoint) {
          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login?session_expired=true";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
