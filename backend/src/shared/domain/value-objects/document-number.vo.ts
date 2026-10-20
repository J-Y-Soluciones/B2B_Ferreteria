import { DomainValidationError } from "../../../core/errors/domain.error.js";

export type DocumentType = "DNI" | "RUC";

export class DocumentNumber {
  private readonly _value: string;
  private readonly _type: DocumentType;

  private constructor(value: string, type: DocumentType) {
    this._value = value;
    this._type = type;
    Object.freeze(this);
  }

  public static from(raw: string): DocumentNumber {
    const cleaned = raw.trim();
    if (!/^\d+$/.test(cleaned)) {
      throw new DomainValidationError(
        "El documento fiscal debe contener solo dígitos numéricos.",
      );
    }

    if (cleaned.length === 8) {
      return new DocumentNumber(cleaned, "DNI");
    }

    if (cleaned.length === 11) {
      // Validación formal RUC SUNAT (10, 15, 17, 20)
      if (
        !["10", "15", "17", "20"].some((prefix) => cleaned.startsWith(prefix))
      ) {
        throw new DomainValidationError(
          "El prefijo de RUC no corresponde a una numeración válida SUNAT.",
        );
      }
      return new DocumentNumber(cleaned, "RUC");
    }

    throw new DomainValidationError(
      "El documento tributario debe ser un DNI (8 dígitos) o RUC (11 dígitos).",
    );
  }

  public get value(): string {
    return this._value;
  }

  public get type(): DocumentType {
    return this._type;
  }
}
