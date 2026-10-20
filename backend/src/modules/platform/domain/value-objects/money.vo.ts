// src/modules/platform/domain/value-objects/money.vo.ts
import { InvalidMoneyAmountException } from "../exceptions/platform-domain.exception.js";

export class Money {
  private readonly _amount: number;
  public readonly currency: string = "PEN";

  private constructor(amount: number) {
    this._amount = amount;
  }

  public static from(rawAmount: number | string): Money {
    const num =
      typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

    if (isNaN(num) || !isFinite(num) || num < 0) {
      throw new InvalidMoneyAmountException(num);
    }

    // Redondeo exacto a 2 decimales
    const rounded = Math.round(num * 100) / 100;
    return new Money(rounded);
  }

  public static zero(): Money {
    return new Money(0);
  }

  public get amount(): number {
    return this._amount;
  }

  public add(other: Money): Money {
    return Money.from(this._amount + other._amount);
  }

  public equals(other: Money): boolean {
    return this._amount === other._amount && this.currency === other.currency;
  }
}
