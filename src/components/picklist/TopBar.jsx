import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          "sticky top-0 z-20 flex items-center justify-between gap-4 w-full px-6 h-16 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-on-surface truncate">
            {title}
          </h2>
          {titleAdornment}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onSync}>
            <RefreshCw className="w-4 h-4" />
            Sync
          </Button>
          <Button variant="primary" size="sm" onClick={onSave}>
            Save
          </Button>
          {extras}
          <UserAvatar user={user} />
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between w-full px-6 h-14 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-4">
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <UserAvatar user={user} />
      </div>
    </header>
  );
}

function UserAvatar({ user }) {
  return (
    <AvatarPrimitive.Root className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-primary-container/20">
      {user?.avatarUrl && (
        <AvatarPrimitive.Image
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-primary-container text-on-primary text-[10px] font-bold uppercase tracking-wide">
        {user?.initials ?? "BR"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
