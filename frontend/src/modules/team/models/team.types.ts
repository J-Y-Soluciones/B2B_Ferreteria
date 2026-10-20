// src/modules/team/models/team.types.ts
import type { UserRole } from "@/modules/auth/models/auth.types";

export interface TenantUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly mustChangePassword: boolean;
  readonly createdAt: string;
}

export interface ResetPasswordResponse {
  readonly success: boolean;
  readonly temporaryPassword: string;
  readonly message: string;
}

export interface ResetPasswordPayload {
  readonly userId: string;
  readonly temporaryPassword?: string;
}
