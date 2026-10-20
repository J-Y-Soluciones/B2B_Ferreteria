import { z } from "zod";
import { uuidSchema, PaymentMethodEnum } from "@/shared/api/domainTypes";

export const debtPaymentFormSchema = z.object({
  shiftId: uuidSchema,
  amount: z
    .number({ message: "Ingresa un monto válido" })
    .positive("El monto a amortizar debe ser mayor a 0"),
  paymentMethod: PaymentMethodEnum,
  referenceCode: z.string().max(50).optional(),
});
export type DebtPaymentFormValues = z.infer<typeof debtPaymentFormSchema>;
