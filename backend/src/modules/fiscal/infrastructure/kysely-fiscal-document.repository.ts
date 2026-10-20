//src/modules/fiscal/infrastructure/kysely-fiscal-document.repository.ts
import { Kysely, sql } from "kysely";
import { DatabaseSchema } from "../../../shared/infrastructure/database/database.types.js";
import {
  FiscalDocumentFilters,
  IFiscalDocumentRepository,
  PaginatedFiscalDocuments,
} from "../domain/ports/fiscal-document.repository.port.js";
import { FiscalDocument } from "../domain/entities/fiscal-document.entity.js";

export class KyselyFiscalDocumentRepository implements IFiscalDocumentRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findPaginated(
    filters: FiscalDocumentFilters,
  ): Promise<PaginatedFiscalDocuments> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 100);
    const offset = (page - 1) * limit;

    let baseQuery = this.db
      .selectFrom("fiscal_documents")
      .where("tenant_id", "=", filters.tenantId);

    if (filters.docType && filters.docType !== "ALL") {
      baseQuery = baseQuery.where("doc_type", "=", filters.docType);
    }

    if (filters.status && filters.status !== "ALL") {
      baseQuery = baseQuery.where("cdr_status", "=", filters.status);
    }

    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`series ILIKE ${"%" + term + "%"}`,
          sql<boolean>`CAST(number AS TEXT) ILIKE ${"%" + term + "%"}`,
          sql<boolean>`external_id ILIKE ${"%" + term + "%"}`,
        ]),
      );
    }

    // Conteo total
    const totalRow = await baseQuery
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirst();
    const total = Number(totalRow?.total ?? 0);

    // Registros paginados ordenados por emisión descendente
    const rows = await baseQuery
      .selectAll()
      .orderBy("issued_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const items = rows.map((r) =>
      FiscalDocument.rehydrate({
        id: r.id,
        tenantId: r.tenant_id,
        saleId: r.sale_id,
        docType: r.doc_type,
        series: r.series,
        number: Number(r.number),
        externalId: r.external_id,
        cdrStatus: r.cdr_status,
        hashCpe: r.hash_cpe,
        pdfUrl: r.pdf_url,
        xmlUrl: r.xml_url,
        sunatErrorMessage: r.sunat_error_message,
        issuedAt: new Date(r.issued_at),
      }),
    );

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async findById(
    tenantId: string,
    id: string,
  ): Promise<FiscalDocument | null> {
    const row = await this.db
      .selectFrom("fiscal_documents")
      .selectAll()
      .where("tenant_id", "=", tenantId)
      .where("id", "=", id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return FiscalDocument.rehydrate({
      id: row.id,
      tenantId: row.tenant_id,
      saleId: row.sale_id,
      docType: row.doc_type,
      series: row.series,
      number: Number(row.number),
      externalId: row.external_id,
      cdrStatus: row.cdr_status,
      hashCpe: row.hash_cpe,
      pdfUrl: row.pdf_url,
      xmlUrl: row.xml_url,
      sunatErrorMessage: row.sunat_error_message,
      issuedAt: new Date(row.issued_at),
    });
  }

  public async resetToPending(
    tenantId: string,
    documentId: string,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      // 1. Obtener el comprobante fiscal asegurando aislamiento multi-tenant
      const doc = await trx
        .selectFrom("fiscal_documents")
        .select(["id", "sale_id"])
        .where("tenant_id", "=", tenantId)
        .where("id", "=", documentId)
        .executeTakeFirst();

      if (!doc) {
        return;
      }

      // 2. Restablecer cdr_status a PENDING
      await trx
        .updateTable("fiscal_documents")
        .set({
          cdr_status: "PENDING",
          sunat_error_message: null,
        })
        .where("id", "=", documentId)
        .where("tenant_id", "=", tenantId)
        .execute();

      // 3. Restablecer fiscal_outbox por sale_id a PENDING y retry_count = 0
      await trx
        .updateTable("fiscal_outbox")
        .set({
          status: "PENDING",
          retry_count: 0,
          last_error: null,
          updated_at: new Date(),
        })
        .where("tenant_id", "=", tenantId)
        .where("sale_id", "=", doc.sale_id)
        .execute();
    });
  }
}
