import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical, Plus, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCell } from "@/lib/match-analytics";

const ABOVE = "above";
const BELOW = "below";

const COLOR_TIERS = [
  "bg-rose-500/15 text-rose-700",
  "bg-amber-500/10 text-amber-800",
  "",
  "bg-emerald-500/10 text-emerald-700",
  "bg-emerald-500/20 text-emerald-800",
];

function tierFor(value, min, max) {
  if (value == null || min === max) return 2;
  const t = (value - min) / (max - min);
  if (t >= 0.8) return 4;
  if (t >= 0.6) return 3;
  if (t >= 0.4) return 2;
  if (t >= 0.2) return 1;
  return 0;
}

const BASE_SORTABLE = {
  rank: { getter: (t) => t.rank },
  name: { getter: (t) => (t.name ?? "").toLowerCase() },
};


export function RankingsTable({
  teams,
  columns = [],
  onReorder,
  notes = {},
  onOpenNote,
  blackedOut = new Set(),
  onToggleBlackout,
  onAddToComparison,
  comparisonTeams = new Set(),
}) {
  const minWidth = 520 + columns.length * 80;

  // { col, dir: "asc" | "desc" } — single sort key (null when unsorted).
  const [sort, setSort] = useState(null);
  const isSorted = sort != null;

  // Cache min/max per metric column to drive the heat-map cell tinting.
  const metricStats = useMemo(() => {
    const stats = {};
    for (const c of columns) {
      const vals = teams
        .map((t) => (typeof t[c.id] === "number" ? t[c.id] : null))
        .filter((v) => v != null);
      stats[c.id] = vals.length
        ? { min: Math.min(...vals), max: Math.max(...vals) }
        : { min: 0, max: 0 };
    }
    return stats;
  }, [teams, columns]);

  const orderedTeams = useMemo(() => {
    if (!sort) return teams;
    const { col, dir } = sort;
    const getter = BASE_SORTABLE[col]
      ? BASE_SORTABLE[col].getter
      : (t) => (typeof t[col] === "number" ? t[col] : null);
    const indexed = teams.map((t, i) => ({ t, i }));
    indexed.sort((a, b) => {
      const av = getter(a.t);
      const bv = getter(b.t);
      if (av == null && bv == null) return a.i - b.i;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return a.i - b.i;
    });
    return indexed.map((x) => x.t);
  }, [teams, sort]);

  const cycleSort = (col) => {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  };

  const sortInfo = (col) => {
    if (!sort || sort.col !== col) return null;
    return { dir: sort.dir };
  };

  // Drag-and-drop — disabled while sorted.
  const [dragIdx, setDragIdx] = useState(null);
  const [hover, setHover] = useState(null);
  const draggable = typeof onReorder === "function" && !isSorted;

  const onDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const onDragOver = (idx) => (e) => {
    if (dragIdx == null || idx === dragIdx) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? ABOVE : BELOW;
    if (hover?.idx !== idx || hover?.position !== position) {
      setHover({ idx, position });
    }
  };
  const onDragLeaveRow = (idx) => () => {
    if (hover?.idx === idx) setHover(null);
  };
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    if (dragIdx != null && dragIdx !== idx) {
      const position = hover?.position ?? BELOW;
      let target = idx + (position === BELOW ? 1 : 0);
      if (dragIdx < target) target -= 1;
      if (target !== dragIdx) onReorder(dragIdx, target);
    }
    setDragIdx(null);
    setHover(null);
  };
  const onDragEnd = () => {
    setDragIdx(null);
    setHover(null);
  };

  if (teams.length === 0) {
    return (
      <div className="border border-primary-container/10 rounded-md bg-surface-container-lowest shadow-warm-sm py-10 text-center text-sm text-on-surface-variant">
        -
      </div>
    );
  }
  
  return (
    <div className="border border-primary-container/10 rounded-md overflow-hidden bg-surface-container-lowest shadow-warm-sm">
      <div className="overflow-auto scrollbar-warm max-h-[calc(100vh-16rem)]">
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead className="bg-surface-container border-b border-outline-variant/30 sticky top-0 z-10">
            <tr>
              <Th className="w-6 px-1" />
              <SortableTh
                className="w-10 px-1.5"
                onSort={() => cycleSort("rank")}
                info={sortInfo("rank")}
              >
                #
              </SortableTh>
              <SortableTh
                onSort={() => cycleSort("name")}
                info={sortInfo("name")}
              >
                Robot
              </SortableTh>
              <Th className="px-1 w-20 text-center">Actions</Th>
              {columns.map((c) => (
                <SortableDataTh
                  key={c.id}
                  onSort={() => cycleSort(c.id)}
                  info={sortInfo(c.id)}
                >
                  {c.label}
                </SortableDataTh>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {orderedTeams.map((t, i) => {
              const isDragging = dragIdx === i;
              const isHoverAbove =
                hover?.idx === i && hover.position === ABOVE && dragIdx !== i;
              const isHoverBelow =
                hover?.idx === i && hover.position === BELOW && dragIdx !== i;
              const note = notes[t.number] ?? "";
              const isBlackedOut = blackedOut.has?.(t.number) ?? false;
              return (
                <tr
                  key={t.number}
                  draggable={draggable}
                  onDragStart={draggable ? onDragStart(i) : undefined}
                  onDragOver={draggable ? onDragOver(i) : undefined}
                  onDragLeave={draggable ? onDragLeaveRow(i) : undefined}
                  onDrop={draggable ? onDrop(i) : undefined}
                  onDragEnd={draggable ? onDragEnd : undefined}
                  onContextMenu={
                    onToggleBlackout
                      ? (e) => {
                          e.preventDefault();
                          onToggleBlackout(t.number);
                        }
                      : undefined
                  }
                  title={
                    onToggleBlackout
                      ? isBlackedOut
                        ? "Right-click to un-black out"
                        : "Right-click to black out"
                      : undefined
                  }
                  className={cn(
                    "group transition-colors hover:bg-primary-container/3",
                    isDragging && "opacity-40",
                    isBlackedOut && "opacity-50",
                    isHoverAbove &&
                      "shadow-[inset_0_2px_0_0_var(--color-primary-container)]",
                    isHoverBelow &&
                      "shadow-[inset_0_-2px_0_0_var(--color-primary-container)]"
                  )}
                >
                  <Td className="text-center px-1">
                    <span
                      className={cn(
                        "inline-flex transition-colors",
                        draggable
                          ? "text-outline group-hover:text-primary-container cursor-grab active:cursor-grabbing"
                          : "text-outline-variant/40"
                      )}
                      title={
                        isSorted
                          ? "Reset sort to drag rows"
                          : draggable
                          ? `Drag to reorder ${t.number}`
                          : undefined
                      }
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  </Td>
                  <Td
                    className={cn(
                      "font-mono text-sm text-on-surface px-1.5",
                      isBlackedOut && "line-through"
                    )}
                  >
                    {String(t.rank).padStart(2, "0")}
                  </Td>
                  <Td>
                    <Link
                      to={`/robot-data?team=${t.number}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      draggable={false}
                      className="flex items-center gap-2 group/link"
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-md bg-surface-container-high border border-primary-container/10 flex items-center justify-center font-bold text-[11px] text-primary-container shrink-0",
                          isBlackedOut && "line-through"
                        )}
                      >
                        {t.number}
                      </div>
                      <span
                        className={cn(
                          "font-semibold text-sm text-on-surface whitespace-nowrap group-hover/link:underline underline-offset-4 decoration-2 decoration-primary-container/40",
                          isBlackedOut && "line-through"
                        )}
                      >
                        {t.name}
                      </span>
                    </Link>
                  </Td>
                  <Td className="px-1 text-center">
                    <div className="inline-flex items-center gap-1">
                      <NoteCell
                        hasNote={Boolean(note)}
                        onOpen={() => onOpenNote?.(t)}
                      />
                      {onAddToComparison && (
                        <AddCell
                          alreadyAdded={comparisonTeams.has?.(t.number) ?? false}
                          onAdd={() => onAddToComparison(t.number)}
                        />
                      )}
                    </div>
                  </Td>
                  {columns.map((c) => (
                    <DataTd key={c.id}>
                      <MetricCell
                        value={t[c.id]}
                        stats={metricStats[c.id]}
                        blackedOut={isBlackedOut}
                      />
                    </DataTd>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCell({ value, stats, blackedOut }) {
  const num = typeof value === "number" ? value : null;
  const tier = stats == null ? 2 : tierFor(num, stats.min, stats.max);
  const colorClass = !blackedOut && num != null ? COLOR_TIERS[tier] : "";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-10 px-1.5 py-0.5 rounded font-mono text-sm",
        colorClass || "text-on-surface-variant",
        blackedOut && "line-through opacity-60"
      )}
    >
      {formatCell(value)}
    </span>
  );
}

function AddCell({ alreadyAdded, onAdd }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={alreadyAdded}
      aria-label={alreadyAdded ? "Already in comparison" : "Add to comparison"}
      title={alreadyAdded ? "Already in comparison" : "Add to Robot Comparison"}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors",
        alreadyAdded
          ? "text-on-surface-variant/40 cursor-not-allowed"
          : "text-on-surface-variant/70 hover:text-primary-container hover:bg-primary-container/10"
      )}
    >
      <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
    </button>
  );
}

function NoteCell({ hasNote, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={hasNote ? "View note" : "Add note"}
      title={hasNote ? "View note" : "Add note"}
      className={cn(
        "relative inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors",
        hasNote
          ? "text-primary-container bg-primary-container/10 hover:bg-primary-container/20"
          : "text-on-surface-variant/60 hover:text-primary-container hover:bg-primary-container/5"
      )}
    >
      <StickyNote className="w-3.5 h-3.5" />
      {hasNote && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-container" />
      )}
    </button>
  );
}

function SortIndicator({ info }) {
  if (!info) {
    return (
      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/sort:opacity-60 transition-opacity" />
    );
  }
  const Icon = info.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center text-primary-container">
      <Icon className="w-3 h-3" />
    </span>
  );
}

function Th({ className = "", children }) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

function SortableTh({ className = "", onSort, info, children }) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap transition-colors",
        info &&
          "bg-primary-container/15 text-primary-container shadow-[inset_0_-2px_0_0_var(--color-primary-container)]",
        className
      )}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "group/sort inline-flex items-center gap-1 hover:text-primary-container transition-colors",
          info && "text-primary-container"
        )}
      >
        <span>{children}</span>
        <SortIndicator info={info} />
      </button>
    </th>
  );
}

function SortableDataTh({ className = "", onSort, info, children }) {
  return (
    <th
      className={cn(
        "px-2 py-2.5 text-center text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap transition-colors",
        info &&
          "bg-primary-container/15 text-primary-container shadow-[inset_0_-2px_0_0_var(--color-primary-container)]",
        className
      )}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "group/sort inline-flex items-center gap-0.5 hover:text-primary-container transition-colors",
          info && "text-primary-container"
        )}
      >
        <span>{children}</span>
        <SortIndicator info={info} />
      </button>
    </th>
  );
}

function Td({ className = "", children }) {
  return (
    <td className={cn("px-3 py-2 whitespace-nowrap", className)}>{children}</td>
  );
}

function DataTd({ className = "", children }) {
  return (
    <td
      className={cn(
        "px-1 py-2 whitespace-nowrap text-center",
        className
      )}
    >
      {children}
    </td>
  );
}
