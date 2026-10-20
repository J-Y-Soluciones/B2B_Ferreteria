import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { CatalogController } from "./catalog.controller.js";

export interface CatalogRouteOptions {
  controller: CatalogController;
}

export const catalogRoutes: FastifyPluginAsync<CatalogRouteOptions> = async (
  fastify: FastifyInstance,
  opts: CatalogRouteOptions,
): Promise<void> => {
  const { controller } = opts;

  // Rutas de Lectura
  fastify.get("/products/scan", controller.handleScan.bind(controller));
  fastify.get("/products/search", controller.handleSearch.bind(controller));

  // Rutas de Escritura / Mutación
  fastify.post("/products", controller.handleCreate.bind(controller));
  fastify.patch("/products/:id", controller.handleUpdate.bind(controller));
};
