import { IFiscalDocumentRepository } from "../domain/ports/fiscal-document.repository.port.js";
import { FiscalDocumentNotFoundError } from "../domain/errors/fiscal.errors.js";
import { DomainValidationError } from "../../../core/errors/domain.error.js";

export interface GetFiscalDocumentFilesQuery {
  tenantId: string;
  documentId: string;
  fileType: "pdf" | "xml";
}

export class GetFiscalDocumentFilesUseCase {
  constructor(private readonly fiscalRepo: IFiscalDocumentRepository) {}

  public async execute(query: GetFiscalDocumentFilesQuery): Promise<string> {
    const doc = await this.fiscalRepo.findById(
      query.tenantId,
      query.documentId,
    );
    if (!doc) {
      throw new FiscalDocumentNotFoundError(query.documentId);
    }

    const url = query.fileType === "pdf" ? doc.pdfUrl : doc.xmlUrl;
    if (!url) {
      throw new DomainValidationError(
        `El archivo ${query.fileType.toUpperCase()} para el comprobante ${doc.series}-${doc.number} aún no está disponible o no ha sido generado.`,
      );
    }

    return url;
  }
}
