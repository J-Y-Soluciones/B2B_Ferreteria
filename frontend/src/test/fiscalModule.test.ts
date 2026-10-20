import { describe, it, expect, vi } from "vitest";
import {
  FiscalMapper,
  type FiscalDocumentDTO,
} from "@/modules/sales-history/dtos/fiscal.mapper";
import type { IFiscalRepository } from "@/modules/sales-history/repositories/IFiscalRepository";

describe("FiscalMapper - Outbox y Resiliencia SUNAT", () => {
  it("debe transformar el comprobante tributario con estado FAILED y error de red", () => {
    const mockDTO: FiscalDocumentDTO = {
      id: "fisc-1",
      sale_id: "sale-100",
      ticket_number: 10423,
      doc_type: "03",
      series: "B001",
      number: 842,
      total: 81.0,
      outbox_status: "FAILED",
      cdr_status: "PENDING",
      retry_count: 3,
      last_error: "Timeout comunicando con servidor del PSE",
      pdf_url: null,
      xml_url: null,
      issued_at: "2026-10-05T14:45:10Z",
    };

    const domain = FiscalMapper.toDomain(mockDTO);
    expect(domain.series).toBe("B001");
    expect(domain.outboxStatus).toBe("FAILED");
    expect(domain.retryCount).toBe(3);
    expect(domain.lastError).toContain("Timeout");
  });
});

describe("FiscalRepository - Mock Reintento", () => {
  it("debe disparar la orden de reintento de despacho fiscal manual", async () => {
    const mockRepo: IFiscalRepository = {
      getFiscalDocuments: vi.fn(),
      retryFailedDispatch: vi.fn().mockResolvedValue(undefined),
      retryAllFailed: vi.fn().mockResolvedValue(4),
    };

    await mockRepo.retryFailedDispatch("fisc-1");
    expect(mockRepo.retryFailedDispatch).toHaveBeenCalledWith("fisc-1");

    const retriedCount = await mockRepo.retryAllFailed();
    expect(retriedCount).toBe(4);
  });
});
