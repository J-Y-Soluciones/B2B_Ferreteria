import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { CreditController } from "./credit.controller.js";

export interface CreditRouteOptions {
  controller: CreditController;
}

export const creditRoutes: FastifyPluginAsync<CreditRouteOptions> = async (
  fastify: FastifyInstance,
  opts: CreditRouteOptions,
): Promise<void> => {
  const { controller } = opts;

  fastify.post(
    "/customers/:id/debt-payments",
    controller.handleDebtPayment.bind(controller),
  );
};
