import { FastifyInstance } from "fastify";
import { PasswordRecoveryController } from "../controllers/password-recovery.controller.js";

export function registerPasswordRecoveryRoutes(
  server: FastifyInstance,
  controller: PasswordRecoveryController,
) {
  server.register(
    async (authScope) => {
      // Rutas públicas con limitador estricto para mitigar ataques de fuerza bruta
      authScope.post(
        "/forgot-password",
        {
          config: {
            rateLimit: {
              max: 5,
              timeWindow: "15 minutes",
            },
          },
        },
        (req, rep) => controller.forgotPassword(req, rep),
      );

      authScope.post(
        "/reset-password",
        {
          config: {
            rateLimit: {
              max: 10,
              timeWindow: "15 minutes",
            },
          },
        },
        (req, rep) => controller.resetPassword(req, rep),
      );
    },
    { prefix: "/api/v1/auth" },
  );
}
