import { useQuery } from "@tanstack/react-query";
import { customerRepository } from "../repositories/HttpCustomerRepository";
import type { CustomerCreditProfile } from "../models/customer.types";

export function useCustomerSearch(query: string) {
  return useQuery<CustomerCreditProfile[], Error>({
    queryKey: ["customers", "search", query.trim()],
    queryFn: async () => {
      return customerRepository.searchCustomers(query.trim());
    },
    staleTime: 1000 * 20, // 20 segundos
  });
}
