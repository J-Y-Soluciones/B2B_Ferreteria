import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IEmailTokenRepository } from "../../domain/ports/email-token.repository.port.js";
import { IEmailService } from "../../../../shared/domain/ports/email-service.port.js";
import { EmailToken } from "../../domain/entities/email-token.entity.js";
import { Email } from "../../domain/value-objects/email.vo.js";
import { env } from "../../../../core/config/env.js";

export interface ForgotPasswordCommand {
  email: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly emailTokenRepo: IEmailTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  public async execute(command: ForgotPasswordCommand): Promise<void> {
    const validEmail = Email.create(command.email);

    const user = await this.db
      .selectFrom("users")
      .select(["id", "is_active"])
      .where("email", "=", validEmail.value)
      .executeTakeFirst();

    // OWASP: Anti-Enumeration. Si el usuario no existe o está inactivo, no revelamos el estado.
    if (!user || !user.is_active) {
      return;
    }

    // Invalidar tokens previos de password reset
    await this.emailTokenRepo.invalidateExistingUserTokens(
      user.id,
      "PASSWORD_RESET",
    );

    // Generar token opaco criptográfico de 32 bytes y su hash SHA-256
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const emailToken = EmailToken.create(
      randomUUID(),
      user.id,
      tokenHash,
      "PASSWORD_RESET",
      1, // Expira en 1 hora
    );

    await this.emailTokenRepo.save(emailToken);

    const resetUrl = `${env.FRONTEND_PLATFORM_URL}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordReset(validEmail.value, resetUrl);
  }
}
