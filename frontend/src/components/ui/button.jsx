import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-on-primary shadow-warm-md hover:shadow-warm-lg",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:brightness-95",
        outline:
          "border-2 border-primary-container text-primary-container bg-transparent hover:bg-primary-container/5",
        ghost:
          "text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5",
        link: "text-primary-container underline-offset-4 hover:underline",
        destructive:
          "bg-error text-on-error hover:brightness-95 shadow-warm-md",
      },
      size: {
        sm: "h-9 px-4 text-[13px] rounded-full",
        md: "h-11 px-6 text-sm rounded-full",
        lg: "h-12 px-8 text-sm rounded-full tracking-wide",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { Button, buttonVariants };
