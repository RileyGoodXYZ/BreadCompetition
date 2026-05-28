import { useState } from "react";
import { Plus, Swords } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Shell } from "@/components/picklist/Shell";
import { TopBar } from "@/components/picklist/TopBar";
import { Button } from "@/components/ui/button";
import { NewStrategyDialog } from "@/components/match-strategy/NewStrategyDialog";
import { useMatchStrategy } from "@/lib/match-strategy-store";
import { cn } from "@/lib/utils";

// Match strategy home page
export default function MatchStrategyLibrary() {
  const navigate = useNavigate();
  const { strategies, createStrategy } = useMatchStrategy();
  const [dialogOpen, setDialogOpen] = useState(false);

  const open = (id) => navigate(`/match-strategy/${id}`);
  const handleCreate = (payload) => {
    const id = createStrategy(payload);
    setDialogOpen(false);
    navigate(`/match-strategy/${id}`);
  };

  return (
    <Shell>
      <TopBar variant="library" />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary-container leading-[1.05]">
                Match Strategy
              </h1>
              <p className="text-on-surface-variant text-base sm:text-lg mt-2 max-w-xl">
                Plan plays and counter-plays for upcoming matches.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="self-start md:self-auto"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-5 h-5" />
              New Strategy
            </Button>
          </div>

          {/* Section header */}
          <div className="flex items-center gap-3 mb-5 sm:mb-7">
            <div className="p-2 bg-secondary-container rounded-md">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-on-secondary-fixed-variant" />
            </div>
            <h3 className="text-lg sm:text-2xl font-semibold uppercase tracking-tight text-on-surface">
              Upcoming Matches
            </h3>
            <div className="h-px flex-1 bg-outline-variant/50 ml-2 sm:ml-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {strategies.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                onOpen={() => open(s.id)}
              />
            ))}
            <CreateStrategyCard onClick={() => setDialogOpen(true)} />
          </div>
        </div>
      </div>

      <NewStrategyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </Shell>
  );
}

const FAVOR_LABELS = {
  us: "Favored",
  even: "Even",
  them: "Underdog",
};

function StrategyCard({ strategy, onOpen }) {
  const {
    title,
    event,
    updatedLabel,
    favored,
    ourAlliance,
    opponentAlliance,
  } = strategy;
  return (
    <article
      onClick={onOpen}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-5 cursor-pointer transition-all hover:border-primary-container/40 hover:shadow-warm-lg"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="text-lg font-semibold text-primary-container leading-tight">
          {title}
        </h4>
        {favored && (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
            {FAVOR_LABELS[favored] ?? favored}
          </span>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-mono">
        {event} · {updatedLabel}
      </p>

      <div className="mt-5 space-y-2">
        <AllianceRow label="Ours" color="blue" teams={ourAlliance} />
        <AllianceRow label="Opp" color="red" teams={opponentAlliance} />
      </div>
    </article>
  );
}

function AllianceRow({ label, color, teams }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          color === "blue" ? "bg-blue-600" : "bg-red-600"
        )}
      />
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-9">
        {label}
      </span>
      <span className="font-mono text-on-surface">
        {teams.map((t, i) => (
          <span key={t}>
            <Link
              to={`/robot-data?team=${t}`}
              // The whole card is also clickable — keep the click on the
              // number from also opening the strategy detail.
              onClick={(e) => e.stopPropagation()}
              className="hover:underline underline-offset-4 decoration-2 decoration-on-surface/30"
            >
              {t}
            </Link>
            {i < teams.length - 1 && " · "}
          </span>
        ))}
      </span>
    </div>
  );
}

function CreateStrategyCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border-2 border-dashed border-outline-variant/60 rounded-lg flex flex-col items-center justify-center min-h-[170px] transition-all hover:border-primary-container hover:bg-primary-container/5"
    >
      <span className="w-10 h-10 mb-2 rounded-full flex items-center justify-center text-outline-variant group-hover:text-primary-container group-hover:scale-110 transition-all">
        <Plus className="w-8 h-8" strokeWidth={2} />
      </span>
      <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary-container transition-colors">
        New Strategy
      </span>
    </button>
  );
}
