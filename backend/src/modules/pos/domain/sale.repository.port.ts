import { Sale } from "./sale.entity.js";

export interface SaleRepositoryPort {
  save(sale: Sale, transactionContext?: any): Promise<void>;
  findById(id: string): Promise<Sale | null>;
}
