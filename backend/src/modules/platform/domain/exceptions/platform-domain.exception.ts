// src/modules/platform/domain/exceptions/platform-domain.exception.ts
import { DomainError } from "../../../../core/errors/domain.error.js";

export class InvalidRucException extends DomainError {
  public readonly statusCode = 422;
  public readonly errorType = "https://api.jysoluciones.pe/errors/invalid-ruc";

  constructor(ruc: string, detail?: string) {
    super(
      `El número de RUC '${ruc}' es inválido.${detail ? ` ${detail}` : ""}`,
      [
        {
          name: "ruc",
          reason: detail ?? "Formato de RUC no cumple con el algoritmo SUNAT.",
        },
      ],
    );
  }
}

export class InvalidEmailException extends DomainError {
  public readonly statusCode = 422;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/invalid-email";

  constructor(email: string) {
    super(
      `La dirección de correo electrónico '${email}' no cumple con el formato estándar RFC 5322.`,
      [
        {
          name: "email",
          reason: "Formato de correo electrónico no válido.",
        },
      ],
    );
  }
}

export class InvalidMoneyAmountException extends DomainError {
  public readonly statusCode = 422;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/invalid-money-amount";

  constructor(amount: number) {
    super(
      `El monto monetario '${amount}' no es válido. Debe ser un número finito no negativo con un máximo de 2 decimales.`,
      [
        {
          name: "amount",
          reason: "Monto inválido o negativo.",
        },
      ],
    );
  }
}

export class TenantSuspendedException extends DomainError {
  public readonly statusCode = 403;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/tenant-suspended";

  constructor(tenantId: string, reason?: string) {
    super(
      `El comercio '${tenantId}' se encuentra suspendido.${reason ? ` Motivo: ${reason}` : ""}`,
      [
        {
          name: "tenant_id",
          reason: reason ?? "Acceso denegado por suspensión de suscripción.",
        },
      ],
    );
  }
}

export class TenantLimitExceededException extends DomainError {
  public readonly statusCode = 409;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/resource-limit-exceeded";

  constructor(resource: string, current: number, max: number) {
    super(
      `Se ha alcanzado el límite permitido de ${resource} (${current}/${max}) según el plan contratado.`,
      [
        {
          name: resource.toLowerCase().replace(/\s+/g, "_"),
          reason: `Límite alcanzado: máximo ${max} permitidos en tu plan.`,
        },
      ],
    );
  }
}

export class EmailTokenExpiredException extends DomainError {
  public readonly statusCode = 400;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/token-expired";

  constructor(tokenType: string) {
    super(`El token de ${tokenType} ha expirado o ya ha sido utilizado.`, [
      {
        name: "token",
        reason: `Token de ${tokenType} inválido o expirado.`,
      },
    ]);
  }
}
