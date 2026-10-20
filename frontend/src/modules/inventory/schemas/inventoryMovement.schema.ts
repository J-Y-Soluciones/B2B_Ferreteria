import { z } from "zod";

export const movementTypeSchema = z.enum([
  "INITIAL_STOCK",
  "PURCHASE_ENTRY",
  "POSITIVE_ADJUSTMENT",
  "NEGATIVE_ADJUSTMENT",
]);

export const createMovementFormSchema = z.object({
  movementType: movementTypeSchema,
  quantity: z.coerce
    .number()
    .positive("La cantidad debe ser estrictamente mayor a 0"),
  unitCost: z.coerce
    .number()
    .nonnegative("El costo no puede ser negativo")
    .optional(),
  documentNumber: z.string().trim().optional(),
  providerName: z.string().trim().optional(),
  reason: z
    .string()
    .trim()
    .min(3, "El motivo debe contener al menos 3 caracteres"),
});

export type CreateMovementFormData = z.infer<typeof createMovementFormSchema>;
