import axios, { type AxiosError } from "axios";
import { env } from "@/config/env";
import { rfc7807ProblemDetailsSchema, ProblemDetailsError } from "./rfc7807";

export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jypos_token");
  const tenantId = localStorage.getItem("jypos_tenant_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // No enviar X-Tenant-Id previo si se está iniciando sesión
  const isAuthLogin = config.url?.includes("/auth/login");
  if (tenantId && !isAuthLogin) {
    config.headers["X-Tenant-Id"] = tenantId;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<unknown>;

      // 401: Sesión caducada / token revocado
      if (axiosError.response?.status === 401) {
        localStorage.removeItem("jypos_session");
        localStorage.removeItem("jypos_token");
        localStorage.removeItem("jypos_tenant_id");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // Procesamiento de error RFC 7807 del backend
      if (
        axiosError.response?.data &&
        typeof axiosError.response.data === "object"
      ) {
        const parsedProblem = rfc7807ProblemDetailsSchema.safeParse(
          axiosError.response.data,
        );
        if (parsedProblem.success) {
          return Promise.reject(new ProblemDetailsError(parsedProblem.data));
        }
      }

      // Normalización de error no estructurado
      return Promise.reject(
        new ProblemDetailsError({
          title: axiosError.response?.statusText ?? "Error de red",
          status: axiosError.response?.status ?? 500,
          detail:
            axiosError.message ??
            "Ocurrió un error inesperado al procesar la solicitud.",
        }),
      );
    }

    return Promise.reject(error);
  },
);
