import { FastifyReply, FastifyRequest } from "fastify";
import { ProcessSaleUseCase } from "../application/process-sale.use-case.js";
import { processSaleSchema, ProcessSaleBody } from "./pos.schema.js";
import { DomainError } from "../../../core/errors/domain.error.js";
import { z } from "zod";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class PosController {
  constructor(private readonly processSaleUseCase: ProcessSaleUseCase) {}

  public handleProcessSale = async (
    request: FastifyRequest<{ Body: ProcessSaleBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const context = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { tenantId, userId } = context;

    const validationResult = processSaleSchema.safeParse(request.body);
    if (!validationResult.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "El cuerpo de la solicitud no cumple con el esquema requerido.",
        instance: request.url,
        invalid_params: validationResult.error.issues.map(
          (issue: z.ZodIssue) => ({
            name: issue.path.join("."),
            reason: issue.message,
          }),
        ),
      });
      return;
    }

    const body = validationResult.data;

    try {
      const result = await this.processSaleUseCase.execute({
        tenantId,
        userId,
        warehouseId: body.warehouse_id,
        shiftId: body.shift_id,
        customerId: body.customer_id ?? null,
        referenceValue: body.reference_value ?? null,
        items: body.items.map((i: ProcessSaleBody["items"][number]) => ({
          productId: i.product_id,
          conversionId: i.conversion_id ?? null,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
        payments: body.payments.map(
          (p: ProcessSaleBody["payments"][number]) => ({
            paymentMethod: p.payment_method,
            amount: p.amount,
            referenceCode: p.reference_code ?? null,
          }),
        ),
        fiscalDispatch: body.fiscal_dispatch
          ? {
              requiresInvoice: body.fiscal_dispatch.requires_invoice,
              docType: body.fiscal_dispatch.doc_type,
              customerDocNumber: body.fiscal_dispatch.customer_doc_number,
              customerName: body.fiscal_dispatch.customer_name,
            }
          : undefined,
      });

      reply.status(201).send(result);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.status(err.statusCode).send({
          type: err.errorType,
          title: err.name,
          status: err.statusCode,
          detail: err.message,
          instance: request.url,
          invalid_params: err.invalidParams,
        });
        return;
      }
      throw err;
    }
  };
}
