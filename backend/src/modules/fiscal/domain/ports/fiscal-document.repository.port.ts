import { FiscalDocument } from "../entities/fiscal-document.entity.js";

export interface FiscalDocumentFilters {
  tenantId: string;
  docType?: "01" | "03" | "ALL";
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFiscalDocuments {
  items: FiscalDocument[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IFiscalDocumentRepository {
  findPaginated(
    filters: FiscalDocumentFilters,
  ): Promise<PaginatedFiscalDocuments>;
  findById(tenantId: string, id: string): Promise<FiscalDocument | null>;
  resetToPending(tenantId: string, documentId: string): Promise<void>;
}
