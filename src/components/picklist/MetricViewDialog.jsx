import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TEAM_POOL, getAnalyticsForTeam } from "@/pages/picklist/data";
import { cn } from "@/lib/utils";

const NUMERIC_METRICS = ["scoreBps", "passBps", "defBps", "drive", "pass", "defense", "steal"];

function parseNumeric(value) {
  if (value === "-" || value == null) return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function averageRows(rows, metricId) {
  const values = rows
    .map((r) => parseNumeric(r[metricId]))
    .filter((v) => v !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatValue(value, metricId) {
  if (value === null) return "—";
  if (metricId === "scoreBps" || metricId === "defBps") return value.toFixed(2);
  return value.toFixed(1);
}

export function MetricViewDialog({ open, onOpenChange, metric }) {
  if (!metric) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Metric view</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Supporting columns: a few other numeric metrics besides the selected one.
  const supporting = NUMERIC_METRICS.filter((m) => m !== metric.id).slice(0, 3);

  const leaderboard = TEAM_POOL.map((teamInfo) => {
    const analytics = getAnalyticsForTeam(teamInfo.team);
    const rows = analytics?.rows ?? [];
    const primary = averageRows(rows, metric.id);
    const supportingValues = Object.fromEntries(
      supporting.map((id) => [id, averageRows(rows, id)])
    );
    return {
      team: teamInfo.team,
      name: teamInfo.name,
      primary,
      supportingValues,
    };
  })
    .filter((row) => row.primary !== null)
    .sort((a, b) => b.primary - a.primary);

  const supportingHeaders = supporting.map((id) => {
    const header =
      TABLE_HEADER_LOOKUP[id] ??
      id.replace(/Bps$/, " BPS").replace(/^./, (c) => c.toUpperCase());
    return { id, header };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{metric.header}: Leaderboard</DialogTitle>
          <DialogDescription>
            Average {metric.header.toLowerCase()} across all scouted matches,
            ranked high to low.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto scrollbar-warm px-2 pb-2 pt-3 min-h-0">
          {leaderboard.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-10 text-center">
              No data recorded for this metric yet.
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-warm">
              <table className="w-full border-collapse text-left min-w-160">
                <thead className="bg-surface-container border-b border-outline-variant/30">
                  <tr>
                    <Th className="w-10">#</Th>
                    <Th>Team</Th>
                    <Th className="text-right">
                      <span className="text-primary-container font-bold">
                        {metric.header}
                      </span>
                    </Th>
                    {supportingHeaders.map((s) => (
                      <Th key={s.id} className="text-right hidden sm:table-cell">
                        {s.header}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {leaderboard.map((row, i) => (
                    <tr
                      key={row.team}
                      className="transition-colors hover:bg-primary-container/[0.03]"
                    >
                      <Td className="font-mono font-semibold text-on-surface">
                        {String(i + 1).padStart(2, "0")}
                      </Td>
                      <Td>
                        <Link
                          to={`/robot-data?team=${row.team}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center gap-2.5 hover:underline underline-offset-4 decoration-2 decoration-primary-container/40"
                        >
                          <div className="w-7 h-7 rounded-md bg-surface-container-high border border-primary-container/10 flex items-center justify-center font-bold text-[11px] text-primary-container">
                            {row.team}
                          </div>
                          <span className="font-semibold text-sm text-on-surface">
                            {row.name}
                          </span>
                        </Link>
                      </Td>
                      <Td className="text-right">
                        <span className="font-mono font-bold text-primary-container">
                          {formatValue(row.primary, metric.id)}
                        </span>
                      </Td>
                      {supportingHeaders.map((s) => (
                        <Td
                          key={s.id}
                          className="text-right hidden sm:table-cell"
                        >
                          <span className="font-mono text-on-surface-variant">
                            {formatValue(row.supportingValues[s.id], s.id)}
                          </span>
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TABLE_HEADER_LOOKUP = {
  scoreBps: "Score BPS",
  passBps: "Pass BPS",
  defBps: "Def BPS",
  drive: "Drive",
  pass: "Pass",
  defense: "Def",
  steal: "Steal",
};

function Th({ className = "", children }) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ className = "", children }) {
  return (
    <td className={cn("px-3 py-2 whitespace-nowrap text-sm", className)}>
      {children}
    </td>
  );
}

export { NUMERIC_METRICS };
