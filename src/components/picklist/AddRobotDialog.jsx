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

/**
 * Modal picker for choosing one (or many) teams from the scouted pool.
 *
 *  pool          – all available teams (TEAM_POOL)
 *  alreadyInUse  – team numbers already on the board (excluded from results)
 *  multi         – false: single pick, auto-closes (default)
 *                  true:  checkbox list + Add-selected footer
 *  onPick(team)  – fired in single mode (one team)
 *  onPickMany(teams) – fired in multi mode (array of teams)
 */
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

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool
      .filter((t) => !inUse.has(t.team))
      .filter((t) =>
        !q
          ? true
          : t.team.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q)
      );
  }, [pool, inUse, query]);

  const toggle = (team) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });

  const confirmMulti = () => {
    const picked = candidates.filter((t) => selected.has(t.team));
    if (picked.length === 0) return;
    onPickMany?.(picked);
    onOpenChange(false);
  };

  const pickSingle = (team) => {
    onPick?.(team);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)]">
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

        <div className="px-6 pt-4">
          <label className="relative block">
            <span className="sr-only">Search teams</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by team number or name…"
              className="w-full h-10 pl-9 pr-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-warm px-4 pb-4 pt-3 min-h-0">
          {candidates.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-8 text-center">
              No matching teams.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {candidates.map((t) =>
                multi ? (
                  <li key={t.team}>
                    <label className="flex items-center gap-3 p-2.5 rounded-md cursor-pointer bg-surface-container-low hover:bg-primary-container/5 border border-outline-variant/40 hover:border-primary-container/40 transition-colors">
                      <Checkbox
                        checked={selected.has(t.team)}
                        onCheckedChange={() => toggle(t.team)}
                      />
                      <TeamRowBody team={t} />
                    </label>
                  </li>
                ) : (
                  <li key={t.team}>
                    <button
                      type="button"
                      onClick={() => pickSingle(t)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-md text-left bg-surface-container-low hover:bg-primary-container/5 border border-outline-variant/40 hover:border-primary-container/40 transition-colors"
                    >
                      <TeamRowBody team={t} />
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
              size="md"
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

function TeamRowBody({ team }) {
  return (
    <>
      <div className="w-10 h-10 shrink-0 rounded-md bg-surface-container-high border border-primary-container/10 flex items-center justify-center font-bold text-xs text-primary-container">
        {team.team}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-on-surface truncate">
          {team.name}
        </div>
        <div className="text-[11px] font-mono text-on-surface-variant truncate">
          Auto {team.metrics?.find((m) => m.label === "Auto")?.value} · Teleop{" "}
          {team.metrics?.find((m) => m.label === "Teleop")?.value}
        </div>
      </div>
    </>
  );
}
