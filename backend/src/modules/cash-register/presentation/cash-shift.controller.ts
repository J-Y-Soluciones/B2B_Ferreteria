import { FastifyReply, FastifyRequest } from "fastify";
import { OpenCashShiftUseCase } from "../application/open-cash-shift.use-case.js";
import { CloseCashShiftUseCase } from "../application/close-cash-shift.use-case.js";
import {
  openShiftSchema,
  closeShiftSchema,
  OpenShiftBody,
  CloseShiftBody,
} from "./cash-shift.schema.js";
import { DomainError } from "../../../core/errors/domain.error.js";
import { z } from "zod";
import { GetCurrentCashShiftUseCase } from "../application/get-current-cash-shift.use-case.js";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class CashShiftController {
  constructor(
    private readonly openUseCase: OpenCashShiftUseCase,
    private readonly closeUseCase: CloseCashShiftUseCase,
    private readonly getCurrentShiftUseCase: GetCurrentCashShiftUseCase,
  ) {}

  public handleOpenShift = async (
    request: FastifyRequest<{ Body: OpenShiftBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId, userId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;

    const validation = openShiftSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Cuerpo de solicitud inválido para apertura de caja.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const result = await this.openUseCase.execute({
        tenantId,
        userId,
        cashRegisterId: validation.data.cash_register_id,
        initialCash: validation.data.initial_cash,
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

  public handleCloseShift = async (
    request: FastifyRequest<{ Params: { id: string }; Body: CloseShiftBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId, userId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;
    const { id: shiftId } = request.params;

    const validation = closeShiftSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "Cuerpo de solicitud inválido para arqueo de caja.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const result = await this.closeUseCase.execute({
        tenantId,
        shiftId,
        userId,
        declaredCash: validation.data.declared_cash,
        declaredCards: validation.data.declared_cards,
        declaredYapePlin: validation.data.declared_yape_plin,
        notes: validation.data.notes ?? null,
      });

      reply.status(200).send(result);
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
  public handleGetCurrentShift = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId, userId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;

    const currentShift = await this.getCurrentShiftUseCase.execute({
      tenantId,
      userId,
    });

    if (!currentShift) {
      reply.status(200).send(null);
      return;
    }

    // Contrato HTTP snake_case
    reply.status(200).send({
      id: currentShift.id,
      tenant_id: currentShift.tenantId,
      cash_register_id: currentShift.cashRegisterId,
      user_id: currentShift.userId,
      status: currentShift.status,
      initial_cash: currentShift.initialCash,
      opened_at: currentShift.openedAt,
    });
  };
}
