// src/modules/identity/application/login.dto.ts
import { UserRole } from "../domain/user.aggregate.js";

export interface LoginCommand {
  tenantId?: string | null;
  email: string;
  passwordPlain: string;
}

export interface TenantSessionDto {
  id: string;
  tradeName: string;
  businessName: string;
  ruc: string;
  profile: string;
  moduleSunat: boolean;
  moduleCredits: boolean;
  moduleMultiwarehouse: boolean;
  allowNegativeStock: boolean;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    tenantId: string | null;
    mustChangePassword: boolean;
  };
  tenant?: TenantSessionDto | null; // 👈 Agregado para hidratación del POS
}
