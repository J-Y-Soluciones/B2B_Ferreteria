import type { FiscalDocType, CdrStatus } from "@/shared/api/domainTypes";
import type {
  FiscalDocumentSummary,
  OutboxStatus,
} from "../models/fiscal.types";

export interface FiscalDocumentDTO {
  id: string;
  sale_id: string;
  ticket_number: number;
  doc_type: FiscalDocType;
  series: string;
  number: number;
  total: number;
  outbox_status: OutboxStatus;
  cdr_status: CdrStatus;
  retry_count: number;
  last_error: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  issued_at: string;
}

export class FiscalMapper {
  static toDomain(dto: FiscalDocumentDTO): FiscalDocumentSummary {
    return {
      id: dto.id,
      saleId: dto.sale_id,
      ticketNumber: dto.ticket_number,
      docType: dto.doc_type,
      series: dto.series,
      number: dto.number,
      total: Number(dto.total) || 0,
      outboxStatus: dto.outbox_status,
      cdrStatus: dto.cdr_status,
      retryCount: dto.retry_count,
      lastError: dto.last_error,
      pdfUrl: dto.pdf_url,
      xmlUrl: dto.xml_url,
      issuedAt: dto.issued_at,
    };
  }
}
