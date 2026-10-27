"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MoneyInput({
  value,
  onValueChange,
  placeholder = "0",
  className,
  id,
  allowZero = true,
}: {
  value: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  allowZero?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        Rp
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        className={cn("pl-9 text-right font-semibold tabular-nums", className)}
        placeholder={placeholder}
        value={value ? new Intl.NumberFormat("id-ID").format(value) : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          const next = digits ? Number(digits) : 0;
          onValueChange(allowZero ? next : Math.max(0, next));
        }}
      />
    </div>
  );
}
