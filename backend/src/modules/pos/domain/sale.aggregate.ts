import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { Quantity } from "../../../shared/domain/value-objects/quantity.vo.js";
import { DomainValidationError } from "../../../core/errors/domain.error.js";

export type PaymentMethod = "CASH" | "YAPE_PLIN" | "CARD" | "CREDIT";
export type SaleStatus = "COMPLETED" | "VOIDED";

export interface SaleItemProps {
  id: string;
  productId: string;
  conversionId: string | null;
  quantitySold: Quantity;
  conversionRate: number;
  baseQuantityDeducted: Quantity;
  unitPrice: Money;
  subtotal: Money;
}

export interface SalePaymentProps {
  id: string;
  paymentMethod: PaymentMethod;
  amount: Money;
  referenceCode: string | null;
}

export interface SaleProps {
  id: string;
  tenantId: string;
  warehouseId: string;
  shiftId: string;
  customerId: string | null;
  userId: string;
  ticketNumber: bigint;
  subtotal: Money;
  discount: Money;
  total: Money;
  status: SaleStatus;
  referenceValue: string | null;
  items: SaleItemProps[];
  payments: SalePaymentProps[];
  createdAt: Date;
}

export class Sale {
  private constructor(private readonly props: SaleProps) {
    this.validateInvariants();
    Object.freeze(this);
  }

  public static create(props: Omit<SaleProps, "status" | "createdAt">): Sale {
    return new Sale({
      ...props,
      status: "COMPLETED",
      createdAt: new Date(),
    });
  }

  public static rehydrate(props: SaleProps): Sale {
    return new Sale(props);
  }

  private validateInvariants(): void {
    if (this.props.items.length === 0) {
      throw new DomainValidationError(
        "Una venta debe incluir al menos un ítem.",
      );
    }
    if (this.props.payments.length === 0) {
      throw new DomainValidationError(
        "Una venta debe contener al menos una forma de pago.",
      );
    }

    const calculatedTotal = this.props.items
      .reduce((sum, item) => sum.add(item.subtotal), Money.zero())
      .subtract(this.props.discount);

    if (!calculatedTotal.equals(this.props.total)) {
      throw new DomainValidationError(
        `Discrepancia contable: La suma de ítems netos (${calculatedTotal.amount}) no cuadra con el total (${this.props.total.amount}).`,
      );
    }

    const totalPaid = this.props.payments.reduce(
      (sum, p) => sum.add(p.amount),
      Money.zero(),
    );

    if (!totalPaid.equals(this.props.total)) {
      throw new DomainValidationError(
        `Discrepancia de cobro: Los pagos recibidos (${totalPaid.amount}) no cubren el total pactado (${this.props.total.amount}).`,
      );
    }
  }

  public get id(): string {
    return this.props.id;
  }
  public get tenantId(): string {
    return this.props.tenantId;
  }
  public get shiftId(): string {
    return this.props.shiftId;
  }
  public get customerId(): string | null {
    return this.props.customerId;
  }
  public get total(): Money {
    return this.props.total;
  }
  public get items(): readonly SaleItemProps[] {
    return this.props.items;
  }
  public get payments(): readonly SalePaymentProps[] {
    return this.props.payments;
  }
  public get referenceValue(): string | null {
    return this.props.referenceValue;
  }

  public getCreditAmount(): Money {
    return this.props.payments
      .filter((p) => p.paymentMethod === "CREDIT")
      .reduce((sum, p) => sum.add(p.amount), Money.zero());
  }

  public toSnapshot(): Readonly<SaleProps> {
    return Object.freeze({ ...this.props });
  }
}
