// src/modules/platform/domain/value-objects/ruc.vo.ts
import { InvalidRucException } from "../exceptions/platform-domain.exception.js";

export class Ruc {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(rawRuc: string): Ruc {
    const cleanRuc = (rawRuc ?? "").trim();

    if (!/^\d{11}$/.test(cleanRuc)) {
      throw new InvalidRucException(
        cleanRuc,
        "Debe contener exactamente 11 dígitos numéricos.",
      );
    }

    const validPrefixes = ["10", "15", "17", "20"];
    const prefix = cleanRuc.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      throw new InvalidRucException(
        cleanRuc,
        `Debe iniciar con un prefijo válido (${validPrefixes.join(", ")}).`,
      );
    }

    if (!Ruc.validateChecksum(cleanRuc)) {
      throw new InvalidRucException(
        cleanRuc,
        "Dígito verificador inválido según el algoritmo SUNAT.",
      );
    }

    return new Ruc(cleanRuc);
  }

  private static validateChecksum(ruc: string): boolean {
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(ruc.charAt(i), 10) * weights[i];
    }

    const remainder = sum % 11;
    let expectedCheckDigit = 11 - remainder;

    if (expectedCheckDigit === 10) expectedCheckDigit = 0;
    else if (expectedCheckDigit === 11) expectedCheckDigit = 1;

    const actualCheckDigit = parseInt(ruc.charAt(10), 10);
    return expectedCheckDigit === actualCheckDigit;
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Ruc): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
