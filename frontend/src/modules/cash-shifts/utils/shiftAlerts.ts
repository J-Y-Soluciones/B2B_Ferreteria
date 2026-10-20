// src/modules/cash-shifts/utils/shiftAlerts.ts
import Swal from "sweetalert2";

export async function alertClosedCashShift(): Promise<boolean> {
  const result = await Swal.fire({
    title: "Caja Registradora Cerrada",
    html: `
      <div style="text-align: left; font-family: monospace; font-size: 11px; color: #94A3B8; margin-top: 6px;">
        <p style="margin-bottom: 8px;">
          No es posible registrar cobros ni emitir tickets porque esta terminal no cuenta con un <strong style="color: #F8FAFC;">turno de caja abierto</strong>.
        </p>
        <p style="color: #F59E0B; margin: 0;">
          ¿Deseas registrar el fondo fijo inicial y abrir la caja ahora?
        </p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Abrir Caja (F8)",
    confirmButtonColor: "#10B981",
    cancelButtonText: "Cancelar",
    cancelButtonColor: "#334155",
    background: "#0F172A",
    color: "#F8FAFC",
    customClass: {
      popup:
        "border border-amber-500/30 rounded-2xl font-mono text-xs shadow-2xl",
      title: "text-amber-400 font-bold tracking-wide text-sm",
      confirmButton: "font-mono font-bold text-xs px-4 py-2 rounded-lg",
      cancelButton: "font-mono font-bold text-xs px-4 py-2 rounded-lg",
    },
  });

  return result.isConfirmed;
}
