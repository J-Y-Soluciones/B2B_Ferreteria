import { describe, it, expect, vi } from "vitest";
import { CustomerMapper } from "@/modules/customers/dtos/customer.mapper";
import type { ICustomerRepository } from "@/modules/customers/repositories/ICustomerRepository";

describe("CustomerMapper - Créditos y Fiados", () => {
  it("debe calcular el crédito disponible correctamente (US-04)", () => {
    const domain = CustomerMapper.toDomain({
      id: "8f8a1e2d-3c4b-5a6b-7c8d-9e0f1a2b3c4d",
      doc_number: "10728491821",
      name: "Taller Ramos SAC",
      phone: "999888777",
      credit_limit: 1500,
      current_debt: 1350,
    });

    expect(domain.availableCredit).toBe(150.0);
    expect(domain.hasOverdueDebt).toBe(false);
  });

  it("debe evitar números negativos en crédito disponible si está sobregirado", () => {
    const domain = CustomerMapper.toDomain({
      id: "8f8a1e2d-3c4b-5a6b-7c8d-9e0f1a2b3c4d",
      doc_number: "10728491821",
      name: "Cliente Moroso",
      phone: null,
      credit_limit: 500,
      current_debt: 600,
    });

    expect(domain.availableCredit).toBe(0);
  });
});

describe("CustomerRepository - Cobranza de Deuda Mock", () => {
  it("debe registrar un abono a deuda y retornar el saldo restante", async () => {
    const mockRepo: ICustomerRepository = {
      getCustomerById: vi.fn(),
      searchCustomers: vi.fn(),
      recordDebtPayment: vi.fn().mockResolvedValue({
        paymentId: "11223344-0000-0000-0000-000000000000",
        customerId: "8f8a1e2d-3c4b-5a6b-7c8d-9e0f1a2b3c4d",
        amortizedAmount: 200,
        remainingDebt: 350,
        registeredInShift: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      }),
      createCustomer: vi.fn().mockResolvedValue({
        id: "8f8a1e2d-3c4b-5a6b-7c8d-9e0f1a2b3c4d",
        name: "Cliente Prueba",
        docNumber: "10723456789",
        creditLimit: 1000,
        currentDebt: 0,
      }),
    };

    const result = await mockRepo.recordDebtPayment({
      customerId: "8f8a1e2d-3c4b-5a6b-7c8d-9e0f1a2b3c4d",
      shiftId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      amount: 200,
      paymentMethod: "CASH",
    });

    expect(result.amortizedAmount).toBe(200);
    expect(result.remainingDebt).toBe(350);
  });
});
