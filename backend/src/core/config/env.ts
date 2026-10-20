import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  API_PREFIX: z.string().default("/api/v1"),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(5).default(10),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().default(5000),

  REDIS_URL: z.string().min(1),
  REDIS_KEY_PREFIX: z.string().default("jypos:"),

  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRATION_SECONDS: z.coerce.number().int().default(900),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().int().default(7),

  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().default(5),
  RATE_LIMIT_LOGIN_TTL_SECONDS: z.coerce.number().int().default(60),

  FISCAL_WORKER_ENABLED: z.coerce.boolean().default(false),
  FISCAL_POLLING_INTERVAL_MS: z.coerce.number().int().default(3000),
  FISCAL_MAX_RETRIES: z.coerce.number().int().default(5),

  // Configuración de Email SMTP
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  EMAIL_FROM: z.string().default("JYPos <no-reply@jypos.pe>"),
  FRONTEND_PLATFORM_URL: z.string().url().default("http://localhost:5173"),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("CRITICAL: Configuración de entorno inválida:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env: EnvConfig = parsedEnv.data;
