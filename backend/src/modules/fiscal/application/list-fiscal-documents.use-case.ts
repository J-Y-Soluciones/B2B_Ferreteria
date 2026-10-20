//src/modules/fiscal/application/list-fiscal-documents.use-case.ts
import {
  FiscalDocumentFilters,
  IFiscalDocumentRepository,
} from "../domain/ports/fiscal-document.repository.port.js";

export interface ListFiscalDocumentsItemDto {
  id: string;
  saleId: string;
  docType: "01" | "03";
  series: string;
  number: number;
  externalId: string | null;
  cdrStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  hashCpe: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  sunatErrorMessage: string | null;
  issuedAt: string;
}

export interface ListFiscalDocumentsResult {
  items: ListFiscalDocumentsItemDto[];
  total: number;
  page: number;
  totalPages: number;
}

export class ListFiscalDocumentsUseCase {
  constructor(private readonly fiscalRepo: IFiscalDocumentRepository) {}

  public async execute(
    filters: FiscalDocumentFilters,
  ): Promise<ListFiscalDocumentsResult> {
    const result = await this.fiscalRepo.findPaginated(filters);

    return {
      items: result.items.map((doc) => ({
        id: doc.id,
        saleId: doc.saleId,
        docType: doc.docType,
        series: doc.series,
        number: doc.number,
        externalId: doc.externalId,
        cdrStatus: doc.cdrStatus,
        hashCpe: doc.hashCpe,
        pdfUrl: doc.pdfUrl,
        xmlUrl: doc.xmlUrl,
        sunatErrorMessage: doc.sunatErrorMessage,
        issuedAt: doc.issuedAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }
}
