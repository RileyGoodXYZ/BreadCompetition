import { StickyNote, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PointBreakdownChart } from "@/components/picklist/PointBreakdownChart";
import { cn } from "@/lib/utils";

export function RobotCard({
  robot,
  chartMatches,
  loading = false,
  onViewNotes,
  onRemove,
  className,
}) {
  return (
    <article
      className={cn(
        "relative bg-surface-container-lowest border border-primary-container/10 rounded sm:rounded-md overflow-hidden",
        "flex flex-col p-2.5 sm:p-5 shadow-warm-sm transition-all hover:shadow-warm-md",
        className
      )}
    >
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${robot.team} from comparison`}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors flex items-center justify-center"
        >
          <X className="w-4 h-4" strokeWidth={2.4} />
        </button>
      )}

      <div className="flex-none">
        <div className="flex items-start justify-between mb-4 pr-9">
          <h4 className="text-lg font-black uppercase tracking-tight leading-tight text-primary-container">
            <Link
              to={`/robot-data?team=${robot.team}`}
              className="hover:underline underline-offset-4 decoration-2 decoration-primary-container/40"
            >
              {robot.team} {robot.name}
            </Link>
          </h4>
        </div>

        {/* Placeholder for images*/}
        <div className="h-32 sm:h-40 relative bg-surface-container-highest rounded-md overflow-hidden mb-3 sm:mb-4 border border-primary-container/10 shadow-inner flex items-center justify-center">
          <div className="text-center px-3">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-primary-container">
              {robot.team}
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="mb-3 sm:mb-4 bg-surface-container/50 p-2 sm:p-3 rounded-md">
          {loading ? (
            <div className="h-24 flex items-center justify-center text-xs text-on-surface-variant">
              Loading match data…
            </div>
          ) : (
            <PointBreakdownChart matches={chartMatches ?? []} compact />
          )}
        </div>
      </div>

      <div className="flex-none">
        <Button
          variant="outline"
          size="md"
          className="w-full text-[11px] tracking-wider uppercase"
          onClick={onViewNotes}
        >
          <StickyNote className="w-4 h-4" />
          View Notes
        </Button>
      </div>
    </article>
  );
}
