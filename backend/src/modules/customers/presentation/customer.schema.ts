import { z } from "zod";

export const getCustomersQuerySchema = z.object({
  q: z.string().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "El nombre o razón social es obligatorio").max(255),
  doc_number: z
    .string()
    .min(8, "El documento debe tener al menos 8 dígitos")
    .max(20),
  phone: z.string().max(30).nullable().optional(),
  credit_limit: z.coerce
    .number()
    .min(0, "El límite de crédito no puede ser negativo")
    .default(0),
});

export type GetCustomersQuery = z.infer<typeof getCustomersQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
