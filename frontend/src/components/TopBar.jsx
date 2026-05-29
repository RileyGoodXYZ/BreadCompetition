import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenuButton } from "./Sidebar";
import { cn } from "@/lib/utils";

// Top card
export function TopBar({
  variant = "library",
  title,
  titleAdornment,
  onSync,
  onSave,
  extras,
  user,
  className,
}) {
  if (variant === "manager") {
    return (
      <header
        className={cn(
          "sticky top-0 z-20 flex items-center justify-between gap-3 w-full px-3 sm:px-4 md:px-6 h-14 sm:h-16 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0",
          className
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <MobileMenuButton />
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-on-surface truncate">
            {title}
          </h2>
          {titleAdornment}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            className="hidden sm:inline-flex"
          >
            <RefreshCw className="w-4 h-4" />
            Sync
          </Button>
          <button
            type="button"
            onClick={onSync}
            aria-label="Sync"
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button variant="primary" size="sm" onClick={onSave}>
            Save
          </Button>
          {extras}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between w-full px-3 sm:px-4 md:px-6 h-14 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <MobileMenuButton />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
