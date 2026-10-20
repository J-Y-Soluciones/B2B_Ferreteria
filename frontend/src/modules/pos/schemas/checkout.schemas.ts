// src/modules/pos/schemas/checkout.schemas.ts
import { z } from "zod";
import { FiscalDocTypeEnum } from "@/shared/api/domainTypes";

export const checkoutFormSchema = z
  .object({
    cashAmount: z.number().min(0),
    cashTendered: z.number().min(0),
    cardAmount: z.number().min(0),
    cardReference: z.string(),
    yapePlinAmount: z.number().min(0),
    yapeReference: z.string(),
    creditAmount: z.number().min(0),

    // Despacho Fiscal
    requiresInvoice: z.boolean(),
    docType: FiscalDocTypeEnum,
    customerDocNumber: z.string(),
    customerName: z.string(),
    saleTotal: z.number(),
  })
  .superRefine((data, ctx) => {
    const isOverLimit = data.saleTotal >= 700;

    // Si el operador activó comprobante o si supera S/ 700.00
    if (data.requiresInvoice || isOverLimit) {
      const doc = data.customerDocNumber.trim();
      const name = data.customerName.trim();

      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerName"],
          message: "Nombre o Razón Social es obligatorio por SUNAT",
        });
      }

      if (data.docType === "01") {
        // Factura requiere RUC de 11 dígitos válido (10, 15, 17, 20)
        const isValidRuc =
          /^\d{11}$/.test(doc) &&
          ["10", "15", "17", "20"].some((p) => doc.startsWith(p));

        if (!isValidRuc) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customerDocNumber"],
            message:
              "Factura requiere RUC de 11 dígitos válido (10, 15, 17, 20)",
          });
        }
      } else if (data.docType === "03") {
        // Boleta: Si supera S/ 700, el DNI de 8 dígitos es obligatorio
        if (isOverLimit && !/^\d{8}$/.test(doc)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customerDocNumber"],
            message:
              "Para ventas ≥ S/ 700.00, el DNI (8 dígitos) es obligatorio por SUNAT",
          });
        } else if (doc && !/^\d{8}$/.test(doc)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customerDocNumber"],
            message: "Boleta requiere DNI de 8 dígitos",
          });
        }
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
