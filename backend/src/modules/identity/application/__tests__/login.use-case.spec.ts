import { describe, it, expect, beforeEach } from "vitest";
import { LoginUseCase } from "../login.use-case.js";
import { IUserRepository } from "../../domain/identity.repository.interface.js";
import {
  IPasswordHasher,
  ITokenService,
} from "../../domain/security.interfaces.js";
import { User } from "../../domain/user.aggregate.js";
import {
  InvalidCredentialsError,
  UserInactiveError,
} from "../../domain/identity.errors.js";

describe("LoginUseCase", () => {
  let mockUserRepo: IUserRepository;
  let mockHasher: IPasswordHasher;
  let mockTokenService: ITokenService;
  let useCase: LoginUseCase;

  const tenantId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    const activeUser = User.rehydrate({
      id: "user-01",
      tenantId,
      email: "cajero@tienda.pe",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$hash",
      fullName: "Carlos Mostrador",
      role: "CASHIER",
      tokenVersion: 1,
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
    });

    mockUserRepo = {
      findByEmail: async (_t, email) =>
        email === "cajero@tienda.pe" ? activeUser : null,
      findById: async () => null,
      incrementTokenVersion: async () => {},
      findPrimaryAdminByTenantId: () => Promise.resolve(null),
    };

    mockHasher = {
      hash: async () => "mock-hash",
      verify: async (_hash, plain) => plain === "Password123!",
    };

    mockTokenService = {
      signAccessToken: async () => "signed.jwt.token",
      verifyAccessToken: async () => ({
        sub: "user-01",
        tenant_id: tenantId,
        role: "CASHIER",
        token_version: 1,
      }),
      generateRefreshToken: () => "secure-random-refresh-token",
      hashRefreshToken: () => "hash-refresh",
    };

    useCase = new LoginUseCase(mockUserRepo, mockHasher, mockTokenService);
  });

  it("debe autenticar al usuario y emitir access y refresh tokens", async () => {
    const result = await useCase.execute({
      tenantId,
      email: "cajero@tienda.pe",
      passwordPlain: "Password123!",
    });

    expect(result.accessToken).toBe("signed.jwt.token");
    expect(result.refreshToken).toBe("secure-random-refresh-token");
    expect(result.user.role).toBe("CASHIER");
  });
  

  it("debe arrojar InvalidCredentialsError si la contraseña no coincide", async () => {
    await expect(
      useCase.execute({
        tenantId,
        email: "cajero@tienda.pe",
        passwordPlain: "WrongPassword",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("debe arrojar UserInactiveError si la cuenta está desactivada", async () => {
    const inactiveUser = User.rehydrate({
      id: "user-02",
      tenantId,
      email: "inactivo@tienda.pe",
      passwordHash: "hash",
      fullName: "Usuario Bloqueado",
      role: "CASHIER",
      tokenVersion: 1,
      isActive: false,
      mustChangePassword: false,
      createdAt: new Date(),
    });

    mockUserRepo.findByEmail = async () => inactiveUser;

    await expect(
      useCase.execute({
        tenantId,
        email: "inactivo@tienda.pe",
        passwordPlain: "Password123!",
      }),
    ).rejects.toThrow(UserInactiveError);
  });
});
