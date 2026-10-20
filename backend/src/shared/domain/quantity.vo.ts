export class Quantity {
  private readonly _value: number;

  private constructor(value: number) {
    // 3 decimales de precisión para fraccionamiento ferretero
    this._value = Math.round(value * 1000) / 1000;
  }

  public static create(value: number): Quantity {
    if (isNaN(value) || value < 0) {
      throw new Error("La cantidad no puede ser negativa ni inválida");
    }
    return new Quantity(value);
  }

  public static zero(): Quantity {
    return new Quantity(0);
  }

  get value(): number {
    return this._value;
  }

  public add(other: Quantity): Quantity {
    return new Quantity(this._value + other._value);
  }

  public subtract(other: Quantity): Quantity {
    if (this._value < other._value) {
      throw new Error(
        "Operación de inventario inválida: cantidad resultante negativa",
      );
    }
    return new Quantity(this._value - other._value);
  }

  public isZero(): boolean {
    return this._value === 0;
  }
}
