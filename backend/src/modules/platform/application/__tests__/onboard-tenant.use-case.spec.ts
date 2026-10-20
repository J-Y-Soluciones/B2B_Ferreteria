import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardTenantUseCase } from "../use-cases/onboard-tenant.use-case.js";
import { OnboardTenantCommand } from "../dtos/onboard-tenant.dto.js";
import { IPasswordHasher } from "../../../identity/domain/security.interfaces.js";
import { DomainValidationError } from "../../../../core/errors/domain.error.js";
import { InvalidRucException } from "../../domain/exceptions/platform-domain.exception.js";

describe("OnboardTenantUseCase", () => {
  let useCase: OnboardTenantUseCase;
  let mockPasswordHasher: IPasswordHasher;
  let mockDb: any;
  let mockTrx: any;

  // 20608912341 es un RUC con checksum válido según el módulo 11 de SUNAT
  const validRuc = "20100070970";

  const validCommand: OnboardTenantCommand = {
    superadminId: "00000000-0000-4000-8000-000000000001",
    ipAddress: "127.0.0.1",
    userAgent: "Vitest Agent",
    businessName: "Ferretería El Tornillo S.A.C.",
    tradeName: "El Tornillo",
    ruc: validRuc,
    profile: "HARDWARE_STORE",
    planName: "PRO",
    adminFullName: "Juan Pérez",
    adminEmail: "admin@eltornillo.pe",
    adminPasswordPlain: "Tornillo2026!",
    sendInvitationEmail: false,
    warehouseName: "Almacén Central",
    cashRegisterName: "Caja Principal 01",
  };

  beforeEach(() => {
    mockPasswordHasher = {
      hash: vi.fn().mockResolvedValue("hashed_secret_password"),
      verify: vi.fn().mockResolvedValue(true),
    };

    mockTrx = {
      selectFrom: vi.fn(),
      insertInto: vi.fn(),
    };

    mockDb = {
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn(async (callback) => await callback(mockTrx)),
      }),
    };

    useCase = new OnboardTenantUseCase(mockDb, mockPasswordHasher);
  });

  it("debe crear exitosamente un tenant con almacén, caja 01, usuario admin y log de auditoría", async () => {
    const selectQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(undefined),
    };
    mockTrx.selectFrom.mockReturnValue(selectQueryBuilder);

    const insertQueryBuilder = {
      values: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(undefined),
    };
    mockTrx.insertInto.mockReturnValue(insertQueryBuilder);

    const result = await useCase.execute(validCommand);

    expect(result).toBeDefined();
    expect(result.ruc).toBe(validRuc);
    expect(result.businessName).toBe("Ferretería El Tornillo S.A.C.");
    expect(result.adminEmail).toBe("admin@eltornillo.pe");
    expect(result.tenantId).toBeDefined();
    expect(result.defaultWarehouseId).toBeDefined();
    expect(result.defaultCashRegisterId).toBeDefined();

    expect(mockPasswordHasher.hash).toHaveBeenCalledWith("Tornillo2026!");
    expect(mockTrx.insertInto).toHaveBeenCalledTimes(5);
  });

  it("debe fallar antes de iniciar la transacción si el RUC es sintácticamente inválido", async () => {
    const invalidCommand = {
      ...validCommand,
      ruc: "12345",
    };

    await expect(useCase.execute(invalidCommand)).rejects.toThrow(
      InvalidRucException,
    );
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it("debe lanzar DomainValidationError si el RUC ya se encuentra registrado", async () => {
    const selectQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue({ id: "existing-tenant-id" }),
    };
    mockTrx.selectFrom.mockReturnValue(selectQueryBuilder);

    await expect(useCase.execute(validCommand)).rejects.toThrow(
      `Ya existe un comercio registrado con el RUC ${validRuc}.`,
    );
  });

  it("debe lanzar DomainValidationError si el email del administrador ya está en uso", async () => {
    let callCount = 0;
    const selectQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return undefined; // RUC libre
        return { id: "existing-user-id" }; // Email en uso
      }),
    };
    mockTrx.selectFrom.mockReturnValue(selectQueryBuilder);

    await expect(useCase.execute(validCommand)).rejects.toThrow(
      "La dirección de correo admin@eltornillo.pe ya está registrada en la plataforma.",
    );
  });
});
