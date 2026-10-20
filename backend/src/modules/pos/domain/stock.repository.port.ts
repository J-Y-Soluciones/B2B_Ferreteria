import { Quantity } from "../../../shared/domain/quantity.vo.js";

export interface StockRepositoryPort {
  /**
   * Bloquea pesimistamente las filas con FOR UPDATE para evitar condiciones de carrera en stock
   */
  decrementStockWithLock(
    productId: string,
    quantity: Quantity,
    transactionContext?: any,
  ): Promise<void>;
  getCurrentStock(productId: string): Promise<Quantity>;
}
