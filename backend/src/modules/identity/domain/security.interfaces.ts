//src/modules/identity/domain/security.interfaces.ts
import { UserRole } from "./user.aggregate.js";

export interface JwtAccessTokenClaims {
  sub: string;
  tenant_id: string | null;
  role: UserRole;
  token_version: number;
  is_impersonated?: boolean; 
  impersonated_by?: string; 
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export interface ITokenService {
  signAccessToken(claims: JwtAccessTokenClaims): Promise<string>;
  verifyAccessToken(token: string): Promise<JwtAccessTokenClaims>;
  generateRefreshToken(): string;
  hashRefreshToken(rawToken: string): string;
}
