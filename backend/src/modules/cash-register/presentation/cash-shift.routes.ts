import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { CashShiftController } from "./cash-shift.controller.js";

export interface CashShiftRouteOptions {
  controller: CashShiftController;
}

export const cashShiftRoutes: FastifyPluginAsync<
  CashShiftRouteOptions
> = async (
  fastify: FastifyInstance,
  opts: CashShiftRouteOptions,
): Promise<void> => {
  const { controller } = opts;

  // Ruta para consultar el turno activo del usuario autenticado
  fastify.get("/current", controller.handleGetCurrentShift.bind(controller));

  fastify.post("/open", controller.handleOpenShift.bind(controller));
  fastify.post("/:id/close", controller.handleCloseShift.bind(controller));
};
