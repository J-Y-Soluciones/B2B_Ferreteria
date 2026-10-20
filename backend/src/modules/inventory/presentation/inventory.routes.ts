import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { InventoryController } from "./inventory.controller.js";

export interface InventoryRouteOptions {
  controller: InventoryController;
}

export const inventoryRoutes: FastifyPluginAsync<
  InventoryRouteOptions
> = async (
  fastify: FastifyInstance,
  opts: InventoryRouteOptions,
): Promise<void> => {
  const { controller } = opts;

  fastify.post(
    "/movements",
    controller.handleRegisterMovement.bind(controller),
  );
};
