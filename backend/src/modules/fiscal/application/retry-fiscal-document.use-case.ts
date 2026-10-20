import { IFiscalDocumentRepository } from "../domain/ports/fiscal-document.repository.port.js";
import {
  FiscalDocumentNotFoundError,
  FiscalDocumentNotRetryableError,
} from "../domain/errors/fiscal.errors.js";

export interface RetryFiscalDocumentCommand {
  tenantId: string;
  documentId: string;
}

export class RetryFiscalDocumentUseCase {
  constructor(private readonly fiscalRepo: IFiscalDocumentRepository) {}

  public async execute(command: RetryFiscalDocumentCommand): Promise<void> {
    // 1. Validar existencia y propiedad del comprobante (Mitigación BOLA/IDOR)
    const doc = await this.fiscalRepo.findById(
      command.tenantId,
      command.documentId,
    );
    if (!doc) {
      throw new FiscalDocumentNotFoundError(command.documentId);
    }

    // 2. Regla de dominio: si ya fue aceptado, no puede volver a encolarse
    if (!doc.canBeRetried()) {
      throw new FiscalDocumentNotRetryableError(command.documentId);
    }

    // 3. Restablecer en base de datos tanto comprobante como outbox
    await this.fiscalRepo.resetToPending(command.tenantId, command.documentId);
  }
}
