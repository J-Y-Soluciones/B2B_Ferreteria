import { DomainValidationError } from "../../../core/errors/domain.error.js";

export class Money {
  private readonly _amount: number;

  private constructor(amount: number) {
    this._amount = Math.round(amount * 100) / 100;
    Object.freeze(this);
  }

  public static from(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new DomainValidationError(
        "El monto monetario debe ser un número finito válido.",
      );
    }
    if (amount < 0) {
      throw new DomainValidationError(
        "El monto monetario no puede ser negativo.",
      );
    }
    return new Money(amount);
  }

  public static zero(): Money {
    return new Money(0);
  }

  public get amount(): number {
    return this._amount;
  }

  public add(other: Money): Money {
    return new Money(this._amount + other._amount);
  }

  public subtract(other: Money): Money {
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new DomainValidationError(
        "La resta monetaria produce un saldo negativo.",
      );
    }
    return new Money(result);
  }

  public isGreaterThan(other: Money): boolean {
    return this._amount > other._amount;
  }

  public equals(other: Money): boolean {
    return this._amount === other._amount;
  }
}
