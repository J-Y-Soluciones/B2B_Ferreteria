import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import {
  IFiscalOutboxRepository,
  OutboxRecord,
} from "../domain/fiscal-outbox.repository.interface.js";
import {
  FiscalDocumentPayload,
  FiscalDispatchSuccessResponse,
} from "../domain/fiscal.types.js";

export class KyselyFiscalOutboxRepository implements IFiscalOutboxRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async enqueue(
    tenantId: string,
    payload: FiscalDocumentPayload,
  ): Promise<void> {
    await this.db
      .insertInto("fiscal_outbox")
      .values({
        tenant_id: tenantId,
        sale_id: payload.saleId,
        payload: JSON.stringify(payload),
        status: "PENDING",
      })
      .execute();
  }

  public async fetchPendingBatch(limit: number): Promise<OutboxRecord[]> {
    // Bloqueo SKIP LOCKED para evitar colisiones entre workers concurrentes
    const rows = await this.db
      .selectFrom("fiscal_outbox")
      .selectAll()
      .where("status", "in", ["PENDING"])
      .orderBy("created_at", "asc")
      .limit(limit)
      .forUpdate()
      .skipLocked()
      .execute();

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      saleId: r.sale_id,
      payload: (typeof r.payload === "string"
        ? JSON.parse(r.payload)
        : r.payload) as FiscalDocumentPayload,
      status: r.status,
      retryCount: r.retry_count,
      lastError: r.last_error,
    }));
  }

  public async markProcessing(id: string): Promise<void> {
    await this.db
      .updateTable("fiscal_outbox")
      .set({
        status: "PROCESSING",
        updated_at: sql`NOW()`,
      })
      .where("id", "=", id)
      .execute();
  }

  public async markSent(
    id: string,
    result: FiscalDispatchSuccessResponse,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      const outbox = await trx
        .selectFrom("fiscal_outbox")
        .select(["tenant_id", "sale_id", "payload"])
        .where("id", "=", id)
        .executeTakeFirstOrThrow();

      const payload = (
        typeof outbox.payload === "string"
          ? JSON.parse(outbox.payload)
          : outbox.payload
      ) as FiscalDocumentPayload;

      // Persistir documento fiscal emitido
      await trx
        .insertInto("fiscal_documents")
        .values({
          tenant_id: outbox.tenant_id,
          sale_id: outbox.sale_id,
          doc_type: payload.docType,
          series: result.series,
          number: result.number,
          external_id: result.externalId,
          cdr_status: result.cdrStatus,
          hash_cpe: result.hashCpe,
          pdf_url: result.pdfUrl,
          xml_url: result.xmlUrl,
          sunat_error_message: result.sunatErrorMessage,
        })
        .execute();

      // Actualizar estado del outbox a SENT
      await trx
        .updateTable("fiscal_outbox")
        .set({
          status: "SENT",
          updated_at: sql`NOW()`,
        })
        .where("id", "=", id)
        .execute();
    });
  }

  public async markRetry(
    id: string,
    retryCount: number,
    error: string,
  ): Promise<void> {
    await this.db
      .updateTable("fiscal_outbox")
      .set({
        status: "PENDING",
        retry_count: retryCount,
        last_error: error,
        updated_at: sql`NOW()`,
      })
      .where("id", "=", id)
      .execute();
  }

  public async markFailed(id: string, error: string): Promise<void> {
    await this.db
      .updateTable("fiscal_outbox")
      .set({
        status: "FAILED",
        last_error: error,
        updated_at: sql`NOW()`,
      })
      .where("id", "=", id)
      .execute();
  }
}
