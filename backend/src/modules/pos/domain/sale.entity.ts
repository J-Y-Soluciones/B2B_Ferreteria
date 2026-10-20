import { Money } from "../../../shared/domain/money.vo.js";
import { Quantity } from "../../../shared/domain/quantity.vo.js";

export interface SaleItemProps {
  id: string;
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: Quantity;
  subtotal: Money;
}

export interface SaleProps {
  id: string;
  tenantId: string;
  cashShiftId: string;
  userId: string;
  customerId?: string;
  voucherType: "TICKET" | "BOLETA" | "FACTURA";
  items: SaleItemProps[];
  total: Money;
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "CREDIT";
  status: "COMPLETED" | "ANNULLED";
  createdAt: Date;
}

export class Sale {
  private constructor(private readonly props: SaleProps) {}

  public static create(
    params: Omit<SaleProps, "total" | "status" | "createdAt"> & {
      items: Omit<SaleItemProps, "subtotal">[];
    },
  ): Sale {
    if (params.items.length === 0) {
      throw new Error("Una venta debe tener al menos un ítem");
    }

    let calculatedTotal = Money.zero();
    const calculatedItems: SaleItemProps[] = params.items.map((item) => {
      const subtotal = item.unitPrice.multiply(item.quantity.value);
      calculatedTotal = calculatedTotal.add(subtotal);
      return {
        ...item,
        subtotal,
      };
    });

    return new Sale({
      ...params,
      items: calculatedItems,
      total: calculatedTotal,
      status: "COMPLETED",
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get total(): Money {
    return this.props.total;
  }
  get items(): ReadonlyArray<SaleItemProps> {
    return this.props.items;
  }
  get cashShiftId(): string {
    return this.props.cashShiftId;
  }
  get paymentMethod(): string {
    return this.props.paymentMethod;
  }
  get status(): string {
    return this.props.status;
  }
}
