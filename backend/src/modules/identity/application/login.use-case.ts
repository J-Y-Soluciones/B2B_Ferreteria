// src/modules/identity/application/login.use-case.ts
import { Kysely } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import { LoginCommand, LoginResult, TenantSessionDto } from "./login.dto.js";
import { IUserRepository } from "../domain/identity.repository.interface.js";
import {
  IPasswordHasher,
  ITokenService,
} from "../domain/security.interfaces.js";
import {
  InvalidCredentialsError,
  UserInactiveError,
} from "../domain/identity.errors.js";

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly db?: Kysely<DatabaseSchema>, // 👈 Inyectado para consultar el tenant
  ) {}

  public async execute(command: LoginCommand): Promise<LoginResult> {
    const tenantId = command.tenantId ?? null;

    const user = await this.userRepo.findByEmail(tenantId, command.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new UserInactiveError();
    }

    const isValidPassword = await this.passwordHasher.verify(
      user.passwordHash,
      command.passwordPlain,
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    // Firmar token JWT con claims
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      token_version: user.tokenVersion,
    });

    const refreshToken = this.tokenService.generateRefreshToken();

    // Consultar datos del comercio si el usuario pertenece a un tenant
    let tenantInfo: TenantSessionDto | null = null;
    if (user.tenantId && this.db) {
      const row = await this.db
        .selectFrom("tenants")
        .select([
          "id",
          "trade_name",
          "business_name",
          "ruc",
          "profile",
          "module_sunat",
          "module_credits",
          "module_multiwarehouse",
          "allow_negative_stock",
        ])
        .where("id", "=", user.tenantId)
        .executeTakeFirst();

      if (row) {
        tenantInfo = {
          id: row.id,
          tradeName: row.trade_name ?? row.business_name,
          businessName: row.business_name,
          ruc: row.ruc,
          profile: row.profile,
          moduleSunat: Boolean(row.module_sunat),
          moduleCredits: Boolean(row.module_credits),
          moduleMultiwarehouse: Boolean(row.module_multiwarehouse),
          allowNegativeStock: Boolean(row.allow_negative_stock),
        };
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
      },
      tenant: tenantInfo,
    };
  }
}
