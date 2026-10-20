import { z } from "zod";

// --- Validadores Generales ---
export const uuidSchema = z.string().uuid();

// --- Enumeraciones de Dominio (DDL PostgreSQL) ---
export const BusinessProfileEnum = z.enum(["HARDWARE_STORE", "LUBRICENTER"]);
export type BusinessProfile = z.infer<typeof BusinessProfileEnum>;

export const UserRoleEnum = z.enum([
  "TENANT_ADMIN",
  "CASHIER",
  "WAREHOUSE_OPERATOR",
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const ShiftStatusEnum = z.enum(["OPEN", "CLOSED"]);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;

export const PaymentMethodEnum = z.enum([
  "CASH",
  "YAPE_PLIN",
  "CARD",
  "CREDIT",
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const SaleStatusEnum = z.enum(["COMPLETED", "VOIDED"]);
export type SaleStatus = z.infer<typeof SaleStatusEnum>;

export const FiscalDocTypeEnum = z.enum(["01", "03"]);
export type FiscalDocType = z.infer<typeof FiscalDocTypeEnum>;

export const CdrStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
export type CdrStatus = z.infer<typeof CdrStatusEnum>;

// --- Módulo Catálogo (Estandarizado en camelCase por catalog.serializer.ts) ---
export const productConversionSchema = z.object({
  conversionId: z.string().uuid(),
  presentationName: z.string(),
  conversionRate: z.number().positive(),
  salePrice: z.number().nonnegative(),
});
export type ProductConversionDTO = z.infer<typeof productConversionSchema>;

export const productScanResponseSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  isService: z.boolean(),
  baseUnit: z.string(),
  baseSalePrice: z.number().nonnegative(),
  stockAvailable: z.number(),
  conversions: z.array(productConversionSchema).optional().default([]), // <-- PERMITE LAS PRESENTACIONES
  matchedConversion: productConversionSchema.nullable().optional(),
});
export type ProductScanResponseDTO = z.infer<typeof productScanResponseSchema>;

// --- Módulo POS (Contratos de Red POST /pos/sales en snake_case) ---
export const posSaleItemRequestSchema = z.object({
  product_id: z.string().uuid(),
  conversion_id: z.string().uuid().nullable().optional(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

export const posSalePaymentRequestSchema = z.object({
  payment_method: PaymentMethodEnum,
  amount: z.number().positive(),
  reference_code: z.string().max(50).nullable().optional(),
});

export const posSaleFiscalRequestSchema = z.object({
  requires_invoice: z.boolean(),
  doc_type: FiscalDocTypeEnum,
  customer_doc_number: z.string().min(8).max(11),
  customer_name: z.string().min(2).max(150),
});

export const posSaleRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  shift_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  reference_value: z.string().max(100).nullable().optional(),
  items: z.array(posSaleItemRequestSchema).min(1),
  payments: z.array(posSalePaymentRequestSchema).min(1),
  fiscal_dispatch: posSaleFiscalRequestSchema.optional(),
});
export type PosSaleRequest = z.infer<typeof posSaleRequestSchema>;

export const posSaleResponseSchema = z.preprocess(
  (val) => {
    if (typeof val === "object" && val !== null) {
      const raw = val as Record<string, unknown>;
      const rawFiscal = String(
        raw.fiscal_status ?? raw.fiscalStatus ?? "SKIPPED",
      ).toUpperCase();

      // Normalizar 'NONE' a 'SKIPPED' si el dominio de frontend lo requiere, o aceptarlo directamente
      const normalizedFiscal = rawFiscal === "NONE" ? "SKIPPED" : rawFiscal;

      return {
        sale_id: raw.sale_id ?? raw.saleId,
        ticket_number: Number(raw.ticket_number ?? raw.ticketNumber),
        total: Number(raw.total ?? 0),
        status: raw.status ?? "COMPLETED",
        fiscal_status: normalizedFiscal,
        created_at: raw.created_at ?? raw.createdAt,
      };
    }
    return val;
  },
  z.object({
    sale_id: z.string().uuid(),
    ticket_number: z.number().int().positive(),
    total: z.number().nonnegative(),
    status: z.enum(["COMPLETED", "VOIDED"]),
    fiscal_status: z
      .enum(["ENQUEUED", "SKIPPED", "SENT", "FAILED", "NONE"])
      .optional()
      .default("SKIPPED"),
    created_at: z.string(),
  }),
);
export type PosSaleResponse = z.infer<typeof posSaleResponseSchema>;

// --- Módulo Cash Shifts (POST /cash-shifts/{id}/close con objeto audit en snake_case) ---
export const shiftAuditBreakdownSchema = z.object({
  expected_cash: z.number(),
  declared_cash: z.number(),
  cash_difference: z.number(),
  expected_cards: z.number(),
  declared_cards: z.number(),
  expected_yape_plin: z.number(),
  declared_yape_plin: z.number(),
});

export const cashShiftCloseResponseSchema = z.object({
  id: z.string().uuid(),
  status: ShiftStatusEnum,
  closed_at: z.string(),
  audit: shiftAuditBreakdownSchema,
});
export type CashShiftCloseResponse = z.infer<
  typeof cashShiftCloseResponseSchema
>;

// --- Módulo Customers (POST /customers/{id}/debt-payments en snake_case) ---
export const debtPaymentResponseSchema = z.object({
  payment_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  amortized_amount: z.number().positive(),
  remaining_debt: z.number().nonnegative(),
  registered_in_shift: z.string().uuid().optional().nullable(),
  created_at: z.string(),
});
export type DebtPaymentResponse = z.infer<typeof debtPaymentResponseSchema>;
