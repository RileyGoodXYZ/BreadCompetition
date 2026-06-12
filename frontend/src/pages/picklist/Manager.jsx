import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Pencil, Plus, Sliders, Star, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { TopBar } from "@/components/TopBar";
import { RobotCard } from "@/components/picklist/RobotCard";
import { RankingsTable } from "@/components/picklist/RankingsTable";
import { ConfigureColumnsModal } from "@/components/picklist/ConfigureColumnsModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddRobotDialog } from "@/components/picklist/AddRobotDialog";
import { ScoutNotesDialog } from "@/components/picklist/ScoutNotesDialog";
import { PicklistActions } from "@/components/picklist/PicklistActions";
import { usePicklists } from "@/lib/picklists-store";
import { useTeamImages } from "@/lib/use-team-images";
import { cn } from "@/lib/utils";
import { TEAM_POOL, RANKINGS, DEFAULT_COLUMNS } from "./data";

const SLOT_COUNT = 3;
const SAVE_DEBOUNCE_MS = 500;

const TEAMS_BY_NUMBER = Object.fromEntries(TEAM_POOL.map((r) => [r.team, r]));
const RANKING_BY_NUMBER = Object.fromEntries(RANKINGS.map((r) => [r.number, r]));

function hydrateSlots(savedSlots) {
  const out = Array.from({ length: SLOT_COUNT }, () => null);
  if (Array.isArray(savedSlots)) {
    savedSlots.slice(0, SLOT_COUNT).forEach((teamNum, i) => {
      if (teamNum && TEAMS_BY_NUMBER[teamNum]) {
        out[i] = TEAMS_BY_NUMBER[teamNum];
      }
    });
  }
  return out;
}

function hydrateRankings(savedOrder) {
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
    return RANKINGS.map((r, i) => ({ ...r, rank: i + 1 }));
  }
  const seen = new Set(savedOrder);
  const ordered = savedOrder
    .map((n) => RANKING_BY_NUMBER[n])
    .filter(Boolean);
  const missing = RANKINGS.filter((r) => !seen.has(r.number));
  return [...ordered, ...missing].map((row, i) => ({ ...row, rank: i + 1 }));
}

export default function Manager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findPicklist, loadPicklist, saveData } = usePicklists();
  const teamImages = useTeamImages();

  const [picklist, setPicklist] = useState(() => findPicklist(id));
  const picklistRef = useRef(picklist);
  picklistRef.current = picklist;

  useEffect(() => {
    let cancelled = false;
    if (!picklist || picklist.id !== id) {
      const cached = findPicklist(id);
      if (cached) {
        setPicklist(cached);
      } else {
        loadPicklist(id).then((p) => {
          if (!cancelled) setPicklist(p);
        });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [id, picklist, findPicklist, loadPicklist]);

  // Keep local picklist reference in sync when the store record updates.
  const storeRecord = findPicklist(id);
  useEffect(() => {
    if (storeRecord && storeRecord !== picklist) setPicklist(storeRecord);
  }, [storeRecord, picklist]);

  const data = picklist?.data ?? {};

  const [slots, setSlots] = useState(() => hydrateSlots(data.slots));
  const [columns, setColumns] = useState(() => data.columns ?? DEFAULT_COLUMNS);
  const [rowNotes, setRowNotes] = useState(() => data.rowNotes ?? {});
  const [rankings, setRankings] = useState(() => hydrateRankings(data.rankings));

  // Re-hydrate when the loaded picklist changes (e.g. async fetch resolves).
  const hydratedFor = useRef(null);
  useEffect(() => {
    if (!picklist) return;
    if (hydratedFor.current === picklist.id) return;
    hydratedFor.current = picklist.id;
    const d = picklist.data ?? {};
    setSlots(hydrateSlots(d.slots));
    setColumns(d.columns ?? DEFAULT_COLUMNS);
    setRowNotes(d.rowNotes ?? {});
    setRankings(hydrateRankings(d.rankings));
  }, [picklist]);

  // Debounced autosave whenever persistable state changes. Depend on
  // picklist?.id (not the full record) so the effect doesn't re-fire on
  // every successful save — otherwise the record refresh would queue
  // another no-op save forever. Spread the latest known data via the ref
  // so we preserve unknown keys (e.g. `locked`) across writes.
  useEffect(() => {
    if (!picklist) return;
    if (hydratedFor.current !== picklist.id) return;
    if (picklist.data?.locked === true) return;
    const t = setTimeout(() => {
      const latest = picklistRef.current;
      saveData(picklist.id, {
        ...(latest?.data ?? {}),
        slots: slots.map((r) => r?.team ?? null),
        columns,
        rowNotes,
        rankings: rankings.map((r) => r.number),
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [picklist?.id, picklist?.data?.locked, slots, columns, rowNotes, rankings, saveData]);

  const title = picklist?.title ?? "Loading…";
  const locked = picklist?.data?.locked === true;

  const scrollers = useRef(Array.from({ length: SLOT_COUNT }, () => null));
  const handleSync = (sourceIdx) => (e) => {
    const top = e.currentTarget.scrollTop;
    scrollers.current.forEach((el, i) => {
      if (i !== sourceIdx && el && Math.abs(el.scrollTop - top) > 0.5) {
        el.scrollTop = top;
      }
    });
  };

  // Dialog state (not persisted)
  const [configOpen, setConfigOpen] = useState(false);
  const [addSlotIdx, setAddSlotIdx] = useState(null);
  const [notesRobot, setNotesRobot] = useState(null);

  // Row-note dialog (view/edit)
  const [noteDialogTeam, setNoteDialogTeam] = useState(null);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (noteDialogTeam) {
      const existing = rowNotes[noteDialogTeam.number] ?? "";
      setNoteDraft(existing);
      setNoteEditing(!locked && !existing);
    } else {
      setNoteEditing(false);
      setNoteDraft("");
    }
  }, [noteDialogTeam, rowNotes, locked]);

  const openNote = (team) => setNoteDialogTeam(team);
  const closeNote = () => setNoteDialogTeam(null);
  const saveNote = () => {
    if (!noteDialogTeam) return;
    const value = noteDraft.trim();
    setRowNotes((prev) => {
      const next = { ...prev };
      if (value) next[noteDialogTeam.number] = value;
      else delete next[noteDialogTeam.number];
      return next;
    });
    setNoteEditing(false);
    if (!value) closeNote();
  };
  const clearNote = () => {
    if (!noteDialogTeam) return;
    setRowNotes((prev) => {
      const next = { ...prev };
      delete next[noteDialogTeam.number];
      return next;
    });
    closeNote();
  };

  const reorderRankings = (from, to) => {
    setRankings((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((row, i) => ({ ...row, rank: i + 1 }));
    });
  };

  const filledTeamNumbers = useMemo(
    () => slots.filter(Boolean).map((r) => r.team),
    [slots]
  );

  const fillSlot = (idx, robot) =>
    setSlots((prev) => {
      const next = prev.slice();
      next[idx] = robot;
      return next;
    });

  const clearSlot = (idx) =>
    setSlots((prev) => {
      const next = prev.slice();
      next[idx] = null;
      return next;
    });

  if (!picklist) {
    return (
      <Shell>
        <TopBar variant="manager" title={title} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant text-sm">Loading picklist…</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar
        variant="manager"
        title={title}
        titleAdornment={
          <span className="inline-flex items-center gap-1.5">
            {picklist.starred && (
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-500"
                title="Starred"
                aria-label="Starred"
              >
                <Star className="w-4 h-4 fill-current" />
              </span>
            )}
            {locked && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider"
                title="Locked — edits disabled"
                aria-label="Locked"
              >
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </span>
        }
        onSync={() => {}}
        onSave={() => {}}
        extras={
          <PicklistActions
            picklist={picklist}
            onAfterDelete={() => navigate("/picklists")}
          />
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-12 pb-20">
          {/* Robot Comparison */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-7">
              <h3 className="text-base sm:text-2xl font-semibold tracking-tight text-on-surface border-l-4 border-primary-container pl-2 sm:pl-4">
                Robot Comparison
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
              {slots.map((robot, idx) =>
                robot ? (
                  <RobotCard
                    key={`slot-${idx}-${robot.team}`}
                    robot={{ ...robot, image: teamImages[robot.team] ?? robot.image }}
                    onViewNotes={() => setNotesRobot(robot)}
                    onRemove={locked ? undefined : () => clearSlot(idx)}
                    scrollRef={(el) => {
                      scrollers.current[idx] = el;
                    }}
                    onScroll={handleSync(idx)}
                  />
                ) : locked ? (
                  <LockedSlotCard key={`slot-${idx}-locked`} />
                ) : (
                  <EmptySlotCard
                    key={`slot-${idx}-empty`}
                    onAdd={() => setAddSlotIdx(idx)}
                  />
                )
              )}
            </div>
          </section>

          {/* Picklist Rankings */}
          <section>
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-7">
              <h3 className="text-base sm:text-2xl font-semibold tracking-tight text-on-surface border-l-4 border-primary-container pl-2 sm:pl-4">
                Picklist Rankings
              </h3>
              {!locked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigOpen(true)}
                  className="shrink-0"
                >
                  <Sliders className="w-4 h-4" />
                  <span className="hidden sm:inline">Configure Columns</span>
                  <span className="sm:hidden">Columns</span>
                </Button>
              )}
            </div>
            <RankingsTable
              teams={rankings}
              columns={columns}
              onReorder={locked ? undefined : reorderRankings}
              notes={rowNotes}
              onOpenNote={openNote}
            />
          </section>
        </div>
      </div>

      <ConfigureColumnsModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        columns={columns}
        onSave={setColumns}
      />

      <AddRobotDialog
        open={addSlotIdx !== null}
        onOpenChange={(open) => !open && setAddSlotIdx(null)}
        pool={TEAM_POOL}
        alreadyInUse={filledTeamNumbers}
        onPick={(robot) => {
          if (addSlotIdx !== null) fillSlot(addSlotIdx, robot);
        }}
      />

      <ScoutNotesDialog
        open={notesRobot !== null}
        onOpenChange={(open) => !open && setNotesRobot(null)}
        robot={notesRobot}
      />

      <Dialog
        open={noteDialogTeam !== null}
        onOpenChange={(open) => !open && closeNote()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteDialogTeam
                ? `Note · ${noteDialogTeam.number} ${noteDialogTeam.name}`
                : "Robot Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-3 sm:px-6 py-3 sm:py-4">
            {noteEditing ? (
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="e.g. inconsistent climb under defense; check bumper damage"
                rows={5}
                className="w-full resize-y rounded-md border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30 min-h-24"
              />
            ) : (
              <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                {noteDraft || (
                  <span className="text-on-surface-variant italic">
                    No notes yet.
                  </span>
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            {noteEditing ? (
              <>
                {rowNotes[noteDialogTeam?.number] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearNote}
                    className="mr-auto text-error hover:text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const existing = rowNotes[noteDialogTeam?.number] ?? "";
                    if (existing) {
                      setNoteDraft(existing);
                      setNoteEditing(false);
                    } else {
                      closeNote();
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={saveNote}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={closeNote}>
                  Close
                </Button>
                {!locked && (
                  <Button size="sm" onClick={() => setNoteEditing(true)}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function LockedSlotCard() {
  return (
    <div
      className={cn(
        "group h-40 sm:h-180 rounded sm:rounded-md border-2 border-dashed border-outline-variant/40",
        "flex flex-col items-center justify-center gap-2 sm:gap-3 bg-surface-container-low/40"
      )}
    >
      <span className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
        <Lock className="w-5 h-5" />
      </span>
      <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        Empty Slot
      </span>
      <span className="text-[11px] text-on-surface-variant max-w-[180px] text-center leading-snug">
        This picklist is locked. Unlock it to add robots.
      </span>
    </div>
  );
}

function EmptySlotCard({ onAdd }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "group h-40 sm:h-180 rounded sm:rounded-md border-2 border-dashed border-outline-variant/60",
        "flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all",
        "hover:border-primary-container hover:bg-primary-container/5"
      )}
    >
      <span className="w-12 h-12 rounded-full bg-secondary-container/60 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
        <Plus className="w-6 h-6" strokeWidth={2.4} />
      </span>
      <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-primary-container transition-colors">
        Add Robot
      </span>
      <span className="text-[11px] text-on-surface-variant max-w-[180px] text-center leading-snug">
        Choose a scouted team to compare against the others.
      </span>
    </button>
  );
}
