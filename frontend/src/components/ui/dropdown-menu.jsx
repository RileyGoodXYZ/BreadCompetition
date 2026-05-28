import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = React.forwardRef(function DropdownMenuContent(
  { className, sideOffset = 6, ...props },
  ref
) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "picklist-app z-50 min-w-44 overflow-hidden rounded-md p-1.5",
          "bg-surface-container-lowest border border-outline-variant/60 shadow-warm-lg",
          "font-sans text-on-surface",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
});

const DropdownMenuItem = React.forwardRef(function DropdownMenuItem(
  { className, destructive = false, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm cursor-pointer outline-none select-none",
        "transition-colors",
        destructive
          ? "text-error data-[highlighted]:bg-error/10 data-[highlighted]:text-error"
          : "text-on-surface data-[highlighted]:bg-primary-container/10 data-[highlighted]:text-primary-container",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className
      )}
      {...props}
    />
  );
});

const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator(
  { className, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("my-1 h-px bg-outline-variant/50", className)}
      {...props}
    />
  );
});

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
