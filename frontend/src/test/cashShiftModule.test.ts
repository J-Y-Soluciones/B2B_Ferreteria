import { describe, it, expect, vi } from "vitest";
import { CashShiftMapper } from "@/modules/cash-shifts/dtos/cashShift.mapper";
import type { ICashShiftRepository } from "@/modules/cash-shifts/repositories/ICashShiftRepository";
import type { CashShift } from "@/modules/cash-shifts/models/cashShift.types";

describe("CashShiftMapper - Arqueo Ciego", () => {
  it("debe transformar los valores de entrada al DTO de cierre con formato decimal seguro", () => {
    const dto = CashShiftMapper.toClosePayload({
      shiftId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      declaredCash: 1250.5,
      declaredCards: 480,
      declaredYapePlin: 310,
      notes: "Cierre de turno tarde",
    });

    expect(dto.declared_cash).toBe(1250.5);
    expect(dto.declared_cards).toBe(480.0);
    expect(dto.declared_yape_plin).toBe(310.0);
    expect(dto.notes).toBe("Cierre de turno tarde");
  });

  it("debe mapear la auditoría calculando las diferencias reales devueltas por el backend", () => {
    const mockAuditResponse = {
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      tenant_id: "tenant-uuid-1234",
      cash_register_id: "cash-reg-1",
      user_id: "user-admin-1",
      status: "CLOSED" as const,
      initial_cash: 500,
      opened_at: "2026-10-05T08:00:00Z",
      closed_at: "2026-10-05T20:30:00Z",
      audit: {
        expected_cash: 1252.5,
        declared_cash: 1250.5,
        cash_difference: -2.0,
        expected_cards: 480.0,
        declared_cards: 480.0,
        expected_yape_plin: 310.0,
        declared_yape_plin: 310.0,
      },
    };

    const domain = CashShiftMapper.toDomain(mockAuditResponse);
    expect(domain.audit?.cashDifference).toBe(-2.0);
    expect(domain.status).toBe("CLOSED");
  });
});

describe("CashShiftRepository - Inyección Mock", () => {
  it("debe ejecutar el cierre de turno y retornar la auditoría", async () => {
    const mockResult: CashShift = {
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      tenantId: "tenant-uuid-1234",
      cashRegisterId: "cash-reg-1",
      userId: "user-admin-1",
      status: "CLOSED",
      initialCash: 500,
      openedAt: "2026-10-05T08:00:00Z",
      closedAt: "2026-10-05T20:30:00Z",
      audit: {
        expectedCash: 1000,
        declaredCash: 1000,
        cashDifference: 0,
        expectedCards: 200,
        declaredCards: 200,
        expectedYapePlin: 150,
        declaredYapePlin: 150,
      },
    };

    const mockRepo: ICashShiftRepository = {
      getCurrentShift: vi.fn().mockResolvedValue(null),
      openShift: vi.fn(),
      closeShift: vi.fn().mockResolvedValue(mockResult),
    };

    const result = await mockRepo.closeShift({
      shiftId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      declaredCash: 1000,
      declaredCards: 200,
      declaredYapePlin: 150,
      notes: "Cierre conforme",
    });

    expect(result.status).toBe("CLOSED");
    expect(result.audit?.cashDifference).toBe(0);
  });
});
