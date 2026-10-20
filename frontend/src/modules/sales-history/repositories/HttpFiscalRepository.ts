import { httpClient } from "@/shared/api/httpClient";
import type { IFiscalRepository } from "./IFiscalRepository";
import type {
  FiscalDocumentSummary,
  FiscalFilterParams,
} from "../models/fiscal.types";
import { FiscalMapper, type FiscalDocumentDTO } from "../dtos/fiscal.mapper";

export class HttpFiscalRepository implements IFiscalRepository {
  async getFiscalDocuments(
    filters?: FiscalFilterParams,
  ): Promise<FiscalDocumentSummary[]> {
    const response = await httpClient.get<FiscalDocumentDTO[]>(
      "/fiscal/documents",
      {
        params: {
          doc_type: filters?.docType,
          only_failed: filters?.onlyFailed,
          q: filters?.query,
        },
      },
    );

    return response.data.map(FiscalMapper.toDomain);
  }

  async retryFailedDispatch(documentId: string): Promise<void> {
    await httpClient.post(`/fiscal/documents/${documentId}/retry`);
  }

  async retryAllFailed(): Promise<number> {
    const response = await httpClient.post<{ retried_count: number }>(
      "/fiscal/outbox/retry-all",
    );
    return response.data.retried_count;
  }
}

export const fiscalRepository = new HttpFiscalRepository();
