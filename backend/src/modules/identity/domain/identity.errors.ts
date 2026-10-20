import { DomainError } from "../../../core/errors/domain.error.js";

export class InvalidCredentialsError extends DomainError {
  public readonly code = "INVALID_CREDENTIALS";
  public readonly statusCode = 401;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/invalid-credentials";

  constructor() {
    super("Credenciales de acceso inválidas.");
  }
}

export class TenantMismatchError extends DomainError {
  public readonly code = "TENANT_MISMATCH";
  public readonly statusCode = 403;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/tenant-mismatch";

  constructor() {
    super(
      "Violación de aislamiento: el header X-Tenant-Id no coincide con la identidad autenticada.",
    );
  }
}

export class UserInactiveError extends DomainError {
  public readonly code = "USER_INACTIVE";
  public readonly statusCode = 403;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/user-inactive";

  constructor() {
    super("La cuenta de usuario se encuentra inactiva o bloqueada.");
  }
}
export class TenantRequiredError extends DomainError {
  public readonly code = "TENANT_REQUIRED";
  public readonly statusCode = 400;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/tenant-required";

  constructor() {
    super(
      "Para cuentas de comercio se requiere especificar la cabecera 'X-Tenant-Id'.",
    );
  }
}
