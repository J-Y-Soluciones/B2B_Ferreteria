// src/modules/team/repositories/HttpTeamRepository.ts
import { httpClient } from "@/shared/api/httpClient";
import type {
  TenantUser,
  ResetPasswordResponse,
  ResetPasswordPayload,
} from "../models/team.types";

export class HttpTeamRepository {
  async getTenantUsers(): Promise<TenantUser[]> {
    const response = await httpClient.get<TenantUser[]>("/tenant/users");
    return response.data;
  }

  async resetUserPassword({
    userId,
    temporaryPassword,
  }: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const payload = temporaryPassword?.trim()
      ? { temporaryPassword: temporaryPassword.trim() }
      : {};

    const response = await httpClient.post<ResetPasswordResponse>(
      `/tenant/users/${userId}/reset-password`,
      payload,
    );
    return response.data;
  }
}

export const teamRepository = new HttpTeamRepository();
