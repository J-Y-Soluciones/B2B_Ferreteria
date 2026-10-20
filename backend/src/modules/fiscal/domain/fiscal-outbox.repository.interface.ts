import {
  FiscalDocumentPayload,
  FiscalDispatchSuccessResponse,
} from "./fiscal.types.js";

export type FiscalOutboxPayload = FiscalDocumentPayload;

export interface OutboxRecord {
  id: string;
  tenantId: string;
  saleId: string;
  payload: FiscalDocumentPayload;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  retryCount: number;
  lastError: string | null;
}

export interface IFiscalOutboxQueue {
  enqueue(tenantId: string, payload: FiscalDocumentPayload): Promise<void>;
}

export interface IFiscalOutboxRepository extends IFiscalOutboxQueue {
  fetchPendingBatch(limit: number): Promise<OutboxRecord[]>;
  markProcessing(id: string): Promise<void>;
  markSent(id: string, result: FiscalDispatchSuccessResponse): Promise<void>;
  markRetry(id: string, retryCount: number, error: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}
