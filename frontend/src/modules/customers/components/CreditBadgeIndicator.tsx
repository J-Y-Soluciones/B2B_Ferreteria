import type { CustomerCreditProfile } from "../models/customer.types";
import { Badge } from "@/shared/components/ui/Badge";

interface CreditBadgeIndicatorProps {
  readonly customer: CustomerCreditProfile;
}

export function CreditBadgeIndicator({ customer }: CreditBadgeIndicatorProps) {
  const isExhausted = customer.availableCredit <= 0;

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <Badge intent={isExhausted ? "rose" : "emerald"}>
        Disponible: S/ {customer.availableCredit.toFixed(2)}
      </Badge>
      <span className="text-foreground-secondary">
        Deuda:{" "}
        <strong className="text-foreground">
          S/ {customer.currentDebt.toFixed(2)}
        </strong>{" "}
        / S/ {customer.creditLimit.toFixed(2)}
      </span>
      {customer.hasOverdueDebt && (
        <Badge intent="rose" indicatorPulse>
          MORA
        </Badge>
      )}
    </div>
  );
}
