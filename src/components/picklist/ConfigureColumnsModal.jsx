import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
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

const ABOVE = "above";
const BELOW = "below";

export function ConfigureColumnsModal({
  open,
  onOpenChange,
  columns: initialColumns,
  onSave,
}) {
  const [columns, setColumns] = useState(initialColumns);
  useEffect(() => {
    if (open) setColumns(initialColumns);
  }, [open, initialColumns]);

  const toggle = (id) =>
    setColumns((cols) =>
      cols.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );

  const reorder = (from, to) =>
    setColumns((cols) => {
      const next = cols.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Drag-and-drop wiring 
  const [dragIdx, setDragIdx] = useState(null);
  const [hover, setHover] = useState(null);

  const onDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx)); 
  };
  const onDragOver = (idx) => (e) => {
    if (dragIdx == null || dragIdx === idx) return;
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
      if (target !== dragIdx) reorder(dragIdx, target);
    }
    setDragIdx(null);
    setHover(null);
  };
  const onDragEnd = () => {
    setDragIdx(null);
    setHover(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Data Columns</DialogTitle>
          <DialogDescription>
            Select and reorder columns for your ranking table.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-warm px-4 py-4">
          <ul className="space-y-2">
            {columns.map((col, i) => {
              const isDragging = dragIdx === i;
              const isHoverAbove =
                hover?.idx === i && hover.position === ABOVE && dragIdx !== i;
              const isHoverBelow =
                hover?.idx === i && hover.position === BELOW && dragIdx !== i;
              return (
                <li
                  key={col.id}
                  draggable
                  onDragStart={onDragStart(i)}
                  onDragOver={onDragOver(i)}
                  onDragLeave={onDragLeaveRow(i)}
                  onDrop={onDrop(i)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "group flex items-center gap-3 p-3 bg-surface-container-low rounded-full border border-outline-variant/60 hover:border-primary-container transition-colors",
                    isDragging && "opacity-40",
                    isHoverAbove &&
                      "shadow-[inset_0_2px_0_0_var(--color-primary-container)]",
                    isHoverBelow &&
                      "shadow-[inset_0_-2px_0_0_var(--color-primary-container)]"
                  )}
                >
                  <span
                    className="text-on-surface-variant cursor-grab active:cursor-grabbing group-hover:text-primary-container transition-colors"
                    aria-label={`Drag ${col.label}`}
                  >
                    <GripVertical className="w-5 h-5" />
                  </span>
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <Checkbox
                      checked={col.checked}
                      onCheckedChange={() => toggle(col.id)}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium flex-1 transition-colors",
                        col.checked
                          ? "text-on-surface"
                          : "text-on-surface-variant"
                      )}
                    >
                      {col.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

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
            onClick={() => {
              onSave?.(columns);
              onOpenChange?.(false);
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
