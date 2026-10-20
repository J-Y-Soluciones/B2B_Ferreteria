import type {
  CustomerCreditProfile,
  CustomerDebtPaymentInput,
  CustomerDebtPaymentResult,
} from "../models/customer.types";
import type { CreateCustomerPayload } from "./HttpCustomerRepository";

export interface ICustomerRepository {
  getCustomerById(id: string): Promise<CustomerCreditProfile>;
  searchCustomers(query: string): Promise<CustomerCreditProfile[]>;
  createCustomer(
    payload: CreateCustomerPayload,
  ): Promise<CustomerCreditProfile>;
  recordDebtPayment(
    input: CustomerDebtPaymentInput,
  ): Promise<CustomerDebtPaymentResult>;
}
