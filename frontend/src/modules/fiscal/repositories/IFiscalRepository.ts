// src/modules/fiscal/repositories/IFiscalRepository.ts
import type {
  FiscalFilterParams,
  FiscalPaginatedResult,
} from "../models/fiscal.types";

export interface IFiscalRepository {
  getDocuments(params: FiscalFilterParams): Promise<FiscalPaginatedResult>;
  retryDocument(documentId: string): Promise<void>;
  getFileDownloadUrl(documentId: string, format: "xml" | "pdf"): string;
}
