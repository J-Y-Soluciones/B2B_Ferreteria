import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateSubscriptionStatusUseCase } from "../use-cases/update-subscription-status.use-case.js";
import { IPlatformTenantRepository } from "../../domain/ports/platform-tenant.repository.port.js";
import { Tenant } from "../../domain/entities/tenant.entity.js";
import { Ruc } from "../../domain/value-objects/ruc.vo.js";
import { EntityNotFoundError } from "../../../../core/errors/domain.error.js";

describe("UpdateSubscriptionStatusUseCase", () => {
  let useCase: UpdateSubscriptionStatusUseCase;
  let mockTenantRepo: IPlatformTenantRepository;
  let mockDb: any;
  let mockTrx: any;

  const tenantId = "11111111-1111-4111-8111-111111111111";
  const validRuc = "20100070970";

  beforeEach(() => {
    mockTrx = {
      updateTable: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
      insertInto: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    mockDb = {
      transaction: vi.fn().mockReturnValue({
        execute: vi.fn(async (cb) => await cb(mockTrx)),
      }),
    };

    mockTenantRepo = {
      findById: vi.fn(),
      findByRuc: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    useCase = new UpdateSubscriptionStatusUseCase(mockDb, mockTenantRepo);
  });

  it("debe suspender una suscripción activa y registrar el evento en auditoría", async () => {
    const existingTenant = Tenant.create(
      tenantId,
      "Ferretería El Tornillo",
      "El Tornillo",
      Ruc.create(validRuc),
      "HARDWARE_STORE",
      "PRO",
    );

    vi.mocked(mockTenantRepo.findById).mockResolvedValue(existingTenant);

    await useCase.execute({
      superadminId: "00000000-0000-4000-8000-000000000001",
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
      tenantId,
      status: "SUSPENDED",
      reason: "Falta de pago de cuota mensual",
    });

    expect(existingTenant.subscription.status).toBe("SUSPENDED");
    expect(mockTrx.updateTable).toHaveBeenCalledWith("tenants");
    expect(mockTrx.insertInto).toHaveBeenCalledWith("platform_audit_logs");
  });

  it("debe lanzar EntityNotFoundError si el tenant no existe", async () => {
    vi.mocked(mockTenantRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        superadminId: "00000000-0000-4000-8000-000000000001",
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
        tenantId: "non-existent-id",
        status: "SUSPENDED",
      }),
    ).rejects.toThrow(EntityNotFoundError);
  });
});
