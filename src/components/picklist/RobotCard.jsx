import { StickyNote, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Robot card
export function RobotCard({
  robot,
  onViewNotes,
  onRemove,
  scrollRef,
  onScroll,
  className,
}) {
  return (
    <article
      className={cn(
        "relative bg-surface-container-lowest border border-primary-container/10 rounded-lg overflow-hidden",
        "flex flex-col p-4 sm:p-6 shadow-warm-sm transition-all hover:shadow-warm-md",
        "h-140 sm:h-180",
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

        {/* Robot image */}
        <div className="h-32 sm:h-48 relative bg-surface-container-highest rounded-md overflow-hidden mb-3 sm:mb-4 border border-primary-container/10 shadow-inner group">
          {robot.image && (
            <img
              src={robot.image}
              alt={`Robot ${robot.team}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-black/40 to-transparent flex items-end p-3">
            <StarBar count={robot.stars ?? 0} />
          </div>
        </div>

        {/* Trend — taller, with header + peak label */}
        {robot.trend && (
          <div className="mb-3 sm:mb-4 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-tighter">
                Performance Trend
              </span>
              {robot.trend.peakLabel && (
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    robot.trend.peakTone === "error"
                      ? "text-error"
                      : "text-primary-container"
                  )}
                >
                  {robot.trend.peakLabel}
                </span>
              )}
            </div>
            <div className="flex items-end gap-1 sm:gap-1.5 h-16 sm:h-24 bg-surface-container/50 p-2 sm:p-3 rounded-md">
              {robot.trend.bars.map((b, i) => {
                const tone = b.tone ?? "primary";
                const h = Math.max(0.06, Math.min(1, b.height));
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-t-sm",
                      tone === "error" ? "bg-error/60" : "bg-primary-container",
                      tone === "primary" &&
                        b.opacity != null &&
                        "opacity-(--o)"
                    )}
                    style={{
                      height: `${h * 100}%`,
                      ...(b.opacity != null && { "--o": b.opacity }),
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable metrics — controlled by parent for cross-card sync */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto scrollbar-warm pr-2 mb-3 sm:mb-6"
      >
        <table className="w-full text-[11px] sm:text-[12px]">
          <tbody className="divide-y divide-outline-variant/10">
            {robot.metrics?.map((m) => (
              <tr key={m.label} className="flex justify-between py-1 sm:py-1.5">
                <td className="font-bold uppercase text-on-surface-variant">
                  {m.label}
                </td>
                <td className="font-mono font-bold text-primary-container">
                  {m.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

function StarBar({ count }) {
  return (
    <div className="flex gap-1 w-full opacity-80">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-1 rounded-full",
            i < count ? "bg-white" : "bg-white/40"
          )}
        />
      ))}
    </div>
  );
}
