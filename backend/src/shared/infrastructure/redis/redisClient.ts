import { Redis } from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 5) return null;
    return Math.min(times * 100, 2000);
  },
});

redis.on("error", (err: Error) => {
  console.error("[Redis] Error de conexión:", err.message);
});

redis.on("connect", () => {
  console.info("[Redis] Conexión establecida exitosamente.");
});
