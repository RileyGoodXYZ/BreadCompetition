import { useState } from "react";
import { Plus, Swords } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { NewStrategyDialog } from "@/components/match-strategy/NewStrategyDialog";
import { useMatchStrategy } from "@/lib/match-strategy-store";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

// Match strategy home page
export default function MatchStrategyLibrary() {
  const navigate = useNavigate();
  const { strategies, createStrategy, loading, error } = useMatchStrategy();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const open = (id) => navigate(`/match-strategy/${id}`);
  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      const id = await createStrategy(payload);
      setDialogOpen(false);
      navigate(`/match-strategy/${id}`);
    } catch (e) {
      console.error("createStrategy failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <TopBar variant="library" />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-10">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6 mb-6 sm:mb-12">
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary-container leading-[1.05]">
                Match Strategy
              </h1>
              <p className="text-on-surface-variant text-sm sm:text-lg mt-1 sm:mt-2 max-w-xl">
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

          {error && (
            <div className="mb-6 p-3 rounded-md border border-error/40 bg-error/5 text-sm text-error">
              Failed to load strategies: {String(error.message ?? error)}
            </div>
          )}

          {/* Section header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-7">
            <div className="p-1.5 sm:p-2 bg-secondary-container rounded-md">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-on-secondary-fixed-variant" />
            </div>
            <h3 className="text-base sm:text-2xl font-semibold uppercase tracking-tight text-on-surface">
              Upcoming Matches
            </h3>
            <div className="h-px flex-1 bg-outline-variant/50 ml-1 sm:ml-4" />
          </div>

          {loading && strategies.length === 0 ? (
            <p className="text-on-surface-variant text-sm">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
              {strategies.map((s) => (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  onOpen={() => open(s.id)}
                />
              ))}
              <CreateStrategyCard onClick={() => setDialogOpen(true)} />
            </div>
          )}
        </div>
      </div>

      <NewStrategyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        submitting={submitting}
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
  const { title, event_key: eventKey, favored, updated_at: updatedAt, data } =
    strategy;
  const ourAlliance = data?.ourAlliance ?? [];
  const opponentAlliance = data?.opponentAlliance ?? [];
  const updatedLabel = relativeTime(updatedAt);

  return (
    <article
      onClick={onOpen}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded sm:rounded-md p-2.5 sm:p-4 cursor-pointer transition-all hover:border-primary-container/40 hover:shadow-warm-lg"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1">
        <h4 className="text-base sm:text-lg font-semibold text-primary-container leading-tight">
          {title}
        </h4>
        {favored && (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
            {FAVOR_LABELS[favored] ?? favored}
          </span>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-mono">
        {[eventKey, updatedLabel].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2">
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
      className="group border-2 border-dashed border-outline-variant/60 rounded sm:rounded-md flex flex-col items-center justify-center min-h-28 sm:min-h-42.5 transition-all hover:border-primary-container hover:bg-primary-container/5"
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
