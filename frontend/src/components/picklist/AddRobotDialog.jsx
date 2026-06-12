import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Modal picker for choosing one (or many) teams from the scouted pool.
export function AddRobotDialog({
  open,
  onOpenChange,
  pool,
  alreadyInUse = [],
  multi = false,
  onPick,
  onPickMany,
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const inUse = useMemo(() => new Set(alreadyInUse), [alreadyInUse]);

  // Reset internal state every time the dialog re-opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(new Set());
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  const candidates = useMemo(() => {
    return pool
      .filter((t) =>
        !q
          ? true
          : t.team.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q)
      )
      .map((t) => ({ ...t, _alreadyAdded: inUse.has(t.team) }))
      .sort((a, b) => {
        if (a._alreadyAdded !== b._alreadyAdded) {
          return a._alreadyAdded ? 1 : -1;
        }
        return 0;
      });
  }, [pool, inUse, q]);

  const looksLikeTeamNumber = q.length > 0 && /^\d+$/.test(q);

  const toggle = (team) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });

  const confirmMulti = () => {
    const picked = candidates.filter(
      (t) => selected.has(t.team) && !t._alreadyAdded
    );
    if (picked.length === 0) return;
    onPickMany?.(picked);
    onOpenChange(false);
  };

  const pickSingle = (team) => {
    if (team._alreadyAdded) return;
    onPick?.(team);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {multi ? "Add Robots" : "Add Robot to Comparison"}
          </DialogTitle>
          <DialogDescription>
            {multi
              ? "Select one or more scouted teams to add to the board."
              : "Pick a scouted team to fill the open slot."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 pt-3 sm:px-6 sm:pt-4">
          <label className="relative block">
            <span className="sr-only">Search teams</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by team number or name…"
              className="w-full h-9 sm:h-10 pl-9 pr-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-warm px-2 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 min-h-0">
          {candidates.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-8 text-center">
              {q ? (
                <>
                  {looksLikeTeamNumber ? (
                    <>
                      Team{" "}
                      <span className="font-semibold text-on-surface">
                        {query.trim()}
                      </span>{" "}
                      doesn't exist in the scouting pool.
                    </>
                  ) : (
                    <>
                      No teams match{" "}
                      <span className="font-semibold text-on-surface">
                        "{query.trim()}"
                      </span>
                      .
                    </>
                  )}
                </>
              ) : (
                "No matching teams."
              )}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {candidates.map((t) =>
                multi ? (
                  <li key={t.team}>
                    <label
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-md border border-outline-variant/40 transition-colors",
                        t._alreadyAdded
                          ? "bg-surface-container-low/60 opacity-60 cursor-not-allowed"
                          : "cursor-pointer bg-surface-container-low hover:bg-primary-container/5 hover:border-primary-container/40"
                      )}
                    >
                      <Checkbox
                        checked={t._alreadyAdded || selected.has(t.team)}
                        disabled={t._alreadyAdded}
                        onCheckedChange={() =>
                          !t._alreadyAdded && toggle(t.team)
                        }
                      />
                      <TeamRowBody team={t} />
                      {t._alreadyAdded && <AddedBadge />}
                    </label>
                  </li>
                ) : (
                  <li key={t.team}>
                    <button
                      type="button"
                      onClick={() => pickSingle(t)}
                      disabled={t._alreadyAdded}
                      className={cn(
                        "w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-md text-left border border-outline-variant/40 transition-colors",
                        t._alreadyAdded
                          ? "bg-surface-container-low/60 opacity-60 cursor-not-allowed"
                          : "bg-surface-container-low hover:bg-primary-container/5 hover:border-primary-container/40"
                      )}
                    >
                      <TeamRowBody team={t} />
                      {t._alreadyAdded && <AddedBadge />}
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        {multi && (
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
              disabled={selected.size === 0}
              onClick={confirmMulti}
            >
              Add {selected.size > 0 ? `${selected.size} ` : ""}
              {selected.size === 1 ? "Robot" : "Robots"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddedBadge() {
  return (
    <span className="ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-container/15 text-primary-container">
      Added
    </span>
  );
}

function TeamRowBody({ team }) {
  return (
    <>
      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-md bg-surface-container-high border border-primary-container/10 flex items-center justify-center font-bold text-[11px] sm:text-xs text-primary-container">
        {team.team}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-semibold text-on-surface truncate">
          {team.name}
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono text-on-surface-variant truncate">
          Auto {team.metrics?.find((m) => m.label === "Auto")?.value} · Teleop{" "}
          {team.metrics?.find((m) => m.label === "Teleop")?.value}
        </div>
      </div>
    </>
  );
}
