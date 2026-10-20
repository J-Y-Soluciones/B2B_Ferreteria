import { z } from "zod";

export const loginSchema = z.object({
  tenantId: z.string().optional(),
  email: z.string().email("Ingresa un correo electrónico corporativo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
