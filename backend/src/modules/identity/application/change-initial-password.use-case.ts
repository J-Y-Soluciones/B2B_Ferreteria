// src/modules/identity/application/change-initial-password.use-case.ts
import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { IPasswordHasher } from "../domain/security.interfaces.js";
import { EntityNotFoundError } from "../../../core/errors/domain.error.js";

export class ChangeInitialPasswordUseCase {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(
    userId: string,
    newPasswordPlain: string,
  ): Promise<void> {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "is_active"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!user || !user.is_active) {
      throw new EntityNotFoundError("User", userId);
    }

    const passwordHash = await this.passwordHasher.hash(newPasswordPlain);

    await this.db
      .updateTable("users")
      .set({
        password_hash: passwordHash,
        must_change_password: false,
      })
      .where("id", "=", userId)
      .execute();
  }
}
