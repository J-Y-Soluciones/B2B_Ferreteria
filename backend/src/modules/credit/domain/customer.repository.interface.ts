import { Money } from "../../../shared/domain/value-objects/money.vo.js";

export interface CustomerCreditState {
  id: string;
  creditLimit: Money;
  currentDebt: Money;
}

export interface ICustomerRepository {
  lockCustomerCredit(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerCreditState | null>;
  increaseDebt(
    tenantId: string,
    customerId: string,
    amount: Money,
  ): Promise<void>;
  decreaseDebt(
    tenantId: string,
    customerId: string,
    amount: Money,
  ): Promise<void>;
}
