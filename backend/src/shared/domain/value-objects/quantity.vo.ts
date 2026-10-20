import { DomainValidationError } from "../../../core/errors/domain.error.js";

export class Quantity {
  private readonly _value: number;

  private constructor(value: number) {
    // 4 decimales para unidades de medida fraccionadas (kg, m, ltr)
    this._value = Math.round(value * 10000) / 10000;
    Object.freeze(this);
  }

  public static from(value: number): Quantity {
    if (!Number.isFinite(value)) {
      throw new DomainValidationError(
        "La cantidad física debe ser un número finito.",
      );
    }
    if (value <= 0) {
      throw new DomainValidationError(
        "La cantidad física debe ser mayor a cero.",
      );
    }
    return new Quantity(value);
  }

  public static zero(): Quantity {
    return new Quantity(0);
  }

  public get value(): number {
    return this._value;
  }

  public multiply(factor: number): Quantity {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new DomainValidationError(
        "El factor multiplicador debe ser un número finito mayor a cero.",
      );
    }
    return new Quantity(this._value * factor);
  }

  public subtract(other: Quantity): Quantity {
    const diff = this._value - other._value;
    if (diff < 0) {
      throw new DomainValidationError(
        "La deducción resulta en una cantidad física negativa.",
      );
    }
    return new Quantity(diff);
  }

  public isGreaterThan(other: Quantity): boolean {
    return this._value > other._value;
  }
}
