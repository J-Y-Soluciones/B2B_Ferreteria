// src/modules/identity/application/reset-password.use-case.ts
import { Kysely, sql } from "kysely";
import crypto from "node:crypto";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { IPasswordHasher } from "../domain/security.interfaces.js";
import { DomainValidationError } from "../../../core/errors/domain.error.js";

export class ResetPasswordUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(token: string, newPasswordPlain: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1. Buscar token válido, no usado y no expirado
    const emailToken = await this.db
      .selectFrom("email_tokens")
      .select(["id", "user_id", "expires_at", "used_at"])
      .where("token_hash", "=", tokenHash)
      .where("token_type", "=", "PASSWORD_RESET")
      .executeTakeFirst();

    if (
      !emailToken ||
      emailToken.used_at !== null ||
      new Date() > emailToken.expires_at
    ) {
      throw new DomainValidationError(
        "El enlace de recuperación es inválido o ha caducado.",
      );
    }

    // 2. Hashear nueva contraseña
    const newPasswordHash = await this.passwordHasher.hash(newPasswordPlain);

    // 3. Transacción: actualizar contraseña, invalidar sesiones (token_version + 1) y quemar token
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("users")
        .set({
          password_hash: newPasswordHash,
          must_change_password: false,
          token_version: sql`token_version + 1`,
        })
        .where("id", "=", emailToken.user_id)
        .execute();

      await trx
        .updateTable("email_tokens")
        .set({ used_at: new Date() })
        .where("id", "=", emailToken.id)
        .execute();
    });
  }
}
