import { httpClient } from "@/shared/api/httpClient";
import { debtPaymentResponseSchema } from "@/shared/api/domainTypes";
import type { ICustomerRepository } from "./ICustomerRepository";
import type {
  CustomerCreditProfile,
  CustomerDebtPaymentInput,
  CustomerDebtPaymentResult,
} from "../models/customer.types";
import { CustomerMapper, type CustomerDTO } from "../dtos/customer.mapper";

export interface CreateCustomerPayload {
  name: string;
  docNumber: string;
  phone?: string | null;
  creditLimit: number;
}

export class HttpCustomerRepository implements ICustomerRepository {
  // Resuelve la ruta relativa evitando duplicar /api/v1 si baseURL ya lo incluye
  private resolvePath(subpath: string): string {
    const base = httpClient.defaults.baseURL ?? "";
    const cleanSub = subpath.startsWith("/") ? subpath : `/${subpath}`;
    if (base.endsWith("/api/v1") || base.endsWith("/api/v1/")) {
      return cleanSub; // ej: /customers
    }
    return `/api/v1${cleanSub}`; // ej: /api/v1/customers
  }

  async getCustomerById(id: string): Promise<CustomerCreditProfile> {
    const endpoint = this.resolvePath(`/customers/${id}`);
    const response = await httpClient.get<unknown>(endpoint);

    const payload = response.data as Record<string, unknown> | null;
    const raw =
      payload && typeof payload === "object" && "data" in payload
        ? (payload.data as CustomerDTO)
        : (payload as unknown as CustomerDTO);

    return CustomerMapper.toDomain(raw);
  }

  async searchCustomers(query: string): Promise<CustomerCreditProfile[]> {
    const trimmed = query.trim();
    const endpoint = this.resolvePath("/customers");

    const response = await httpClient.get<unknown>(endpoint, {
      params: trimmed ? { q: trimmed } : undefined,
    });

    const body = response.data;
    let list: CustomerDTO[] = [];

    if (Array.isArray(body)) {
      list = body as CustomerDTO[];
    } else if (body && typeof body === "object" && "data" in body) {
      const wrapped = (body as { data: unknown }).data;
      if (Array.isArray(wrapped)) {
        list = wrapped as CustomerDTO[];
      }
    }

    return list.map(CustomerMapper.toDomain);
  }

  async createCustomer(
    payload: CreateCustomerPayload,
  ): Promise<CustomerCreditProfile> {
    const endpoint = this.resolvePath("/customers");
    const response = await httpClient.post<unknown>(endpoint, {
      name: payload.name,
      doc_number: payload.docNumber,
      phone: payload.phone || null,
      credit_limit: payload.creditLimit,
    });

    const body = response.data as Record<string, unknown> | null;
    const raw =
      body && typeof body === "object" && "data" in body
        ? (body.data as CustomerDTO)
        : (body as unknown as CustomerDTO);

    return CustomerMapper.toDomain(raw);
  }

  async recordDebtPayment(
    input: CustomerDebtPaymentInput,
  ): Promise<CustomerDebtPaymentResult> {
    const payload = CustomerMapper.toDebtPaymentPayload(input);
    const endpoint = this.resolvePath(
      `/customers/${input.customerId}/debt-payments`,
    );
    const response = await httpClient.post<unknown>(endpoint, payload);

    const body = response.data as Record<string, unknown> | null;
    const raw =
      body && typeof body === "object" && "data" in body
        ? body.data
        : response.data;

    const validatedDTO = debtPaymentResponseSchema.parse(raw);
    return CustomerMapper.toPaymentResultDomain(validatedDTO);
  }
}

export const customerRepository = new HttpCustomerRepository();
