import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  sku: z.string().max(50).nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  isService: z.boolean().default(false),
  baseUnit: z.string().min(1).max(10).default("NIU"),
  costPrice: z.coerce.number().min(0).default(0),
  baseSalePrice: z.coerce
    .number()
    .min(0, "El precio base debe ser mayor o igual a 0"),
  minStock: z.coerce.number().min(0).default(0),
  initialStock: z.coerce.number().min(0).optional().default(0),
  conversions: z
    .array(
      z.object({
        presentationName: z
          .string()
          .min(1, "El nombre de la presentación es requerido"),
        barcode: z.string().nullable().optional(),
        conversionRate: z.coerce
          .number()
          .positive("El factor debe ser mayor a 0"),
        salePrice: z.coerce
          .number()
          .positive("El precio de venta debe ser mayor a 0"),
      }),
    )
    .optional()
    .default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
