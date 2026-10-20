import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32, "Token de seguridad inválido"),
  new_password: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});
