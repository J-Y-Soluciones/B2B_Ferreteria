import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AuthController } from "./auth.controller.js";

export interface AuthRouteOptions {
  controller: AuthController;
}

export const authRoutes: FastifyPluginAsync<AuthRouteOptions> = async (
  fastify: FastifyInstance,
  opts: AuthRouteOptions,
): Promise<void> => {
  fastify.post("/login", opts.controller.handleLogin);
  fastify.post("/forgot-password", opts.controller.handleForgotPassword);
  fastify.post("/reset-password", opts.controller.handleResetPassword);
  fastify.post(
    "/change-initial-password",
    opts.controller.handleChangeInitialPassword,
  );
};
