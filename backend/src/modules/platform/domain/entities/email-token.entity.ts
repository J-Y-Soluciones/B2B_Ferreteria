// src/modules/platform/domain/entities/email-token.entity.ts
import { EmailTokenExpiredException } from "../exceptions/platform-domain.exception.js";

export type TokenType = "ADMIN_INVITATION" | "PASSWORD_RESET";

export interface EmailTokenProps {
  id: string;
  userId: string;
  tokenHash: string; // Hash SHA-256 del token plano
  tokenType: TokenType;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class EmailToken {
  private _props: EmailTokenProps;

  private constructor(props: EmailTokenProps) {
    this._props = props;
  }

  public static create(
    id: string,
    userId: string,
    tokenHash: string,
    tokenType: TokenType,
    expiresInHours: number,
  ): EmailToken {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return new EmailToken({
      id,
      userId,
      tokenHash,
      tokenType,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: EmailTokenProps): EmailToken {
    return new EmailToken(props);
  }

  public validateAndConsume(now: Date = new Date()): void {
    if (this._props.usedAt !== null) {
      throw new EmailTokenExpiredException(this._props.tokenType);
    }
    if (now > this._props.expiresAt) {
      throw new EmailTokenExpiredException(this._props.tokenType);
    }
    this._props.usedAt = now;
  }

  public get id(): string {
    return this._props.id;
  }
  public get userId(): string {
    return this._props.userId;
  }
  public get tokenHash(): string {
    return this._props.tokenHash;
  }
  public get tokenType(): TokenType {
    return this._props.tokenType;
  }
  public get expiresAt(): Date {
    return this._props.expiresAt;
  }
  public get usedAt(): Date | null {
    return this._props.usedAt;
  }
}
