import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Cpu } from "lucide-react";
import { Shell } from "@/components/picklist/Shell";
import { cn } from "@/lib/utils";
import {
  STRATEGY_TEAM_STATS,
  TIMELINE_COLUMNS,
  getStrategy,
} from "./data";

// Match strategy detail page
export default function MatchStrategyDetail() {
  const { id } = useParams();
  const strategy = getStrategy(id);

  return (
    <Shell>
      <DetailTopBar />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-[1400px] mx-auto w-full px-8 py-6">
          {strategy ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10 mb-10">
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

              <StrategyTimelineTable scenarios={strategy.scenarios} />
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
    <header className="sticky top-0 z-20 flex items-center gap-6 w-full px-8 h-16 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shrink-0">
      <h1 className="text-xl font-bold text-on-surface tracking-tight whitespace-nowrap">
        Match Strategy
      </h1>
      <div className="flex-1 max-w-md">
        <label className="relative block">
          <span className="sr-only">Search match</span>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="search"
            placeholder="Search match..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition"
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
          const team = STRATEGY_TEAM_STATS[tn];
          if (!team) return null;
          return <TeamCard key={tn} team={team} color={color} />;
        })}
      </div>
    </section>
  );
}

function TeamCard({ team, color }) {
  return (
    <article className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <h4 className="text-lg font-bold text-on-surface leading-tight">
          <Link
            to={`/robot-data?team=${team.team}`}
            className="hover:underline underline-offset-4 decoration-2 decoration-on-surface/30"
          >
            {team.name}
          </Link>
        </h4>
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shrink-0",
            color === "blue" ? "bg-blue-600" : "bg-red-600"
          )}
        >
          {color}
        </span>
        <Cpu className="ml-auto w-5 h-5 text-on-surface-variant shrink-0" />
      </div>
      <p className="text-sm text-on-surface-variant mt-0.5 mb-4">
        Team {team.team}
      </p>

      <div className="grid grid-cols-4 gap-x-6">
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

function StrategyTimelineTable({ scenarios: initial }) {
  const [scenarios, setScenarios] = useState(initial);

  const setCell = (scenarioId, teamNum, columnId, value) => {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== scenarioId) return s;
        return {
          ...s,
          cells: {
            ...s.cells,
            [teamNum]: {
              ...(s.cells[teamNum] ?? {}),
              [columnId]: value,
            },
          },
        };
      })
    );
  };

  return (
    <div className="rounded-2xl border border-outline-variant/50 overflow-hidden bg-surface-container-lowest">
      <div className="overflow-x-auto scrollbar-warm">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="bg-secondary-container py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-on-secondary-container w-36">
                Timeline
              </th>
              {TIMELINE_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className="py-4 px-6 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap border-l border-outline-variant/30"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <ScenarioBlock
                key={scenario.id}
                scenario={scenario}
                onSetCell={(team, col, val) =>
                  setCell(scenario.id, team, col, val)
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScenarioBlock({ scenario, onSetCell }) {
  const colSpan = TIMELINE_COLUMNS.length + 1;
  return (
    <>
      <tr>
        <td
          colSpan={colSpan}
          className={cn(
            "py-2.5 px-6 text-[11px] font-bold uppercase tracking-widest",
            scenario.tone === "ours"  && "bg-blue-600 text-white",
            scenario.tone === "opponent" && "bg-red-600 text-white"
          )}
        >
          Scenario: {scenario.title}
        </td>
      </tr>
      {scenario.teams.map((teamNum) => (
        <tr
          key={teamNum}
          className="border-t border-outline-variant/30"
        >
          <td className="bg-secondary-container/25 py-4 px-6 text-base font-semibold text-on-surface align-middle">
            {teamNum}
          </td>
          {TIMELINE_COLUMNS.map((col) => {
            const text = scenario.cells[teamNum]?.[col.id] ?? "";
            return (
              <td
                key={col.id}
                className="border-l border-outline-variant/30 px-2 py-1.5 align-top"
              >
                <textarea
                  value={text}
                  onChange={(e) =>
                    onSetCell(teamNum, col.id, e.target.value)
                  }
                  rows={2}
                  className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:bg-primary-container/5 rounded-md px-2 py-1.5 resize-none transition-colors"
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
