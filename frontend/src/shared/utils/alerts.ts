// src/shared/utils/alerts.ts
import Swal from "sweetalert2";

export const alertService = {
  confirm: async ({
    title,
    text,
    confirmButtonText = "Confirmar",
    confirmButtonColor = "#f59e0b",
    icon = "warning",
  }: {
    title: string;
    text: string;
    confirmButtonText?: string;
    confirmButtonColor?: string;
    icon?: "warning" | "error" | "success" | "info" | "question";
  }) => {
    return await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor,
      cancelButtonColor: "#334155",
      confirmButtonText,
      cancelButtonText: "Cancelar",
      background: "#0F172A",
      color: "#F8FAFC",
      customClass: {
        popup:
          "border border-slate-800 rounded-2xl font-mono text-xs shadow-2xl",
        title: "text-sm font-bold text-white tracking-wide",
        confirmButton: "font-mono font-bold text-xs px-4 py-2 rounded-lg",
        cancelButton: "font-mono font-bold text-xs px-4 py-2 rounded-lg",
      },
    });
  },

  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: "success",
      title,
      text,
      background: "#0F172A",
      color: "#F8FAFC",
      confirmButtonColor: "#10B981",
      customClass: {
        popup:
          "border border-slate-800 rounded-2xl font-mono text-xs shadow-2xl",
        title: "text-sm font-bold text-emerald-400",
      },
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: "error",
      title,
      text,
      background: "#0F172A",
      color: "#F8FAFC",
      confirmButtonColor: "#EF4444",
      customClass: {
        popup:
          "border border-slate-800 rounded-2xl font-mono text-xs shadow-2xl",
        title: "text-sm font-bold text-rose-400",
      },
    });
  },
};
