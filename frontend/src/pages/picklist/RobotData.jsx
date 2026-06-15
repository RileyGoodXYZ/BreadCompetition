import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { MobileMenuButton } from "@/components/Sidebar";
import { AddRobotDialog } from "@/components/picklist/AddRobotDialog";
import { PointBreakdownChart } from "@/components/picklist/PointBreakdownChart";
import { cn } from "@/lib/utils";
import { getTeam, listTeams, listTeamSubmissions } from "@/lib/api/teams";
import { listEventMatches } from "@/lib/api/events";
import { useMatchStrategy } from "@/lib/match-strategy-store";
import { CURRENT_EVENT_KEY, OUR_TEAM, getAllianceColor } from "@/lib/schedule";
import {
  MISSING,
  buildChartMatches,
  buildSubmissionRows,
  humanizeKey,
  formatCell,
} from "@/lib/match-analytics";

const ROBOT_DATA_STORAGE_KEY = "robotData.displayedTeams.v1";

function loadDisplayedFromStorage() {
  try {
    const raw = localStorage.getItem(ROBOT_DATA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => typeof t === "string");
  } catch {
    return [];
  }
}

function saveDisplayedToStorage(teams) {
  try {
    localStorage.setItem(ROBOT_DATA_STORAGE_KEY, JSON.stringify(teams));
  } catch {
    // localStorage may be unavailable (private mode, quota) — ignore.
  }
}

function teamMatches(matches, team) {
  return matches.filter(
    (m) => m.red.includes(team) || m.blue.includes(team)
  );
}

function teamStrategies(strategies, team) {
  return strategies.filter((s) => {
    const ours = s.data?.ourAlliance ?? [];
    const opp = s.data?.opponentAlliance ?? [];
    return ours.includes(team) || opp.includes(team);
  });
}

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

// Single-team analytics loader. Used by RobotData (multi-card) and Home
// (embedded "Our Robot" block). Pulls the team record, the four submission
// types, the event schedule, and reuses the in-context strategies store.
export function useTeamAnalytics(teamNumber) {
  const { strategies } = useMatchStrategy();
  const [card, setCard] = useState(null);
  const [byType, setByType] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (teamNumber == null) return undefined;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const [team, match, subjective, pit, brk, schedule] = await Promise.all([
          getTeam(teamNumber).catch(() => null),
          listTeamSubmissions(teamNumber, { type: "match", limit: 1000 }),
          listTeamSubmissions(teamNumber, { type: "subjective", limit: 1000 }),
          listTeamSubmissions(teamNumber, { type: "pit", limit: 1000 }),
          listTeamSubmissions(teamNumber, { type: "break", limit: 1000 }),
          listEventMatches(CURRENT_EVENT_KEY).catch(() => []),
        ]);
        if (cancelled) return;
        setCard(
          team
            ? teamRecordToCard(team)
            : {
                team: String(teamNumber),
                name: `Team ${teamNumber}`,
                drivetrain: null,
                image: null,
              }
        );
        setByType({ match, subjective, pit, break: brk });
        setAllMatches(schedule);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamNumber]);

  const robot = useMemo(() => {
    if (!card || !byType) return null;
    return buildAnalytics(card, byType);
  }, [card, byType]);

  const matches = useMemo(
    () => teamMatches(allMatches, String(teamNumber)),
    [allMatches, teamNumber]
  );
  const strategiesForTeam = useMemo(
    () => teamStrategies(strategies, String(teamNumber)),
    [strategies, teamNumber]
  );

  return { robot, matches, strategies: strategiesForTeam, loaded };
}

export default function RobotData() {
  const [searchParams] = useSearchParams();
  const targetTeam = searchParams.get("team");
  const { strategies } = useMatchStrategy();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listEventMatches(CURRENT_EVENT_KEY)
      .then((rows) => {
        if (!cancelled) setMatches(rows);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [pool, setPool] = useState([]);
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [analyticsByTeam, setAnalyticsByTeam] = useState({});

  const [displayedTeams, setDisplayedTeams] = useState(() => {
    if (targetTeam) return [targetTeam];
    return loadDisplayedFromStorage();
  });

  useEffect(() => {
    if (targetTeam) setDisplayedTeams([targetTeam]);
  }, [targetTeam]);

  // Persist the board to localStorage so it survives navigation away and back.
  useEffect(() => {
    saveDisplayedToStorage(displayedTeams);
  }, [displayedTeams]);

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
              Robot Data
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
                  matches={teamMatches(matches, robot.team)}
                  strategies={teamStrategies(strategies, robot.team)}
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

export function RobotAnalyticsCard({ robot, matches, strategies, onRemove }) {
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
          {robot.team === OUR_TEAM ? (
            <MatchTileGrid
              team={robot.team}
              matches={matches}
              strategies={strategies}
            />
          ) : (
            <ScheduleAndStrategies
              team={robot.team}
              upcoming={matches[0] ?? null}
              matches={matches}
              strategies={strategies}
            />
          )}
          <MatchDataTable rows={robot.rows} />
        </>
      )}
    </article>
  );
}

function MatchTileGrid({ team, matches, strategies }) {
  const navigate = useNavigate();
  const { createStrategy } = useMatchStrategy();
  const [creatingKey, setCreatingKey] = useState(null);

  const strategyByMatch = useMemo(() => {
    const out = {};
    for (const s of strategies) {
      if (s.event_key && s.match_number != null) {
        out[`${s.event_key}::${s.match_number}`] = s;
      }
    }
    return out;
  }, [strategies]);

  const handleClick = async (match) => {
    const eventKey = CURRENT_EVENT_KEY;
    const key = `${eventKey}::${match.number}`;
    const existing = strategyByMatch[key];
    if (existing) {
      navigate(`/match-strategy/${existing.id}`);
      return;
    }
    setCreatingKey(key);
    try {
      const teamStr = String(team);
      const ourSide = match.red.includes(teamStr) ? "red" : "blue";
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
    <div className="p-3 sm:p-5 border-b border-outline-variant/40">
      <SectionHeading>Match Strategies</SectionHeading>
      {matches.length === 0 ? (
        <EmptySectionNote>No scheduled matches for {team}.</EmptySectionNote>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {matches.map((m) => {
            const eventKey = CURRENT_EVENT_KEY;
            const key = `${eventKey}::${m.number}`;
            return (
              <MatchTile
                key={m.id}
                match={m}
                team={team}
                hasStrategy={key in strategyByMatch}
                creating={creatingKey === key}
                onClick={() => handleClick(m)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchTile({ match, team, hasStrategy, creating, onClick }) {
  const color = getAllianceColor(match, team);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={creating}
      className={cn(
        "group text-left rounded-md border bg-surface-container-low px-2.5 py-2 transition-all disabled:opacity-60 disabled:cursor-progress",
        hasStrategy
          ? "border-primary-container/40 hover:border-primary-container hover:bg-primary-container/5"
          : "border-dashed border-outline-variant/60 hover:border-primary-container hover:bg-primary-container/5"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-semibold text-primary-container leading-tight group-hover:underline underline-offset-4 decoration-2 decoration-primary-container/40">
          {match.type} {match.number}
        </span>
        {color && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              color === "red" ? "bg-red-600" : "bg-blue-600"
            )}
          />
        )}
      </div>
      <div className="mt-0.5 text-[10px] sm:text-[11px] font-mono text-on-surface-variant truncate">
        {creating
          ? "Creating…"
          : match.scheduledAt ?? (hasStrategy ? "Open" : "Plan")}
      </div>
    </button>
  );
}

function SectionHeading({ children }) {
  return (
    <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 sm:mb-3">
      {children}
    </h4>
  );
}

function EmptySectionNote({ children }) {
  return <p className="text-sm text-on-surface-variant">{children}</p>;
}

// Non-OUR_TEAM teams keep the original three-section layout:
// Upcoming Match | All Matches | Linked Strategies.
function ScheduleAndStrategies({ team, upcoming, matches, strategies }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-outline-variant/40 lg:divide-x divide-outline-variant/40">
      <div className="p-3 sm:p-5 border-b lg:border-b-0 border-outline-variant/40">
        <SectionHeading>Upcoming Match</SectionHeading>
        {upcoming ? (
          <UpcomingMatchCard match={upcoming} team={team} />
        ) : (
          <EmptySectionNote>No upcoming match for {team}.</EmptySectionNote>
        )}
      </div>
      <div className="p-3 sm:p-5 border-b lg:border-b-0 border-outline-variant/40">
        <SectionHeading>All Matches</SectionHeading>
        {matches.length === 0 ? (
          <EmptySectionNote>No scheduled matches for {team}.</EmptySectionNote>
        ) : (
          <ul className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-warm pr-1">
            {matches.map((m) => (
              <li key={m.id}>
                <MatchRow match={m} team={team} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 sm:p-5">
        <SectionHeading>Linked Strategies</SectionHeading>
        {strategies.length === 0 ? (
          <EmptySectionNote>
            No strategies reference team {team} yet.
          </EmptySectionNote>
        ) : (
          <ul className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-warm pr-1">
            {strategies.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/match-strategy/${s.id}`}
                  className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-primary-container/5 transition-colors"
                >
                  <span className="text-sm text-on-surface font-medium truncate">
                    {s.title}
                  </span>
                  {s.event_key && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant shrink-0">
                      {s.event_key}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UpcomingMatchCard({ match, team }) {
  const color = getAllianceColor(match, team);
  return (
    <div className="rounded-md bg-surface-container-low border border-outline-variant/40 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-on-surface">
          {match.type} {match.number}
        </span>
        <AllianceBadge color={color} />
      </div>
      <div className="mt-0.5 text-xs text-on-surface-variant">
        {match.scheduledAt} · {match.startsInLabel}
      </div>
      <div className="mt-2 space-y-1 text-xs">
        <AllianceLine label="Red" color="red" teams={match.red} highlight={team} />
        <AllianceLine label="Blue" color="blue" teams={match.blue} highlight={team} />
      </div>
    </div>
  );
}

function MatchRow({ match, team }) {
  const color = getAllianceColor(match, team);
  return (
    <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-primary-container/5 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            color === "red" ? "bg-red-600" : "bg-blue-600"
          )}
        />
        <span className="text-sm font-medium text-on-surface">
          {match.type} {match.number}
        </span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant shrink-0">
        {match.scheduledAt}
      </span>
    </div>
  );
}

function AllianceBadge({ color }) {
  if (!color) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
        color === "red" ? "bg-red-600" : "bg-blue-600"
      )}
    >
      {color}
    </span>
  );
}

function AllianceLine({ label, color, teams, highlight }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-widest w-7",
          color === "red" ? "text-red-700" : "text-blue-700"
        )}
      >
        {label}
      </span>
      <span className="font-mono text-on-surface">
        {teams.map((t, i) => (
          <span
            key={t}
            className={cn(t === highlight && "font-bold text-primary-container")}
          >
            {t}
            {i < teams.length - 1 && " · "}
          </span>
        ))}
      </span>
    </div>
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
  // { col, dir: "asc"|"desc" } — click header to cycle asc → desc → null.
  // Defaults to match_number asc so the table reads in match order.
  const [sort, setSort] = useState({ col: "match_number", dir: "asc" });

  const filteredRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r._type === filter)),
    [rows, filter]
  );

  const visibleRows = useMemo(() => {
    if (!sort) return filteredRows;
    const { col, dir } = sort;
    const getter =
      col === "_type"
        ? (r) => r._type ?? ""
        : (r) => {
            const v = r[col];
            // Coerce booleans → 0/1 so they sort with numerics.
            if (typeof v === "boolean") return v ? 1 : 0;
            return v;
          };
    return [...filteredRows].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      const aMissing = av === null || av === undefined || av === "";
      const bMissing = bv === null || bv === undefined || bv === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sort]);

  const pitRows = useMemo(
    () => (filter === "pit" ? filteredRows : rows.filter((r) => r._type === "pit")),
    [filter, filteredRows, rows]
  );

  const columns = useMemo(() => deriveColumns(visibleRows), [visibleRows]);

  const cycleSort = (col) => {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  };

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
      {filter === "pit" ? (
        <PitScoutPanel rows={pitRows} />
      ) : visibleRows.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
          -
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-warm">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/40">
              <tr>
                <SortableHeaderCell
                  active={sort?.col === "_type" ? sort.dir : null}
                  onClick={() => cycleSort("_type")}
                >
                  Type
                </SortableHeaderCell>
                {columns.map((c) => (
                  <SortableHeaderCell
                    key={c.id}
                    active={sort?.col === c.id ? sort.dir : null}
                    onClick={() => cycleSort(c.id)}
                  >
                    {c.header}
                  </SortableHeaderCell>
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

function SortableHeaderCell({ active, onClick, children }) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap transition-colors",
        active &&
          "bg-primary-container/15 text-primary-container shadow-[inset_0_-2px_0_0_var(--color-primary-container)]"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group/sort inline-flex items-center gap-1 hover:text-primary-container transition-colors",
          active && "text-primary-container"
        )}
      >
        <span>{children}</span>
        {active === "asc" ? (
          <ArrowUp className="w-3 h-3 text-primary-container" />
        ) : active === "desc" ? (
          <ArrowDown className="w-3 h-3 text-primary-container" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/sort:opacity-60 transition-opacity" />
        )}
      </button>
    </th>
  );
}

function PitScoutPanel({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
        No pit scout data yet.
      </div>
    );
  }

  // Pit scout is a single document per team — render as a vertical key/value
  // sheet rather than a wide table. If multiple submissions exist (e.g. the
  // team was re-scouted), each becomes its own value column.
  const fields = deriveColumns(rows);

  return (
    <div className="overflow-x-auto scrollbar-warm">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <tbody className="divide-y divide-outline-variant/30">
          {fields.map((c) => (
            <tr key={c.id} className="hover:bg-primary-container/3">
              <th
                scope="row"
                className="bg-surface-container-low px-3 sm:px-6 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap align-top w-1/3 max-w-xs"
              >
                {c.header}
              </th>
              {rows.map((row, i) => {
                const raw = row[c.id];
                const numeric = isNumeric(raw);
                const empty = raw === undefined || raw === null || raw === "";
                return (
                  <td
                    key={row.id ?? i}
                    className={cn(
                      "px-3 sm:px-6 py-2 align-top",
                      numeric && "font-mono",
                      empty ? "text-on-surface-variant" : "text-on-surface"
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
