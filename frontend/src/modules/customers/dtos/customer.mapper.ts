import type { DebtPaymentResponse } from "@/shared/api/domainTypes";
import type {
  CustomerCreditProfile,
  CustomerDebtPaymentResult,
  CustomerDebtPaymentInput,
} from "../models/customer.types";

export interface CustomerDTO {
  id: string;
  doc_number: string | null;
  name: string;
  phone: string | null;
  credit_limit: number;
  current_debt: number;
  has_overdue_debt?: boolean;
}

export class CustomerMapper {
  static toDomain(dto: CustomerDTO): CustomerCreditProfile {
    const creditLimit = Number(dto.credit_limit) || 0;
    const currentDebt = Number(dto.current_debt) || 0;
    const availableCredit = Number(
      Math.max(0, creditLimit - currentDebt).toFixed(2),
    );

    return {
      id: dto.id,
      docNumber: dto.doc_number,
      name: dto.name,
      phone: dto.phone,
      creditLimit,
      currentDebt,
      availableCredit,
      hasOverdueDebt: Boolean(dto.has_overdue_debt),
    };
  }

  static toDebtPaymentPayload(input: CustomerDebtPaymentInput) {
    return {
      shift_id: input.shiftId,
      amount: Number(input.amount.toFixed(2)),
      payment_method: input.paymentMethod,
      reference_code: input.referenceCode?.trim() || null,
    };
  }

  static toPaymentResultDomain(
    dto: DebtPaymentResponse,
  ): CustomerDebtPaymentResult {
    return {
      paymentId: dto.payment_id,
      customerId: dto.customer_id,
      amortizedAmount: dto.amortized_amount,
      remainingDebt: dto.remaining_debt,
      registeredInShift: dto.registered_in_shift || "",
    };
  }
}
