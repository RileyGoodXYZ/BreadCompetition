import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Sliders, Star } from "lucide-react";
import { Shell } from "@/components/picklist/Shell";
import { TopBar } from "@/components/picklist/TopBar";
import { RobotCard } from "@/components/picklist/RobotCard";
import { RankingsTable } from "@/components/picklist/RankingsTable";
import { ConfigureColumnsModal } from "@/components/picklist/ConfigureColumnsModal";
import { Button } from "@/components/ui/button";
import { AddRobotDialog } from "@/components/picklist/AddRobotDialog";
import { ScoutNotesDialog } from "@/components/picklist/ScoutNotesDialog";
import { PicklistActions } from "@/components/picklist/PicklistActions";
import { usePicklists } from "@/lib/picklists-store";
import { cn } from "@/lib/utils";
import { ROBOT_CARDS, TEAM_POOL, RANKINGS, DEFAULT_COLUMNS } from "./data";

const FALLBACK_TITLE_BY_ID = {
  new: "Untitled Picklist",
};

const SLOT_COUNT = 3;

export default function Manager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findPicklist } = usePicklists();

  const picklist = findPicklist(id);
  const title =
    picklist?.title ?? FALLBACK_TITLE_BY_ID[id] ?? "Champs Draft List";

  const [slots, setSlots] = useState(() => {
    const seed = ROBOT_CARDS.slice(0, SLOT_COUNT);
    return Array.from({ length: SLOT_COUNT }, (_, i) => seed[i] ?? null);
  });

  const scrollers = useRef(Array.from({ length: SLOT_COUNT }, () => null));
  const handleSync = (sourceIdx) => (e) => {
    const top = e.currentTarget.scrollTop;
    scrollers.current.forEach((el, i) => {
      if (i !== sourceIdx && el && Math.abs(el.scrollTop - top) > 0.5) {
        el.scrollTop = top;
      }
    });
  };

  // Dialog state
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [configOpen, setConfigOpen] = useState(false);
  const [addSlotIdx, setAddSlotIdx] = useState(null); // null = closed
  const [notesRobot, setNotesRobot] = useState(null); // null = closed

  // Rankings live in local state so the user's drag-reorders persist.
  const [rankings, setRankings] = useState(RANKINGS);
  const reorderRankings = (from, to) => {
    setRankings((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((row, i) => ({ ...row, rank: i + 1 }));
    });
  };

  const filledTeamNumbers = slots.filter(Boolean).map((r) => r.team);

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

  return (
    <Shell>
      <TopBar
        variant="manager"
        title={title}
        titleAdornment={
          picklist?.starred && (
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-500"
              title="Starred"
              aria-label="Starred"
            >
              <Star className="w-4 h-4 fill-current" />
            </span>
          )
        }
        onSync={() => {}}
        onSave={() => {}}
        extras={
          picklist && (
            <PicklistActions
              picklist={picklist}
              onAfterDelete={() => navigate("/picklists")}
            />
          )
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
                    robot={robot}
                    onViewNotes={() => setNotesRobot(robot)}
                    onRemove={() => clearSlot(idx)}
                    scrollRef={(el) => {
                      scrollers.current[idx] = el;
                    }}
                    onScroll={handleSync(idx)}
                  />
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
            </div>
            <RankingsTable
              teams={rankings}
              columns={columns}
              onReorder={reorderRankings}
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
    </Shell>
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
