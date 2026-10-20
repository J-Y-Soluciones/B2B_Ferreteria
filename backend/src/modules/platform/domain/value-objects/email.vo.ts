// src/modules/platform/domain/value-objects/email.vo.ts
import { InvalidEmailException } from "../exceptions/platform-domain.exception.js";

export class Email {
  private readonly _value: string;
  private static readonly RFC_5322_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(rawEmail: string): Email {
    const normalized = (rawEmail ?? "").trim().toLowerCase();

    if (
      !normalized ||
      normalized.length > 254 ||
      !Email.RFC_5322_REGEX.test(normalized)
    ) {
      throw new InvalidEmailException(rawEmail);
    }

    return new Email(normalized);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
