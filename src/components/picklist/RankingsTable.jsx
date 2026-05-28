import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT = {
  stable: "stable",
  "re-eval": "reeval",
};

const ABOVE = "above";
const BELOW = "below";

const METRIC_COLUMNS = {
  auto: {
    header: "Auto Avg",
    cell: (t) => <Mono>{t.auto}</Mono>,
  },
  teleop: {
    header: "Teleop Avg",
    cell: (t) => <Mono>{t.teleop}</Mono>,
  },
  climb: {
    header: "Climb %",
    cell: (t) => <Mono>{t.climb}</Mono>,
  },
  speaker: {
    header: "Speaker",
    cell: (t) => <Mono>{t.speaker}</Mono>,
  },
  amp: {
    header: "Amp",
    cell: (t) => <Mono>{t.amp}</Mono>,
  },
  defense: {
    header: "Defense",
    cell: (t) => <Badge variant="soft">{t.defense}</Badge>,
  },
  consistency: {
    header: "Consistency",
    cell: (t) => <Mono>{t.consistency}</Mono>,
  },
};

// Rankings table
export function RankingsTable({ teams, columns = [], onReorder }) {
  const activeMetricCols = columns
    .filter((c) => c.checked && METRIC_COLUMNS[c.id])
    .map((c) => c.id);

  const minWidth = 600 + activeMetricCols.length * 110;

  const [dragIdx, setDragIdx] = useState(null);
  const [hover, setHover] = useState(null); 

  const draggable = typeof onReorder === "function";

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

  return (
    <div className="border border-primary-container/10 rounded-md overflow-hidden bg-surface-container-lowest shadow-warm-sm">
      <div className="overflow-x-auto scrollbar-warm">
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead className="bg-surface-container border-b border-outline-variant/30">
            <tr>
              <Th className="w-10" />
              <Th>#</Th>
              <Th>Robot</Th>
              {activeMetricCols.map((id) => (
                <Th key={id}>{METRIC_COLUMNS[id].header}</Th>
              ))}
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {teams.map((t, i) => {
              const isDragging = dragIdx === i;
              const isHoverAbove = hover?.idx === i && hover.position === ABOVE && dragIdx !== i;
              const isHoverBelow = hover?.idx === i && hover.position === BELOW && dragIdx !== i;
              return (
                <tr
                  key={t.number}
                  draggable={draggable}
                  onDragStart={draggable ? onDragStart(i) : undefined}
                  onDragOver={draggable ? onDragOver(i) : undefined}
                  onDragLeave={draggable ? onDragLeaveRow(i) : undefined}
                  onDrop={draggable ? onDrop(i) : undefined}
                  onDragEnd={draggable ? onDragEnd : undefined}
                  className={cn(
                    "group transition-colors hover:bg-primary-container/3",
                    isDragging && "opacity-40",
                    isHoverAbove &&
                      "shadow-[inset_0_2px_0_0_var(--color-primary-container)]",
                    isHoverBelow &&
                      "shadow-[inset_0_-2px_0_0_var(--color-primary-container)]"
                  )}
                >
                  <Td className="text-center">
                    <span
                      className={cn(
                        "inline-flex text-outline group-hover:text-primary-container transition-colors",
                        draggable ? "cursor-grab active:cursor-grabbing" : ""
                      )}
                      aria-label={
                        draggable ? `Drag to reorder ${t.number}` : undefined
                      }
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  </Td>
                  <Td className="font-mono text-sm text-on-surface">
                    {String(t.rank).padStart(2, "0")}
                  </Td>
                  <Td>
                    <Link
                      to={`/robot-data?team=${t.number}`}
                      // Stop a click on the link from being interpreted
                      // as the start of a row drag.
                      onMouseDown={(e) => e.stopPropagation()}
                      draggable={false}
                      className="flex items-center gap-2.5 group/link"
                    >
                      <div className="w-7 h-7 rounded-md bg-surface-container-high border border-primary-container/10 flex items-center justify-center font-bold text-[11px] text-primary-container">
                        {t.number}
                      </div>
                      <span className="font-semibold text-sm text-on-surface whitespace-nowrap group-hover/link:underline underline-offset-4 decoration-2 decoration-primary-container/40">
                        {t.name}
                      </span>
                    </Link>
                  </Td>
                  {activeMetricCols.map((id) => (
                    <Td key={id}>{METRIC_COLUMNS[id].cell(t)}</Td>
                  ))}
                  <Td>
                    <Badge
                      variant={
                        STATUS_VARIANT[t.status?.toLowerCase()] ?? "soft"
                      }
                    >
                      {t.status}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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

function Td({ className = "", children }) {
  return (
    <td className={cn("px-3 py-2 whitespace-nowrap", className)}>{children}</td>
  );
}

function Mono({ children }) {
  return (
    <span className="font-mono text-on-surface-variant">{children}</span>
  );
}
