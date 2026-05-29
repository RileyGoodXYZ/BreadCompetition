import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import {
  Plus,
  Search,
  RefreshCw,
  Cloud,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { MobileMenuButton } from "@/components/Sidebar";
import { AddRobotDialog } from "@/components/picklist/AddRobotDialog";
import { MetricViewDialog } from "@/components/picklist/MetricViewDialog";
import { cn } from "@/lib/utils";
import {
  TEAM_POOL,
  getAnalyticsForTeam,
  INITIAL_ANALYTICS_TEAM,
} from "./data";

export default function RobotData() {
  const [searchParams] = useSearchParams();
  const targetTeam = searchParams.get("team");

  const [displayedTeams, setDisplayedTeams] = useState(() =>
    targetTeam ? [targetTeam] : [INITIAL_ANALYTICS_TEAM]
  );

  useEffect(() => {
    if (targetTeam) setDisplayedTeams([targetTeam]);
  }, [targetTeam]);

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [metricView, setMetricView] = useState(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    const displayed = new Set(displayedTeams);
    return TEAM_POOL.filter(
      (t) =>
        !displayed.has(t.team) &&
        (t.team.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q))
    );
  }, [query, displayedTeams]);

  const cards = useMemo(
    () => displayedTeams.map(getAnalyticsForTeam).filter(Boolean),
    [displayedTeams]
  );

  const addRobot = (team) => {
    if (!displayedTeams.includes(team.team)) {
      setDisplayedTeams((prev) => [...prev, team.team]);
    }
  };
  const addManyRobots = (teams) => {
    setDisplayedTeams((prev) => {
      const seen = new Set(prev);
      const additions = teams
        .map((t) => t.team)
        .filter((t) => !seen.has(t));
      return [...prev, ...additions];
    });
  };
  const removeRobot = (teamNumber) =>
    setDisplayedTeams((prev) => prev.filter((t) => t !== teamNumber));

  const pickFromSearch = (team) => {
    addRobot(team);
    setQuery("");
  };

  return (
    <Shell>
      <AnalyticsTopBar
        query={query}
        onQueryChange={setQuery}
        suggestions={suggestions}
        onPickSuggestion={pickFromSearch}
        onAddRobot={() => setAddOpen(true)}
      />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <header className="mb-3 sm:mb-6">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
              Robot Analytics
            </h1>
          </header>

          {cards.length === 0 ? (
            <EmptyState onAddRobot={() => setAddOpen(true)} />
          ) : (
            <div className="space-y-3 sm:space-y-6">
              {cards.map((robot) => (
                <RobotAnalyticsCard
                  key={robot.team}
                  robot={robot}
                  onRemove={() => removeRobot(robot.team)}
                  onMetricClick={setMetricView}
                />
              ))}
              <AddAnotherRobotCard onClick={() => setAddOpen(true)} />
            </div>
          )}
        </div>
      </div>

      <AddRobotDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        pool={TEAM_POOL}
        alreadyInUse={displayedTeams}
        multi
        onPickMany={addManyRobots}
      />

      <MetricViewDialog
        open={metricView !== null}
        onOpenChange={(o) => !o && setMetricView(null)}
        metric={metricView}
      />
    </Shell>
  );
}

function AddAnotherRobotCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-2 border-dashed border-outline-variant/60 rounded sm:rounded-lg py-2.5 sm:py-4 flex items-center justify-center gap-2 text-on-surface-variant hover:border-primary-container hover:text-primary-container hover:bg-primary-container/5 transition-all"
    >
      <Plus className="w-5 h-5" strokeWidth={2.2} />
      <span className="text-sm font-semibold">Add another robot</span>
    </button>
  );
}

function EmptyState({ onAddRobot }) {
  return (
    <div className="border border-dashed border-outline-variant/60 rounded sm:rounded-lg py-8 sm:py-14 px-3 sm:px-5 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary-container/60 text-primary-container flex items-center justify-center mx-auto mb-4">
        <Plus className="w-5 h-5" strokeWidth={2.4} />
      </div>
      <p className="text-on-surface font-semibold">
        No robots on the board yet.
      </p>
      <p className="text-on-surface-variant text-sm mt-1 max-w-md mx-auto">
        Search above or use Add Robot to start comparing scouted teams.
      </p>
      <button
        type="button"
        onClick={onAddRobot}
        className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary-container text-on-primary font-semibold shadow-warm-sm hover:opacity-95 active:scale-[0.98] transition"
      >
        <Plus className="w-4 h-4" strokeWidth={2.4} />
        Add Robot
      </button>
    </div>
  );
}

function AnalyticsTopBar({
  query,
  onQueryChange,
  suggestions,
  onPickSuggestion,
  onAddRobot,
}) {
  const [focused, setFocused] = useState(false);
  const hasQuery = query.trim().length > 0;
  const showSuggestions = focused && hasQuery;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 sm:gap-4 w-full px-3 sm:px-6 lg:px-8 h-14 sm:h-20 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0">
      <MobileMenuButton />
      <div className="flex-1 max-w-2xl relative min-w-0">
        <label className="relative block">
          <span className="sr-only">Search robots</span>
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onQueryChange("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search robots..."
            className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
          />
        </label>

        {showSuggestions && (
          <SuggestionsPanel
            query={query}
            suggestions={suggestions}
            onPick={onPickSuggestion}
          />
        )}
      </div>

      <div className="hidden lg:block flex-1" />

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onAddRobot}
          aria-label="Add robot"
          className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-container text-on-primary hover:opacity-95 active:scale-[0.98] transition shadow-warm-sm"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onAddRobot}
          className="hidden sm:inline-flex items-center gap-2.5 h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-primary-container text-on-primary font-semibold hover:opacity-95 active:scale-[0.98] transition shadow-warm-sm"
        >
          <span className="w-5 h-5 rounded-full bg-on-primary/15 flex items-center justify-center">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </span>
          Add Robot
        </button>

        <AvatarPrimitive.Root className="hidden sm:flex ml-1 relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-primary-container/20">
          <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-primary-container text-on-primary text-xs font-bold">
            BR
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
      </div>
    </header>
  );
}

function SuggestionsPanel({ query, suggestions, onPick }) {
  return (
    <div className="absolute top-full mt-2 left-0 right-0 z-30 bg-surface-container-lowest border border-outline-variant/60 rounded-lg shadow-warm-lg max-h-80 overflow-y-auto scrollbar-warm">
      {suggestions.length === 0 ? (
        <p className="p-4 text-sm text-on-surface-variant">
          No teams match{" "}
          <span className="font-semibold text-on-surface">
            “{query.trim()}”
          </span>
          .
        </p>
      ) : (
        <ul className="p-1.5">
          {suggestions.map((team) => (
            <li key={team.team}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(team)}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-primary-container/5 transition-colors text-left"
              >
                <div className="w-9 h-9 shrink-0 rounded-md bg-surface-container-high border border-primary-container/10 flex items-center justify-center font-bold text-[11px] text-primary-container">
                  {team.team}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-on-surface truncate">
                    {team.name}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant truncate">
                    {team.drivetrain}
                  </div>
                </div>
                <Plus
                  className="w-4 h-4 text-on-surface-variant"
                  strokeWidth={2.2}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({ children, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors"
    >
      {children}
    </button>
  );
}

function RobotAnalyticsCard({ robot, onRemove, onMetricClick }) {
  const [open, setOpen] = useState(true);

  return (
    <article className="rounded sm:rounded-lg overflow-hidden border border-primary-container/20 bg-surface-container-lowest shadow-warm-sm">
      <CardHeader
        robot={robot}
        onRemove={onRemove}
        collapsed={!open}
        onToggle={() => setOpen((o) => !o)}
      />

      {open && (
        <>
          <div className="grid grid-cols-12 gap-0 border-b border-outline-variant/40">
            <div className="col-span-12 xl:col-span-8 p-3 sm:p-6 border-b xl:border-b-0 xl:border-r border-outline-variant/40">
              <PointBreakdownChart matches={robot.matches} />
            </div>
            <div className="col-span-12 xl:col-span-4">
              <StatGrid stats={robot.stats} />
            </div>
          </div>
          <MatchDataTable rows={robot.rows} onMetricClick={onMetricClick} />
        </>
      )}
    </article>
  );
}

function CardHeader({ robot, onRemove, collapsed, onToggle }) {
  return (
    <div className="bg-primary-container text-on-primary">
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand card" : "Collapse card"}
          className="w-7 h-7 -ml-1 shrink-0 rounded-full flex items-center justify-center text-on-primary/80 hover:text-on-primary hover:bg-on-primary/15 transition-colors"
        >
          {collapsed ? (
            <ChevronDown className="w-4 h-4" strokeWidth={2.4} />
          ) : (
            <ChevronUp className="w-4 h-4" strokeWidth={2.4} />
          )}
        </button>

        <h3 className="text-sm sm:text-base font-semibold tracking-tight truncate">
          {robot.team} - {robot.name}
        </h3>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right leading-tight">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-on-primary/70">
              EPA Rank
            </div>
            <div className="text-xs sm:text-sm font-semibold">
              {robot.epaRank} of {robot.epaTotal}
            </div>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${robot.team} from analytics board`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-on-primary/70 hover:text-on-primary hover:bg-on-primary/15 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PointBreakdownChart({ matches }) {
  const max = Math.max(
    1,
    ...matches.map((m) => (m.noData ? 0 : m.scoring + m.passing + m.defense))
  );
  const scaleMax = max * 1.05;

  return (
    <div>
      {/* Title + legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-on-surface">
          <ChartIcon />
          <span className="font-semibold">Point Breakdown per Match</span>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          <LegendDot color="bg-chart-defense" label="Defense" />
          <LegendDot color="bg-chart-passing" label="Passing" />
          <LegendDot color="bg-chart-scoring" label="Scoring" />
        </div>
      </div>

      {/* Plot */}
      <div className="relative h-72">
        {/* Faint horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-t border-outline-variant/30 first:border-t-0"
            />
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end justify-around gap-6 px-4">
          {matches.map((m) => (
            <BarStack key={m.match} match={m} max={scaleMax} />
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-around gap-6 px-4 mt-3">
        {matches.map((m) => (
          <span
            key={m.match}
            className={cn(
              "flex-1 text-center text-base font-medium",
              m.noData ? "text-on-surface-variant/40" : "text-on-surface"
            )}
          >
            {m.match}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarStack({ match: m, max }) {
  if (m.noData) {
    return (
      <div className="flex-1 h-full flex items-end">
        <div className="w-full h-12 rounded-t-sm bg-surface-container-high/60" />
      </div>
    );
  }

  const score = (m.scoring / max) * 100;
  const pass = (m.passing / max) * 100;
  const def = (m.defense / max) * 100;

  return (
    <div className="flex-1 h-full flex flex-col-reverse">
      {m.scoring > 0 && (
        <Segment color="bg-chart-scoring" textColor="text-on-surface" height={score}>
          {m.scoring}
        </Segment>
      )}
      {m.passing > 0 && (
        <Segment color="bg-chart-passing" textColor="text-on-surface" height={pass}>
          {m.passing}
        </Segment>
      )}
      {m.defense > 0 && (
        <Segment color="bg-chart-defense" textColor="text-on-primary" height={def}>
          {m.defense}
        </Segment>
      )}
    </div>
  );
}

function Segment({ color, textColor, height, children }) {
  return (
    <div
      style={{ height: `${height}%` }}
      className={cn(
        "w-full flex items-center justify-center font-semibold text-sm",
        color,
        textColor
      )}
    >
      {children}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-3 h-3 rounded-sm", color)} />
      {label}
    </span>
  );
}

function ChartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-on-surface-variant"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="8" rx="0.5" />
      <rect x="12" y="6" width="3" height="12" rx="0.5" />
      <rect x="17" y="13" width="3" height="5" rx="0.5" />
    </svg>
  );
}

function StatGrid({ stats }) {
  const farAcc = stats.farAcc ?? "no data";
  const closeAcc = stats.closeAcc === "error" ? "error :(" : stats.closeAcc;
  return (
    <div className="grid grid-cols-3 h-full divide-x divide-y divide-outline-variant/40 border-l border-outline-variant/40">
      <Stat label="Throughput" value={stats.throughput.toFixed(2)} className="border-t-0" />
      <Stat label="Score Avg" value={stats.scoreAvg.toFixed(2)} className="border-t-0" />
      <Stat
        label="SOTM?"
        value={stats.sotm ? "TRUE" : "FALSE"}
        variant="dark"
        className="border-t-0"
      />
      <Stat label="Mech Score" value={stats.mechScore} />
      <Stat label="Elec Score" value={stats.elecScore} />
      <Stat label="Foul Total" value={stats.foulTotal} />
      <Stat label="Far Acc %" value={farAcc} variant="coral" valueMuted />
      <Stat label="Close Acc %" value={closeAcc} variant="coral" valueMuted />
      <Stat label="Match Count" value={stats.matchCount} variant="coral" />
    </div>
  );
}

function Stat({ label, value, variant, valueMuted, className }) {
  const isDark = variant === "dark";
  const isCoral = variant === "coral";
  return (
    <div
      className={cn(
        "px-3 sm:px-4 py-3 sm:py-5 flex flex-col justify-center gap-1 sm:gap-1.5",
        isDark && "bg-primary-container text-on-primary",
        isCoral && "bg-accent-coral text-on-surface",
        !isDark && !isCoral && "bg-surface-container-lowest",
        className
      )}
    >
      <span
        className={cn(
          "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
          isDark ? "text-on-primary/80" : "text-on-surface-variant"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-lg sm:text-2xl font-semibold leading-none",
          isDark && "text-on-primary",
          isCoral && (valueMuted ? "text-on-surface/85 text-sm sm:text-base" : "text-on-surface"),
          !isDark && !isCoral && "text-on-surface"
        )}
      >
        {value}
      </span>
    </div>
  );
}

const TABLE_COLUMNS = [
  { id: "match", header: "Match" },
  { id: "scoreBps", header: "Score BPS", clickable: true },
  { id: "passBps", header: "Pass BPS", clickable: true },
  { id: "defBps", header: "Def BPS", clickable: true },
  { id: "drive", header: "Drive (1-6)", clickable: true },
  { id: "pass", header: "Pass (1-4)", clickable: true },
  { id: "defense", header: "Def (1-4)", clickable: true },
  { id: "steal", header: "Steal (1-4)", clickable: true },
  { id: "brokeDie", header: "Broke/Die?" },
  { id: "driveNote", header: "Drive Note" },
  { id: "defNote", header: "Def Note" },
];

function MatchDataTable({ rows = [], onMetricClick }) {
  return (
    <div className="overflow-x-auto scrollbar-warm">
      <table className="w-full border-collapse text-xs sm:text-sm min-w-275">
        <thead className="bg-surface-container-low border-b border-outline-variant/40">
          <tr>
            {TABLE_COLUMNS.map((c) =>
              c.clickable && onMetricClick ? (
                <th
                  key={c.id}
                  className="px-3 py-2 text-left text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => onMetricClick(c)}
                    className="text-on-surface-variant hover:text-primary-container hover:underline underline-offset-4 decoration-2 decoration-primary-container/40 transition-colors"
                  >
                    {c.header}
                  </button>
                </th>
              ) : (
                <th
                  key={c.id}
                  className="px-3 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap"
                >
                  {c.header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {rows.map((row) => (
            <tr key={row.match} className="hover:bg-primary-container/3">
              <td className="px-3 py-2 font-bold text-on-surface text-sm sm:text-base text-center">
                {row.match}
              </td>
              <BpsCell value={row.scoreBps} bold={row.highlight} />
              <BpsCell value={row.passBps} bold={row.highlight} />
              <BpsCell
                value={row.defBps}
                bold={row.highlight}
                highlight={row.defBpsHighlight}
              />
              <NumCell value={row.drive} />
              <NumCell value={row.pass} />
              <NumCell value={row.defense} />
              <NumCell value={row.steal} />
              <td className="px-3 py-2 text-center text-on-surface-variant">
                {row.brokeDie ? "TRUE" : "FALSE"}
              </td>
              <td className="px-3 py-2 text-on-surface-variant max-w-65 truncate">
                {row.driveNote}
              </td>
              <td className="px-3 py-2 text-on-surface-variant">
                {row.defNote}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BpsCell({ value, bold, highlight }) {
  return (
    <td
      className={cn(
        "px-3 py-2 font-mono",
        highlight && "bg-chart-scoring/30",
        bold ? "font-bold text-on-surface" : "text-on-surface"
      )}
    >
      {value}
    </td>
  );
}

function NumCell({ value }) {
  return (
    <td
      className={cn(
        "px-3 py-2 text-center font-mono",
        value === "-" ? "text-on-surface-variant" : "text-on-surface"
      )}
    >
      {value}
    </td>
  );
}
