import {
  IFiscalOutboxRepository,
  OutboxRecord,
} from "../domain/fiscal-outbox.repository.interface.js";
import { IFiscalPseClient } from "../domain/fiscal-pse-client.interface.js";
import { FiscalNonRetryableError } from "../domain/fiscal.types.js";

export interface FiscalWorkerOptions {
  batchSize: number;
  maxRetries: number;
}

export class ProcessFiscalOutboxUseCase {
  constructor(
    private readonly outboxRepo: IFiscalOutboxRepository,
    private readonly pseClient: IFiscalPseClient,
    private readonly options: FiscalWorkerOptions,
  ) {}

  public async execute(): Promise<number> {
    const records = await this.outboxRepo.fetchPendingBatch(
      this.options.batchSize,
    );
    if (records.length === 0) return 0;

    for (const record of records) {
      await this.processSingleRecord(record);
    }

    return records.length;
  }

  private async processSingleRecord(record: OutboxRecord): Promise<void> {
    await this.outboxRepo.markProcessing(record.id);

    try {
      const result = await this.pseClient.dispatchToPse(
        record.tenantId,
        record.payload,
      );
      await this.outboxRepo.markSent(record.id, result);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al timbrar con el PSE";

      // Si es un error definitivo de SUNAT/PSE (ej. RUC no existe), descartar reintentos de inmediato
      if (
        err instanceof FiscalNonRetryableError ||
        record.retryCount + 1 >= this.options.maxRetries
      ) {
        await this.outboxRepo.markFailed(record.id, errorMessage);
      } else {
        await this.outboxRepo.markRetry(
          record.id,
          record.retryCount + 1,
          errorMessage,
        );
      }
    }
  }
}
