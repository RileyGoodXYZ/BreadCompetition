import { useEffect, useRef, useState } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { RefreshCw, Search, X } from "lucide-react";
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
  saveLabel = "Save",
  saveDisabled = false,
  extras,
  user,
  search,
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
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saveLabel}
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
        {search ? <TopBarSearch {...search} /> : null}
      </div>
    </header>
  );
}

function TopBarSearch({ value, onChange, placeholder = "Search…" }) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const isActive = expanded || (value ?? "").length > 0;

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  if (!isActive) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Search"
        className="h-9 w-9 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center w-56 sm:w-72">
      <Search className="absolute left-3 w-4 h-4 text-on-surface-variant pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => {
          if (!(value ?? "")) setExpanded(false);
        }}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-9 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
      />
      {(value ?? "").length > 0 && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange?.("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:text-primary-container hover:bg-primary-container/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
