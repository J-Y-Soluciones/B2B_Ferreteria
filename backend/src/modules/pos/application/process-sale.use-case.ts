import { randomUUID } from "node:crypto";
import { ProcessSaleCommand, ProcessSaleResult } from "./process-sale.dto.js";
import { IUnitOfWork } from "../../../shared/application/ports/unit-of-work.port.js";
import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { Quantity } from "../../../shared/domain/value-objects/quantity.vo.js";
import { Sale } from "../domain/sale.aggregate.js";
import { CreditAccount } from "../../credit/domain/credit-account.aggregate.js";
import {
  EntityNotFoundError,
  InsufficientStockError,
  CreditLimitExceededError,
  DomainValidationError,
} from "../../../core/errors/domain.error.js";

export interface IProductCatalogQuery {
  findByIdWithConversions(
    tenantId: string,
    productId: string,
  ): Promise<{
    id: string;
    isService: boolean;
    conversions: Array<{ id: string; conversionRate: number }>;
  } | null>;
  isNegativeStockAllowed(tenantId: string): Promise<boolean>;
  isSunatModuleActive(tenantId: string): Promise<boolean>;
}

export class ProcessSaleUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly catalogQuery: IProductCatalogQuery,
  ) {}

  public async execute(
    command: ProcessSaleCommand,
  ): Promise<ProcessSaleResult> {
    return this.uow.execute(command.tenantId, async (ctx) => {
      // 1. Validar que la caja esté abierta y pertenezca al tenant
      const shift = await ctx.cashShifts.findById(
        command.tenantId,
        command.shiftId,
      );
      if (!shift) {
        throw new EntityNotFoundError("CashShift", command.shiftId);
      }
      shift.ensureIsOpen();

      // 2. Resolver características de configuración del tenant
      const allowNegativeStock = await this.catalogQuery.isNegativeStockAllowed(
        command.tenantId,
      );
      const isSunatEnabled = await this.catalogQuery.isSunatModuleActive(
        command.tenantId,
      );

      // 3. Procesar stock físico con bloqueo pesimista
      const domainItems = [];
      let totalAmount = Money.zero();

      for (const item of command.items) {
        const product = await this.catalogQuery.findByIdWithConversions(
          command.tenantId,
          item.productId,
        );
        if (!product) {
          throw new EntityNotFoundError("Product", item.productId);
        }

        let conversionRate = 1.0;
        if (item.conversionId) {
          const matched = product.conversions.find(
            (c) => c.id === item.conversionId,
          );
          if (!matched) {
            throw new DomainValidationError(
              `Presentación con ID ${item.conversionId} inválida.`,
            );
          }
          conversionRate = matched.conversionRate;
        }

        const quantitySoldVo = Quantity.from(item.quantity);
        const baseDeductedVo = product.isService
          ? Quantity.zero()
          : quantitySoldVo.multiply(conversionRate);

        if (!product.isService) {
          const currentStock = await ctx.inventories.lockStock(
            command.tenantId,
            command.warehouseId,
            item.productId,
          );

          if (currentStock === null) {
            throw new EntityNotFoundError(
              "Inventory",
              `${command.warehouseId}:${item.productId}`,
            );
          }

          if (
            !allowNegativeStock &&
            currentStock.isGreaterThan(baseDeductedVo) === false &&
            !currentStock.value
              .toFixed(4)
              .endsWith(baseDeductedVo.value.toFixed(4))
          ) {
            if (currentStock.value < baseDeductedVo.value) {
              throw new InsufficientStockError(
                item.productId,
                baseDeductedVo.value,
                currentStock.value,
              );
            }
          }

          await ctx.inventories.deductStock(
            command.tenantId,
            command.warehouseId,
            item.productId,
            baseDeductedVo,
          );
        }

        const unitPriceVo = Money.from(item.unitPrice);
        const subtotalVo = Money.from(item.quantity * item.unitPrice);
        totalAmount = totalAmount.add(subtotalVo);

        domainItems.push({
          id: randomUUID(),
          productId: item.productId,
          conversionId: item.conversionId,
          quantitySold: quantitySoldVo,
          conversionRate,
          baseQuantityDeducted: baseDeductedVo,
          unitPrice: unitPriceVo,
          subtotal: subtotalVo,
        });
      }

      // 4. Validar pagos y resolver crédito
      const domainPayments = command.payments.map((p) => ({
        id: randomUUID(),
        paymentMethod: p.paymentMethod,
        amount: Money.from(p.amount),
        referenceCode: p.referenceCode,
      }));

      const creditAmount = domainPayments
        .filter((p) => p.paymentMethod === "CREDIT")
        .reduce((acc, p) => acc.add(p.amount), Money.zero());

      const saleId = randomUUID();
      let creditAccountToCreate: CreditAccount | null = null;

      if (creditAmount.isGreaterThan(Money.zero())) {
        if (!command.customerId) {
          throw new DomainValidationError(
            "Debe indicar un cliente para ventas que incluyan crédito.",
          );
        }

        const customer = await ctx.customers.lockCustomerCredit(
          command.tenantId,
          command.customerId,
        );
        if (!customer) {
          throw new EntityNotFoundError("Customer", command.customerId);
        }

        const projectedDebt = customer.currentDebt.add(creditAmount);
        if (projectedDebt.isGreaterThan(customer.creditLimit)) {
          const available = customer.creditLimit.subtract(customer.currentDebt);
          throw new CreditLimitExceededError(
            command.customerId,
            available.amount,
            creditAmount.amount,
          );
        }

        await ctx.customers.increaseDebt(
          command.tenantId,
          command.customerId,
          creditAmount,
        );

        // Se instancia en memoria pero NO se persiste aún en la BD
        creditAccountToCreate = CreditAccount.rehydrate({
          id: randomUUID(),
          tenantId: command.tenantId,
          customerId: command.customerId,
          saleId,
          principalAmount: creditAmount,
          balance: creditAmount,
          status: "PENDING",
          dueDate: null,
          createdAt: new Date(),
        });
      }

      // 5. Construir agregado Sale y correlativo
      const nextTicketNumber = await ctx.sales.getNextTicketNumber(
        command.tenantId,
      );

      const sale = Sale.create({
        id: saleId,
        tenantId: command.tenantId,
        warehouseId: command.warehouseId,
        shiftId: command.shiftId,
        customerId: command.customerId,
        userId: command.userId,
        ticketNumber: nextTicketNumber,
        subtotal: totalAmount,
        discount: Money.zero(),
        total: totalAmount,
        referenceValue: command.referenceValue,
        items: domainItems,
        payments: domainPayments,
      });

      // ✅ 6. PRIMERO: Guardar cabecera e ítems de la venta en PostgreSQL
      await ctx.sales.save(sale);

      // ✅ 7. DESPUÉS: Persistir la cuenta de crédito (la FK credit_accounts_sale_id_fkey ya es válida)
      if (creditAccountToCreate) {
        await ctx.creditAccounts.create(creditAccountToCreate);
      }

      // 8. Outbox fiscal
      let fiscalStatus: "ENQUEUED" | "SKIPPED" = "SKIPPED";
      if (command.fiscalDispatch?.requiresInvoice && isSunatEnabled) {
        await ctx.fiscalOutbox.enqueue(command.tenantId, {
          saleId: sale.id,
          docType: command.fiscalDispatch.docType,
          customerDocNumber: command.fiscalDispatch.customerDocNumber,
          customerName: command.fiscalDispatch.customerName,
          total: totalAmount.amount,
          items: domainItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantitySold.value,
            unitPrice: i.unitPrice.amount,
            subtotal: i.subtotal.amount,
          })),
        });
        fiscalStatus = "ENQUEUED";
      }

      const snapshot = sale.toSnapshot();
      return {
        saleId: snapshot.id,
        ticketNumber: snapshot.ticketNumber.toString(),
        total: snapshot.total.amount,
        status: "COMPLETED",
        fiscalStatus,
        createdAt: snapshot.createdAt.toISOString(),
      };
    });
  }
}
