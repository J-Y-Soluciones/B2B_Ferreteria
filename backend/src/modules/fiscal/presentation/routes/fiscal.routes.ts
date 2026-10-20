import { FastifyInstance } from "fastify";
import { FiscalController } from "../controllers/fiscal.controller.js"; // o ./fiscal.controller.js

export function registerFiscalRoutes(
  server: FastifyInstance,
  controller: FiscalController,
  tenantGuard?: any,
) {
  server.register(
    async (fiscalScope) => {
      // Si tenantGuard no vino pre-aplicado por el contexto padre, se añade como fallback
      if (tenantGuard) {
        fiscalScope.addHook("preHandler", tenantGuard);
      }

      fiscalScope.get("/documents", controller.listDocuments);
      fiscalScope.post("/documents/:id/retry", controller.retryDocument);
      fiscalScope.get("/documents/:id/xml", controller.downloadXml);
      fiscalScope.get("/documents/:id/pdf", controller.downloadPdf);
    },
    { prefix: "/fiscal" },
  );
}
