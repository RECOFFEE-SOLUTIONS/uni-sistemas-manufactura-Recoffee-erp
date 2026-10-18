import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor: Inyectar token JWT automáticamente
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("recoffee_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Manejo de errores globales y expiración de sesión (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        const isAuthEndpoint = error.config?.url?.includes("/api/auth/login");
        if (!isAuthEndpoint) {
          localStorage.removeItem("recoffee_token");
          localStorage.removeItem("recoffee_user");
          // Si no estamos en la página de login, redirigir
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
