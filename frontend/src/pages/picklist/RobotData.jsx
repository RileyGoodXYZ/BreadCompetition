import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Plus, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Shell } from "@/components/Shell";
import { MobileMenuButton } from "@/components/Sidebar";
import { AddRobotDialog } from "@/components/picklist/AddRobotDialog";
import { PointBreakdownChart } from "@/components/picklist/PointBreakdownChart";
import { cn } from "@/lib/utils";
import { listTeams, listTeamSubmissions } from "@/lib/api/teams";
import {
  MISSING,
  buildChartMatches,
  buildSubmissionRows,
  humanizeKey,
  formatCell,
} from "@/lib/match-analytics";

function teamRecordToCard(t) {
  const data = t.data ?? {};
  const drivetrain = data.drivetrain ? `${String(data.drivetrain).toUpperCase()} DRIVE` : null;
  return {
    team: String(t.team_number),
    name: t.name,
    drivetrain,
    image: data.image_url ?? null,
  };
}

function tagRows(submissions, kind) {
  return buildSubmissionRows(submissions).map((r) => ({ ...r, _type: kind }));
}

function buildAnalytics(card, byType) {
  const matchSubs = byType.match ?? [];
  const matches = buildChartMatches(matchSubs);
  const rows = [
    ...tagRows(matchSubs, "match"),
    ...tagRows(byType.subjective ?? [], "subjective"),
    ...tagRows(byType.pit ?? [], "pit"),
    ...tagRows(byType.break ?? [], "break"),
  ];

  const scored = matches.filter((m) => !m.noData);
  const scoreAvg = scored.length
    ? +(
        scored.reduce((sum, m) => sum + m.scoring, 0) / scored.length
      ).toFixed(2)
    : MISSING;
  const matchCount = scored.length || MISSING;

  // Most data points in the stat grid rely on calculations to be performed on the backend that have yet to be implemented, so display them as "no data" for now
  const stats = {
    throughput: MISSING,
    scoreAvg,
    sotm: MISSING,
    mechScore: MISSING,
    elecScore: MISSING,
    foulTotal: MISSING,
    farAcc: MISSING,
    closeAcc: MISSING,
    matchCount,
  };

  return {
    team: card.team,
    name: card.name,
    drivetrain: card.drivetrain,
    image: card.image,
    epaRank: MISSING,
    epaTotal: MISSING,
    stats,
    matches,
    rows,
  };
}

export default function RobotData() {
  const [searchParams] = useSearchParams();
  const targetTeam = searchParams.get("team");

  const [pool, setPool] = useState([]);
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [analyticsByTeam, setAnalyticsByTeam] = useState({});

  const [displayedTeams, setDisplayedTeams] = useState(() =>
    targetTeam ? [targetTeam] : []
  );

  useEffect(() => {
    if (targetTeam) setDisplayedTeams([targetTeam]);
  }, [targetTeam]);

  useEffect(() => {
    let cancelled = false;
    listTeams({ limit: 5000 })
      .then((rows) => {
        if (cancelled) return;
        setPool(rows.map(teamRecordToCard));
        setPoolLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setPoolLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const missing = displayedTeams.filter((t) => !(t in analyticsByTeam));
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (teamNumber) => {
        const card = pool.find((t) => t.team === teamNumber) ?? {
          team: teamNumber,
          name: `Team ${teamNumber}`,
          drivetrain: null,
          image: null,
        };
        try {
          const [match, subjective, pit, brk] = await Promise.all([
            listTeamSubmissions(teamNumber, { type: "match", limit: 1000 }),
            listTeamSubmissions(teamNumber, { type: "subjective", limit: 1000 }),
            listTeamSubmissions(teamNumber, { type: "pit", limit: 1000 }),
            listTeamSubmissions(teamNumber, { type: "break", limit: 1000 }),
          ]);
          return [teamNumber, buildAnalytics(card, { match, subjective, pit, break: brk })];
        } catch {
          return [teamNumber, buildAnalytics(card, {})];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setAnalyticsByTeam((prev) => {
        const next = { ...prev };
        for (const [k, v] of entries) next[k] = v;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [displayedTeams, pool, analyticsByTeam]);

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    const displayed = new Set(displayedTeams);
    return pool.filter(
      (t) =>
        !displayed.has(t.team) &&
        (t.team.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q))
    );
  }, [query, displayedTeams, pool]);

  const cards = useMemo(
    () => displayedTeams.map((t) => analyticsByTeam[t]).filter(Boolean),
    [displayedTeams, analyticsByTeam]
  );

  const addRobot = (team) => {
    if (!displayedTeams.includes(team.team)) {
      setDisplayedTeams((prev) => [...prev, team.team]);
    }
  };
  const addManyRobots = (teams) => {
    setDisplayedTeams((prev) => {
      const seen = new Set(prev);
      const additions = teams.map((t) => t.team).filter((t) => !seen.has(t));
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
            poolLoaded ? (
              <EmptyState onAddRobot={() => setAddOpen(true)} />
            ) : (
              <p className="text-on-surface-variant text-sm">Loading…</p>
            )
          ) : (
            <div className="space-y-3 sm:space-y-6">
              {cards.map((robot) => (
                <RobotAnalyticsCard
                  key={robot.team}
                  robot={robot}
                  onRemove={() => removeRobot(robot.team)}
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
        pool={pool}
        alreadyInUse={displayedTeams}
        multi
        onPickMany={addManyRobots}
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

function RobotAnalyticsCard({ robot, onRemove }) {
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 border-b border-outline-variant/40 xl:divide-x divide-outline-variant/40">
            <div className="p-3 sm:p-6 border-b xl:border-b-0 border-outline-variant/40">
              <RobotImage robot={robot} />
            </div>
            <div className="p-3 sm:p-6 border-b xl:border-b-0 border-outline-variant/40">
              <PointBreakdownChart matches={robot.matches} />
            </div>
            <div>
              <StatGrid stats={robot.stats} />
            </div>
          </div>
          <MatchDataTable rows={robot.rows} />
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

function RobotImage({ robot }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-on-surface mb-4">
        <CameraIcon />
        <span className="font-semibold">Robot</span>
      </div>
      <div className="flex-1 min-h-56 rounded-md bg-surface-container-high border border-outline-variant/40 overflow-hidden flex items-center justify-center">
        {robot.image ? (
          <img
            src={robot.image}
            alt={`${robot.team} ${robot.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center px-4">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-primary-container">
              {robot.team}
            </div>
            {robot.drivetrain && (
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-2">
                {robot.drivetrain}
              </div>
            )}
            <div className="text-xs text-on-surface-variant/70 mt-3">
              No photo yet
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CameraIcon() {
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
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function formatStat(value) {
  if (value === MISSING) return MISSING;
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-3 h-full divide-x divide-y divide-outline-variant/40 border-l border-outline-variant/40">
      <Stat label="Throughput" value={formatStat(stats.throughput)} className="border-t-0" />
      <Stat label="Score Avg" value={formatStat(stats.scoreAvg)} className="border-t-0" />
      <Stat
        label="SOTM?"
        value={formatStat(stats.sotm)}
        variant="dark"
        className="border-t-0"
      />
      <Stat label="Mech Score" value={formatStat(stats.mechScore)} />
      <Stat label="Elec Score" value={formatStat(stats.elecScore)} />
      <Stat label="Foul Total" value={formatStat(stats.foulTotal)} />
      <Stat label="Far Acc %" value={formatStat(stats.farAcc)} variant="coral" valueMuted />
      <Stat label="Close Acc %" value={formatStat(stats.closeAcc)} variant="coral" valueMuted />
      <Stat label="Match Count" value={formatStat(stats.matchCount)} variant="coral" />
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

const COLUMN_PRIORITY = [
  "match_number",
  "scout_name",
  "alliance",
];

const HIDDEN_COLUMNS = new Set([
  "id",
  "type",
  "team_number",
  "event_key",
  "client_uuid",
  "session_type",
]);

const TABLE_FILTERS = [
  { id: "all", label: "All" },
  { id: "match", label: "Match Data" },
  { id: "subjective", label: "Subjective" },
  { id: "pit", label: "Pit Scout" },
  { id: "break", label: "Break" },
];

const TYPE_BADGE_LABEL = {
  match: "Data",
  subjective: "Subj",
  pit: "Pit",
  break: "Break",
};

function deriveColumns(rows) {
  const seen = new Set();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (k === "_type") continue;
      if (!HIDDEN_COLUMNS.has(k)) seen.add(k);
    }
  }
  const priority = COLUMN_PRIORITY.filter((k) => seen.has(k));
  const rest = [...seen]
    .filter((k) => !COLUMN_PRIORITY.includes(k))
    .sort((a, b) => a.localeCompare(b));
  return [...priority, ...rest].map((k) => ({ id: k, header: humanizeKey(k) }));
}

function isNumeric(value) {
  return typeof value === "number" || typeof value === "boolean";
}

function MatchDataTable({ rows = [] }) {
  const [filter, setFilter] = useState("all");

  const visibleRows = useMemo(() => {
    const filtered = filter === "all" ? rows : rows.filter((r) => r._type === filter);
    return [...filtered].sort(
      (a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)
    );
  }, [rows, filter]);

  const columns = useMemo(() => deriveColumns(visibleRows), [visibleRows]);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 px-3 sm:px-6 py-3 border-b border-outline-variant/40 bg-surface-container-low/40">
        {TABLE_FILTERS.map((f) => (
          <FilterPill
            key={f.id}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </FilterPill>
        ))}
      </div>
      {visibleRows.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
          -
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-warm">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/40">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                  Type
                </th>
                {columns.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap"
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {visibleRows.map((row, i) => (
                <tr
                  key={row.id ?? `${row._type}-${row.match_number ?? "?"}-${i}`}
                  className="hover:bg-primary-container/3"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <TypeBadge kind={row._type} />
                  </td>
                  {columns.map((c) => {
                    const raw = row[c.id];
                    const numeric = isNumeric(raw);
                    return (
                      <td
                        key={c.id}
                        className={cn(
                          "px-3 py-2 whitespace-nowrap",
                          numeric ? "font-mono text-center" : "text-on-surface-variant",
                          raw === undefined || raw === null || raw === ""
                            ? "text-on-surface-variant"
                            : "text-on-surface"
                        )}
                      >
                        {formatCell(raw)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ kind }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
        kind === "match" && "bg-primary-container/15 text-primary-container",
        kind === "subjective" && "bg-secondary-container text-on-secondary-container",
        kind === "pit" && "bg-amber-500/15 text-amber-800",
        kind === "break" && "bg-rose-500/15 text-rose-700"
      )}
    >
      {TYPE_BADGE_LABEL[kind] ?? kind}
    </span>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
        active
          ? "bg-primary-container text-on-primary border-primary-container"
          : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:border-primary-container/60"
      )}
    >
      {children}
    </button>
  );
}
