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
import { cn } from "@/lib/utils";

const EMPTY_TEAMS = ["", "", "", "", "", ""];
const OUR_TEAM = "5940";

export function NewStrategyDialog({ open, onOpenChange, onCreate }) {
  const [match, setMatch] = useState("");
  const [event, setEvent] = useState("");
  const [teams, setTeams] = useState(EMPTY_TEAMS);

  useEffect(() => {
    if (open) {
      setMatch("");
      setEvent("");
      setTeams(EMPTY_TEAMS);
    }
  }, [open]);

  const setTeam = (idx, value) =>
    setTeams((prev) => {
      const next = prev.slice();
      next[idx] = value.replace(/[^0-9]/g, "");
      return next;
    });

  const blue = teams.slice(0, 3).map((t) => t.trim());
  const red = teams.slice(3, 6).map((t) => t.trim());

  const allFilled =
    match.trim().length > 0 &&
    event.trim().length > 0 &&
    teams.every((t) => t.trim().length > 0);

  const blueIsOurs = blue.includes(OUR_TEAM);
  const redIsOurs = red.includes(OUR_TEAM);
  // Tie/missing 5940 → default blue = ours so the table still renders.
  const ourIsBlue = blueIsOurs || !redIsOurs;

  const submit = (e) => {
    e.preventDefault();
    if (!allFilled) return;
    onCreate({
      title: match.trim(),
      event: event.trim(),
      ourAlliance: ourIsBlue ? blue : red,
      opponentAlliance: ourIsBlue ? red : blue,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Match Strategy</DialogTitle>
          <DialogDescription>
            Pick the match, the event, and the six teams on the field.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="px-4 sm:px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Match" htmlFor="ns-match">
              <input
                id="ns-match"
                autoFocus
                value={match}
                onChange={(e) => setMatch(e.target.value)}
                placeholder="Qualification 42"
                className="w-full h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
              />
            </Field>
            <Field label="Event" htmlFor="ns-event">
              <input
                id="ns-event"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="SVR Regional"
                className="w-full h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
              />
            </Field>
          </div>

          <AllianceFieldset
            title="Blue Alliance"
            color="blue"
            teams={blue}
            isOurs={blueIsOurs}
            onChange={(i, v) => setTeam(i, v)}
          />
          <AllianceFieldset
            title="Red Alliance"
            color="red"
            teams={red}
            isOurs={redIsOurs}
            onChange={(i, v) => setTeam(i + 3, v)}
          />

          {allFilled && !blueIsOurs && !redIsOurs && (
            <p className="text-[11px] text-on-surface-variant italic">
              Our team isn't on either alliance. Defaulting Blue to
              "Our Alliance".
            </p>
          )}
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
            size="md"
            disabled={!allFilled}
            onClick={submit}
          >
            Create Strategy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AllianceFieldset({ title, color, teams, isOurs, onChange }) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            color === "blue" ? "bg-blue-600" : "bg-red-600"
          )}
        />
        {title}
        {isOurs && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary-container text-on-primary text-[9px] tracking-wider">
            OURS
          </span>
        )}
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {teams.map((t, i) => (
          <input
            key={i}
            inputMode="numeric"
            value={t}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={`Team ${i + 1}`}
            className={cn(
              "w-full h-10 px-3 rounded-md bg-surface-container-low border text-sm font-mono text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition text-center",
              t === OUR_TEAM
                ? "border-primary-container ring-2 ring-primary-container/20"
                : "border-outline-variant/60"
            )}
          />
        ))}
      </div>
    </fieldset>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}
