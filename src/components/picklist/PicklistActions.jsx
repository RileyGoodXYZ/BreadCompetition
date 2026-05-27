import { useState } from "react";
import {
  MoreVertical,
  Star,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePicklists } from "@/lib/picklists-store";
import { cn } from "@/lib/utils";

// Picklist action dropdow 
export function PicklistActions({
  picklist: picklistProp,
  picklistId,
  onAfterDelete,
  triggerClassName,
  menuAlign = "end",
  icon: Icon = MoreVertical,
}) {
  const { findPicklist, toggleStar, setArchived, remove } = usePicklists();
  const picklist =
    picklistProp ?? (picklistId ? findPicklist(picklistId) : null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!picklist) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Picklist actions"
            className={cn(
              "p-1 -m-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30",
              "text-on-surface-variant hover:text-primary-container",
              triggerClassName
            )}
          >
            <Icon className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={menuAlign}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem onSelect={() => toggleStar(picklist.id)}>
            <Star
              className={cn("w-4 h-4", picklist.starred && "fill-current")}
            />
            {picklist.starred ? "Unstar" : "Star"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Pencil className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          {picklist.archived ? (
            <DropdownMenuItem
              onSelect={() => setArchived(picklist.id, false)}
            >
              <ArchiveRestore className="w-4 h-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setArchived(picklist.id, true)}>
              <Archive className="w-4 h-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        picklist={picklist}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        picklist={picklist}
        onConfirmed={(p) => {
          remove(p.id);
          onAfterDelete?.(p);
        }}
      />
    </>
  );
}

// Dialogs
function RenameDialog({ open, onClose, picklist }) {
  const { rename } = usePicklists();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <RenameDialogBody
          key={picklist.id}
          picklist={picklist}
          onCommit={(title) => {
            rename(picklist.id, title);
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}

function RenameDialogBody({ picklist, onCommit }) {
  const [value, setValue] = useState(picklist.title);
  const trimmed = value.trim();
  const submit = () => {
    if (trimmed.length > 0) onCommit(trimmed);
  };
  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Rename Picklist</DialogTitle>
        <DialogDescription>
          Give this picklist a new name. Strategy leads will see the update on
          next sync.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="px-6 pt-2 pb-6"
      >
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Name
          </span>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-11 px-4 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
          />
        </label>
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
          disabled={trimmed.length === 0}
          onClick={submit}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DeleteDialog({ open, onClose, picklist, onConfirmed }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete picklist?</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-on-surface">
              {picklist?.title}
            </span>{" "}
            will be permanently removed. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
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
              onConfirmed?.(picklist);
              onClose();
            }}
            className="bg-error hover:bg-error/90 text-on-error shadow-none"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
