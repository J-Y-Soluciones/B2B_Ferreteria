import { createHash } from "node:crypto";
import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IEmailTokenRepository } from "../../domain/ports/email-token.repository.port.js";
import { IPasswordHasher } from "../../../identity/domain/security.interfaces.js";
import { EmailTokenExpiredException } from "../../domain/exceptions/platform-domain.exception.js";

export interface ResetPasswordCommand {
  rawToken: string;
  newPasswordPlain: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly emailTokenRepo: IEmailTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(command: ResetPasswordCommand): Promise<void> {
    const tokenHash = createHash("sha256")
      .update(command.rawToken)
      .digest("hex");
    const emailToken = await this.emailTokenRepo.findByTokenHash(tokenHash);

    if (!emailToken || emailToken.tokenType !== "PASSWORD_RESET") {
      throw new EmailTokenExpiredException("recuperación de contraseña");
    }

    // Valida y marca como consumido
    emailToken.validateAndConsume();

    const newPasswordHash = await this.passwordHasher.hash(
      command.newPasswordPlain,
    );

    await this.db.transaction().execute(async (trx) => {
      // 1. Guardar token como usado
      await trx
        .updateTable("email_tokens")
        .set({ used_at: emailToken.usedAt })
        .where("id", "=", emailToken.id)
        .execute();

      // 2. Actualizar contraseña e invalidar tokens JWT previos (incrementar token_version)
      await trx
        .updateTable("users")
        .set({
          password_hash: newPasswordHash,
          token_version: sql`token_version + 1`,
        })
        .where("id", "=", emailToken.userId)
        .execute();
    });
  }
}
