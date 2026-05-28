import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(function DialogOverlay(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  );
});

const DialogContent = React.forwardRef(function DialogContent(
  { className, children, hideClose = false, ...props },
  ref
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "picklist-app fixed z-50 left-1/2 -translate-x-1/2",
          // Phone: top-anchored sheet — always reachable above the on-screen
          // keyboard. Tablet+: classic centered modal.
          "top-2 sm:top-1/2 sm:-translate-y-1/2",
          "w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-md",
          "max-h-[calc(var(--app-vh,100dvh)-1rem)] sm:max-h-[85vh]",
          "bg-surface-container-lowest border border-outline-variant/60 rounded-lg sm:rounded-xl shadow-warm-lg",
          "font-sans text-left text-on-surface",
          "flex flex-col overflow-hidden",
          "transition-[max-height] duration-150 ease-out",
          className
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-3 top-3 sm:right-4 sm:top-4 p-1.5 sm:p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "px-3 py-2.5 sm:px-6 sm:py-4 flex flex-col gap-0.5 sm:gap-1 border-b border-outline-variant/60",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "px-3 py-2 sm:px-5 sm:py-4 bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-end gap-2 sm:gap-3",
        className
      )}
      {...props}
    />
  );
}

const DialogTitle = React.forwardRef(function DialogTitle(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-sm sm:text-xl font-semibold tracking-tight text-on-surface",
        className
      )}
      {...props}
    />
  );
});

const DialogDescription = React.forwardRef(function DialogDescription(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-[11px] sm:text-sm text-on-surface-variant leading-snug",
        className
      )}
      {...props}
    />
  );
});

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
