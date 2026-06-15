import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { NewStrategyDialog } from "@/components/match-strategy/NewStrategyDialog";
import { useMatchStrategy } from "@/lib/match-strategy-store";
import { listEvents, listEventMatches } from "@/lib/api/events";
import { OUR_TEAM } from "@/lib/schedule";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

// Match strategy library: one card per 5940 match grouped by event. Existing strategies hydrate their matching slot; empty slots offer one-click create.
export default function MatchStrategyLibrary() {
  const navigate = useNavigate();
  const { strategies, createStrategy, loading, error } = useMatchStrategy();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventSchedules, setEventSchedules] = useState([]);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [creatingKey, setCreatingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const events = await listEvents({ limit: 100 });
        const data = await Promise.all(
          events.map(async (e) => ({
            event: e,
            matches: await listEventMatches(e.event_key, {
              team: Number(OUR_TEAM),
            }),
          }))
        );
        if (!cancelled) {
          setEventSchedules(data.filter((d) => d.matches.length > 0));
          setSchedulesLoaded(true);
        }
      } catch {
        if (!cancelled) setSchedulesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Map "event_key::match_number" → existing strategy, so per-match cards
  // hydrate without an O(n*m) scan.
  const strategyByMatch = useMemo(() => {
    const out = {};
    for (const s of strategies) {
      if (s.event_key && s.match_number != null) {
        out[`${s.event_key}::${s.match_number}`] = s;
      }
    }
    return out;
  }, [strategies]);

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

  const createForMatch = async (eventKey, match) => {
    const key = `${eventKey}::${match.number}`;
    setCreatingKey(key);
    try {
      const ourSide = match.red.includes(OUR_TEAM) ? "red" : "blue";
      const ourAlliance = ourSide === "red" ? match.red : match.blue;
      const opponentAlliance = ourSide === "red" ? match.blue : match.red;
      const id = await createStrategy({
        title: `${match.type} ${match.number}`,
        event: eventKey,
        matchNumber: match.number,
        ourAlliance,
        opponentAlliance,
      });
      navigate(`/match-strategy/${id}`);
    } catch (e) {
      console.error("createStrategy failed", e);
      setCreatingKey(null);
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

          {!schedulesLoaded || (loading && strategies.length === 0) ? (
            <p className="text-on-surface-variant text-sm">Loading…</p>
          ) : eventSchedules.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              No scheduled matches for team {OUR_TEAM} yet.
            </p>
          ) : (
            <div className="space-y-8 sm:space-y-12">
              {eventSchedules.map(({ event, matches }) => (
                <EventSection
                  key={event.event_key}
                  event={event}
                  matches={matches}
                  strategyByMatch={strategyByMatch}
                  creatingKey={creatingKey}
                  onOpen={open}
                  onCreate={(m) => createForMatch(event.event_key, m)}
                />
              ))}
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

function EventSection({
  event,
  matches,
  strategyByMatch,
  creatingKey,
  onOpen,
  onCreate,
}) {
  return (
    <section>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-7">
        <div className="p-1.5 sm:p-2 bg-secondary-container rounded-md">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-on-secondary-fixed-variant" />
        </div>
        <h3 className="text-base sm:text-2xl font-semibold uppercase tracking-tight text-on-surface">
          {event.name}
        </h3>
        <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-on-surface-variant">
          {event.event_key}
        </span>
        <div className="h-px flex-1 bg-outline-variant/50 ml-1 sm:ml-4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
        {matches.map((m) => {
          const key = `${event.event_key}::${m.number}`;
          const strategy = strategyByMatch[key];
          if (strategy) {
            return (
              <StrategyCard
                key={key}
                strategy={strategy}
                match={m}
                onOpen={() => onOpen(strategy.id)}
              />
            );
          }
          return (
            <PlanMatchCard
              key={key}
              match={m}
              submitting={creatingKey === key}
              onClick={() => onCreate(m)}
            />
          );
        })}
      </div>
    </section>
  );
}

function StrategyCard({ strategy, match, onOpen }) {
  const { title, favored, updated_at: updatedAt, data } = strategy;
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
        {[match?.scheduledAt, updatedLabel].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2">
        <AllianceRow label="Ours" color="blue" teams={ourAlliance} />
        <AllianceRow label="Opp" color="red" teams={opponentAlliance} />
      </div>
    </article>
  );
}

function PlanMatchCard({ match, submitting, onClick }) {
  const ourSide = match.red.includes(OUR_TEAM) ? "red" : "blue";
  const ourAlliance = ourSide === "red" ? match.red : match.blue;
  const opponentAlliance = ourSide === "red" ? match.blue : match.red;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className="group text-left scout-card-gradient bg-surface-container-lowest border border-dashed border-outline-variant/60 rounded sm:rounded-md p-2.5 sm:p-4 transition-all hover:border-primary-container hover:bg-primary-container/5 disabled:opacity-60 disabled:cursor-progress"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1">
        <h4 className="text-base sm:text-lg font-semibold text-on-surface leading-tight">
          {match.type} {match.number}
        </h4>
        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container text-[10px] font-bold uppercase tracking-wider group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          {submitting ? "Creating…" : "Plan"}
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-mono">
        {match.scheduledAt ?? "Unscheduled"}
        {match.field ? ` · ${match.field}` : ""}
      </p>

      <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2">
        <AllianceRow label="Ours" color="blue" teams={ourAlliance} />
        <AllianceRow label="Opp" color="red" teams={opponentAlliance} />
      </div>
    </button>
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
