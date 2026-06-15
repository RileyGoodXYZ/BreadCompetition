import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(function Checkbox(
  { className, ...props },
  ref
) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer relative h-5 w-5 shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40 focus-visible:ring-offset-1",
        "data-[state=checked]:bg-primary-container data-[state=checked]:border-primary-container",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="pointer-events-none absolute inset-0 flex items-center justify-center text-secondary-container">
        <Check className="h-3/4 w-3/4" strokeWidth={3} color="currentColor" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export { Checkbox };
