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

  private async getPrivateKey(): Promise<ImportedKey> {
    if (!this.privateKeyPromise) {
      this.privateKeyPromise = jose.importPKCS8(env.JWT_PRIVATE_KEY, "RS256");
    }
    return this.privateKeyPromise;
  }

  private async getPublicKey(): Promise<ImportedKey> {
    if (!this.publicKeyPromise) {
      this.publicKeyPromise = jose.importSPKI(env.JWT_PUBLIC_KEY, "RS256");
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
