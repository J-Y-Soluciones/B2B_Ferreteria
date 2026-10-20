import { z } from "zod";

export const processSaleSchema = z.object({
  warehouse_id: z.string().uuid(),
  shift_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  reference_value: z.string().max(100).nullable().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        conversion_id: z.string().uuid().nullable().optional(),
        quantity: z.number().positive(),
        unit_price: z.number().nonnegative(),
      }),
    )
    .min(1),
  payments: z
    .array(
      z.object({
        payment_method: z.enum(["CASH", "YAPE_PLIN", "CARD", "CREDIT"]),
        amount: z.number().positive(),
        reference_code: z.string().max(50).nullable().optional(),
      }),
    )
    .min(1),
  fiscal_dispatch: z
    .object({
      requires_invoice: z.boolean(),
      doc_type: z.enum(["01", "03"]),
      customer_doc_number: z.string().min(8).max(11),
      customer_name: z.string().min(2).max(150),
    })
    .optional(),
});

export type ProcessSaleBody = z.infer<typeof processSaleSchema>;
