// src/modules/fiscal/models/fiscal.types.ts

export type FiscalDocType = "01" | "03"; // 01: Factura, 03: Boleta
export type CdrStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type OutboxStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

export interface FiscalDocument {
  readonly id: string;
  readonly saleId: string;
  readonly docType: FiscalDocType;
  readonly series: string;
  readonly number: number;
  readonly externalId: string | null;
  readonly cdrStatus: CdrStatus;
  readonly hashCpe: string | null;
  readonly pdfUrl: string | null;
  readonly xmlUrl: string | null;
  readonly sunatErrorMessage: string | null;
  readonly issuedAt: string;
}

export interface FiscalFilterParams {
  readonly docType?: FiscalDocType | "ALL";
  readonly cdrStatus?: CdrStatus | "ALL";
  readonly searchTerm?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface FiscalPaginatedResult {
  readonly items: readonly FiscalDocument[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
}
