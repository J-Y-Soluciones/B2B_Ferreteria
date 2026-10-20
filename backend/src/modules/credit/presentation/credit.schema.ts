import { z } from "zod";

export const debtPaymentSchema = z.object({
  shift_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.enum(["CASH", "YAPE_PLIN", "CARD"]),
  reference_code: z.string().max(50).nullable().optional(),
});

export type DebtPaymentBody = z.infer<typeof debtPaymentSchema>;
