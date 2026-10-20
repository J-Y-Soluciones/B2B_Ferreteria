import {
  DomainError,
  EntityNotFoundError,
} from "../../../../core/errors/domain.error.js";

export class FiscalDocumentNotFoundError extends EntityNotFoundError {
  constructor(documentId: string) {
    super("FiscalDocument", documentId);
  }
}

export class FiscalDocumentNotRetryableError extends DomainError {
  public readonly statusCode = 409;
  public readonly errorType =
    "https://api.jysoluciones.pe/errors/fiscal-document-not-retryable";

  constructor(documentId: string) {
    super(
      `El comprobante '${documentId}' ya fue aceptado por SUNAT y no puede reintentarse.`,
    );
  }
}
