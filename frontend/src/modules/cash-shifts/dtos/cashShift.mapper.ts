//src/modules/cash-shifts/dtos/cashShift.mapper.ts
import type {
  CashShift,
  CashShiftAudit,
  OpenShiftPayload,
  CloseShiftPayload,
} from "../models/cashShift.types";

export interface CashShiftBackendDTO {
  id?: string;
  shift_id?: string;
  tenant_id?: string;
  cash_register_id: string;
  user_id: string;
  status: "OPEN" | "CLOSED";
  initial_cash: number | string;
  opened_at: string;
  closed_at?: string | null;
  audit?: {
    expected_cash: number | string;
    declared_cash: number | string;
    cash_difference: number | string;
    expected_cards: number | string;
    declared_cards: number | string;
    expected_yape_plin: number | string;
    declared_yape_plin: number | string;
  } | null;
}

export interface OpenShiftBackendPayloadDTO {
  cash_register_id?: string;
  initial_cash: number;
}

export interface CloseShiftBackendPayloadDTO {
  declared_cash: number;
  declared_cards: number;
  declared_yape_plin: number;
  notes: string;
}

export class CashShiftMapper {
  static toDomain(dto: CashShiftBackendDTO): CashShift {
    let audit: CashShiftAudit | undefined;

    if (dto.audit) {
      audit = {
        expectedCash: Number(dto.audit.expected_cash) || 0,
        declaredCash: Number(dto.audit.declared_cash) || 0,
        cashDifference: Number(dto.audit.cash_difference) || 0,
        expectedCards: Number(dto.audit.expected_cards) || 0,
        declaredCards: Number(dto.audit.declared_cards) || 0,
        expectedYapePlin: Number(dto.audit.expected_yape_plin) || 0,
        declaredYapePlin: Number(dto.audit.declared_yape_plin) || 0,
      };
    }

    return {
      id: dto.id ?? dto.shift_id ?? "",
      tenantId: dto.tenant_id ?? "",
      cashRegisterId: dto.cash_register_id,
      userId: dto.user_id,
      status: dto.status,
      initialCash: Number(dto.initial_cash) || 0,
      openedAt: dto.opened_at,
      closedAt: dto.closed_at ?? undefined,
      audit,
    };
  }

  static toOpenPayload(domain: OpenShiftPayload): OpenShiftBackendPayloadDTO {
    const rawCash = Number(domain.initialCash);
    const initialCash = Number.isFinite(rawCash) ? rawCash : 0;

    const payload: OpenShiftBackendPayloadDTO = {
      initial_cash: initialCash,
    };

    // Solo enviamos cash_register_id si tiene un valor real
    if (
      typeof domain.cashRegisterId === "string" &&
      domain.cashRegisterId.trim().length > 0
    ) {
      payload.cash_register_id = domain.cashRegisterId.trim();
    }

    return payload;
  }

  static toClosePayload(
    domain: CloseShiftPayload,
  ): CloseShiftBackendPayloadDTO {
    return {
      declared_cash: Number(domain.declaredCash) || 0,
      declared_cards: Number(domain.declaredCards) || 0,
      declared_yape_plin: Number(domain.declaredYapePlin) || 0,
      notes: (domain.notes ?? "").trim(),
    };
  }
}
