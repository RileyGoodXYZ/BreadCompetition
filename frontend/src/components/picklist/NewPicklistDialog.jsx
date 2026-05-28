import { useEffect, useState } from "react";
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

export function NewPicklistDialog({ open, onOpenChange, onCreate }) {
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setEvent("");
    }
  }, [open]);

  const trimmedTitle = title.trim();
  const trimmedEvent = event.trim();
  const valid = trimmedTitle.length > 0 && trimmedEvent.length > 0;

  const submit = (e) => {
    e?.preventDefault?.();
    if (!valid) return;
    onCreate({ title: trimmedTitle, event: trimmedEvent });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Picklist</DialogTitle>
          <DialogDescription>
            Name the picklist and pick the event it belongs to.
          </DialogDescription>
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
            <input
              id="np-event"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. SVR Regional"
              className="w-full h-9 sm:h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
            />
          </Field>
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
