import type { PosSaleRequest, PosSaleResponse } from "@/shared/api/domainTypes";
import type {
  CompleteSalePayload,
  SaleConfirmationResult,
  CartItem,
  PaymentSplit,
} from "../models/pos.types";

/**
 * Representa la carga útil de respuesta serializada del backend,
 * tolerando campos en snake_case (según especificación API) o camelCase.
 */
export interface RawPosSaleResponseDto {
  sale_id?: string;
  saleId?: string;
  ticket_number?: number | string;
  ticketNumber?: number | string;
  total?: number | string;
  status?: "COMPLETED" | "VOIDED";
  fiscal_status?: "ENQUEUED" | "SKIPPED" | "SENT" | "FAILED";
  fiscalStatus?: "ENQUEUED" | "SKIPPED" | "SENT" | "FAILED";
  created_at?: string;
  createdAt?: string;
}

export class PosMapper {
  static toApiRequest(payload: CompleteSalePayload): PosSaleRequest {
    const requestBody: PosSaleRequest = {
      warehouse_id: payload.warehouseId,
      shift_id: payload.shiftId,
      customer_id: payload.customerId || null,
      reference_value: payload.referenceValue || null,
      items: payload.items.map((item: CartItem) => ({
        product_id: item.productId,
        conversion_id: item.conversionId ? item.conversionId : null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      payments: payload.payments.map((payment: PaymentSplit) => ({
        payment_method: payment.paymentMethod,
        amount: payment.amount,
        reference_code: payment.referenceCode || null,
      })),
    };

    if (payload.fiscalDispatch && payload.fiscalDispatch.requiresInvoice) {
      requestBody.fiscal_dispatch = {
        requires_invoice: true,
        doc_type: payload.fiscalDispatch.docType,
        customer_doc_number: payload.fiscalDispatch.customerDocNumber,
        customer_name: payload.fiscalDispatch.customerName,
      };
    }

    return requestBody;
  }

  static toApiPayload(payload: CompleteSalePayload): PosSaleRequest {
    return this.toApiRequest(payload);
  }

  static toDomainResponse(
    dto: PosSaleResponse | RawPosSaleResponseDto,
  ): SaleConfirmationResult {
    const raw = dto as RawPosSaleResponseDto;

    const resolvedSaleId = raw.sale_id ?? raw.saleId ?? "";
    const resolvedTicketNumber = Number(
      raw.ticket_number ?? raw.ticketNumber ?? 0,
    );
    const resolvedTotal = Number(raw.total ?? 0);
    const resolvedStatus = raw.status ?? "COMPLETED";
    const resolvedFiscalStatus =
      (raw.fiscal_status ?? raw.fiscalStatus) === "ENQUEUED"
        ? "ENQUEUED"
        : "SKIPPED";
    const resolvedCreatedAt =
      raw.created_at ?? raw.createdAt ?? new Date().toISOString();

    return {
      saleId: resolvedSaleId,
      ticketNumber: resolvedTicketNumber,
      total: resolvedTotal,
      status: resolvedStatus,
      fiscalStatus: resolvedFiscalStatus,
      createdAt: resolvedCreatedAt,
    };
  }
}
