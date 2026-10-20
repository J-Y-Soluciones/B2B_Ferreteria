import { z } from "zod";

export const listFiscalDocumentsQuerySchema = z.object({
  docType: z.enum(["01", "03", "ALL"]).optional().default("ALL"),
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED", "ALL"])
    .optional()
    .default("ALL"),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListFiscalDocumentsQueryParams = z.infer<
  typeof listFiscalDocumentsQuerySchema
>;
