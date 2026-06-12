import { useEffect, useState } from "react";
import { User, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listEvents } from "@/lib/api/events";
import { cn } from "@/lib/utils";

export function NewPicklistDialog({ open, onOpenChange, onCreate }) {
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("");
  const [kind, setKind] = useState("my");
  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setEvent("");
    setKind("my");
    setEventsLoaded(false);
    let cancelled = false;
    listEvents({ limit: 500 })
      .then((rows) => {
        if (cancelled) return;
        setEvents(rows);
        setEventsLoaded(true);
        const newest = [...rows].sort((a, b) =>
          (b.updated_at ?? "").localeCompare(a.updated_at ?? "")
        )[0];
        if (newest) setEvent(newest.event_key);
      })
      .catch(() => {
        if (cancelled) return;
        setEvents([]);
        setEventsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const trimmedTitle = title.trim();
  const valid = trimmedTitle.length > 0 && event.length > 0;

  const submit = (e) => {
    e?.preventDefault?.();
    if (!valid) return;
    onCreate({ title: trimmedTitle, event, kind });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Picklist</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-warm px-3 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4"
        >
          <Field label="Name" htmlFor="np-name">
            <input
              id="np-name"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SVR Regional - Defensive Tier"
              className="w-full h-9 sm:h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
            />
          </Field>
          <Field label="Event" htmlFor="np-event">
            <select
              id="np-event"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              disabled={!eventsLoaded || events.length === 0}
              className="w-full h-9 sm:h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition disabled:opacity-60"
            >
              {!eventsLoaded ? (
                <option value="">Loading…</option>
              ) : events.length === 0 ? (
                <option value="">-</option>
              ) : (
                <>
                  <option value="">Select event…</option>
                  {events.map((ev) => (
                    <option key={ev.event_key} value={ev.event_key}>
                      {ev.name} ({ev.event_key})
                    </option>
                  ))}
                </>
              )}
            </select>
            {eventsLoaded && events.length === 0 && (
              <p className="text-[11px] text-on-surface-variant italic">
                No events in the database yet.
              </p>
            )}
          </Field>
          <div className="space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Visibility
            </span>
            <div className="grid grid-cols-2 gap-2">
              <KindButton
                active={kind === "my"}
                icon={User}
                title="Private"
                description="Only you"
                onClick={() => setKind("my")}
              />
              <KindButton
                active={kind === "shared"}
                icon={Users}
                title="Public"
                description="Everyone on the team"
                onClick={() => setKind("shared")}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="uppercase tracking-widest font-bold"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="primary"
            size="sm"
            disabled={!valid}
            onClick={submit}
          >
            Create Picklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function KindButton({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md border text-left transition-colors",
        active
          ? "border-primary-container bg-primary-container/10"
          : "border-outline-variant/60 bg-surface-container-low hover:border-primary-container/60"
      )}
      aria-pressed={active}
    >
      <Icon
        className={cn(
          "w-4 h-4 mt-0.5 shrink-0",
          active ? "text-primary-container" : "text-on-surface-variant"
        )}
      />
      <span className="flex flex-col min-w-0">
        <span
          className={cn(
            "text-xs sm:text-sm font-semibold",
            active ? "text-on-surface" : "text-on-surface-variant"
          )}
        >
          {title}
        </span>
        <span className="text-[10px] sm:text-[11px] text-on-surface-variant leading-tight">
          {description}
        </span>
      </span>
    </button>
  );
}
