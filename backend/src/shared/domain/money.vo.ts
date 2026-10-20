export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency = "PEN") {
    this._amount = Math.round(amount * 100) / 100;
    this._currency = currency;
  }

  public static create(amount: number, currency = "PEN"): Money {
    if (isNaN(amount) || !isFinite(amount)) {
      throw new Error("El importe monetario debe ser un número válido");
    }
    return new Money(amount, currency);
  }

  public static zero(currency = "PEN"): Money {
    return new Money(0, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  public multiply(factor: number): Money {
    return new Money(this._amount * factor, this._currency);
  }

  public isNegative(): boolean {
    return this._amount < 0;
  }

  public equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Conflicto de monedas: ${this._currency} vs ${other._currency}`,
      );
    }
  }
}
