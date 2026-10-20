export interface ProblemDetailsInvalidParam {
  name: string;
  reason: string;
}

export abstract class DomainError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly errorType: string;
  public readonly invalidParams: ProblemDetailsInvalidParam[];

  constructor(
    message: string,
    invalidParams: ProblemDetailsInvalidParam[] = [],
  ) {
    super(message);
    this.name = this.constructor.name;
    this.invalidParams = invalidParams;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DomainValidationError extends DomainError {
  public readonly statusCode = 422;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/domain-validation-failed";
}

export class InsufficientStockError extends DomainError {
  public readonly statusCode = 409;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/insufficient-stock";

  constructor(productId: string, required: number, available: number) {
    super(
      `Stock insuficiente: Requerido ${required.toFixed(4)}, Disponible ${available.toFixed(4)}`,
      [
        {
          name: `product_id:${productId}`,
          reason: `Stock insuficiente en almacén (disponible: ${available.toFixed(4)})`,
        },
      ],
    );
  }
}

export class CreditLimitExceededError extends DomainError {
  public readonly statusCode = 409;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/credit-limit-exceeded";

  constructor(customerId: string, available: number, requested: number) {
    super(
      `Límite de crédito excedido. Disponible: S/ ${available.toFixed(2)}, Solicitado: S/ ${requested.toFixed(2)}`,
      [
        {
          name: `customer_id:${customerId}`,
          reason: `Línea de crédito insuficiente (disponible: S/ ${available.toFixed(2)})`,
        },
      ],
    );
  }
}

export class ShiftClosedError extends DomainError {
  public readonly statusCode = 412;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/cash-shift-closed";

  constructor(shiftId: string) {
    super(
      `El turno de caja ${shiftId} no se encuentra abierto para transacciones.`,
    );
  }
}

export class EntityNotFoundError extends DomainError {
  public readonly statusCode = 404;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/entity-not-found";

  constructor(entityName: string, id: string) {
    super(
      `El recurso ${entityName} con identificador ${id} no fue encontrado.`,
    );
  }
}
