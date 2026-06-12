import { useEffect, useMemo, useState } from "react";
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
import { listSubmissions } from "@/lib/api/submissions";
import { cn } from "@/lib/utils";

const OUR_TEAM = "5940";

function bucketByMatch(submissions) {
  const byMatch = new Map();
  for (const s of submissions) {
    if (s.match_number == null) continue;
    const m = byMatch.get(s.match_number) ?? { red: [], blue: [] };
    const alliance = String(s.data?.alliance ?? "").toLowerCase();
    const position = parseInt(s.data?.position ?? "0", 10) || 0;
    const entry = { team: String(s.team_number), position };
    if (alliance === "red") m.red.push(entry);
    else if (alliance === "blue") m.blue.push(entry);
    byMatch.set(s.match_number, m);
  }
  for (const m of byMatch.values()) {
    m.red.sort((a, b) => a.position - b.position);
    m.blue.sort((a, b) => a.position - b.position);
  }
  return byMatch;
}

export function NewStrategyDialog({ open, onOpenChange, onCreate }) {
  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [event, setEvent] = useState("");

  const [matchesByNumber, setMatchesByNumber] = useState(new Map());
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [matchNumber, setMatchNumber] = useState("");

  useEffect(() => {
    if (!open) return;
    setEvent("");
    setMatchNumber("");
    setMatchesByNumber(new Map());
    setMatchesLoaded(false);
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

  useEffect(() => {
    if (!event) {
      setMatchesByNumber(new Map());
      setMatchesLoaded(true);
      return;
    }
    let cancelled = false;
    setMatchesLoaded(false);
    setMatchNumber("");
    listSubmissions({ event, type: "match", limit: 1000 })
      .then((rows) => {
        if (cancelled) return;
        setMatchesByNumber(bucketByMatch(rows));
        setMatchesLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMatchesByNumber(new Map());
        setMatchesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [event]);

  const sortedMatchNumbers = useMemo(
    () => [...matchesByNumber.keys()].sort((a, b) => a - b),
    [matchesByNumber]
  );

  const selectedMatch = matchNumber ? matchesByNumber.get(Number(matchNumber)) : null;

  const valid =
    event.length > 0 && matchNumber.length > 0 && selectedMatch != null;

  const submit = (e) => {
    e?.preventDefault?.();
    if (!valid) return;
    const blueTeams = selectedMatch.blue.map((t) => t.team);
    const redTeams = selectedMatch.red.map((t) => t.team);
    const redIsOurs = redTeams.includes(OUR_TEAM);
    const ours = redIsOurs ? redTeams : blueTeams;
    const opponents = redIsOurs ? blueTeams : redTeams;
    onCreate({
      title: `Qual ${matchNumber}`,
      event,
      ourAlliance: ours,
      opponentAlliance: opponents,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Match Strategy</DialogTitle>
          <DialogDescription>
            Pick the event and the match. Teams come from the scouted lineup.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-warm px-3 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4"
        >
          <Field label="Event" htmlFor="ns-event">
            <select
              id="ns-event"
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

          <Field label="Match" htmlFor="ns-match">
            <select
              id="ns-match"
              value={matchNumber}
              onChange={(e) => setMatchNumber(e.target.value)}
              disabled={!event || !matchesLoaded || sortedMatchNumbers.length === 0}
              className="w-full h-9 sm:h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition disabled:opacity-60"
            >
              {!event ? (
                <option value="">Choose an event first</option>
              ) : !matchesLoaded ? (
                <option value="">Loading…</option>
              ) : sortedMatchNumbers.length === 0 ? (
                <option value="">-</option>
              ) : (
                <>
                  <option value="">Select match…</option>
                  {sortedMatchNumbers.map((n) => (
                    <option key={n} value={n}>
                      Qual {n}
                    </option>
                  ))}
                </>
              )}
            </select>
            {event && matchesLoaded && sortedMatchNumbers.length === 0 && (
              <p className="text-[11px] text-on-surface-variant italic">
                No match submissions for this event yet.
              </p>
            )}
          </Field>

          {selectedMatch && (
            <AlliancePreview
              blue={selectedMatch.blue.map((t) => t.team)}
              red={selectedMatch.red.map((t) => t.team)}
            />
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
            size="sm"
            disabled={!valid}
            onClick={submit}
          >
            Create Strategy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlliancePreview({ blue, red }) {
  return (
    <div className="space-y-2 rounded-md border border-outline-variant/40 bg-surface-container-low/40 p-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        Lineup
      </span>
      <AllianceRow color="blue" teams={blue} />
      <AllianceRow color="red" teams={red} />
    </div>
  );
}

function AllianceRow({ color, teams }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          color === "blue" ? "bg-blue-600" : "bg-red-600"
        )}
      />
      <span className="font-mono text-on-surface">
        {teams.length === 0
          ? "-"
          : teams.map((t, i) => (
              <span key={`${t}-${i}`}>
                {t}
                {i < teams.length - 1 && " · "}
              </span>
            ))}
      </span>
    </div>
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
