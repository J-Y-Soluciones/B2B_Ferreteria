import { CreditAccount } from "./credit-account.aggregate.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";

export interface DebtPaymentRecord {
  id: string;
  creditAccountId: string;
  shiftId: string;
  amount: Money;
  paymentMethod: "CASH" | "YAPE_PLIN" | "CARD";
  referenceCode: string | null;
}

export interface ICreditAccountRepository {
  create(account: CreditAccount): Promise<void>;
  update(account: CreditAccount): Promise<void>;
  findPendingByCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<CreditAccount[]>;
  recordPayment(tenantId: string, record: DebtPaymentRecord): Promise<void>;
}
