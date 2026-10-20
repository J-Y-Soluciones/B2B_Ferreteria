import type {
  FiscalDocumentSummary,
  FiscalFilterParams,
} from "../models/fiscal.types";

export interface IFiscalRepository {
  getFiscalDocuments(
    filters?: FiscalFilterParams,
  ): Promise<FiscalDocumentSummary[]>;
  retryFailedDispatch(documentId: string): Promise<void>;
  retryAllFailed(): Promise<number>;
}
