import { httpClient } from "@/shared/api/httpClient";
import { posSaleResponseSchema } from "@/shared/api/domainTypes";
import type { IPosRepository } from "./IPosRepository";
import type {
  CompleteSalePayload,
  SaleConfirmationResult,
} from "../models/pos.types";
import { PosMapper } from "../dtos/pos.mapper";

export class HttpPosRepository implements IPosRepository {
  async confirmSale(
    payload: CompleteSalePayload,
  ): Promise<SaleConfirmationResult> {
    const apiPayload = PosMapper.toApiRequest(payload);

    const response = await httpClient.post<unknown>("/pos/sales", apiPayload, {
      headers: {
        "Idempotency-Key": crypto.randomUUID(),
      },
    });

    const validatedDTO = posSaleResponseSchema.parse(response.data);
    return PosMapper.toDomainResponse(validatedDTO);
  }
}

export const posRepository = new HttpPosRepository();
