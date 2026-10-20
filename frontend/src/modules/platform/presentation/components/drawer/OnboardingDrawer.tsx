// src/modules/platform/presentation/components/drawer/OnboardingDrawer.tsx
import { useState, useMemo } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Zap,
  Building2,
  UserCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Dices,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  onboardTenantSchema,
  type OnboardTenantFormInput,
  type OnboardTenantFormRawInput,
} from "../../../domain/schemas/platformTenant.schemas";
import { useOnboardTenant } from "../../../application/hooks/useOnboardTenant";
import { platformRepository } from "../../../infrastructure/HttpPlatformRepository";
import { alertService } from "@/shared/utils/alerts";
import Swal from "sweetalert2";

interface OnboardingDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

// Generador de clave aleatoria de alta entropía
function generateSecurePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const specials = "!@#$%*";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const special = specials.charAt(Math.floor(Math.random() * specials.length));
  return `JY-${randomStr}${special}`;
}

const INITIAL_DEFAULT_VALUES: OnboardTenantFormRawInput = {
  ruc: "",
  businessName: "",
  tradeName: "",
  profile: "LUBRICENTER",
  adminFullName: "",
  adminEmail: "",
  temporaryPassword: "JY-Pass#8841",
  planName: "BASIC",
  gracePeriodDays: 14,
  moduleSunat: true,
  moduleCredits: true,
  moduleMultiwarehouse: false,
  allowNegativeStock: false,
};

export function OnboardingDrawer({ open, onClose }: OnboardingDrawerProps) {
  const [isConsultingRuc, setIsConsultingRuc] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OnboardTenantFormRawInput, unknown, OnboardTenantFormInput>({
    resolver: zodResolver(onboardTenantSchema),
    defaultValues: INITIAL_DEFAULT_VALUES,
  });

  const { onboardTenant, isSubmitting } = useOnboardTenant({
    onSuccess: async () => {
      // Almacenar el valor que se envió para el modal de bienvenida
      const trade = formValues.tradeName || "Nuevo Comercio";
      const email = formValues.adminEmail || "";
      const pass = formValues.temporaryPassword || "";

      reset(INITIAL_DEFAULT_VALUES);
      setStatusMessage(null);
      onClose();

      const welcomeCardText = `🏪 *ACCESO A JYPOS INDUSTRIAL*\nComercio: ${trade}\nURL: ${window.location.origin}/login\nUsuario: ${email}\nContraseña Temporal: ${pass}\n\n*Nota:* Al ingresar por primera vez, el sistema solicitará cambiar su contraseña.`;

      await Swal.fire({
        icon: "success",
        title: "¡Comercio Aprovisionado con Éxito!",
        html: `
        <div style="text-align: left; font-family: monospace; font-size: 11px; background: #1E293B; padding: 12px; border-radius: 8px; border: 1px solid #334155; margin-top: 10px;">
          <p style="margin: 2px 0;"><strong>Comercio:</strong> ${trade}</p>
          <p style="margin: 2px 0;"><strong>Usuario:</strong> ${email}</p>
          <p style="margin: 2px 0;"><strong>Clave Temporal:</strong> <code style="color: #F59E0B; font-weight: bold;">${pass}</code></p>
          <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 10px;">El cliente deberá cambiar su contraseña en su primer inicio de sesión.</p>
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "Copiar Ficha para WhatsApp",
        confirmButtonColor: "#F59E0B",
        cancelButtonText: "Cerrar",
        cancelButtonColor: "#334155",
        background: "#0F172A",
        color: "#F8FAFC",
        customClass: {
          popup:
            "border border-slate-800 rounded-2xl font-mono text-xs shadow-2xl",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          void navigator.clipboard.writeText(welcomeCardText);
          alertService.success("¡Copiado!", "Ficha copiada al portapapeles.");
        }
      });
    },
    onError: (err) => {
      setStatusMessage(`Error: ${err.message}`);
    },
  });

  const formValues = useWatch({ control });

  const currentRuc = formValues.ruc ?? "";
  const selectedProfile = formValues.profile ?? "LUBRICENTER";
  const modSunat = Boolean(formValues.moduleSunat);
  const modCredits = Boolean(formValues.moduleCredits);
  const modMultiwarehouse = Boolean(formValues.moduleMultiwarehouse);
  const graceDays = formValues.gracePeriodDays ?? 14;
  const currentPassword = formValues.temporaryPassword ?? "";

  const calculatedFee = useMemo(() => {
    let base = 119;
    if (modSunat) base += 90;
    if (modCredits) base += 60;
    if (modMultiwarehouse) base += 80;
    return base;
  }, [modSunat, modCredits, modMultiwarehouse]);

  const handleConsultRuc = async () => {
    if (!currentRuc || currentRuc.length !== 11) {
      setStatusMessage("El RUC debe tener 11 dígitos para consultar.");
      return;
    }
    try {
      setIsConsultingRuc(true);
      setStatusMessage(null);
      const res = await platformRepository.queryRucSunat(currentRuc);
      setValue("businessName", res.businessName, { shouldValidate: true });
      if (res.tradeName) {
        setValue("tradeName", res.tradeName, { shouldValidate: true });
      }
    } catch {
      setStatusMessage("No se pudo obtener datos automáticos del RUC.");
    } finally {
      setIsConsultingRuc(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword();
    setValue("temporaryPassword", newPass, { shouldValidate: true });
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (!currentPassword) return;
    void navigator.clipboard.writeText(currentPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit: SubmitHandler<OnboardTenantFormInput> = async (data) => {
    await onboardTenant(data);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm font-mono text-xs animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-xl h-full bg-surface border-l border-border-strong flex flex-col shadow-2xl">
        {/* Header Drawer */}
        <div className="h-14 border-b border-border-strong px-4 flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-brand/20 border border-brand flex items-center justify-center text-brand">
              <Zap className="h-3.5 w-3.5 fill-current" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">
                Aprovisionar Nuevo Comercio SaaS
              </h2>
              <span className="text-[10px] text-foreground-muted">
                POST /api/v1/platform/tenants
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-4 space-y-5"
        >
          {/* SECCIÓN 1: DATOS FISCALES & IDENTIDAD */}
          <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-subtle/50 p-3.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                <Building2 className="h-3.5 w-3.5 text-brand" />
                1. DATOS FISCALES & IDENTIDAD
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold">
                Padrón SUNAT RUC
              </span>
            </div>

            <div>
              <label
                htmlFor="ruc"
                className="block text-[10px] text-foreground-secondary mb-1"
              >
                RUC del Contribuyente (11 dígitos) *
              </label>
              <div className="flex gap-2">
                <input
                  id="ruc"
                  type="text"
                  maxLength={11}
                  {...register("ruc")}
                  placeholder="20608974123"
                  className="flex-1 rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button
                  type="button"
                  disabled={isConsultingRuc}
                  onClick={handleConsultRuc}
                  className="rounded bg-brand/10 border border-brand/30 px-3 py-1.5 text-[11px] font-bold text-brand hover:bg-brand hover:text-brand-fg disabled:opacity-50"
                >
                  {isConsultingRuc ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Consultar RUC"
                  )}
                </button>
              </div>
              {errors.ruc && (
                <p className="text-[10px] text-rose-400 mt-1">
                  {errors.ruc.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="block text-[10px] text-foreground-secondary mb-1"
              >
                Razón Social Registrada *
              </label>
              <input
                id="businessName"
                type="text"
                {...register("businessName")}
                placeholder="INVERSIONES AUTOMOTRICES EL TREBOL S.A.C."
                className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.businessName && (
                <p className="text-[10px] text-rose-400 mt-1">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tradeName"
                className="block text-[10px] text-foreground-secondary mb-1"
              >
                Nombre Comercial (Rotulado en Ticket / POS) *
              </label>
              <input
                id="tradeName"
                type="text"
                {...register("tradeName")}
                placeholder="Lubricentro El Trébol - Surco"
                className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.tradeName && (
                <p className="text-[10px] text-rose-400 mt-1">
                  {errors.tradeName.message}
                </p>
              )}
            </div>

            {/* Selector de Perfil / Rubro */}
            <div>
              <label className="block text-[10px] text-foreground-secondary mb-1">
                Perfil de Operación (Workflow del Negocio) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue("profile", "LUBRICENTER")}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    selectedProfile === "LUBRICENTER"
                      ? "border-sky-500 bg-sky-500/10 text-foreground"
                      : "border-border-subtle bg-surface text-foreground-muted"
                  }`}
                >
                  <div className="font-bold text-sky-400 text-[11px]">
                    LUBRICENTRO
                  </div>
                  <div className="text-[9px] text-foreground-muted mt-0.5">
                    Automotriz: Placas, Galones fraccionados, Kilometraje y
                    Bahías.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("profile", "HARDWARE_STORE")}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    selectedProfile === "HARDWARE_STORE"
                      ? "border-amber-500 bg-amber-500/10 text-foreground"
                      : "border-border-subtle bg-surface text-foreground-muted"
                  }`}
                >
                  <div className="font-bold text-amber-400 text-[11px]">
                    FERRETERÍA
                  </div>
                  <div className="text-[9px] text-foreground-muted mt-0.5">
                    Materiales: Obras, Metros, Kilos, Tornillos y Conversión
                    fraccional.
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ADMINISTRADOR INICIAL */}
          <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-subtle/50 p-3.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                <UserCheck className="h-3.5 w-3.5 text-brand" />
                2. ADMINISTRADOR INICIAL (TENANT_ADMIN)
              </span>
              <span className="text-[9px] text-foreground-muted">
                Credenciales Root del Cliente
              </span>
            </div>

            <div>
              <label
                htmlFor="adminFullName"
                className="block text-[10px] text-foreground-secondary mb-1"
              >
                Nombre Completo del Administrador *
              </label>
              <input
                id="adminFullName"
                type="text"
                {...register("adminFullName")}
                placeholder="Roberto Carlos Medina"
                className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.adminFullName && (
                <p className="text-[10px] text-rose-400 mt-1">
                  {errors.adminFullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="adminEmail"
                  className="block text-[10px] text-foreground-secondary mb-1"
                >
                  Correo Electrónico (Login) *
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  {...register("adminEmail")}
                  placeholder="gerencia@eltrebol.pe"
                  className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {errors.adminEmail && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {errors.adminEmail.message}
                  </p>
                )}
              </div>

              {/* Contraseña con Generador y Copiado */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="temporaryPassword"
                    className="block text-[10px] text-foreground-secondary"
                  >
                    Contraseña Temporal *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="flex items-center gap-1 text-[9px] text-brand hover:underline"
                      title="Generar nueva clave aleatoria"
                    >
                      <Dices className="h-3 w-3" />
                      <span>Generar</span>
                    </button>
                    <span className="text-border-subtle">•</span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="flex items-center gap-1 text-[9px] text-foreground-muted hover:text-foreground"
                      title="Copiar contraseña"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copied ? "Copiada" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="temporaryPassword"
                    type={showPassword ? "text" : "password"}
                    {...register("temporaryPassword")}
                    className="w-full rounded border border-border-strong bg-surface py-1.5 px-2.5 pr-8 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-foreground-muted hover:text-foreground"
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {errors.temporaryPassword && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {errors.temporaryPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SUSCRIPCIÓN BASE & ADD-ONS */}
          <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-subtle/50 p-3.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                <Zap className="h-3.5 w-3.5 text-brand" />
                3. SUSCRIPCIÓN BASE & ADD-ONS MODULARES
              </span>
              <span className="text-[9px] text-amber-400 font-bold uppercase">
                Billing Matrix
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-surface border border-border-subtle">
              <div>
                <div className="font-bold text-foreground text-[11px]">
                  Plan Base JYPOS
                </div>
                <div className="text-[9px] text-foreground-muted">
                  Incluye 1 Caja POS, 2 Usuarios, Catálogo y Ventas Locales.
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-400">
                  S/ 119.00
                </span>
                <span className="text-[9px] text-foreground-muted"> / mes</span>
              </div>
            </div>

            {/* Días de Gracia */}
            <div>
              <label className="block text-[10px] text-foreground-secondary mb-1">
                Período Inicial de Gracia (Días de Prueba)
              </label>
              <div className="flex gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setValue("gracePeriodDays", days)}
                    className={`flex-1 rounded py-1 text-[11px] font-bold border transition-all ${
                      graceDays === days
                        ? "border-brand bg-brand/20 text-brand"
                        : "border-border-strong bg-surface text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {days} días {days === 14 ? "(Default)" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div className="space-y-2 pt-1">
              <span className="block text-[10px] text-foreground-secondary uppercase tracking-wider font-semibold">
                Módulos Complementarios (Add-ons):
              </span>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("moduleSunat")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Facturación Electrónica SUNAT (PSE)
                    </span>
                    <span className="ml-1.5 rounded bg-amber-500/10 px-1 py-0.2 text-[8px] font-bold text-amber-400 border border-amber-500/20">
                      POPULAR
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Emisión Ilimitada Facturas, Boletas, CDR y Firma Digital
                      SHA-256.
                    </p>
                  </div>
                </div>
                <span className="font-black text-amber-400 text-[11px]">
                  + S/ 90.00
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("moduleCredits")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Cuentas por Cobrar & Fiados (Crédito B2B)
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Gestión de líneas de crédito, amortización FIFO y alertas
                      de mora.
                    </p>
                  </div>
                </div>
                <span className="font-black text-amber-400 text-[11px]">
                  + S/ 60.00
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("moduleMultiwarehouse")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Multi-Almacén & Guías de Remisión
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Control de múltiples depósitos, traslados internos y guías
                      GRE.
                    </p>
                  </div>
                </div>
                <span className="font-black text-amber-400 text-[11px]">
                  + S/ 80.00
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded border border-border-subtle bg-surface cursor-pointer hover:bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("allowNegativeStock")}
                    className="rounded border-border-strong text-brand focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-foreground text-[11px]">
                      Permitir Venta con Stock Negativo (Venta rápida)
                    </span>
                    <p className="text-[9px] text-foreground-muted">
                      Permite despachos en mostrador aún sin registrar la guía
                      de ingreso.
                    </p>
                  </div>
                </div>
                <span className="font-bold text-emerald-400 text-[10px]">
                  Gratis
                </span>
              </label>
            </div>

            {/* Sumatoria Recurrente */}
            <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground text-xs">
                  Tarifa Mensual Recurrente Acordada:
                </span>
                <p className="text-[9px] text-foreground-muted">
                  Plan Base (S/ 119) {modSunat ? "+ SUNAT (S/ 90) " : ""}
                  {modCredits ? "+ Fiados (S/ 60) " : ""}
                  {modMultiwarehouse ? "+ Multi-Stock (S/ 80)" : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-brand">
                  S/ {calculatedFee.toFixed(2)}
                </div>
                <span className="text-[8px] text-foreground-muted">
                  Facturación cada 30 días
                </span>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="rounded border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Footer Acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-strong">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-strong px-4 py-2 text-xs font-bold text-foreground-secondary hover:bg-surface-elevated"
            >
              Cancelar [ESC]
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-brand-fg shadow hover:bg-brand-hover disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Aprovisionando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Crear y Provisionar Tenant en 1-Clic</span>
                  <kbd className="rounded bg-black/20 px-1 text-[9px]">
                    ENTER
                  </kbd>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
