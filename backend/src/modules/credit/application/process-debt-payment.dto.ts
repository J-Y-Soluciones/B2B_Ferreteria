export interface ProcessDebtPaymentCommand {
  tenantId: string;
  customerId: string;
  shiftId: string;
  amount: number;
  paymentMethod: "CASH" | "YAPE_PLIN" | "CARD";
  referenceCode: string | null;
}

export interface ProcessDebtPaymentResult {
  paymentId: string;
  customerId: string;
  amortizedAmount: number;
  remainingDebt: number;
  registeredInShift: string;
  createdAt: string;
}
