import { z } from "zod";

export const registerMovementSchema = z.object({
  warehouse_id: z.string().uuid("warehouse_id debe ser un UUID válido."),
  product_id: z.string().uuid("product_id debe ser un UUID válido."),
  movement_type: z.enum([
    "INITIAL_STOCK",
    "PURCHASE_ENTRY",
    "POSITIVE_ADJUSTMENT",
    "NEGATIVE_ADJUSTMENT",
  ]),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
  unit_cost: z.coerce
    .number()
    .min(0, "El costo unitario no puede ser negativo.")
    .optional(),
  reason: z
    .string()
    .min(3, "El motivo debe contener al menos 3 caracteres.")
    .max(255),
});

export type RegisterMovementInput = z.infer<typeof registerMovementSchema>;
