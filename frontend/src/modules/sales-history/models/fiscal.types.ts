import type { FiscalDocType, CdrStatus } from "@/shared/api/domainTypes";

export type OutboxStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

export interface FiscalDocumentSummary {
  id: string;
  saleId: string;
  ticketNumber: number;
  docType: FiscalDocType;
  series: string;
  number: number;
  total: number;
  outboxStatus: OutboxStatus;
  cdrStatus: CdrStatus;
  retryCount: number;
  lastError: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  issuedAt: string;
}

export interface FiscalFilterParams {
  docType?: FiscalDocType;
  onlyFailed?: boolean;
  query?: string;
}
