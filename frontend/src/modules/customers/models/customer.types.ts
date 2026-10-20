import type { PaymentMethod } from "@/shared/api/domainTypes";

export interface CustomerCreditProfile {
  id: string;
  docNumber: string | null;
  name: string;
  phone: string | null;
  creditLimit: number;
  currentDebt: number;
  availableCredit: number;
  hasOverdueDebt: boolean;
}

export interface CustomerDebtPaymentInput {
  customerId: string;
  shiftId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceCode?: string;
}

export interface CustomerDebtPaymentResult {
  paymentId: string;
  customerId: string;
  amortizedAmount: number;
  remainingDebt: number;
  registeredInShift: string;
}
