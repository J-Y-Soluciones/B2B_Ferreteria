// src/modules/fiscal/dtos/fiscal.mapper.ts
import type { FiscalDocument, CdrStatus } from "../models/fiscal.types";

export interface ApiFiscalDocDTO {
  id?: string;
  fiscal_id?: string;
  saleId?: string;
  sale_id?: string;
  docType?: "01" | "03";
  doc_type?: "01" | "03";
  series: string;
  number: number | string;
  externalId?: string | null;
  external_id?: string | null;
  cdrStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  cdr_status?: "PENDING" | "ACCEPTED" | "REJECTED";
  hashCpe?: string | null;
  hash_cpe?: string | null;
  pdfUrl?: string | null;
  pdf_url?: string | null;
  xmlUrl?: string | null;
  xml_url?: string | null;
  sunatErrorMessage?: string | null;
  sunat_error_message?: string | null;
  issuedAt?: string;
  issued_at?: string;
}

export class FiscalMapper {
  static toDomain(dto: ApiFiscalDocDTO): FiscalDocument {
    const rawDocType = dto.docType ?? dto.doc_type ?? "03";
    const rawCdr = dto.cdrStatus ?? dto.cdr_status ?? "PENDING";
    const rawNumber = Number(dto.number);

    return {
      id: String(dto.id ?? dto.fiscal_id ?? ""),
      saleId: String(dto.saleId ?? dto.sale_id ?? ""),
      docType: rawDocType === "01" ? "01" : "03",
      series: String(dto.series ?? ""),
      number: Number.isFinite(rawNumber) ? rawNumber : 0,
      externalId: dto.externalId ?? dto.external_id ?? null,
      cdrStatus: (["ACCEPTED", "REJECTED"].includes(rawCdr)
        ? rawCdr
        : "PENDING") as CdrStatus,
      hashCpe: dto.hashCpe ?? dto.hash_cpe ?? null,
      pdfUrl: dto.pdfUrl ?? dto.pdf_url ?? null,
      xmlUrl: dto.xmlUrl ?? dto.xml_url ?? null,
      sunatErrorMessage:
        dto.sunatErrorMessage ?? dto.sunat_error_message ?? null,
      issuedAt: String(
        dto.issuedAt ?? dto.issued_at ?? new Date().toISOString(),
      ),
    };
  }
}
