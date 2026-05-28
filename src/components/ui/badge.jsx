import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        synced: "bg-blue-600 text-white px-2 py-1 rounded-sm",
        drafting: "bg-[#c46a1c] text-white px-2 py-1 rounded-sm",
        event:
          "bg-secondary-container text-on-secondary-container px-2 py-1 rounded-sm",
        stable:
          "bg-primary-container/85 text-on-primary px-3 py-1 rounded-full",
        reeval:
          "border border-error text-error px-3 py-1 rounded-full",
        soft:
          "bg-surface-container border border-outline-variant/40 text-on-surface-variant px-2.5 py-1 rounded-sm",
        live:
          "bg-surface-container border border-outline-variant/40 text-on-surface-variant px-3 py-1.5 rounded-full",
      },
    },
    defaultVariants: { variant: "soft" },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
