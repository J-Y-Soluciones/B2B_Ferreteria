import { z } from "zod";

export const openShiftSchema = z.object({
  cashRegisterId: z.string().uuid("Identificador de caja inválido").optional(),
  initialCash: z
    .number({ message: "Debe ingresar un número válido" })
    .nonnegative("El sencillo inicial debe ser mayor o igual a 0"),
});

export type OpenShiftFormInput = z.infer<typeof openShiftSchema>;
export type OpenShiftInput = OpenShiftFormInput;

export const blindCloseShiftSchema = z.object({
  declaredCash: z
    .number({ message: "El efectivo debe ser numérico" })
    .nonnegative("El efectivo declarado no puede ser negativo"),
  declaredCards: z
    .number({ message: "El monto en tarjetas debe ser numérico" })
    .nonnegative("El monto en tarjetas no puede ser negativo"),
  declaredYapePlin: z
    .number({ message: "El monto en billeteras debe ser numérico" })
    .nonnegative("El monto en billeteras digitales no puede ser negativo"),
  notes: z
    .string()
    .trim()
    .min(3, "Debe ingresar una observación de cierre (mínimo 3 caracteres)"),
});

export const blindArqueoSchema = blindCloseShiftSchema;
export type BlindCloseShiftInput = z.infer<typeof blindCloseShiftSchema>;
export type BlindArqueoFormInput = BlindCloseShiftInput;
