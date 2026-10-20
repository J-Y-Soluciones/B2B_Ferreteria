export interface ProcessSaleItemInput {
  productId: string;
  conversionId: string | null;
  quantity: number;
  unitPrice: number;
}

export interface ProcessSalePaymentInput {
  paymentMethod: "CASH" | "YAPE_PLIN" | "CARD" | "CREDIT";
  amount: number;
  referenceCode: string | null;
}

export interface ProcessSaleFiscalInput {
  requiresInvoice: boolean;
  docType: "01" | "03";
  customerDocNumber: string;
  customerName: string;
}

export interface ProcessSaleCommand {
  tenantId: string;
  userId: string;
  warehouseId: string;
  shiftId: string;
  customerId: string | null;
  referenceValue: string | null;
  items: ProcessSaleItemInput[];
  payments: ProcessSalePaymentInput[];
  fiscalDispatch?: ProcessSaleFiscalInput;
}

export interface ProcessSaleResult {
  saleId: string;
  ticketNumber: string;
  total: number;
  status: "COMPLETED" | "VOIDED";
  fiscalStatus: "ENQUEUED" | "SKIPPED"; // Normalizado a SKIPPED en lugar de NONE
  createdAt: string;
}
