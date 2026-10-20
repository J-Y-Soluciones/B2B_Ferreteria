import { z } from "zod";

export const scanProductQuerySchema = z.object({
  barcode: z.string().min(1).max(50),
  warehouse_id: z.string().uuid().optional(),
});

export const searchProductsQuerySchema = z
  .object({
    term: z.string().optional(),
    q: z.string().optional(),
    warehouse_id: z.string().uuid().optional(),
    limit: z.coerce.number().int().positive().max(50).optional().default(50),
  })
  .transform((val) => ({
    term: (val.term ?? val.q ?? "").trim(),
    warehouse_id: val.warehouse_id,
    limit: val.limit,
  }));

export type ScanProductQueryParams = z.infer<typeof scanProductQuerySchema>;
export type SearchProductsQueryParams = z.infer<
  typeof searchProductsQuerySchema
>;
