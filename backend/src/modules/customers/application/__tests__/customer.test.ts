import { describe, it, expect, vi, beforeEach } from "vitest";
import { KyselyCustomerRepository } from "../../infrastructure/kysely-customer.repository.js";
import { CustomerController } from "../../presentation/customer.controller.js";
import { createCustomerSchema } from "../../presentation/customer.schema.js";
import type { FastifyReply, FastifyRequest } from "fastify";

describe("Customer Module - Application & Presentation Tests", () => {
  const TENANT_A = "11111111-1111-4000-8000-111111111111";

  describe("Validation Schema (Zod)", () => {
    it("debe aceptar un cliente válido con RUC de 11 dígitos y límite de crédito", () => {
      const input = {
        name: "Constructora San Pedro S.A.C.",
        doc_number: "20608912341",
        phone: "987654321",
        credit_limit: 3500.0,
      };

      const result = createCustomerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.credit_limit).toBe(3500.0);
      }
    });

    it("debe rechazar clientes con documento menor a 8 dígitos", () => {
      const input = {
        name: "Cliente Inválido",
        doc_number: "12345",
        credit_limit: 500,
      };

      const result = createCustomerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("doc_number");
      }
    });

    it("debe rechazar límites de crédito negativos", () => {
      const input = {
        name: "Cliente Moroso",
        doc_number: "47891234",
        credit_limit: -50,
      };

      const result = createCustomerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("CustomerController (HTTP Layer)", () => {
    let mockRepo: Partial<KyselyCustomerRepository>;
    let controller: CustomerController;
    let replyMock: {
      status: ReturnType<typeof vi.fn>;
      send: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockRepo = {
        findAllByTenant: vi.fn(),
        findByDocNumber: vi.fn(),
        createCustomer: vi.fn(),
      };
      controller = new CustomerController(mockRepo as KyselyCustomerRepository);

      replyMock = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };
    });

    it("handleList debe retornar 200 con { data: [...] } filtrada por tenant", async () => {
      const mockCustomers = [
        {
          id: "cust-1",
          doc_number: "20608912341",
          name: "Constructora San Pedro S.A.C.",
          phone: "987654321",
          credit_limit: 3500,
          current_debt: 850,
          has_overdue_debt: false,
        },
      ];

      (mockRepo.findAllByTenant as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCustomers,
      );

      const requestMock = {
        tenantContext: {
          tenantId: TENANT_A,
          userId: "user-1",
          role: "TENANT_ADMIN",
        },
        query: { q: "San Pedro" },
      } as unknown as FastifyRequest<{ Querystring: { q?: string } }>;

      await controller.handleList(
        requestMock,
        replyMock as unknown as FastifyReply,
      );

      expect(mockRepo.findAllByTenant).toHaveBeenCalledWith(
        TENANT_A,
        "San Pedro",
      );
      expect(replyMock.status).toHaveBeenCalledWith(200);
      expect(replyMock.send).toHaveBeenCalledWith({ data: mockCustomers });
    });

    it("handleCreate debe responder 409 Conflict si el documento ya existe", async () => {
      (mockRepo.findByDocNumber as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "existing-uuid",
        doc_number: "20608912341",
      });

      const requestMock = {
        tenantContext: {
          tenantId: TENANT_A,
          userId: "user-1",
          role: "TENANT_ADMIN",
        },
        url: "/api/v1/customers",
        body: {
          name: "Empresa Duplicada",
          doc_number: "20608912341",
          credit_limit: 1000,
        },
      } as unknown as FastifyRequest<{ Body: any }>;

      await controller.handleCreate(
        requestMock,
        replyMock as unknown as FastifyReply,
      );

      expect(replyMock.status).toHaveBeenCalledWith(409);
      expect(mockRepo.createCustomer).not.toHaveBeenCalled();
    });

    it("handleCreate debe responder 201 Created con el nuevo cliente", async () => {
      (mockRepo.findByDocNumber as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );
      (mockRepo.createCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "new-cust-uuid",
        name: "Nuevo Cliente Maestro",
        doc_number: "45891234",
        phone: null,
        credit_limit: 1500,
        current_debt: 0.0,
        has_overdue_debt: false,
      });

      const requestMock = {
        tenantContext: {
          tenantId: TENANT_A,
          userId: "user-1",
          role: "TENANT_ADMIN",
        },
        body: {
          name: "Nuevo Cliente Maestro",
          doc_number: "45891234",
          credit_limit: 1500,
        },
      } as unknown as FastifyRequest<{ Body: any }>;

      await controller.handleCreate(
        requestMock,
        replyMock as unknown as FastifyReply,
      );

      expect(replyMock.status).toHaveBeenCalledWith(201);
      expect(replyMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-cust-uuid",
          current_debt: 0.0,
        }),
      );
    });
  });
});
