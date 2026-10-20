import { Sale } from "./sale.aggregate.js";

export interface ISaleRepository {
  getNextTicketNumber(tenantId: string): Promise<bigint>;
  save(sale: Sale): Promise<void>;
  findById(tenantId: string, id: string): Promise<Sale | null>;
}
