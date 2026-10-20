import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { CustomerController } from "./customer.controller.js";
import type { CreditController } from "../../credit/presentation/credit.controller.js";

export interface CustomerRouteOptions {
  customerController: CustomerController;
  creditController: CreditController;
}

export const customerRoutes: FastifyPluginAsync<CustomerRouteOptions> = async (
  fastify: FastifyInstance,
  opts: CustomerRouteOptions,
): Promise<void> => {
  const { customerController, creditController } = opts;

  // 1. Abono de Deuda: POST /api/v1/customers/:id/debt-payments
  fastify.post("/:id/debt-payments", async (req, reply) => {
    return creditController.handleDebtPayment(req as any, reply);
  });

  // 2. Detalle de Cliente: GET /api/v1/customers/:id
  fastify.get("/:id", async (req, reply) => {
    return customerController.handleGetById(req as any, reply);
  });

  // 3. Colección: GET y POST /api/v1/customers
  fastify.get("/", async (req, reply) => {
    return customerController.handleList(req as any, reply);
  });

  fastify.post("/", async (req, reply) => {
    return customerController.handleCreate(req as any, reply);
  });
};
