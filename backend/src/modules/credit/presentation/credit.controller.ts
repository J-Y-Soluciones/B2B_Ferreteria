import type { FastifyReply, FastifyRequest } from "fastify";
import { ProcessDebtPaymentUseCase } from "../application/process-debt-payment.use-case.js";
import { debtPaymentSchema, type DebtPaymentBody } from "./credit.schema.js";
import { DomainError } from "../../../core/errors/domain.error.js";
import type { z } from "zod";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class CreditController {
  constructor(private readonly debtPaymentUseCase: ProcessDebtPaymentUseCase) {}

  public handleDebtPayment = async (
    request: FastifyRequest<{ Params: { id: string }; Body: DebtPaymentBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    console.log("🔥 [HIT] handleDebtPayment ejecutado con Body:", request.body);

    const { tenantId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id: customerId } = request.params;

    const validation = debtPaymentSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Cuerpo de solicitud inválido para abono de deuda.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
    }

    try {
      const result = await this.debtPaymentUseCase.execute({
        tenantId,
        customerId,
        shiftId: validation.data.shift_id,
        amount: validation.data.amount,
        paymentMethod: validation.data.payment_method,
        referenceCode: validation.data.reference_code ?? null,
      });

      // Mapeo canónico a snake_case para cumplir el contrato REST del Frontend
      return reply.status(200).send({
        payment_id: result.paymentId,
        customer_id: result.customerId,
        amortized_amount: result.amortizedAmount,
        remaining_debt: result.remainingDebt,
        registered_in_shift: result.registeredInShift,
        created_at: result.createdAt,
      });
    } catch (err: unknown) {
      console.error("💥 [ERROR EN CASO DE USO DEUDA]:", err); // <-- Agrega este log
      if (err instanceof DomainError) {
        const statusCode =
          (err as unknown as { statusCode?: number; httpCode?: number })
            .statusCode ??
          (err as unknown as { httpCode?: number }).httpCode ??
          400;

        const errorType =
          (err as unknown as { errorType?: string }).errorType ??
          "https://api.jysoluciones.pe/errors/domain-error";

        const invalidParams = (
          err as unknown as {
            invalidParams?: Array<{ name: string; reason: string }>;
          }
        ).invalidParams;

        return reply.status(statusCode).send({
          type: errorType,
          title: err.name,
          status: statusCode,
          detail: err.message,
          instance: request.url,
          ...(invalidParams ? { invalid_params: invalidParams } : {}),
        });
      }

      throw err;
    }
  };
}
