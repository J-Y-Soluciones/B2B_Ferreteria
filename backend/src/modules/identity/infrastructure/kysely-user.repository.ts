import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { IUserRepository } from "../domain/identity.repository.interface.js";
import { User, UserRole } from "../domain/user.aggregate.js";

export class KyselyUserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findByEmail(
    tenantId: string | null,
    email: string,
  ): Promise<User | null> {
    let query = this.db
      .selectFrom("users")
      .select([
        "id",
        "tenant_id",
        "email",
        "password_hash",
        "full_name",
        "role",
        "token_version",
        "is_active",
        "must_change_password",
        "created_at",
      ])
      .where("email", "=", email.trim().toLowerCase())
      .where("is_active", "=", true);

    // Solo se filtra por tenant si fue enviado explícitamente en el header
    if (tenantId) {
      query = query.where("tenant_id", "=", tenantId);
    }

    const row = await query.executeTakeFirst();
    if (!row) {
      return null;
    }

    return User.rehydrate({
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role as UserRole,
      tokenVersion: row.token_version,
      isActive: row.is_active,
      mustChangePassword: row.must_change_password ?? false,
      createdAt: new Date(row.created_at),
    });
  }

  public async findById(tenantId: string, id: string): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .executeTakeFirst();

    if (!row) return null;

    return User.rehydrate({
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role as UserRole,
      tokenVersion: row.token_version,
      isActive: row.is_active,
      mustChangePassword: row.must_change_password ?? false, // 👈 Agregado aquí
      createdAt: new Date(row.created_at),
    });
  }

  public async incrementTokenVersion(
    tenantId: string,
    id: string,
  ): Promise<void> {
    await this.db
      .updateTable("users")
      .set({
        token_version: sql`token_version + 1`,
      })
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .execute();
  }

  public async findPrimaryAdminByTenantId(
    tenantId: string,
  ): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("role", "=", "TENANT_ADMIN")
      .where("is_active", "=", true)
      .orderBy("created_at", "asc")
      .executeTakeFirst();

    if (!row) return null;

    return User.rehydrate({
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role as UserRole,
      tokenVersion: row.token_version,
      isActive: row.is_active,
      mustChangePassword: row.must_change_password ?? false, // 👈 Agregado aquí
      createdAt: new Date(row.created_at),
    });
  }
}
