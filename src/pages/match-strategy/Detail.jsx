import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Cpu, Plus, X, Trash2 } from "lucide-react";
import { Shell } from "@/components/picklist/Shell";
import { MobileMenuButton } from "@/components/picklist/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useMatchStrategy } from "@/lib/match-strategy-store";
import { cn } from "@/lib/utils";
import { STRATEGY_TEAM_STATS } from "./data";

// Match strategy detail page
export default function MatchStrategyDetail() {
  const { id } = useParams();
  const { findStrategy } = useMatchStrategy();
  const strategy = findStrategy(id);

  return (
    <Shell>
      <DetailTopBar />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-350 mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {strategy ? (
            <>
              <header className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                  {strategy.title}
                </h1>
                {strategy.event && (
                  <p className="text-on-surface-variant text-sm sm:text-base mt-1">
                    {strategy.event}
                  </p>
                )}
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-6 sm:gap-y-10 mb-6 sm:mb-10">
                <AllianceColumn
                  title="Our Alliance"
                  color="blue"
                  teamNumbers={strategy.ourAlliance}
                />
                <AllianceColumn
                  title="Opponent Alliance"
                  color="red"
                  teamNumbers={strategy.opponentAlliance}
                />
              </div>

              <StrategyTimelineTable strategy={strategy} />
            </>
          ) : (
            <p className="text-on-surface-variant text-center py-20">
              Strategy <span className="font-mono">{id}</span> not found.
            </p>
          )}
        </div>
      </div>
    </Shell>
  );
}

function DetailTopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 sm:gap-6 w-full px-3 sm:px-6 lg:px-8 h-14 sm:h-16 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0">
      <MobileMenuButton />
      <h1 className="text-base sm:text-xl font-bold text-on-surface tracking-tight whitespace-nowrap">
        Match Strategy
      </h1>
      <div className="flex-1 max-w-md min-w-0">
        <label className="relative block">
          <span className="sr-only">Search match</span>
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="search"
            placeholder="Search match..."
            className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-3 sm:pr-4 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
          />
        </label>
      </div>
    </header>
  );
}

function AllianceColumn({ title, color, teamNumbers }) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 text-xl font-semibold text-on-surface pb-3 mb-4 border-b border-outline-variant/40">
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            color === "blue" ? "bg-blue-600" : "bg-red-600"
          )}
        />
        {title}
      </h2>
      <div className="space-y-3">
        {teamNumbers.map((tn) => {
          const team = STRATEGY_TEAM_STATS[tn] ?? placeholderTeam(tn);
          return <TeamCard key={tn} team={team} color={color} />;
        })}
      </div>
    </section>
  );
}

function placeholderTeam(tn) {
  return {
    team: tn,
    name: `Team ${tn}`,
    auto: { epa: "—", winPct: "—" },
    teleop: { epa: "—", pieces: "—" },
    accuracy: { close: "—", moving: "—" },
    traits: { intake: "—", bump: "—" },
  };
}

function TeamCard({ team, color }) {
  return (
    <article className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <h4 className="text-base sm:text-lg font-bold text-on-surface leading-tight truncate">
          <Link
            to={`/robot-data?team=${team.team}`}
            className="hover:underline underline-offset-4 decoration-2 decoration-on-surface/30"
          >
            {team.name}
          </Link>
        </h4>
        <span
          className={cn(
            "inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shrink-0",
            color === "blue" ? "bg-blue-600" : "bg-red-600"
          )}
        >
          {color}
        </span>
        <Cpu className="ml-auto w-5 h-5 text-on-surface-variant shrink-0" />
      </div>
      <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 mb-3 sm:mb-4">
        Team {team.team}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-0">
        <StatGroup
          label="Auto"
          rows={[
            ["EPA", team.auto.epa],
            ["Win %", team.auto.winPct],
          ]}
        />
        <StatGroup
          label="Teleop"
          rows={[
            ["EPA", team.teleop.epa],
            ["Pieces", team.teleop.pieces],
          ]}
        />
        <StatGroup
          label="Accuracy"
          rows={[
            ["Close", team.accuracy.close],
            ["Moving", team.accuracy.moving],
          ]}
        />
        <StatGroup
          label="Traits"
          rows={[
            ["Intake", team.traits.intake],
            ["Bump", team.traits.bump],
          ]}
        />
      </div>
    </article>
  );
}

function StatGroup({ label, rows }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </div>
      <div className="space-y-1">
        {rows.map(([key, val]) => (
          <div
            key={key}
            className="flex justify-between items-baseline text-sm gap-3"
          >
            <span className="text-on-surface-variant">{key}</span>
            <span className="font-semibold text-on-surface font-mono whitespace-nowrap">
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyTimelineTable({ strategy }) {
  const { setCell, addScenario, removeScenario, addColumn, removeColumn } =
    useMatchStrategy();
  const [addColOpen, setAddColOpen] = useState(false);
  const [addScenOpen, setAddScenOpen] = useState(false);
  const [pendingDeleteCol, setPendingDeleteCol] = useState(null);
  const [pendingDeleteScen, setPendingDeleteScen] = useState(null);

  const columns = strategy.columns;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-outline-variant/50 overflow-hidden bg-surface-container-lowest">
        <div className="overflow-x-auto scrollbar-warm">
          <table className="w-full border-collapse min-w-250">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-secondary-container py-2.5 px-3 sm:px-4 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-on-secondary-container w-28 sm:w-36 shadow-[1px_0_0_0_var(--color-outline-variant)]">
                  Timeline
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="py-2.5 px-3 sm:px-4 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap border-l border-outline-variant/30 group/col"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {col.custom && (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteCol(col)}
                          aria-label={`Remove ${col.label} column`}
                          className="opacity-0 group-hover/col:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      )}
                    </span>
                  </th>
                ))}
                <th className="py-2 px-2 border-l border-outline-variant/30 w-12">
                  <button
                    type="button"
                    onClick={() => setAddColOpen(true)}
                    aria-label="Add column"
                    className="w-7 h-7 mx-auto rounded-full bg-primary-container/10 text-primary-container hover:bg-primary-container/20 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {strategy.scenarios.map((scenario) => (
                <ScenarioBlock
                  key={scenario.id}
                  scenario={scenario}
                  columns={columns}
                  onSetCell={(team, col, val) =>
                    setCell(strategy.id, scenario.id, team, col, val)
                  }
                  onRemove={() => setPendingDeleteScen(scenario)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button
        variant="outline"
        size="md"
        onClick={() => setAddScenOpen(true)}
      >
        <Plus className="w-4 h-4" />
        Add Scenario
      </Button>

      <AddColumnDialog
        open={addColOpen}
        onOpenChange={setAddColOpen}
        onAdd={(label) => addColumn(strategy.id, label)}
      />
      <AddScenarioDialog
        open={addScenOpen}
        onOpenChange={setAddScenOpen}
        onAdd={(payload) => addScenario(strategy.id, payload)}
      />
      <ConfirmDeleteDialog
        open={pendingDeleteCol !== null}
        onOpenChange={(o) => !o && setPendingDeleteCol(null)}
        title="Delete column?"
        target={pendingDeleteCol?.label}
        description="Notes typed in this column will be lost."
        onConfirm={() => {
          removeColumn(strategy.id, pendingDeleteCol.id);
          setPendingDeleteCol(null);
        }}
      />
      <ConfirmDeleteDialog
        open={pendingDeleteScen !== null}
        onOpenChange={(o) => !o && setPendingDeleteScen(null)}
        title="Delete scenario?"
        target={pendingDeleteScen?.title}
        description="All notes in this scenario will be removed."
        onConfirm={() => {
          removeScenario(strategy.id, pendingDeleteScen.id);
          setPendingDeleteScen(null);
        }}
      />
    </div>
  );
}

function ScenarioBlock({ scenario, columns, onSetCell, onRemove }) {
  const colSpan = columns.length + 2;
  return (
    <>
      <tr>
        <td
          colSpan={colSpan}
          className={cn(
            "py-2 px-3 sm:px-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest sticky left-0",
            scenario.tone === "ours" && "bg-blue-600 text-white",
            scenario.tone === "opponent" && "bg-red-600 text-white"
          )}
        >
          <span className="inline-flex items-center justify-between w-full">
            <span>Scenario: {scenario.title}</span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${scenario.title} scenario`}
              className="ml-3 w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </span>
        </td>
      </tr>
      {scenario.teams.map((teamNum) => (
        <tr key={teamNum} className="border-t border-outline-variant/30">
          <td className="sticky left-0 z-1 bg-secondary-container/95 backdrop-blur-sm py-2.5 px-3 sm:px-4 text-sm sm:text-base font-semibold text-on-surface align-middle shadow-[1px_0_0_0_var(--color-outline-variant)]">
            {teamNum}
          </td>
          {columns.map((col) => {
            const text = scenario.cells[teamNum]?.[col.id] ?? "";
            return (
              <td
                key={col.id}
                className="border-l border-outline-variant/30 px-1.5 sm:px-2 py-1 sm:py-1.5 align-top"
              >
                <textarea
                  value={text}
                  onChange={(e) => onSetCell(teamNum, col.id, e.target.value)}
                  rows={2}
                  className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:bg-primary-container/5 rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 resize-none transition-colors"
                />
              </td>
            );
          })}
          <td className="border-l border-outline-variant/30" />
        </tr>
      ))}
    </>
  );
}

function AddColumnDialog({ open, onOpenChange, onAdd }) {
  const [label, setLabel] = useState("");
  const trimmed = label.trim();
  const submit = (e) => {
    e?.preventDefault?.();
    if (!trimmed) return;
    onAdd(trimmed);
    setLabel("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setLabel("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="px-4 sm:px-6 py-4">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Column label
            </span>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Defense Plan"
              className="w-full h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
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
            disabled={!trimmed}
            onClick={submit}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddScenarioDialog({ open, onOpenChange, onAdd }) {
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("ours");
  const trimmed = title.trim();

  const submit = (e) => {
    e?.preventDefault?.();
    if (!trimmed) return;
    onAdd({ title: trimmed, tone });
    setTitle("");
    setTone("ours");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setTitle("");
          setTone("ours");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Scenario</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="px-4 sm:px-6 py-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Title
            </span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pressed by defense"
              className="w-full h-10 px-3 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Alliance
            </span>
            <div className="grid grid-cols-2 gap-2">
              <ToneButton
                active={tone === "ours"}
                color="blue"
                onClick={() => setTone("ours")}
              >
                Our Alliance
              </ToneButton>
              <ToneButton
                active={tone === "opponent"}
                color="red"
                onClick={() => setTone("opponent")}
              >
                Opponent
              </ToneButton>
            </div>
          </div>
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
            disabled={!trimmed}
            onClick={submit}
          >
            Add Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  target,
  description,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="px-4 sm:px-6 py-4 text-sm text-on-surface-variant">
          {target && (
            <p className="mb-2">
              <span className="font-semibold text-on-surface">{target}</span>{" "}
              will be removed.
            </p>
          )}
          {description && <p>{description} This can't be undone.</p>}
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
            onClick={onConfirm}
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

function ToneButton({ active, color, onClick, children }) {
  const activeClasses =
    color === "blue"
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-red-600 text-white border-red-600";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 px-3 rounded-md border text-sm font-semibold transition-colors",
        active
          ? activeClasses
          : "border-outline-variant/60 text-on-surface-variant hover:border-primary-container hover:text-on-surface bg-surface-container-low"
      )}
    >
      {children}
    </button>
  );
}
