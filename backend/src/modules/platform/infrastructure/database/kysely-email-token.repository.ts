import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../../shared/infrastructure/database/database.types.js";
import { IEmailTokenRepository } from "../../domain/ports/email-token.repository.port.js";
import {
  EmailToken,
  TokenType,
} from "../../domain/entities/email-token.entity.js";

export class KyselyEmailTokenRepository implements IEmailTokenRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async save(token: EmailToken): Promise<void> {
    await this.db
      .insertInto("email_tokens")
      .values({
        id: token.id,
        user_id: token.userId,
        token_hash: token.tokenHash,
        token_type: token.tokenType,
        expires_at: token.expiresAt,
        used_at: token.usedAt,
      })
      .execute();
  }

  public async findByTokenHash(tokenHash: string): Promise<EmailToken | null> {
    const row = await this.db
      .selectFrom("email_tokens")
      .selectAll()
      .where("token_hash", "=", tokenHash)
      .executeTakeFirst();

    if (!row) return null;

    return EmailToken.reconstitute({
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      tokenType: row.token_type as TokenType,
      expiresAt: new Date(row.expires_at),
      usedAt: row.used_at ? new Date(row.used_at) : null,
      createdAt: new Date(row.created_at),
    });
  }

  public async update(token: EmailToken): Promise<void> {
    await this.db
      .updateTable("email_tokens")
      .set({
        used_at: token.usedAt,
      })
      .where("id", "=", token.id)
      .execute();
  }

  public async invalidateExistingUserTokens(
    userId: string,
    tokenType: string,
  ): Promise<void> {
    await this.db
      .updateTable("email_tokens")
      .set({ used_at: new Date() })
      .where("user_id", "=", userId)
      .where("token_type", "=", tokenType as any)
      .where("used_at", "is", null)
      .execute();
  }
}
