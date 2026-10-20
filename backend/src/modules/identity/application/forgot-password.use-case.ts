//src/modules/identity/application/forgot-password.use-case.ts

import { Kysely } from "kysely";
import crypto from "node:crypto";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { IEmailService } from "../domain/email-service.interface.js";
import { env } from "../../../core/config/env.js";

export class ForgotPasswordUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly emailService: IEmailService,
  ) {}

  public async execute(email: string): Promise<void> {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "email", "full_name", "is_active"])
      .where("email", "=", email.trim().toLowerCase())
      .executeTakeFirst();

    // Si el usuario no existe o está inactivo, salimos silenciosamente (anti-enumeración de usuarios)
    if (!user || !user.is_active) {
      return;
    }

    // 1. Generar token criptográfico aleatorio y su hash SHA-256
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos de vigencia

    // 2. Persistir en email_tokens
    await this.db
      .insertInto("email_tokens")
      .values({
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: tokenHash,
        token_type: "PASSWORD_RESET",
        expires_at: expiresAt,
        used_at: null,
      })
      .execute();

    // 3. Despachar correo
    const resetLink = `${env.FRONTEND_PLATFORM_URL}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.full_name,
      resetLink,
    });
  }
}
