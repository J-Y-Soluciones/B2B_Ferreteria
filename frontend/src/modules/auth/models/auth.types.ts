export type UserRole =
  | "SUPERADMIN"
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "CASHIER";
export type BusinessProfile = "HARDWARE_STORE" | "LUBRICENTER";

export interface TenantContext {
  id: string;
  businessName: string;
  tradeName: string;
  ruc: string;
  profile: BusinessProfile;
  moduleCredits: boolean;
  moduleMultiwarehouse: boolean;
  moduleSunat: boolean;
  allowNegativeStock: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId?: string | null;
  mustChangePassword?: boolean; 
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  tenant?: TenantContext;
  defaultWarehouseId?: string;
  activeCashRegisterId?: string;
}
