import { ISaleRepository } from "../../../modules/pos/domain/sale.repository.interface.js";
import { IInventoryRepository } from "../../../modules/inventory/domain/inventory.repository.interface.js";
import { ICustomerRepository } from "../../../modules/credit/domain/customer.repository.interface.js";
import { ICreditAccountRepository } from "../../../modules/credit/domain/credit-account.repository.interface.js";
import { ICashShiftRepository } from "../../../modules/cash-register/domain/cash-shift.repository.interface.js";
import { IFiscalOutboxQueue } from "../../../modules/fiscal/domain/fiscal-outbox.repository.interface.js";

export interface UnitOfWorkContext {
  sales: ISaleRepository;
  inventories: IInventoryRepository;
  customers: ICustomerRepository;
  creditAccounts: ICreditAccountRepository;
  cashShifts: ICashShiftRepository;
  fiscalOutbox: IFiscalOutboxQueue;
}

export interface IUnitOfWork {
  execute<T>(
    tenantId: string,
    operation: (uow: UnitOfWorkContext) => Promise<T>,
  ): Promise<T>;
}
