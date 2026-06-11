import { cn } from "@/lib/utils";

export function PointBreakdownChart({ matches, compact = false }) {
  if (!matches || matches.length === 0) {
    return (
      <div>
        <ChartHeader compact={compact} />
        <div
          className={cn(
            "flex items-center justify-center text-sm text-on-surface-variant border border-dashed border-outline-variant/40 rounded-md",
            compact ? "h-24" : "h-56"
          )}
        >
          -
        </div>
      </div>
    );
  }

  const max = Math.max(
    1,
    ...matches.map((m) => (m.noData ? 0 : m.scoring + m.passing + m.defense))
  );
  const scaleMax = max * 1.05;

  return (
    <div>
      <ChartHeader compact={compact} />

      <div className={cn("relative", compact ? "h-24" : "h-56")}>
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-t border-outline-variant/30 first:border-t-0"
            />
          ))}
        </div>

        <div className="relative h-full flex items-end justify-around gap-1.5 px-1.5 overflow-x-auto scrollbar-warm">
          {matches.map((m) => (
            <BarStack key={m.match} match={m} max={scaleMax} compact={compact} />
          ))}
        </div>
      </div>

      <div className="flex justify-around gap-1.5 px-1.5 mt-2 overflow-x-auto scrollbar-warm">
        {matches.map((m) => (
          <span
            key={m.match}
            className={cn(
              "flex-1 text-center font-medium",
              compact ? "text-[10px]" : "text-xs sm:text-sm",
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

function ChartHeader({ compact }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between flex-wrap gap-2",
        compact ? "mb-2" : "mb-4"
      )}
    >
      <div className="flex items-center gap-2 text-on-surface">
        <ChartIcon />
        <span className={cn("font-semibold", compact && "text-sm")}>
          Points per Match
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <LegendDot color="bg-chart-defense" label="Defense" />
        <LegendDot color="bg-chart-passing" label="Passing" />
        <LegendDot color="bg-chart-scoring" label="Scoring" />
      </div>
    </div>
  );
}

function BarStack({ match: m, max, compact }) {
  if (m.noData) {
    return (
      <div className="flex-1 min-w-6 h-full flex items-end">
        <div
          className={cn(
            "w-full rounded-t-sm bg-surface-container-high/60",
            compact ? "h-6" : "h-12"
          )}
        />
      </div>
    );
  }

  const score = (m.scoring / max) * 100;
  const pass = (m.passing / max) * 100;
  const def = (m.defense / max) * 100;

  return (
    <div className="flex-1 min-w-6 h-full flex flex-col-reverse">
      {m.scoring > 0 && (
        <Segment
          color="bg-chart-scoring"
          textColor="text-on-surface"
          height={score}
          compact={compact}
        >
          {m.scoring}
        </Segment>
      )}
      {m.passing > 0 && (
        <Segment
          color="bg-chart-passing"
          textColor="text-on-surface"
          height={pass}
          compact={compact}
        >
          {m.passing}
        </Segment>
      )}
      {m.defense > 0 && (
        <Segment
          color="bg-chart-defense"
          textColor="text-on-primary"
          height={def}
          compact={compact}
        >
          {m.defense}
        </Segment>
      )}
    </div>
  );
}

function Segment({ color, textColor, height, compact, children }) {
  return (
    <div
      style={{ height: `${height}%` }}
      className={cn(
        "w-full flex items-center justify-center font-semibold",
        compact ? "text-[10px]" : "text-xs",
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
