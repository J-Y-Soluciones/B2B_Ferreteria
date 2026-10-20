// src/modules/auth/pages/LoginPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, type LoginInput } from "../schemas/auth.schemas";
import {
  Store,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const SEED_TENANTS = {
  HARDWARE: "11111111-1111-4111-8111-111111111111",
  LUBRICENTER: "22222222-2222-4222-8222-222222222222",
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantId: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsSubmitting(true);
      setAuthError(null);

      await login(data);

      // Evaluación segura sin depender del tipo de retorno de login()
      const emailLower = data.email.toLowerCase();
      const isSuperadmin =
        emailLower.includes("jysoluciones") ||
        emailLower.includes("superadmin") ||
        emailLower.startsWith("admin@jy");

      if (isSuperadmin) {
        navigate("/platform");
      } else {
        navigate("/pos");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Credenciales inválidas o error de conexión");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (tenantId: string, email: string, pass = "password123") => {
    setValue("tenantId", tenantId);
    setValue("email", email);
    setValue("password", pass);
    setAuthError(null);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas p-4 font-mono select-none">
      <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-8 shadow-elevation">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">
            JYPoS Industrial
          </h1>
          <p className="mt-1 text-xs text-foreground-secondary">
            Terminal de Punto de Venta y Gestión B2B
          </p>
        </div>

        {authError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4"
        >
          {/* Email */}
          <div>
            <label className="text-xs font-bold uppercase text-foreground-secondary">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@comercio.pe"
              {...register("email")}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface-elevated p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {errors.email && (
              <span className="mt-1 text-[11px] text-rose-500">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Contraseña con botón Ver / Ocultar */}
          <div>
            <label className="text-xs font-bold uppercase text-foreground-secondary">
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full rounded-lg border border-border-strong bg-surface-elevated p-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-foreground-muted hover:text-foreground transition-colors"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="mt-1 text-[11px] text-rose-500">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-bold text-brand-fg shadow-elevation hover:bg-brand-hover disabled:opacity-50 transition-all active:scale-95"
          >
            <span>
              {isSubmitting ? "Autenticando..." : "Ingresar al Terminal"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Cuentas del Seed condicionales a variable de entorno */}
        {isDemoEnabled && (
          <div className="mt-6 border-t border-border-subtle pt-4">
            <span className="block text-[11px] font-bold text-foreground-secondary uppercase">
              Cuentas de Acceso Rápido (Modo Demo):
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              {/* Ocultamos el botón de Superadmin: sigue accesible escribiendo admin@jysoluciones.pe */}
              <button
                type="button"
                onClick={() =>
                  setPreset(SEED_TENANTS.HARDWARE, "admin@donlucho.pe")
                }
                className="flex items-center gap-1 rounded border border-border-subtle bg-surface-elevated p-1.5 text-left text-foreground hover:border-brand"
              >
                <ShieldCheck className="h-3 w-3 text-brand" />
                <span>Don Lucho (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreset(SEED_TENANTS.HARDWARE, "cajero@donlucho.pe")
                }
                className="flex items-center gap-1 rounded border border-border-subtle bg-surface-elevated p-1.5 text-left text-foreground hover:border-brand"
              >
                <ShieldCheck className="h-3 w-3 text-brand" />
                <span>Don Lucho (Caja)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreset(SEED_TENANTS.LUBRICENTER, "admin@elpiston.pe")
                }
                className="flex items-center gap-1 rounded border border-border-subtle bg-surface-elevated p-1.5 text-left text-foreground hover:border-brand"
              >
                <ShieldCheck className="h-3 w-3 text-indigo-400" />
                <span>El Pistón (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreset(SEED_TENANTS.LUBRICENTER, "cajero@elpiston.pe")
                }
                className="flex items-center gap-1 rounded border border-border-subtle bg-surface-elevated p-1.5 text-left text-foreground hover:border-brand"
              >
                <ShieldCheck className="h-3 w-3 text-indigo-400" />
                <span>El Pistón (Caja)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
