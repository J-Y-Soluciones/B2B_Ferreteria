import { describe, it, expect, beforeEach } from "vitest";
import { ProcessFiscalOutboxUseCase } from "../process-fiscal-outbox.use-case.js";
import {
  IFiscalOutboxRepository,
  OutboxRecord,
} from "../../domain/fiscal-outbox.repository.interface.js";
import { IFiscalPseClient } from "../../domain/fiscal-pse-client.interface.js";
import { FiscalNonRetryableError } from "../../domain/fiscal.types.js";

describe("ProcessFiscalOutboxUseCase", () => {
  let mockOutboxRepo: IFiscalOutboxRepository;
  let mockPseClient: IFiscalPseClient;
  let useCase: ProcessFiscalOutboxUseCase;

  const mockRecord: OutboxRecord = {
    id: "outbox-01",
    tenantId: "tenant-01",
    saleId: "sale-01",
    payload: {
      saleId: "sale-01",
      docType: "03",
      customerDocNumber: "72849182",
      customerName: "Carlos Gomez",
      total: 81.0,
      items: [
        { productId: "p1", quantity: 1, unitPrice: 81.0, subtotal: 81.0 },
      ],
    },
    status: "PENDING",
    retryCount: 0,
    lastError: null,
  };

  beforeEach(() => {
    mockOutboxRepo = {
      enqueue: async () => {},
      fetchPendingBatch: async () => [mockRecord],
      markProcessing: async () => {},
      markSent: async () => {},
      markRetry: async () => {},
      markFailed: async () => {},
    };

    mockPseClient = {
      dispatchToPse: async () => ({
        externalId: "pse-123",
        series: "B001",
        number: 104,
        cdrStatus: "ACCEPTED",
        hashCpe: "hash-abc",
        pdfUrl: "https://cdn.pse.pe/b001-104.pdf",
        xmlUrl: "https://cdn.pse.pe/b001-104.xml",
        sunatErrorMessage: null,
      }),
    };

    useCase = new ProcessFiscalOutboxUseCase(mockOutboxRepo, mockPseClient, {
      batchSize: 10,
      maxRetries: 3,
    });
  });

  it("debe timbrar exitosamente y marcar el outbox como SENT", async () => {
    let sentMarked = false;
    mockOutboxRepo.markSent = async (id) => {
      if (id === "outbox-01") sentMarked = true;
    };

    const count = await useCase.execute();

    expect(count).toBe(1);
    expect(sentMarked).toBe(true);
  });

  it("debe registrar un reintento si ocurre una falla de red recuperable", async () => {
    mockPseClient.dispatchToPse = async () => {
      throw new Error("PSE Gateway Timeout 504");
    };

    let retryCountRecorded = 0;
    mockOutboxRepo.markRetry = async (_id, count) => {
      retryCountRecorded = count;
    };

    await useCase.execute();

    expect(retryCountRecorded).toBe(1);
  });

  it("debe marcar FAILED inmediatamente sin reintentos ante un error tributario no recuperable", async () => {
    mockPseClient.dispatchToPse = async () => {
      throw new FiscalNonRetryableError(
        "RUC receptor no existe en padrón SUNAT",
      );
    };

    let failedMarked = false;
    mockOutboxRepo.markFailed = async (id) => {
      if (id === "outbox-01") failedMarked = true;
    };

    await useCase.execute();

    expect(failedMarked).toBe(true);
  });
});
