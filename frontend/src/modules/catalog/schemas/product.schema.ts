import { z } from "zod";

export const productConfigSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  sku: z.string().max(50).optional().default(""),
  barcode: z.string().max(50).optional().default(""),
  isService: z.boolean().default(false),
  baseUnit: z.string().min(1).max(10).default("MTR"),
  costPrice: z.coerce.number().min(0).default(0),
  baseSalePrice: z.coerce
    .number()
    .min(0, "El precio base debe ser mayor o igual a 0"),
  minStock: z.coerce.number().min(0).default(0),
  initialStock: z.coerce.number().min(0).optional().default(0),
  conversions: z
    .array(
      z.object({
        presentationName: z.string().min(1, "Nombre de presentación requerido"),
        barcode: z.string().optional().default(""),
        conversionRate: z.coerce.number().positive("Factor debe ser positivo"),
        salePrice: z.coerce
          .number()
          .positive("Precio de venta debe ser positivo"),
      }),
    )
    .default([]),
});

export type ProductConfigSavePayload = z.infer<typeof productConfigSchema>;
