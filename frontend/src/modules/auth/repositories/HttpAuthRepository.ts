// src/modules/auth/repositories/HttpAuthRepository.ts
import { httpClient } from "@/shared/api/httpClient";
import type { IAuthRepository } from "./IAuthRepository";
import type { LoginInput } from "../schemas/auth.schemas";
import type {
  AuthSession,
  BusinessProfile,
  UserRole,
} from "../models/auth.types";

interface RawLoginResponse {
  readonly access_token?: string;
  readonly token?: string;
  readonly token_type?: string;
  readonly user?: {
    readonly id?: string;
    readonly email?: string;
    readonly fullName?: string;
    readonly full_name?: string;
    readonly role?: UserRole;
    readonly tenantId?: string;
    readonly tenant_id?: string | null;
    readonly mustChangePassword?: boolean;
    readonly must_change_password?: boolean;
  };
  readonly tenant?: {
    readonly id?: string;
    readonly business_name?: string;
    readonly businessName?: string;
    readonly trade_name?: string;
    readonly tradeName?: string;
    readonly ruc?: string;
    readonly profile?: BusinessProfile;
    readonly module_credits?: boolean;
    readonly moduleCredits?: boolean;
    readonly module_multiwarehouse?: boolean;
    readonly moduleMultiwarehouse?: boolean;
    readonly module_sunat?: boolean;
    readonly moduleSunat?: boolean;
    readonly allow_negative_stock?: boolean;
    readonly allowNegativeStock?: boolean;
    readonly modules?: {
      readonly credits?: boolean;
      readonly sunat?: boolean;
      readonly multiwarehouse?: boolean;
      readonly allow_negative_stock?: boolean;
    };
  };
  readonly default_warehouse_id?: string;
  readonly defaultWarehouseId?: string;
  readonly active_cash_register_id?: string;
  readonly activeCashRegisterId?: string;
  readonly data?: RawLoginResponse;
}

interface ParsedJwtClaims {
  readonly sub?: string;
  readonly tenant_id?: string;
  readonly tenantId?: string;
  readonly role?: UserRole;
  readonly [key: string]: unknown;
}

function parseJwtPayload(token: string): ParsedJwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadPart = parts[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as ParsedJwtClaims;
  } catch {
    return null;
  }
}

const KNOWN_TENANTS: Record<
  string,
  {
    readonly tradeName: string;
    readonly businessName: string;
    readonly ruc: string;
    readonly profile: BusinessProfile;
  }
> = {
  "11111111-1111-4111-8111-111111111111": {
    tradeName: "Ferretería Don Lucho",
    businessName: "Ferretería Don Lucho E.I.R.L.",
    ruc: "20100070970",
    profile: "HARDWARE_STORE",
  },
  "22222222-2222-4222-8222-222222222222": {
    tradeName: "Lubricentro El Pistón",
    businessName: "Lubricentro El Pistón S.A.C.",
    ruc: "20608912348",
    profile: "LUBRICENTER",
  },
  "76ddfd41-7b1f-4f54-ae2b-e11d7a706a7a": {
    tradeName: "Lubricentro El Trébol - Surco",
    businessName: "INVERSIONES AUTOMOTRICES EL TREBOL S.A.C.",
    ruc: "20100047218",
    profile: "LUBRICENTER",
  },
  "33333333-3333-4333-8333-333333333333": {
    tradeName: "Acabados Ramos",
    businessName: "Materiales & Acabados Ramos",
    ruc: "20491823900",
    profile: "HARDWARE_STORE",
  },
};

export class HttpAuthRepository implements IAuthRepository {
  async login(input: LoginInput): Promise<AuthSession> {
    const headers: Record<string, string> = {};
    if (input.tenantId && input.tenantId.trim() !== "") {
      headers["X-Tenant-Id"] = input.tenantId;
    }

    const response = await httpClient.post<RawLoginResponse>(
      "/auth/login",
      {
        email: input.email,
        password: input.password,
      },
      { headers },
    );

    const raw = response.data?.data ? response.data.data : response.data;
    const token = raw.access_token ?? raw.token ?? "";
    const tokenClaims = parseJwtPayload(token) ?? {};

    const role: UserRole = raw.user?.role ?? tokenClaims.role ?? "TENANT_ADMIN";

    const resolvedTenantId =
      raw.user?.tenantId ??
      raw.user?.tenant_id ??
      tokenClaims.tenant_id ??
      tokenClaims.tenantId ??
      raw.tenant?.id ??
      input.tenantId ??
      null;

    if (role === "SUPERADMIN" || role === "SUPER_ADMIN" || !resolvedTenantId) {
      return {
        accessToken: token,
        user: {
          id: raw.user?.id ?? "00000000-0000-0000-0000-000000000000",
          email: raw.user?.email ?? input.email,
          fullName:
            raw.user?.fullName ?? raw.user?.full_name ?? "Superadmin JY",
          role: "SUPERADMIN",
          tenantId: null,
        },
      };
    }

    httpClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    httpClient.defaults.headers.common["X-Tenant-Id"] = resolvedTenantId;

    const knownData = KNOWN_TENANTS[resolvedTenantId];

    const tradeName =
      raw.tenant?.tradeName ??
      raw.tenant?.trade_name ??
      knownData?.tradeName ??
      "Comercio B2B";

    const businessName =
      raw.tenant?.businessName ??
      raw.tenant?.business_name ??
      knownData?.businessName ??
      tradeName;

    const ruc = raw.tenant?.ruc ?? knownData?.ruc ?? "";
    const profile =
      raw.tenant?.profile ?? knownData?.profile ?? "HARDWARE_STORE";

    const tenantInfo = {
      id: resolvedTenantId,
      businessName,
      tradeName,
      ruc,
      profile,
      moduleCredits: Boolean(
        raw.tenant?.moduleCredits ??
        raw.tenant?.module_credits ??
        raw.tenant?.modules?.credits ??
        true,
      ),
      moduleMultiwarehouse: Boolean(
        raw.tenant?.moduleMultiwarehouse ??
        raw.tenant?.module_multiwarehouse ??
        raw.tenant?.modules?.multiwarehouse,
      ),
      moduleSunat: Boolean(
        raw.tenant?.moduleSunat ??
        raw.tenant?.module_sunat ??
        raw.tenant?.modules?.sunat,
      ),
      allowNegativeStock: Boolean(
        raw.tenant?.allowNegativeStock ??
        raw.tenant?.allow_negative_stock ??
        raw.tenant?.modules?.allow_negative_stock,
      ),
    };

    let defaultWarehouseId =
      raw.defaultWarehouseId ?? raw.default_warehouse_id ?? "";

    if (!defaultWarehouseId) {
      try {
        const warehousesRes = await httpClient.get<
          Array<{
            readonly id: string;
            readonly isDefault?: boolean;
            readonly is_default?: boolean;
          }>
        >("/warehouses");

        const defaultWh =
          warehousesRes.data.find((w) => w.isDefault || w.is_default) ??
          warehousesRes.data[0];

        if (defaultWh) {
          defaultWarehouseId = defaultWh.id;
        }
      } catch {
        // En caso de que el endpoint no esté disponible, se mantiene vacío
      }
    }

    const mustChangePassword = Boolean(
      raw.user?.mustChangePassword ??
      raw.user?.must_change_password ??
      tokenClaims.must_change_password ??
      tokenClaims.mustChangePassword,
    );

    return {
      accessToken: token,
      user: {
        id: raw.user?.id ?? "00000000-0000-0000-0000-000000000000",
        email: raw.user?.email ?? input.email,
        fullName:
          raw.user?.fullName ?? raw.user?.full_name ?? "Usuario en Turno",
        role,
        tenantId: resolvedTenantId,
        mustChangePassword, // 👈 Se asigna al usuario de sesión
      },
      tenant: tenantInfo,
      defaultWarehouseId,
      activeCashRegisterId:
        raw.activeCashRegisterId ?? raw.active_cash_register_id ?? "",
    };

    return {
      accessToken: token,
      user: {
        id: raw.user?.id ?? "00000000-0000-0000-0000-000000000000",
        email: raw.user?.email ?? input.email,
        fullName:
          raw.user?.fullName ?? raw.user?.full_name ?? "Usuario en Turno",
        role,
        tenantId: resolvedTenantId,
      },
      tenant: tenantInfo,
      defaultWarehouseId,
      activeCashRegisterId:
        raw.activeCashRegisterId ?? raw.active_cash_register_id ?? "",
    };
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const rawSession = localStorage.getItem("jypos_session");
    if (!rawSession) return null;
    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      localStorage.removeItem("jypos_session");
      return null;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem("jypos_session");
    localStorage.removeItem("jypos_token");
    localStorage.removeItem("jypos_tenant_id");
  }
}

export const authRepository = new HttpAuthRepository();
