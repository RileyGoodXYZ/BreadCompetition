import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Lock, Pencil, Plus, Sliders, Star, Trash2 } from "lucide-react";
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
import { listEventTeams } from "@/lib/api/events";
import { listSubmissions } from "@/lib/api/submissions";
import { listTeamSubmissions } from "@/lib/api/teams";
import { aggregateEventStats, buildChartMatches } from "@/lib/match-analytics";

const SLOT_COUNT = 3;
const SAVE_DEBOUNCE_MS = 500;

function teamRecordToPoolEntry(t) {
  const data = t.data ?? {};
  const drivetrain = data.drivetrain
    ? `${String(data.drivetrain).toUpperCase()} DRIVE`
    : null;
  return {
    team: String(t.team_number),
    name: t.name,
    drivetrain,
    image: data.image_url ?? null,
  };
}

function hydrateSlots(savedSlots, byNumber) {
  const out = Array.from({ length: SLOT_COUNT }, () => null);
  if (Array.isArray(savedSlots)) {
    savedSlots.slice(0, SLOT_COUNT).forEach((teamNum, i) => {
      if (teamNum && byNumber[teamNum]) {
        out[i] = byNumber[teamNum];
      }
    });
  }
  return out;
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

  const eventKey = picklist?.event_key ?? null;

  // Event roster + per-event submission aggregation
  const [eventTeams, setEventTeams] = useState([]); // pool entries
  const [eventTeamsLoaded, setEventTeamsLoaded] = useState(false);
  const [eventSubmissions, setEventSubmissions] = useState([]);
  const [eventSubmissionsLoaded, setEventSubmissionsLoaded] = useState(false);

  useEffect(() => {
    if (!eventKey) {
      setEventTeams([]);
      setEventTeamsLoaded(true);
      return;
    }
    let cancelled = false;
    setEventTeamsLoaded(false);
    listEventTeams(eventKey)
      .then((rows) => {
        if (cancelled) return;
        setEventTeams(rows.map(teamRecordToPoolEntry));
        setEventTeamsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setEventTeams([]);
        setEventTeamsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [eventKey]);

  useEffect(() => {
    if (!eventKey) {
      setEventSubmissions([]);
      setEventSubmissionsLoaded(true);
      return;
    }
    let cancelled = false;
    setEventSubmissionsLoaded(false);
    listSubmissions({ event: eventKey, type: "match", limit: 1000 })
      .then((rows) => {
        if (cancelled) return;
        setEventSubmissions(rows);
        setEventSubmissionsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setEventSubmissions([]);
        setEventSubmissionsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [eventKey]);

  const poolByNumber = useMemo(
    () => Object.fromEntries(eventTeams.map((t) => [t.team, t])),
    [eventTeams]
  );

  // Persisted picklist state
  const data = picklist?.data ?? {};

  const [slots, setSlots] = useState(() =>
    hydrateSlots(data.slots, poolByNumber)
  );
  const [rowNotes, setRowNotes] = useState(() => data.rowNotes ?? {});
  const [rankOrder, setRankOrder] = useState(() => data.rankings ?? []);
  const [blackedOut, setBlackedOut] = useState(
    () => new Set(data.blackedOut ?? [])
  );
  const [columnPrefs, setColumnPrefs] = useState(() => data.columnPrefs ?? []);

  // Re-hydrate when the loaded picklist OR event roster changes.
  const hydratedFor = useRef(null);
  useEffect(() => {
    if (!picklist) return;
    const key = `${picklist.id}:${eventTeamsLoaded ? "1" : "0"}`;
    if (hydratedFor.current === key) return;
    hydratedFor.current = key;
    const d = picklist.data ?? {};
    setSlots(hydrateSlots(d.slots, poolByNumber));
    setRowNotes(d.rowNotes ?? {});
    setRankOrder(d.rankings ?? []);
    setBlackedOut(new Set(d.blackedOut ?? []));
    setColumnPrefs(d.columnPrefs ?? []);
  }, [picklist, eventTeamsLoaded, poolByNumber]);

  const buildSavePayload = useCallback(
    () => ({
      ...(picklistRef.current?.data ?? {}),
      slots: slots.map((r) => r?.team ?? null),
      rowNotes,
      rankings: rankOrder,
      blackedOut: [...blackedOut],
      columnPrefs,
    }),
    [slots, rowNotes, rankOrder, blackedOut, columnPrefs]
  );

  // Debounced autosave whenever persistable state changes.
  useEffect(() => {
    if (!picklist) return;
    if (!hydratedFor.current?.startsWith(`${picklist.id}:`)) return;
    if (picklist.data?.locked === true) return;
    const t = setTimeout(() => {
      saveData(picklist.id, buildSavePayload());
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [
    picklist?.id,
    picklist?.data?.locked,
    slots,
    rowNotes,
    rankOrder,
    blackedOut,
    columnPrefs,
    saveData,
    buildSavePayload,
    picklist,
  ]);

  // "idle" | "saving" | "saved"
  const [saveState, setSaveState] = useState("idle");
  const savedTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  const handleManualSave = useCallback(async () => {
    if (!picklist) return;
    if (picklist.data?.locked === true) return;
    clearTimeout(savedTimerRef.current);
    setSaveState("saving");
    try {
      await saveData(picklist.id, buildSavePayload());
      setSaveState("saved");
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("idle");
    }
  }, [picklist, saveData, buildSavePayload]);

  const { columns: statColumns, byTeam: statsByTeam } = useMemo(
    () => aggregateEventStats(eventSubmissions),
    [eventSubmissions]
  );

  const allColumns = useMemo(() => {
    const labelById = new Map(statColumns.map((c) => [c.id, c.label]));
    const ordered = [];
    const seen = new Set();
    for (const pref of columnPrefs) {
      if (!labelById.has(pref.id)) continue;
      ordered.push({ id: pref.id, label: labelById.get(pref.id), checked: pref.checked });
      seen.add(pref.id);
    }
    for (const c of statColumns) {
      if (seen.has(c.id)) continue;
      ordered.push({ id: c.id, label: c.label, checked: true });
    }
    return ordered;
  }, [statColumns, columnPrefs]);

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => c.checked),
    [allColumns]
  );

  const rankings = useMemo(() => {
    if (eventTeams.length === 0) return [];
    const byNumber = Object.fromEntries(
      eventTeams.map((t) => [
        t.team,
        {
          number: t.team,
          name: t.name,
          drivetrain: t.drivetrain,
          ...(statsByTeam[t.team] ?? {}),
        },
      ])
    );
    const orderedKeys = (rankOrder ?? []).filter((k) => byNumber[k]);
    const seen = new Set(orderedKeys);
    const ordered = orderedKeys.map((k) => byNumber[k]);
    const remaining = eventTeams
      .map((t) => t.team)
      .filter((k) => !seen.has(k))
      .map((k) => byNumber[k]);
    return [...ordered, ...remaining].map((row, i) => ({
      ...row,
      rank: i + 1,
    }));
  }, [eventTeams, statsByTeam, rankOrder]);

  const reorderRankings = (from, to) => {
    const currentKeys = rankings.map((r) => r.number);
    const next = currentKeys.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRankOrder(next);
  };

  const toggleBlackout = (teamNumber) => {
    setBlackedOut((prev) => {
      const next = new Set(prev);
      if (next.has(teamNumber)) next.delete(teamNumber);
      else next.add(teamNumber);
      return next;
    });
  };

  // Per-slot submissions for the Robot Comparison chart + notes dialog
  const [slotData, setSlotData] = useState({});
  const fetchedSlotsRef = useRef(new Set());

  const filledTeamNumbers = useMemo(
    () => slots.filter(Boolean).map((r) => r.team),
    [slots]
  );

  useEffect(() => {
    const need = filledTeamNumbers.filter(
      (t) => !fetchedSlotsRef.current.has(t)
    );
    if (need.length === 0) return;
    for (const t of need) fetchedSlotsRef.current.add(t);

    setSlotData((prev) => {
      const next = { ...prev };
      for (const t of need) next[t] = { matches: [], subjective: [], loading: true };
      return next;
    });

    need.forEach(async (teamNumber) => {
      let entry;
      try {
        const [matches, subjective, pit, brk] = await Promise.all([
          listTeamSubmissions(teamNumber, { type: "match", limit: 1000 }),
          listTeamSubmissions(teamNumber, { type: "subjective", limit: 1000 }),
          listTeamSubmissions(teamNumber, { type: "pit", limit: 1000 }),
          listTeamSubmissions(teamNumber, { type: "break", limit: 1000 }),
        ]);
        entry = {
          matches: buildChartMatches(matches),
          notes: { subjective, pit, break: brk },
          loading: false,
        };
      } catch {
        entry = {
          matches: [],
          notes: { subjective: [], pit: [], break: [] },
          loading: false,
        };
      }
      setSlotData((prev) => ({ ...prev, [teamNumber]: entry }));
    });
  }, [filledTeamNumbers]);

  // Dialog state (not persisted)
  const [addSlotIdx, setAddSlotIdx] = useState(null);
  const [notesRobot, setNotesRobot] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);

  const [noteDialogTeam, setNoteDialogTeam] = useState(null);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const title = picklist?.title ?? "Loading…";
  const locked = picklist?.data?.locked === true;

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

  const addToComparison = (teamNumber) => {
    if (locked) return;
    const entry = poolByNumber[teamNumber];
    if (!entry) return;
    setSlots((prev) => {
      if (prev.some((s) => s?.team === teamNumber)) return prev;
      const emptyIdx = prev.findIndex((s) => s == null);
      if (emptyIdx !== -1) {
        const next = prev.slice();
        next[emptyIdx] = entry;
        return next;
      }
      return [...prev.slice(1), entry];
    });
  };

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

  const notesForDialog = notesRobot
    ? slotData[notesRobot.team]?.notes ?? {
        subjective: [],
        pit: [],
        break: [],
      }
    : { subjective: [], pit: [], break: [] };
  const notesLoading = notesRobot
    ? slotData[notesRobot.team]?.loading ?? true
    : false;

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
        onSave={handleManualSave}
        saveDisabled={locked || saveState === "saving"}
        saveLabel={
          saveState === "saving" ? "Saving…" : saveState === "saved" ? (
            <span className="inline-flex items-center gap-1">
              <Check className="w-4 h-4" />
              Saved
            </span>
          ) : "Save"
        }
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
                    chartMatches={slotData[robot.team]?.matches}
                    loading={slotData[robot.team]?.loading !== false}
                    robot={{ ...robot, image: teamImages[robot.team] ?? robot.image }}
                    onViewNotes={() => setNotesRobot(robot)}
                    onRemove={locked ? undefined : () => clearSlot(idx)}
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
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-xs text-on-surface-variant hidden sm:block">
                  Right-click a row to toggle blackout.
                </p>
                {!locked && eventKey && allColumns.length > 0 && (
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
            </div>
            {!eventKey ? (
              <EventMissingState />
            ) : !eventTeamsLoaded || !eventSubmissionsLoaded ? (
              <div className="border border-primary-container/10 rounded-md bg-surface-container-lowest shadow-warm-sm py-10 text-center text-sm text-on-surface-variant">
                Loading event roster…
              </div>
            ) : (
              <RankingsTable
                teams={rankings}
                columns={visibleColumns}
                onReorder={locked ? undefined : reorderRankings}
                notes={rowNotes}
                onOpenNote={openNote}
                blackedOut={blackedOut}
                onToggleBlackout={locked ? undefined : toggleBlackout}
                onAddToComparison={locked ? undefined : addToComparison}
                comparisonTeams={new Set(filledTeamNumbers)}
              />
            )}
          </section>
        </div>
      </div>

      <AddRobotDialog
        open={addSlotIdx !== null}
        onOpenChange={(open) => !open && setAddSlotIdx(null)}
        pool={eventTeams}
        alreadyInUse={filledTeamNumbers}
        onPick={(robot) => {
          if (addSlotIdx !== null) fillSlot(addSlotIdx, robot);
        }}
      />

      <ScoutNotesDialog
        open={notesRobot !== null}
        onOpenChange={(open) => !open && setNotesRobot(null)}
        robot={notesRobot}
        notes={notesForDialog}
        loading={notesLoading}
      />

      <ConfigureColumnsModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        columns={allColumns}
        onSave={(next) =>
          setColumnPrefs(next.map((c) => ({ id: c.id, checked: c.checked })))
        }
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
                  <span className="text-on-surface-variant italic">-</span>
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

function EventMissingState() {
  return (
    <div className="border-2 border-dashed border-outline-variant/60 rounded-md py-10 px-4 text-center">
      <p className="text-on-surface font-semibold">No event chosen.</p>
      <p className="text-on-surface-variant text-sm mt-1 max-w-md mx-auto">
        Pick an event for this picklist to populate rankings from the teams at
        that event.
      </p>
    </div>
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
