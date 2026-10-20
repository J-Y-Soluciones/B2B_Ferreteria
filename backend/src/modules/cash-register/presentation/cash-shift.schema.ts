import { z } from "zod";

export const openShiftSchema = z.object({
  cash_register_id: z
    .string()
    .uuid("cash_register_id debe ser un UUID válido.")
    .optional(),
  initial_cash: z.coerce
    .number()
    .min(0, "El monto inicial debe ser mayor o igual a 0."),
});

export type OpenShiftBody = z.infer<typeof openShiftSchema>;

// Cierre de caja
export const closeShiftSchema = z.object({
  declared_cash: z.coerce.number().min(0),
  declared_cards: z.coerce.number().min(0),
  declared_yape_plin: z.coerce.number().min(0),
  notes: z.string().max(500).optional().nullable(),
});

export type CloseShiftBody = z.infer<typeof closeShiftSchema>;
