import type {
  CompleteSalePayload,
  SaleConfirmationResult,
} from "../models/pos.types";

export interface IPosRepository {
  confirmSale(payload: CompleteSalePayload): Promise<SaleConfirmationResult>;
}
