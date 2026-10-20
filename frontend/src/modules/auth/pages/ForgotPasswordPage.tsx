// src/modules/auth/pages/ForgotPasswordPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { httpClient } from "@/shared/api/httpClient";
import { alertService } from "@/shared/utils/alerts";
import { Mail, ArrowLeft, Send } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Ingrese un correo válido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsSubmitting(true);
    try {
      await httpClient.post("/auth/forgot-password", { email: data.email });
      setSent(true);
      alertService.success(
        "Enlace Enviado",
        "Si el correo corresponde a una cuenta activa, recibirá el enlace de recuperación.",
      );
    } catch {
      // OWASP: Siempre mostrar éxito
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas p-4 font-mono text-xs">
      <div className="w-full max-w-sm rounded-xl border border-border-strong bg-surface p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-brand">
          <Mail className="h-5 w-5" />
          <h1 className="text-sm font-bold text-foreground">
            Recuperación de Contraseña
          </h1>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-foreground-secondary leading-relaxed">
              Hemos enviado las instrucciones a su correo. El enlace será válido
              durante los próximos 30 minutos.
            </p>
            <Link
              className="inline-flex items-center gap-1.5 text-brand font-bold hover:underline"
              to="/login"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-foreground-secondary">
              Ingrese su correo institucional registrado para recibir el enlace
              de restablecimiento.
            </p>

            <div>
              <input
                type="email"
                placeholder="ejemplo@comercio.pe"
                {...register("email")}
                className="w-full bg-surface-elevated border border-border-strong rounded px-3 py-1.5 text-foreground focus:border-brand focus:outline-none"
              />
              {errors.email && (
                <span className="text-rose-500 text-[10px] mt-1 block">
                  {errors.email.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-1.5 bg-brand text-brand-fg font-bold py-2 rounded hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Enviando..." : "Enviar Enlace"}</span>
            </button>

            <div className="pt-2 text-center">
              <Link
                className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1"
                to="/login"
              >
                <ArrowLeft className="h-3 w-3" /> Cancelar y volver
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
