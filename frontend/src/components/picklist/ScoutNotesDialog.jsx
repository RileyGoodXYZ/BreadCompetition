import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCell } from "@/lib/match-analytics";
import { cn } from "@/lib/utils";

// Subjective / pit / break scout notes for one team.
const KINDS = [
  { id: "all", label: "All" },
  { id: "subjective", label: "Subjective" },
  { id: "pit", label: "Pit Scout" },
  { id: "break", label: "Break" },
];

export function ScoutNotesDialog({
  open,
  onOpenChange,
  robot,
  notes = { subjective: [], pit: [], break: [] },
  loading = false,
}) {
  const [filter, setFilter] = useState("all");
  // { col, dir } — click a header to cycle asc → desc → null. Defaults to match number asc so the table reads in match order.
  const [sort, setSort] = useState({ col: "match_number", dir: "asc" });

  const rows = useMemo(() => {
    const tag = (arr, kind) => (arr ?? []).map((r) => ({ ...r, _kind: kind }));
    const all = [
      ...tag(notes.subjective, "subjective"),
      ...tag(notes.pit, "pit"),
      ...tag(notes.break, "break"),
    ];
    const filtered = filter === "all" ? all : all.filter((r) => r._kind === filter);
    if (!sort) return filtered;
    const { col, dir } = sort;
    const noteText = (r) => {
      const d = r.data ?? {};
      return (
        d.note ?? d.notes ?? d.comment ?? d.comments ?? d.description ?? ""
      );
    };
    const getter =
      col === "_kind"
        ? (r) => r._kind ?? ""
        : col === "match_number"
        ? (r) => r.match_number ?? null
        : col === "scout_name"
        ? (r) => (r.scout_name ?? "").toLowerCase()
        : col === "note"
        ? (r) => String(noteText(r)).toLowerCase()
        : (r) => r[col];
    return [...filtered].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      const aMissing = av == null || av === "";
      const bMissing = bv == null || bv === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [notes, filter, sort]);

  const cycleSort = (col) => {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  };

  const sortDir = (col) => (sort?.col === col ? sort.dir : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {robot ? (
              <>
                <Link
                  to={`/robot-data?team=${robot.team}`}
                  className="hover:underline underline-offset-4 decoration-2 decoration-primary-container/40"
                >
                  {robot.team} {robot.name}
                </Link>
                : Scout Notes
              </>
            ) : (
              "Scout Notes"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2 sm:px-3 pt-2 flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <FilterPill
              key={k.id}
              active={filter === k.id}
              onClick={() => setFilter(k.id)}
            >
              {k.label}
            </FilterPill>
          ))}
        </div>

        <div className="flex-1 overflow-auto scrollbar-warm px-2 pb-2 pt-3 min-h-0">
          {loading ? (
            <p className="text-sm text-on-surface-variant py-10 text-center">
              Loading scout notes…
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-10 text-center">
              -
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-warm">
              <table className="w-full border-collapse text-left min-w-160">
                <thead className="bg-surface-container border-b border-outline-variant/30">
                  <tr>
                    <SortTh dir={sortDir("_kind")} onClick={() => cycleSort("_kind")}>
                      Type
                    </SortTh>
                    <SortTh
                      dir={sortDir("match_number")}
                      onClick={() => cycleSort("match_number")}
                    >
                      Match
                    </SortTh>
                    <SortTh
                      dir={sortDir("scout_name")}
                      onClick={() => cycleSort("scout_name")}
                    >
                      Scout
                    </SortTh>
                    <SortTh
                      dir={sortDir("note")}
                      onClick={() => cycleSort("note")}
                      className="min-w-50"
                    >
                      Note
                    </SortTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {rows.map((r) => (
                    <NoteRow
                      key={r.id ?? `${r._kind}-${r.match_number}-${r.scout_name}`}
                      row={r}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KindBadge({ kind }) {
  const label = kind === "pit" ? "Pit" : kind === "break" ? "Break" : "Subj";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
        kind === "subjective" && "bg-secondary-container text-on-secondary-container",
        kind === "pit" && "bg-amber-500/15 text-amber-800",
        kind === "break" && "bg-rose-500/15 text-rose-700"
      )}
    >
      {label}
    </span>
  );
}

function NoteRow({ row }) {
  const d = row.data ?? {};
  const note =
    d.note ??
    d.notes ??
    d.comment ??
    d.comments ??
    d.description ??
    (Object.keys(d).length ? JSON.stringify(d) : null);

  return (
    <tr className="transition-colors hover:bg-primary-container/3">
      <Td>
        <KindBadge kind={row._kind} />
      </Td>
      <Td className="font-mono font-semibold text-on-surface">
        {formatCell(row.match_number)}
      </Td>
      <Td className="text-on-surface-variant">{formatCell(row.scout_name)}</Td>
      <Td className="text-on-surface leading-snug">{formatCell(note)}</Td>
    </tr>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
        active
          ? "bg-primary-container text-on-primary border-primary-container"
          : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:border-primary-container/60"
      )}
    >
      {children}
    </button>
  );
}

function Th({ className = "", children }) {
  return (
    <th
      className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

function SortTh({ dir, onClick, className = "", children }) {
  return (
    <th
      className={cn(
        "px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider text-left transition-colors",
        dir &&
          "bg-primary-container/15 text-primary-container shadow-[inset_0_-2px_0_0_var(--color-primary-container)]",
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group/sort inline-flex items-center gap-1 hover:text-primary-container transition-colors",
          dir && "text-primary-container"
        )}
      >
        <span>{children}</span>
        {dir === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : dir === "desc" ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/sort:opacity-60 transition-opacity" />
        )}
      </button>
    </th>
  );
}

function Td({ className = "", children }) {
  return <td className={`px-2 py-1.5 sm:px-3 sm:py-2 align-top text-xs sm:text-sm ${className}`}>{children}</td>;
}
