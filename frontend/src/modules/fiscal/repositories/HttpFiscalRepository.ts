// src/modules/fiscal/repositories/HttpFiscalRepository.ts
import { httpClient } from "@/shared/api/httpClient";
import type { IFiscalRepository } from "./IFiscalRepository";
import type {
  FiscalFilterParams,
  FiscalPaginatedResult,
} from "../models/fiscal.types";
import { FiscalMapper, type ApiFiscalDocDTO } from "../dtos/fiscal.mapper";

export class HttpFiscalRepository implements IFiscalRepository {
  async getDocuments(
    params: FiscalFilterParams,
  ): Promise<FiscalPaginatedResult> {
    const query = new URLSearchParams();
    if (params.docType && params.docType !== "ALL") {
      query.set("docType", params.docType);
    }
    if (params.cdrStatus && params.cdrStatus !== "ALL") {
      query.set("status", params.cdrStatus);
    }
    if (params.searchTerm && params.searchTerm.trim() !== "") {
      query.set("search", params.searchTerm.trim());
    }
    if (params.page) {
      query.set("page", String(params.page));
    }
    if (params.limit) {
      query.set("limit", String(params.limit));
    }

    const response = await httpClient.get<{
      items: ApiFiscalDocDTO[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/fiscal/documents?${query.toString()}`);

    const raw = response.data;
    const items = Array.isArray(raw?.items)
      ? raw.items.map(FiscalMapper.toDomain)
      : [];

    return {
      items,
      total: Number(raw?.total ?? 0),
      page: Number(raw?.page ?? 1),
      totalPages: Number(raw?.totalPages ?? 1),
    };
  }

  async retryDocument(documentId: string): Promise<void> {
    await httpClient.post(`/fiscal/documents/${documentId}/retry`);
  }

  getFileDownloadUrl(documentId: string, format: "xml" | "pdf"): string {
    const baseURL = httpClient.defaults.baseURL ?? "/api/v1";
    const cleanBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
    return `${cleanBase}/fiscal/documents/${documentId}/${format}`;
  }
}

export const fiscalRepository: IFiscalRepository = new HttpFiscalRepository();
