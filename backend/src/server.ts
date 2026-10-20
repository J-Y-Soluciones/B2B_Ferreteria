// src/server.ts
import { buildApp } from "./app.js";
import { env } from "./core/config/env.js";

const { app, pool } = await buildApp();

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(app.printRoutes());
    app.log.info(
      `[PROD READY] API Core escuchando en http://${env.HOST}:${env.PORT}${env.API_PREFIX}`,
    );
  } catch (err) {
    app.log.error(err, "Fallo crítico al iniciar el servidor Fastify");
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  app.log.warn(
    `Señal ${signal} interceptada: liberando pools y cerrando conexiones...`,
  );
  try {
    await app.close();
    await pool.end();
    app.log.info(
      "Servidor Fastify y pool de PostgreSQL finalizados limpiamente.",
    );
    process.exit(0);
  } catch (err) {
    app.log.error(err, "Error durante el cierre ordenado");
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

await start();
