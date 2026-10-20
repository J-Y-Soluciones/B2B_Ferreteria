// src/modules/platform/domain/ports/email-token.repository.port.ts
import { EmailToken } from "../entities/email-token.entity.js";

export interface IEmailTokenRepository {
  save(token: EmailToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<EmailToken | null>;
  update(token: EmailToken): Promise<void>;
  invalidateExistingUserTokens(
    userId: string,
    tokenType: string,
  ): Promise<void>;
}
