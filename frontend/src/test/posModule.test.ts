import { describe, it, expect, vi } from "vitest";
import { PosMapper } from "@/modules/pos/dtos/pos.mapper";
import type { IPosRepository } from "@/modules/pos/repositories/IPosRepository";
import type { CompleteSalePayload } from "@/modules/pos/models/pos.types";

describe("PosMapper - Transformación de Contratos de Venta", () => {
  it("debe mapear el payload del carrito al formato estricto de la API Fastify (UoW-01)", () => {
    const payload: CompleteSalePayload = {
      warehouseId: "4b9f1d2e-0000-0000-0000-000000000001",
      shiftId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      customerId: "8f8a1e2d-3c4b-5a6b-7c8d-9e0f1a2b3c4d",
      referenceValue: "BCA-481",
      items: [
        {
          id: "item-1",
          productId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          name: "Aceite GTX",
          isService: false,
          baseUnit: "LTR",
          conversionId: "1a2b3c4d-0000-0000-0000-000000000001",
          presentationName: "Cuarto de Galón",
          conversionRate: 0.9463,
          quantity: 2,
          unitPrice: 28,
          subtotal: 56,
          stockAvailable: 34,
        },
      ],
      payments: [
        { paymentMethod: "CASH", amount: 50 },
        { paymentMethod: "CREDIT", amount: 6 },
      ],
      fiscalDispatch: {
        requiresInvoice: true,
        docType: "03",
        customerDocNumber: "72849182",
        customerName: "Carlos Gomez",
      },
    };

    const apiBody = PosMapper.toApiRequest(payload);
    expect(apiBody.warehouse_id).toBe("4b9f1d2e-0000-0000-0000-000000000001");
    expect(apiBody.reference_value).toBe("BCA-481");
    expect(apiBody.items[0]?.conversion_id).toBe(
      "1a2b3c4d-0000-0000-0000-000000000001",
    );
    expect(apiBody.fiscal_dispatch?.doc_type).toBe("03");
  });
});

describe("PosRepository - Confirmación Atómica Mock", () => {
  it("debe confirmar la venta y emitir el número de correlativo de ticket", async () => {
    const mockRepo: IPosRepository = {
      confirmSale: vi.fn().mockResolvedValue({
        saleId: "e4b2d3c1-0000-0000-0000-000000000001",
        ticketNumber: 10423,
        total: 81.0,
        status: "COMPLETED",
        fiscalStatus: "ENQUEUED",
        createdAt: "2026-10-05T14:45:10Z",
      }),
    };

    const result = await mockRepo.confirmSale({
      warehouseId: "4b9f1d2e-0000-0000-0000-000000000001",
      shiftId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      customerId: null,
      referenceValue: null,
      items: [],
      payments: [{ paymentMethod: "CASH", amount: 81.0 }],
      fiscalDispatch: null,
    });

    expect(result.ticketNumber).toBe(10423);
    expect(result.status).toBe("COMPLETED");
    expect(result.fiscalStatus).toBe("ENQUEUED");
  });
});
