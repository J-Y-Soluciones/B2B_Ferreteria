//src/modules/cash-shifts/repositories/HttpCashShiftRepository.ts
import { httpClient } from "@/shared/api/httpClient";
import {
  CashShiftMapper,
  type CashShiftBackendDTO,
} from "../dtos/cashShift.mapper";
import type {
  CashShift,
  OpenShiftPayload,
  CloseShiftPayload,
} from "../models/cashShift.types";

export interface ICashShiftRepository {
  getCurrentShift(): Promise<CashShift | null>;
  openShift(payload: OpenShiftPayload): Promise<CashShift>;
  closeShift(payload: CloseShiftPayload): Promise<CashShift>;
}

export class HttpCashShiftRepository implements ICashShiftRepository {
  async getCurrentShift(): Promise<CashShift | null> {
    try {
      const response = await httpClient.get<
        CashShiftBackendDTO | { data: CashShiftBackendDTO | null } | null
      >("/cash-shifts/current");

      if (!response.data) return null;

      // Tolerar respuestas con wrapper { data: { ... } } o directas { ... }
      const rawData =
        typeof response.data === "object" &&
        "data" in response.data &&
        response.data.data !== undefined
          ? response.data.data
          : response.data;

      if (!rawData) return null;

      return CashShiftMapper.toDomain(rawData as CashShiftBackendDTO);
    } catch (err: unknown) {
      // Tolera tanto AxiosError (err.response.status) como ProblemDetailsError (err.status)
      const errObj = err as { status?: number; response?: { status?: number } };
      const status = errObj.status ?? errObj.response?.status;

      if (status === 404) {
        return null;
      }

      console.warn("Aviso al consultar turno actual:", err);
      return null;
    }
  }

  async openShift(payload: OpenShiftPayload): Promise<CashShift> {
    const backendPayload = CashShiftMapper.toOpenPayload(payload);
    const response = await httpClient.post<CashShiftBackendDTO>(
      "/cash-shifts/open",
      backendPayload,
    );

    const rawData =
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      response.data.data !== undefined
        ? (response.data as { data: CashShiftBackendDTO }).data
        : response.data;

    return CashShiftMapper.toDomain(rawData);
  }

  async closeShift(payload: CloseShiftPayload): Promise<CashShift> {
    const backendPayload = CashShiftMapper.toClosePayload(payload);
    const idempotencyKey = crypto.randomUUID();

    const response = await httpClient.post<CashShiftBackendDTO>(
      `/cash-shifts/${payload.shiftId}/close`,
      backendPayload,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    const rawData =
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      response.data.data !== undefined
        ? (response.data as { data: CashShiftBackendDTO }).data
        : response.data;

    return CashShiftMapper.toDomain(rawData);
  }
}

export const cashShiftRepository = new HttpCashShiftRepository();
