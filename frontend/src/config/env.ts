// src/core/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .url("VITE_API_BASE_URL debe ser una URL válida")
    .default("http://localhost:3000/api/v1"),
  VITE_APP_NAME: z.string().min(1).default("JYPoS Industrial"),
  VITE_APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error("Configuración de entorno inválida:", parsedEnv.error.format());
  throw new Error("Variables de entorno no válidas para la aplicación.");
}

export const env = parsedEnv.data;
