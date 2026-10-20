import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterInventoryMovementUseCase } from "../application/register-inventory-movement.use-case.js";
import {
  registerMovementSchema,
  RegisterMovementInput,
} from "./inventory-movement.schema.js";
import { DomainError } from "../../../core/errors/domain.error.js";
import { z } from "zod";

interface AuthenticatedTenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class InventoryController {
  constructor(
    private readonly registerMovementUseCase: RegisterInventoryMovementUseCase,
  ) {}

  public handleRegisterMovement = async (
    request: FastifyRequest<{ Body: RegisterMovementInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { tenantId, userId } = (
      request as unknown as { tenantContext: AuthenticatedTenantContext }
    ).tenantContext;

    const validation = registerMovementSchema.safeParse(request.body);
    if (!validation.success) {
      reply.status(422).send({
        type: "https://api.jysoluciones.pe/errors/validation-failed",
        title: "Validation Failed",
        status: 422,
        detail: "El cuerpo de la solicitud contiene campos inválidos.",
        instance: request.url,
        invalid_params: validation.error.issues.map((i: z.ZodIssue) => ({
          name: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }

    try {
      const result = await this.registerMovementUseCase.execute({
        tenantId,
        userId,
        warehouseId: validation.data.warehouse_id,
        productId: validation.data.product_id,
        movementType: validation.data.movement_type,
        quantity: validation.data.quantity,
        unitCost: validation.data.unit_cost,
        reason: validation.data.reason,
      });

      reply.status(201).send({
        movement_id: result.movementId,
        warehouse_id: result.warehouseId,
        product_id: result.productId,
        previous_stock: result.previousStock,
        new_stock: result.newStock,
        created_at: result.createdAt,
      });
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
