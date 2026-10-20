import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/httpClient";

export interface CashRegister {
  id: string;
  name: string;
  isActive: boolean;
}

interface CashRegisterBackendDTO {
  id: string;
  name: string;
  is_active: boolean;
}

export function useCashRegisters() {
  const tenantId = localStorage.getItem("jypos_tenant_id");

  return useQuery({
    queryKey: ["cash-registers", tenantId],
    queryFn: async () => {
      const response =
        await httpClient.get<CashRegisterBackendDTO[]>("/cash-registers");
      return (response.data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        isActive: item.is_active,
      }));
    },
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60 * 10,
  });
}
