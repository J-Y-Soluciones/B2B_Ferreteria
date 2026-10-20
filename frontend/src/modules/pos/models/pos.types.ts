import type {
  PaymentMethod,
  FiscalDocType,
  SaleStatus,
} from "@/shared/api/domainTypes";

export interface CartItem {
  id: string; // Identificador único de línea en UI
  productId: string;
  name: string;
  isService: boolean;
  baseUnit: string;
  conversionId: string | null;
  presentationName: string;
  conversionRate: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stockAvailable: number;
}

export interface PaymentSplit {
  paymentMethod: PaymentMethod;
  amount: number;
  referenceCode?: string;
}

export interface FiscalDispatchInfo {
  requiresInvoice: boolean;
  docType: FiscalDocType;
  customerDocNumber: string;
  customerName: string;
}

export interface CompleteSalePayload {
  warehouseId: string;
  shiftId: string;
  customerId: string | null;
  referenceValue: string | null;
  items: CartItem[];
  payments: PaymentSplit[];
  fiscalDispatch: FiscalDispatchInfo | null;
}

export interface SaleConfirmationResult {
  saleId: string;
  ticketNumber: number;
  total: number;
  status: SaleStatus;
  fiscalStatus: "ENQUEUED" | "SKIPPED";
  createdAt: string;
}
