// src/modules/team/pages/TeamManagementPage.tsx
import { useState } from "react";
import { Users, KeyRound } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { useTenantUsers } from "../hooks/useTenantUsers";
import { ResetUserPasswordModal } from "../components/ResetUserPasswordModal";
import type { TenantUser } from "../models/team.types";

export function TeamManagementPage() {
  const { users, isLoading, resetPassword, isResetting } = useTenantUsers();
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReset = (user: TenantUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleConfirmReset = async (temporaryPassword?: string) => {
    if (!selectedUser) return undefined;
    const res = await resetPassword({
      userId: selectedUser.id,
      temporaryPassword,
    });
    return res.temporaryPassword;
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-canvas p-4 font-mono text-foreground select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-strong mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">
              Personal de Tienda & Permisos
            </h1>
            <p className="text-[11px] text-foreground-muted">
              Control de cajeros, despachadores y reseteo de claves
              provisionales
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-xl border border-border-strong bg-surface overflow-hidden shadow-elevation">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-surface-subtle border-b border-border-subtle text-[10px] uppercase text-foreground-secondary tracking-wider">
            <tr>
              <th className="px-4 py-2.5">Operador / Nombre</th>
              <th className="px-4 py-2.5">Correo de Acceso</th>
              <th className="px-4 py-2.5">Rol en Tienda</th>
              <th className="px-4 py-2.5 text-center">Estado Clave</th>
              <th className="px-4 py-2.5 text-right">Acción Mostrador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-foreground-muted"
                >
                  Cargando operadores del comercio...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-foreground-muted"
                >
                  No hay operadores registrados en este comercio.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="h-12 hover:bg-surface-elevated/50 transition-colors"
                >
                  <td className="px-4 py-2 font-bold text-foreground">
                    {u.fullName}
                  </td>
                  <td className="px-4 py-2 text-foreground-secondary">
                    {u.email}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      intent={
                        u.role === "TENANT_ADMIN"
                          ? "amber"
                          : u.role === "CASHIER"
                            ? "emerald"
                            : "neutral"
                      }
                    >
                      {u.role === "TENANT_ADMIN"
                        ? "Administrador"
                        : u.role === "CASHIER"
                          ? "Cajero / Mostrador"
                          : "Almacén / Bahía"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {u.mustChangePassword ? (
                      <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Pendiente Cambio Clave
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Clave Activa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.role !== "SUPERADMIN" && (
                      <button
                        type="button"
                        onClick={() => handleOpenReset(u)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border-strong bg-surface-elevated hover:bg-surface text-foreground font-bold hover:text-brand text-[11px] transition-colors shadow-xs"
                      >
                        <KeyRound className="h-3 w-3 text-amber-500" />
                        <span>Blanquear Clave</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ResetUserPasswordModal
        user={selectedUser}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmReset}
        isSubmitting={isResetting}
      />
    </div>
  );
}
