import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { PosController } from "./pos.controller.js";

export interface PosRouteOptions {
  posController: PosController;
}

export const posRoutes: FastifyPluginAsync<PosRouteOptions> = async (
  fastify: FastifyInstance,
  opts: PosRouteOptions,
): Promise<void> => {
  fastify.post("/sales", opts.posController.handleProcessSale);
};
