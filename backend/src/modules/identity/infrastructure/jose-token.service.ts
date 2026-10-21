import { createHash, randomBytes } from "node:crypto";
import * as jose from "jose";
import {
  ITokenService,
  JwtAccessTokenClaims,
} from "../domain/security.interfaces.js";
import { env } from "../../../core/config/env.js";

type ImportedKey = CryptoKey | Uint8Array;

export class JoseTokenService implements ITokenService {
  private privateKeyPromise: Promise<ImportedKey> | null = null;
  private publicKeyPromise: Promise<ImportedKey> | null = null;

  /**
   * Sanitiza y normaliza llaves PEM de entornos cloud (Render, Docker, Vercel).
   * - Elimina comillas accidentales al inicio y final.
   * - Convierte "\n" literales en saltos de línea reales.
   * - Normaliza los retornos de carro de Windows (\r\n -> \n).
   */
  private formatPemKey(rawKey: string): string {
    if (!rawKey) return "";
    return rawKey
      .replace(/^["']|["']$/g, "") // Remueve comillas envolventes si las pusieron
      .replace(/\\n/g, "\n") // Convierte '\n' texto en saltos de línea
      .replace(/\r\n/g, "\n") // Normaliza formato CRLF a LF
      .trim();
  }

  private async getPrivateKey(): Promise<ImportedKey> {
    if (!this.privateKeyPromise) {
      const sanitizedKey = this.formatPemKey(env.JWT_PRIVATE_KEY);
      this.privateKeyPromise = jose.importPKCS8(sanitizedKey, "RS256");
    }
    return this.privateKeyPromise;
  }

  private async getPublicKey(): Promise<ImportedKey> {
    if (!this.publicKeyPromise) {
      const sanitizedKey = this.formatPemKey(env.JWT_PUBLIC_KEY);
      this.publicKeyPromise = jose.importSPKI(sanitizedKey, "RS256");
    }
    return this.publicKeyPromise;
  }

  public async signAccessToken(claims: JwtAccessTokenClaims): Promise<string> {
    const key = await this.getPrivateKey();
    return new jose.SignJWT({ ...claims })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setExpirationTime(`${env.JWT_ACCESS_EXPIRATION_SECONDS}s`)
      .sign(key);
  }

  public async verifyAccessToken(token: string): Promise<JwtAccessTokenClaims> {
    const key = await this.getPublicKey();
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ["RS256"],
    });
    return payload as unknown as JwtAccessTokenClaims;
  }

  public generateRefreshToken(): string {
    return randomBytes(48).toString("hex");
  }

  public hashRefreshToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }
}
