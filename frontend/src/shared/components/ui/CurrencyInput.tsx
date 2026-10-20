//src/shared/components/ui/CurrencyInput.tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  readonly label?: string;
  readonly value: number | string;
  readonly onChange?: (val: string) => void;
  readonly currencyPrefix?: string;
  readonly error?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      value,
      onChange,
      currencyPrefix = "S/",
      error,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs font-semibold tracking-wide text-foreground-secondary uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-foreground-muted font-mono font-bold select-none text-base">
            {currencyPrefix}
          </span>
          <input
            ref={ref}
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "w-full bg-surface-elevated text-foreground font-mono text-xl font-bold pl-10 pr-3 py-2 rounded-lg border border-border-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-inner",
              error && "border-rose-500 focus:ring-rose-500",
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-rose-500 font-mono mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
