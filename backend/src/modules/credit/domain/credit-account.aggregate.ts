import { Money } from "../../../shared/domain/value-objects/money.vo.js";
import { DomainValidationError } from "../../../core/errors/domain.error.js";

export type CreditStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "DEFAULTED";

export interface CreditAccountProps {
  id: string;
  tenantId: string;
  customerId: string;
  saleId: string;
  principalAmount: Money;
  balance: Money;
  status: CreditStatus;
  dueDate: Date | null;
  createdAt: Date;
}

export class CreditAccount {
  private constructor(private props: CreditAccountProps) {}

  public static rehydrate(props: CreditAccountProps): CreditAccount {
    return new CreditAccount({ ...props });
  }

  public get id(): string {
    return this.props.id;
  }
  public get customerId(): string {
    return this.props.customerId;
  }
  public get balance(): Money {
    return this.props.balance;
  }
  public get status(): CreditStatus {
    return this.props.status;
  }

  public amortize(amount: Money): Money {
    if (this.props.status === "PAID") {
      throw new DomainValidationError(
        "La cuenta de crédito ya está liquidada en su totalidad.",
      );
    }

    if (amount.isGreaterThan(this.props.balance)) {
      const absorbed = this.props.balance;
      this.props.balance = Money.zero();
      this.props.status = "PAID";
      return amount.subtract(absorbed); // Retorna el remanente no consumido
    }

    this.props.balance = this.props.balance.subtract(amount);
    this.props.status = this.props.balance.equals(Money.zero())
      ? "PAID"
      : "PARTIALLY_PAID";
    return Money.zero();
  }

  public toSnapshot(): Readonly<CreditAccountProps> {
    return Object.freeze({ ...this.props });
  }
}
